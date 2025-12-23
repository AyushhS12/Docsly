use std::sync::Arc;

use axum::{
    Extension, Json, RequestExt,
    extract::Request,
    http::{StatusCode, request::Parts},
    response::IntoResponse,
};
use serde_json::json;
use tower_cookies::Cookies;

use crate::{
    db::Db,
    models::{Docs, IntoObjectId},
    utils::{self, extract_cookies},
};
pub async fn get_docs(Extension(db): Extension<Arc<Db>>, mut req: Request) -> impl IntoResponse {
    let parts = req.extract_parts::<Parts>().await.unwrap();
    let claims = extract_cookies(&parts).await.unwrap();
    let res = db.find_docs_with_user_id(claims.sub).await;
    match res {
        Some(docs) => (
            StatusCode::OK,
            Json(json!({
                "docs":docs
            })),
        ),
        None => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({
                "err":"an error occurred",
                "docs":[]
            })),
        ),
    }
}

pub async fn create(
    Extension(db): Extension<Arc<Db>>,
    cookies: Cookies,
    Json(mut doc): Json<Docs>,
) -> impl IntoResponse {
    if let Some(cookie) = cookies.get("token") {
        let id = utils::decode_cookie(cookie).await.unwrap();
        doc.author = Some(id.sub.into_objetc_id());
    } else {
    };
    match db.create_doc(doc).await {
        Ok(_) => (
            StatusCode::OK,
            Json(json!({
                "message":"Document Created Successfully"
            })),
        ),
        Err(e) => {
            log::error!("{}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "err":"an error occurred"
                })),
            )
        }
    }
}
