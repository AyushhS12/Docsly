use std::sync::Arc;

use axum::{
    Extension, Json,
    extract::Request,
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};
use serde_json::json;
use tower_cookies::Cookies;

use crate::{db::Db, utils};
///Auth Middleware
pub async fn auth_middleware(
    Extension(db): Extension<Arc<Db>>,
    cookies: Cookies,
    req: Request,
    next: Next,
) -> Response {
    let cookie = cookies.get("token");
    match cookie {
        Some(c) => match utils::decode_cookie(c.clone()).await {
            Some(claims) => {
                let res = db.find_user_with_id(&claims.sub).await;
                match res {
                    Ok(_) => return next.run(req).await,
                    Err(e) => {
                        log::error!("{}", e);
                        return (
                            StatusCode::UNAUTHORIZED,
                            Json(json!({
                                "err":e
                            })),
                        )
                            .into_response();
                    }
                }
            }
            None => {
                return (
                    StatusCode::UNAUTHORIZED,
                    Json(json!({
                        "err":"inavlid jwt 2",
                    })),
                )
                    .into_response();
            }
        },
        None => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({
                    "err":"inavlid jwt 1",
                })),
            )
                .into_response();
        }
    }
}
