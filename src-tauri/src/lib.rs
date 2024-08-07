mod fs;
use fs::{
    get_config, get_file_content, get_files, get_mount_points, save_file_content, set_config,
    start_file_watcher, stop_file_watcher,
};

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_config,
            set_config,
            get_files,
            get_mount_points,
            get_file_content,
            save_file_content,
            start_file_watcher,
            stop_file_watcher,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
