// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

// use tauri::{CustomMenuItem, Menu, Submenu};

// fn create_app_menu() -> Menu {
//     Menu::new()
//         .add_item(CustomMenuItem::new("Home", "Home"))
//         .add_submenu(Submenu::new(
//             "File",
//             Menu::new()
//                 .add_item(CustomMenuItem::new("quit".to_string(), "Quit"))
//                 .add_item(CustomMenuItem::new("close".to_string(), "Close"))
//         ))
// }

#[tauri::command]
fn get_files(dir_path: &str) -> Vec<String> {
    fs::read_dir(dir_path)
        .unwrap()
        .map(|entry| {
            let path: std::path::PathBuf = entry.unwrap().path();
            let name: &std::ffi::OsStr = path.file_name().unwrap_or_default();
            format!("{}{}", name.to_string_lossy(), if path.is_dir() { "/" } else { "" })
        })
        .collect()
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_files])
        // .menu(create_app_menu())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
