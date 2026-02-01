use std::sync::Arc;

use axum::{
    Extension, Json, RequestExt,
    extract::{Multipart, Path, Query, Request},
    http::{StatusCode, request::Parts},
    response::IntoResponse,
};
use mongodb::results::InsertOneResult;
use serde_json::json;
use tower_cookies::Cookies;

use crate::{
    db::Db,
    models::{Author, CollabRequestHandler, Doc, DocQuery, IntoObjectId, UploadedDoc},
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
    let user_id = &claims.sub.clone();
    let res = db.find_docs_with_user_id(user_id.to_owned()).await;
    let uploads = match db.get_uploads(user_id.to_owned()).await{
        Ok(u) => u,
        Err(e) => {
            log::error!("{}",e);
            return (StatusCode::INTERNAL_SERVER_ERROR,Json(json!({
                "err":"an error occurred with uploads"
            })))
        }
    };
    match res {
        Ok(docs) => {
            let mut user_docs = vec![];
            let mut collab_docs = vec![];
            for doc in docs {
                if let Some(Author { id: Some(i), .. }) = doc.author {
                    if i == user_id.into_objetc_id() {
                        user_docs.push(doc.clone());
                    }
                } 
                if doc.collaborators.contains(&user_id.into_objetc_id()) {
                    collab_docs.push(doc);
                };
            }
            (
                StatusCode::OK,
                Json(json!({
                    "docs":user_docs,
                    "collabs":collab_docs,
                    "uploads":uploads
                })),
            )
        }
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

pub async fn handle_collab_request(
    Extension(db): Extension<Arc<Db>>,
    Json(req): Json<CollabRequestHandler>,
) -> impl IntoResponse {
    match req {
        CollabRequestHandler::Accept(r) => match db.handle_collab_request(r).await {
            Ok(_) => (
                StatusCode::OK,
                Json(json!({
                    "success":true
                })),
            ),
            Err(e) => {
                log::error!("{}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({
                        "err":"request not found 1"
                    })),
                )
            }
        },
        CollabRequestHandler::Reject(r) => match db.reject_collab_request(r).await {
            Ok(n) => (
                StatusCode::OK,
                Json(json!({
                    "request_id":n.id
                })),
            ),
            Err(e) => {
                log::error!("{}", e);
                (
                    StatusCode::BAD_REQUEST,
                    Json(json!({
                        "err":"request not found"
                    })),
                )
            }
        },
    }
}

pub async fn upload_doc(
    Extension(db): Extension<Arc<Db>>,
    cookies: Cookies,
    mut form: Multipart,
) -> impl IntoResponse {
    // tokio::fs::create_dir_all(path)
    while let Some(field) = form.next_field().await.unwrap() {
        let file_name = field.file_name().unwrap_or("untitled").to_string();
        let contet_type = field.content_type().map(|s| s.to_string()).unwrap();
        let bytes = field.bytes().await.unwrap();
        if !str::from_utf8(&bytes).is_ok() {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "err":"unknown file type"
                })),
            );
        };
        let data = bson::Binary {
            subtype: bson::spec::BinarySubtype::Generic,
            bytes: bytes.to_vec(),
        };
        if let Some(cookie) = cookies.get("token") {
            if let Some(claims) = decode_cookie(cookie).await {
                let doc = UploadedDoc::new(claims.sub, file_name, contet_type, bytes.len(), data);
                match db.upload_doc(doc).await {
                    Ok(_) => {}
                    Err(e) => {
                        log::error!("{}", e)
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
