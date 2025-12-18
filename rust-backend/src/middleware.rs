use std::sync::Arc;

use axum::{
    Extension, Json, RequestExt,
    body::Body,
    http::{Request, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
};
use serde_json::json;

use crate::{db::Db, utils};
///Auth Middleware
pub async fn auth_middleware(
    Extension(db): Extension<Arc<Db>>,
    mut req: Request<Body>,
    next: Next,
) -> Response {
    let parts = req.extract_parts().await.unwrap();
    match utils::extract_cookies(&parts).await {
        Some(claims) => {
            let res = db.find_user_with_id(claims.sub).await;
            match res {
                Ok(_) => {
                    return next.run(req).await
                }
                Err(e) => {
                    return (
                        StatusCode::UNAUTHORIZED,
                        Json(json!({
                            "err":e
                        })),
                    ).into_response();
                }
            }
        }
        None => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({
                    "err":"inavlid jwt",
                    "parts":parts.uri.to_string()
                })),
            ).into_response();
        }
    }
}
