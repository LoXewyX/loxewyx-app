use futures_util::{SinkExt, StreamExt};
use mongodb::Database;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::sync::Arc;
use tokio::net::TcpListener;
use tokio::sync::{broadcast, RwLock};
use tokio_tungstenite::accept_async;
use tokio_tungstenite::tungstenite::Message as WsMessage;
use mongodb::bson::DateTime;
use mongodb::bson::oid::ObjectId;
use uuid::Uuid;
use serde_json;

use crate::db::{send_message, Message};

#[derive(Debug, Serialize, Deserialize)]
struct IncomingMessage {
    user_id: String,
    content: String,
}

#[derive(Clone)]
struct AppState {
    users: Arc<RwLock<HashSet<String>>>,
    tx: broadcast::Sender<Message>,
}

async fn handle_connection(
    ws_stream: tokio_tungstenite::WebSocketStream<tokio::net::TcpStream>,
    user_id: String,
    state: AppState,
    db: Arc<Database>,
) {
    let (mut ws_tx, mut ws_rx) = ws_stream.split();
    state.users.write().await.insert(user_id.clone());

    let join_msg = Message {
        user_id: ObjectId::new(),
        content: format!("{} has joined", user_id),
        created_at: DateTime::now(),
        updated_at: DateTime::now(),
    };
    if let Err(err) = state.tx.send(join_msg.clone()) {
        eprintln!("Error broadcasting new user message: {:?}", err);
    }

    if let Err(err) = broadcast_users_list(&state.tx, state.users.clone()).await {
        eprintln!("Error broadcasting user list: {:?}", err);
    }

    let mut rx = state.tx.subscribe();

    tokio::spawn({
        async move {
            while let Ok(msg) = rx.recv().await {
                if msg.user_id != ObjectId::new() {
                    let json_msg = serde_json::to_string(&msg).expect("Error serializing message");
                    if let Err(err) = ws_tx.send(WsMessage::Text(json_msg)).await {
                        match err {
                            tokio_tungstenite::tungstenite::Error::AlreadyClosed => return,
                            _ => eprintln!("Error sending message to WebSocket: {:?}", err),
                        }
                        return;
                    }
                }
            }
        }
    });    

    while let Some(Ok(msg)) = ws_rx.next().await {
        if let WsMessage::Text(text) = msg {
            if let Ok(incoming_msg) = serde_json::from_str::<IncomingMessage>(&text) {
                println!(
                    "Received message from {}: {}",
                    incoming_msg.user_id, incoming_msg.content
                );

                match send_message(&db, incoming_msg.content.clone()).await {
                    Ok(saved_msg) => {
                        if let Err(err) = state.tx.send(saved_msg) {
                            eprintln!("Error broadcasting message: {:?}", err);
                        }
                    }
                    Err(err) => {
                        eprintln!("Error sending message to database: {:?}", err);
                    }
                }
            }
        }
    }

    state.users.write().await.remove(&user_id);
    let leave_msg = Message {
        user_id: ObjectId::new(),
        content: "A user has left".to_string(),
        created_at: DateTime::now(),
        updated_at: DateTime::now(),
    };
    if let Err(err) = state.tx.send(leave_msg) {
        eprintln!("Error broadcasting user leave message: {:?}", err);
    }
}

async fn broadcast_users_list(
    tx: &broadcast::Sender<Message>,
    users: Arc<RwLock<HashSet<String>>>,
) -> Result<(), broadcast::error::SendError<Message>> {
    let user_list = users.read().await;
    let users_msg = format!("Current users: {:?}", *user_list);
    let message = Message {
        user_id: ObjectId::new(),
        content: users_msg,
        created_at: DateTime::now(),
        updated_at: DateTime::now(),
    };
    tx.send(message).map(|_| ())
}

pub async fn start_websocket_server(addr: &str, db: Arc<Database>) {
    let listener = TcpListener::bind(addr)
        .await
        .expect("Unable to bind to address");
    let (tx, _rx) = broadcast::channel(100);
    let users = Arc::new(RwLock::new(HashSet::new()));
    let app_state = AppState {
        users: users.clone(),
        tx: tx.clone(),
    };

    while let Ok((stream, _)) = listener.accept().await {
        let ws_stream = accept_async(stream)
            .await
            .expect("Error during WebSocket handshake");

        let user_id = Uuid::new_v4().to_string();

        tokio::spawn(handle_connection(
            ws_stream,
            user_id,
            app_state.clone(),
            db.clone(),
        ));
    }
}
