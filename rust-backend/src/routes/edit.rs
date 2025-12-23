use std::sync::Arc;

use axum::{
    Error, Extension,
    extract::{
        Path, WebSocketUpgrade,
        ws::{Message, WebSocket},
    },
    response::Response,
};
use futures::{SinkExt, StreamExt};
use log::error;
use tower_cookies::Cookies;

use crate::{
    db::Db,
    models::{self, Client, ClientsMap, DocState, IntoObjectId},
    utils::decode_cookie,
};

pub async fn edit(
    Extension(clients): Extension<ClientsMap>,
    Extension(doc_states): Extension<models::DocStateMap>,
    Extension(db): Extension<Arc<Db>>,
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
        handle_edit(
            clients.clone(),
            doc_states,
            user_id,
            doc_id.to_string(),
            db,
            ws,
        )
        .await;
    })
}

///Temporary Websocket Dunction
#[allow(unused_variables)]
#[allow(unused_assignments)]
async fn handle_edit(
    ref mut clients: ClientsMap,
    docs: models::DocStateMap,
    user_id: String,
    doc_id: String,
    db: Arc<Db>,
    ws: WebSocket,
) {
    log::debug!("{} connected", user_id);
    let (tx, mut rx) = tokio::sync::mpsc::channel::<Message>(128);
    let (mut sender, mut receiver) = ws.split();
    let client = Client::new(tx.clone());
    let id = user_id.clone();
    let client_map = clients.lock();
    client_map.await.insert(user_id.clone(), client);
    let state = DocState::new(id.clone().into_objetc_id(), vec![]);
    let s: &DocState;
    if let Some(d) = docs.lock().await.get(&doc_id) {
        s = d;
    } else {
        docs.lock().await.insert(doc_id.clone(), state);
    }

    // Readloop
    let readloop = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            sender.send(msg).await.unwrap();
        }
        log::debug!("shutting down readloop for {}", id);
    });

    //Main websocket loop
    while let Some(Ok(msg)) = receiver.next().await {
        let res = format!("message: {}", msg.to_text().unwrap());
        tx.send(Message::text(res)).await.unwrap();
        // let data: WsEvents = from_str(msg.to_text().unwrap()).unwrap();
        // match data {
        //     WsEvents::Insert(m) => {
        //         log::debug!("{:?}", m);
        //         db.update_doc(&doc_id,m).await;
        //     }
        //     WsEvents::Delete(m) => {
        //         log::debug!("{:?}", m);
        //         db.update_doc(&doc_id,m).await;
        //     }
        // }
    }

    readloop.abort();

    if let Some(_) = clients.lock().await.remove(&user_id) {
        log::debug!("{} disconnected", user_id);
    }
}
