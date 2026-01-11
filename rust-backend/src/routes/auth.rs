use std::{env, sync::Arc, time::SystemTime};

use axum::{Extension, Json, extract::Request, http::StatusCode, response::IntoResponse};
use jsonwebtoken::{EncodingKey, Header, encode};
use serde_json::json;
use tower_cookies::{
    Cookie, Cookies,
    cookie::{CookieBuilder, SameSite},
};

use crate::{
    db::Db,
    models::{Claims, LoginUser, User},
    utils::{self, decode_cookie},
};

pub async fn login(
    Extension(db): Extension<Arc<Db>>,
    cookies: Cookies,
    Json(user): Json<LoginUser>,
) -> impl IntoResponse {
    let mut env = String::from("dev");
    if let Ok(v) = env::var("ENV") {
        env = v
    };
    match db.find_user(&user).await {
        Ok(u) => match utils::verify_password_hash(&user.password, &u.password) {
            Ok(()) => {
                // check if cookies already exist 
                if let Some(cookie) = cookies.get("token") {
                    if let Some(claims) = decode_cookie(cookie.clone()).await {
                        if !claims.sub.is_empty() {
                            return (
                                StatusCode::OK,
                                Json(json!({
                                    "token":cookie.value(),
                                    "success":true
                                })),
                            );
                        }
                    }
                }
                let exp = SystemTime::now()
                    .duration_since(SystemTime::UNIX_EPOCH)
                    .unwrap()
                    .as_secs()
                    + 2592000;
                let claims = Claims::new(u.id.unwrap().to_hex(), exp);
                let key = &EncodingKey::from_secret("hello".as_ref());
                let token = encode(&Header::default(), &claims, key);
                let t = token.unwrap().to_string();
                let cookie = Cookie::new("token", t.clone());
                let (secure, same_site) = if env.as_str() == "prod" {
                    (true, SameSite::None)
                } else {
                    (false, SameSite::Lax)
                };
                let final_cookie = CookieBuilder::from(cookie)
                    .http_only(true)
                    .secure(secure)
                    .same_site(same_site)
                    .path("/")
                    .build();
                cookies.add(final_cookie);
                (
                    StatusCode::OK,
                    Json(json!({
                        "token":t,
                        "success":true
                    })),
                )
            }
            Err(e) => {
                log::error!("{}", e);
                (
                    StatusCode::UNAUTHORIZED,
                    Json(json!({
                        "success":false,
                        "err":"Incorrect credentials"
                    })),
                )
            }
        },
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({
                "route":"login",
                "success":false,
                "err":e.to_string()
            })),
        ),
    }
}

pub async fn signup(
    Extension(db): Extension<Arc<Db>>,
    Json(user): Json<User>,
) -> impl IntoResponse {
    match db.create_user(user).await {
        Ok(()) => (
            StatusCode::OK,
            Json(json!({
                "success":true
            })),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({
                "route":"signup",
                "success":false,
                "err":e.to_string()
            })),
        ),
    }
}

pub async fn me(cookies: Cookies, _req: Request) -> impl IntoResponse {
    // log::debug!("me route");
    let cookie = cookies.get("token");
    match cookie {
        Some(c) => match decode_cookie(c).await {
            Some(_) => (
                StatusCode::OK,
                Json(json!({
                    "success":true
                })),
            ),
            None => (
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "success":false
                })),
            ),
        },
        None => (
            StatusCode::UNAUTHORIZED,
            Json(json!({
                "err":"token not valid"
            })),
        ),
    }
}
