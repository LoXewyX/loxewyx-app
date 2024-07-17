// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
mod fs;
use fs::{
    get_config, get_files, get_last_update_date, get_mount_points, read_file_content, set_config,
};

mod db;
use db::{add_user, connect_to_db, ensure_collections_exist};
use mongodb::Database;
use std::sync::Arc;
use tauri::State;
use tokio;

/* Database */

struct AppState {
    db: Arc<Database>,
}

async fn db_integrity(db: Arc<Database>) {
    if let Err(err) = ensure_collections_exist(&db).await {
        panic!("Failed to ensure collections exist: {}", err);
    }
    println!("Collections are ensured to exist.");
}

#[tauri::command]
async fn create_user(
    state: State<'_, AppState>,
    alias: String,
    email: String,
    full_name: String,
    password: String,
) -> Result<(), String> {
    add_user(&state.db, alias, email, full_name, password)
        .await
        .map_err(|e| e.to_string())
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
            println!("Connected to MongoDB Atlas!");

            db_integrity(Arc::clone(&db)).await;

            let app_state = AppState { db };

            tauri::Builder::default()
                .manage(app_state)
                .plugin(tauri_plugin_shell::init())
                .invoke_handler(tauri::generate_handler![
                    /* cfg & fs */
                    get_config,
                    set_config,
                    get_files,
                    get_mount_points,
                    read_file_content,
                    get_last_update_date,
                    /* db */
                    create_user,
                ])
                .run(tauri::generate_context!())
                .expect("error while running tauri application");
        });
}
