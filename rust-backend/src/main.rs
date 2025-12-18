use std::{collections::HashMap, env, sync::Arc};

use axum::{Extension, Router};
use tokio::{net::TcpListener, sync::Mutex};
use tower_cookies::CookieManagerLayer;

use crate::db::Db;
mod routes;
mod models;
mod middleware;
mod db;
mod utils;
#[tokio::main]
pub async fn main() {
    dotenv::dotenv().ok().unwrap();
    env_logger::init();
    let env_port  = env::var("PORT");
    let address: String;
    match env_port {
        Ok(p) => {
            address = "0.0.0.0:".to_owned() + p.as_str();
        }
        Err(e) => {
            log::info!("{}\n",e);
            log::debug!("Running on default local port");
            address = "localhost:".to_owned() +"7878";
        }
    };
    log::info!("Server listening on http://{}",address);
    let listener = TcpListener::bind(address).await.unwrap();
    let router = Router::new();
    let db = Arc::new(Db::init().await);
    let clients: models::ClientsMap = Arc::new(Mutex::new(HashMap::new()));
    let doc_states: models::DocStateMap = Arc::new(Mutex::new(HashMap::new()));
    let app = manage_routes(router)
        .layer(Extension(db))
        .layer(Extension(clients))
        .layer(Extension(doc_states))
        .layer(CookieManagerLayer::default());

    axum::serve(listener, app).await.unwrap();
}

fn manage_routes(router : Router) -> Router{
    router.nest("/doc", routes::doc_routes())
        .nest("/user", routes::user_routes()).layer(axum::middleware::from_fn(middleware::auth_middleware))
        .nest("/auth", routes::auth_routes())
}