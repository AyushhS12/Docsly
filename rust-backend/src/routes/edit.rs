use std::sync::Arc;

use axum::{
    Error, Extension,
    extract::{
        Path, WebSocketUpgrade,
        ws::{Message, WebSocket},
    },
    response::Response,
};
use chrono::Utc;
use futures::{SinkExt, StreamExt};
use log::error;
use serde_json::json;
use tokio::sync::mpsc::{self};
use tower_cookies::Cookies;

use crate::{
    db::Db,
    models::{BufferMap, Client, DocsMap, IntoObjectId, Update},
    utils::decode_cookie,
};

pub async fn edit(
    Extension(doc_states): Extension<DocsMap>,
    Extension(db): Extension<Arc<Db>>,
    Extension(buffer_map): Extension<BufferMap>,
    doc_id: Path<String>,
    ws: WebSocketUpgrade,
    cookies: Cookies,
) -> Response {
    ws.on_failed_upgrade(|err: Error| {
        error!("{}", err);
    })
    .on_upgrade(async move |ws| {
        let user_id = match cookies.get("token") {
            Some(c) => match decode_cookie(c).await {
                Some(claims) => claims.sub,
                None => return,
            },

            None => return,
        };
        handle_edit(doc_states, user_id, doc_id.to_string(), db, ws, buffer_map).await;
    })
}

///Websocket Function
// #[allow(unused_variables)]
// #[allow(unused_assignments)]
async fn handle_edit<'a>(
    docs: DocsMap,
    user_id: String,
    doc_id: String,
    db: Arc<Db>,
    mut ws: WebSocket,
    _buffer: BufferMap,
) {
    log::debug!("{} connected", &user_id);
    let user_id = Arc::new(user_id.as_str());
    let doc_id = doc_id.as_str();
    let db = Arc::clone(&db);
    let doc = match db.find_doc_with_id(doc_id).await {
        Ok(d) => d,
        Err(e) => {
            #[allow(unused)]
            ws.send(Message::text(e.error));
            return;
        }
    };
    let (tx, mut rx) = mpsc::channel::<Message>(128);
    let (mut sender, mut receiver) = ws.split();
    let mut client = Client::new(Arc::clone(&user_id), tx.clone());
    client.author = client.id == doc.author.unwrap().id.unwrap().to_hex();
    docs.lock()
        .await
        .entry(doc_id.to_string())
        .or_insert_with(Vec::new)
        .push(client);
    let readloop = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            #[allow(unused)]
            sender.send(Message::from(msg)).await;
        }
    });
    while let Some(Ok(msg)) = receiver.next().await {
        if let Message::Close(_) = msg{
            log::info!("user: {} disconnected",*user_id);
            return;
        }
        let mut update = Update::from(msg);
        update.from = Some(Arc::clone(&user_id).into_objetc_id());
        update.timestamp = Some(Utc::now());
        match docs.lock().await.get(doc_id) {
            Some(clients) => {
                for client in clients {
                    if client.id == *user_id{
                        continue;
                    }
                    #[allow(unused)]
                    client.sender.send(Message::from(update.clone())).await;
                }
                if let Err(e) = db.handle_update(doc_id, update).await {
                    #[allow(unused)]
                    tx.send(Message::from(
                        json!({
                            "err":e.error
                        })
                        .to_string(),
                    ))
                    .await;
                };
            }
            None => {
                #[allow(unused)]
                tx.send(Message::Text(
                    json!({
                        "err":"An error occurred",
                    })
                    .to_string()
                    .into(),
                ));
            }
        };
    }

    readloop.abort();

    if let Some(_) = docs.lock().await.remove(*user_id) {
        log::debug!("{} disconnected", user_id);
    }
}
