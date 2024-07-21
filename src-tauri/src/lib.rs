use std::sync::Arc;
use tokio;
use mongodb::Database;

mod fs;
use fs::{
    get_config, get_files, get_last_update_date, get_mount_points, read_file_content, set_config,
};

mod db;
use db::{
    authenticate_user, connect_to_db, create_user, db_integrity, get_all_messages,
    get_users_by_message_ids, logout_user, verify_user_by_code,
};

mod ws;
use ws::start_websocket_server;

struct AppState {
    db: Arc<Database>,
}

pub fn run() {
    tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .unwrap()
        .block_on(async {
            let db = Arc::new(connect_to_db().await.unwrap_or_else(|err| {
                panic!("Failed to connect to MongoDB: {}", err);
            }));
            println!("Connected to MongoDB Atlas");

            // Ensure database integrity
            db_integrity(&db).await;
            
            // Start the websocket server
            let db_clone = Arc::clone(&db);
            tokio::spawn(async move {
                start_websocket_server("127.0.0.1:8080", db_clone).await;
            });

            let app_state = AppState { db };

            tauri::Builder::default()
                .manage(app_state)
                .plugin(tauri_plugin_shell::init())
                .plugin(tauri_plugin_websocket::init())
                .invoke_handler(tauri::generate_handler![
                    get_config,
                    set_config,
                    get_files,
                    get_mount_points,
                    read_file_content,
                    get_last_update_date,
                    create_user,
                    authenticate_user,
                    verify_user_by_code,
                    logout_user,
                    get_all_messages,
                    get_users_by_message_ids,
                ])
                .run(tauri::generate_context!())
                .expect("Error while running tauri application");
        });
}
