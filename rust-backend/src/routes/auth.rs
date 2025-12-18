use std::{sync::Arc, time::SystemTime};

use axum::{
    Extension, Json, body::to_bytes, extract::Request, http::StatusCode, response::IntoResponse,
};
use jsonwebtoken::{EncodingKey, Header, encode};
use serde_json::{from_str, json};
use tower_cookies::{
    Cookie, Cookies,
    cookie::{self, CookieBuilder, SameSite},
};

use crate::{
    db::Db,
    models::{self, Claims},
    utils::decode_cookie,
};

pub async fn login(
    Extension(db): Extension<Arc<Db>>,
    cookies: Cookies,
    req: Request,
) -> impl IntoResponse {
    let (_, body) = req.into_parts();
    let bytes = to_bytes(body, usize::MAX).await.unwrap();
    let data = String::from_utf8_lossy(&bytes);
    let user = from_str::<models::LoginUser>(&data).unwrap();
    let id = match cookies.get("token") {
        Some(c) => match decode_cookie(c.clone()).await {
            Some(claims) => claims.sub,
            None => "".to_string(),
        },
        None => "".to_string(),
    };
    match db.find_user(user).await {
        Ok(u) => {
            if id.is_empty() {
                let exp = SystemTime::now()
                    .duration_since(SystemTime::UNIX_EPOCH)
                    .unwrap()
                    .as_secs()
                    + 2592000;
                let claims = Claims::new(u.id.unwrap().to_hex(), exp);
                let key = &EncodingKey::from_secret("hello".as_ref());
                let token = encode(&Header::default(), &claims, key);
                let cookie = Cookie::new("token", "Bearer ".to_owned() + token.unwrap().as_str());
                let final_cookie = CookieBuilder::from(cookie)
                    .http_only(true)
                    .secure(true)
                    .same_site(SameSite::Lax)
                    .build();
                cookies.add(final_cookie);
            }
            (
                StatusCode::OK,
                Json(json!({
                    "route":"login",
                    "success":true
                })),
            )
        }
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

pub async fn signup(Extension(db): Extension<Arc<Db>>, req: Request) -> impl IntoResponse {
    let (_, body) = req.into_parts();
    let bytes = to_bytes(body, usize::MAX).await.unwrap();
    let data = String::from_utf8_lossy(&bytes);
    let user = from_str::<models::User>(&data).unwrap();
    match db.create_user(user).await {
        Ok(()) => (
            StatusCode::OK,
            Json(json!({
                "route":"signup",
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
