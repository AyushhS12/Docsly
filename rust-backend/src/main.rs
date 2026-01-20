use std::{collections::HashMap, env, sync::Arc};

use axum::{
    Extension, Router,
    http::{
        HeaderValue, Method,
        header::{AUTHORIZATION, CONTENT_TYPE},
    },
};
use tokio::{net::TcpListener, sync::Mutex};
use tower_cookies::CookieManagerLayer;
use tower_http::cors::CorsLayer;

use crate::{db::Db, models::BufferMap};
mod db;
mod middleware;
mod models;
mod routes;
mod utils;
#[tokio::main]
pub async fn main() {
    if let Ok(env) = env::var("ENV"){
        if env == "PROD"{
            println!("Production environment detected")
        } else if env == "DEV" {
            dotenv::dotenv().ok().unwrap();
        }
    }
    env_logger::init();
    let env_port = env::var("PORT");
    let address: String;
    match env_port {
        Ok(p) => {
            address = "0.0.0.0:".to_owned() + p.as_str();
        }
        Err(e) => {
            log::info!("{}\n", e);
            log::debug!("Running on default local port");
            address = "localhost:".to_owned() + "7878";
        }
    };
    log::info!("Server listening on http://{}", address);
    let listener = TcpListener::bind(address).await.unwrap();
    let cors = CorsLayer::new()
        .allow_origin("http://localhost:5173".parse::<HeaderValue>().unwrap())
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers([CONTENT_TYPE, AUTHORIZATION])
        .allow_credentials(true);
    let db = Arc::new(Db::init().await);
    let docs_map: models::DocsMap = Arc::new(Mutex::new(HashMap::new()));
    let buffer_map: BufferMap = Arc::new(Mutex::new(HashMap::new()));
    let router = Router::new();
    let app = manage_routes(router)
        .layer(Extension(db))
        .layer(Extension(docs_map))
        .layer(Extension(buffer_map))
        .layer(cors)
        .layer(CookieManagerLayer::new());

    axum::serve(listener, app).await.unwrap();
}

fn manage_routes(router: Router) -> Router {
    let public_routes = Router::new().nest("/auth", routes::auth_routes());
    let protected_routes = Router::new()
        .nest("/doc", routes::doc_routes())
        .nest("/user", routes::user_routes())
        .layer(axum::middleware::from_fn(middleware::auth_middleware));
    Router::new().nest("/api", router.merge(protected_routes).merge(public_routes))
}
