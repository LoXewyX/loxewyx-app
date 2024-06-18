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
    let dir_entries: fs::ReadDir = match fs::read_dir(dir_path) {
        Ok(entries) => entries,
        Err(err) => {
            return vec![err.to_string()];
        }
    };

    let mut entries: Vec<String> = vec![];

    for entry in dir_entries {
        match entry {
            Ok(entry) => {
                let path: std::path::PathBuf = entry.path();
                let name: String = path.file_name().unwrap_or_default().to_string_lossy().to_string();
                let suffix: &str = if path.is_dir() { "/" } else { "" };
                entries.push(format!("{}{}", name, suffix));
            }
            Err(err) => {
                entries.push(err.to_string());
            }
        }
    }

    // Sorting entries with directories first and then files
    entries.sort_by(|a: &String, b: &String| {
        let is_dir_a: bool = a.ends_with("/");
        let is_dir_b: bool = b.ends_with("/");

        if is_dir_a == is_dir_b {
            a.cmp(b)
        } else if is_dir_a {
            std::cmp::Ordering::Less
        } else {
            std::cmp::Ordering::Greater
        }
    });

    entries
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_files])
        // .menu(create_app_menu())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
