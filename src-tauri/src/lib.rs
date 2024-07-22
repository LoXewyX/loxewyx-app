mod fs;
use fs::{
    get_config, get_files, get_last_update_date, get_mount_points, read_file_content, set_config,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_config,
            set_config,
            get_files,
            get_mount_points,
            read_file_content,
            get_last_update_date,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
