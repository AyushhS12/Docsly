use axum::{Router, extract::Request, routing::{get, post}};
mod auth;
mod docs;
mod edit;
// mod user;
pub fn auth_routes() -> Router{
    let router = Router::new()
        .route("/login", post(auth::login))
        .route("/signup", post(auth::signup))
        .route("/me", get(auth::me));
    router
}
pub fn doc_routes() -> Router{
    let router = Router::new()
        .route("/edit/{id}", get(edit::edit))
        .route("/get_docs", get(docs::get_docs))
        .route("/create", post(docs::create))
        .route("/get_doc", get(docs::get_doc));
    router
}
pub fn user_routes() -> Router{
    let router = Router::new()
        .route("/profile", get( |req: Request| async move {
            log::debug!("{:?}",req);
        }));
    router
}