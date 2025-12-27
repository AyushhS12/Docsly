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
    models::{Author, Doc, IntoObjectId},
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
    Json(mut doc): Json<Doc>,
) -> impl IntoResponse {
    if let Some(cookie) = cookies.get("token") {
        let id = utils::decode_cookie(cookie).await.unwrap();
        let author = match db.find_user_with_id(&id.sub).await {
            Ok(a) => Author {
                id: a.id,
                name: a.name,
            },
            Err(_) => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(json!({
                        "err":"an error occurred"
                    })),
                );
            }
        };
        doc.author = Some(author);
    } else {
    };
    match db.create_doc(doc).await {
        Ok(_) => (
            StatusCode::OK,
            Json(json!({
                "success":true,
                "message":"Document Created Successfully".to_string()
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
