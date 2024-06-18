// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use jwalk::WalkDir;
use std::path::PathBuf;

#[tauri::command]
fn get_files(dir_path: &str) -> Vec<String> {
    let mut entries: Vec<String> = Vec::new();

    WalkDir::new(dir_path).max_depth(1).into_iter().for_each(
        |entry_result: Result<jwalk::DirEntry<((), ())>, jwalk::Error>| match entry_result {
            Ok(entry) => {
                let path: PathBuf = entry.path();
                let name_str: String = path
                    .file_name()
                    .map(|name: &std::ffi::OsStr| {
                        let mut name_str: String = name.to_string_lossy().to_string();
                        if entry.file_type().is_dir() {
                            name_str.push('/');
                        }
                        name_str
                    })
                    .unwrap_or_else(|| String::new());

                // Add the name to entries if it's not empty
                if !name_str.is_empty() {
                    entries.push(name_str);
                }
            }
            Err(err) => {
                entries.push(err.to_string());
            }
        },
    );

    entries.sort_by(|a, b| match (a.ends_with('/'), b.ends_with('/')) {
        (true, true) | (false, false) => a.cmp(b),
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
    });

    entries
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_files])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
