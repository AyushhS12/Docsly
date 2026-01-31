use std::sync::Arc;

use axum::{
    Extension, Json, RequestExt,
    extract::{Multipart, Path, Query, Request},
    http::{StatusCode, request::Parts},
    response::IntoResponse,
};
use mongodb::results::InsertOneResult;
use serde_json::json;
use tokio::fs;
use tower_cookies::Cookies;
use uuid::Uuid;

use crate::{
    db::Db,
    models::{Author, Doc, DocQuery, UploadedDoc},
    utils::{self, decode_cookie, extract_cookies},
};

pub async fn get_doc(
    Query(params): Query<DocQuery>,
    Extension(db): Extension<Arc<Db>>,
) -> impl IntoResponse {
    let res = db.find_doc_with_id(params.id).await;
    match res {
        Ok(d) => (StatusCode::OK, Json(d)).into_response(),
        Err(e) => {
            log::error!("{}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"err":"Document not found"})),
            )
                .into_response()
        }
    }
}

pub async fn get_docs(Extension(db): Extension<Arc<Db>>, mut req: Request) -> impl IntoResponse {
    let parts = req.extract_parts::<Parts>().await.unwrap();
    let claims = extract_cookies(&parts).await.unwrap();
    let res = db.find_docs_with_user_id(claims.sub).await;
    match res {
        Ok(docs) => (
            StatusCode::OK,
            Json(json!({
                "docs":docs
            })),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({
                "err":e.to_string(),
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

pub async fn collab_request(
    Extension(db): Extension<Arc<Db>>,
    Path(doc_id): Path<String>,
    cookies: Cookies,
) -> impl IntoResponse {
    if let Some(cookie) = cookies.get("token") {
        if let Some(claims) = decode_cookie(cookie).await {
            match db.add_collab_request(doc_id, claims.sub).await {
                Ok(i) if i.inserted_id == InsertOneResult::default().inserted_id => {
                    return (
                        StatusCode::OK,
                        Json(json!({
                            "message":"Already has permission",
                            "redirect":true
                        })),
                    );
                }
                Ok(_) => {
                    return (
                        StatusCode::OK,
                        Json(json!({
                            "message":"Permission Pending",
                            "redirect":false
                        })),
                    );
                }
                Err(e) => {
                    return (
                        StatusCode::OK,
                        Json(json!({
                            "err":e.to_string(),
                        })),
                    );
                }
            }
        }
    }
    (
        StatusCode::UNAUTHORIZED,
        Json(json!({
            "err":"Unauthorized access denied"
        })),
    )
}

pub async fn get_collab_requests(
    Extension(db): Extension<Arc<Db>>,
    cookies: Cookies,
) -> impl IntoResponse {
    if let Some(cookie) = cookies.get("token") {
        if let Some(claims) = decode_cookie(cookie).await {
            match db.get_collab_requests(claims.sub).await {
                Ok(reqs) => {
                    return (
                        StatusCode::OK,
                        Json(json!({
                            "requests":reqs
                        })),
                    );
                }
                Err(e) => {
                    return (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(json!({
                            "err":e.to_string()
                        })),
                    );
                }
            }
        }
    }
    (
        StatusCode::UNAUTHORIZED,
        Json(json!({
            "err":"unauthorized"
        })),
    )
}

pub async fn upload_doc(
    Extension(db): Extension<Arc<Db>>,
    cookies: Cookies,
    mut form: Multipart,
) -> impl IntoResponse {
    // tokio::fs::create_dir_all(path)
    while let Some(field) = form.next_field().await.unwrap() {
        let file_name = field.file_name().unwrap_or("file").to_string();
        let contet_type = field.content_type().map(|s| s.to_string()).unwrap();
        let bytes = field.bytes().await.unwrap();
        if let Some(cookie) = cookies.get("token") {
            if let Some(claims) = decode_cookie(cookie).await {
                let binary = bson::Binary {
                    subtype: bson::spec::BinarySubtype::Generic,
                    bytes: bytes.to_vec(),
                };
                let doc = UploadedDoc::new(claims.sub, file_name, contet_type, bytes.len(), binary);
                match db.upload_doc(doc).await{
                    Ok(_) => {}
                    Err(e) => {
                        log::error!("{}",e)
                    }
                };
            }
        }
        log::info!("file written successfully");
    }
    (
        StatusCode::OK,
        Json(json!({
            "message":"file uploaded successfully"
        })),
    )
}
