// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use jwalk::WalkDir;
use mountpoints::mountpaths;
use serde_json::{Map, Value};
use std::fs::{File, OpenOptions};
use std::io::{Read, Write};
use std::path::Path;

/* JSON Config */

fn read_json() -> Map<String, Value> {
    let mut file = File::open("./assets/config.json").expect("Failed to open config.json");
    let mut contents = String::new();
    file.read_to_string(&mut contents)
        .expect("Failed to read config.json");
    let data: Map<String, Value> = serde_json::from_str(&contents).expect("Failed to parse JSON");

    data
}

fn save_json(data: &Map<String, Value>) {
    // Serialize the data to a JSON string
    let json_str = serde_json::to_string_pretty(data).expect("Failed to serialize JSON");

    // Write the JSON string back to the file
    let mut file = OpenOptions::new()
        .write(true)
        .truncate(true)
        .open("./assets/config.json")
        .expect("Failed to open config.json for writing");

    file.write_all(json_str.as_bytes())
        .expect("Failed to write JSON to file");
}

#[tauri::command]
fn get_config(key: &str) -> Option<Value> {
    let data = read_json();

    data.get(key).cloned()
}

#[tauri::command]
fn set_config(key: String, value: Value) {
    let mut data = read_json();
    data.insert(key, value);
    save_json(&data);
}

/* Files */

#[tauri::command]
fn get_files(dir_path: &str) -> Vec<String> {
    let mut entries: Vec<String> = Vec::new();

    // Collect entries excluding the directory itself
    for entry_result in WalkDir::new(dir_path).max_depth(1).into_iter() {
        match entry_result {
            Ok(entry) => {
                let path = entry.path();
                // Skip the directory itself
                if path == Path::new(dir_path) {
                    continue;
                }
                // Get file name as String or handle error
                let name_str = match path.file_name() {
                    Some(name_osstr) => {
                        let mut name_str = name_osstr.to_string_lossy().to_string();
                        if entry.file_type().is_dir() {
                            name_str.push('/');
                        }
                        name_str
                    }
                    None => {
                        entries.push(path.to_string_lossy().to_string());
                        continue;
                    }
                };
                entries.push(name_str);
            }
            Err(err) => {
                entries.push(err.to_string());
            }
        }
    }

    // Sort entries by type (directories first)
    entries.sort_by(|a, b| {
        let a_is_dir = a.ends_with('/');
        let b_is_dir = b.ends_with('/');

        match (a_is_dir, b_is_dir) {
            (true, true) | (false, false) => a.cmp(b),
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
        }
    });

    entries
}

#[tauri::command]
fn get_mount_points() -> Vec<String> {
    let mut mount_points = Vec::new();

    if let Ok(paths) = mountpaths() {
        for path in paths {
            if let Some(path_str) = path.to_str() {
                mount_points.push(path_str.to_string().replace("\\", "/"));
            }
        }
    }
    mount_points.push("D:/".to_string());
    mount_points
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_config,
            set_config,
            get_files,
            get_mount_points
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
