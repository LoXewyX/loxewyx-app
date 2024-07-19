use std::sync::Arc;
use tokio;

mod fs;
use fs::{
    get_config, get_files, get_last_update_date, get_mount_points, read_file_content, set_config,
};

use mongodb::Database;
mod db;
use db::{authenticate_user, connect_to_db, create_user, db_integrity, verify_user_by_code};
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

            db_integrity(&db).await;

            let app_state = AppState { db };

            tauri::Builder::default()
                .manage(app_state)
                .plugin(tauri_plugin_shell::init())
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
                ])
                .run(tauri::generate_context!())
                .expect("Error while running tauri application");
        });
}
