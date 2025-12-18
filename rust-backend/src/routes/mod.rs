use axum::{Router, extract::Request, routing::{get, post}};
mod auth;
mod docs;
pub fn auth_routes() -> Router{
    let router = Router::new()
        .route("/login", post(auth::login))
        .route("/signup", post(auth::signup));
    router
}
pub fn doc_routes() -> Router{
    let router = Router::new()
        .route("/edit/{id}", get(docs::edit))
        .route("/create", post(docs::create));
    router
}
pub fn user_routes() -> Router{
    let router = Router::new()
        .route("/profile", get( |req: Request| async move {
            log::debug!("{:?}",req);
        }));
    router
}