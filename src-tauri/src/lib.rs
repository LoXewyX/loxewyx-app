mod fs;
use fs::{get_config, get_files, get_mount_points, load_file, save_file, set_config};

mod watcher;
use watcher::start_file_watcher;

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_config,
            set_config,
            get_files,
            get_mount_points,
            load_file,
            save_file,
            start_file_watcher,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
