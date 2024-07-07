// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
use chrono::{DateTime, Local};
use jwalk::WalkDir;
use mountpoints::mountpaths;
use serde_json::{Map, Value};
use std::cmp::Ordering;
use std::fs::{File, OpenOptions, metadata};
use std::io::{Read, Write};
use std::path::Path;
use std::process::Command;

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
    let json_str = serde_json::to_string_pretty(data).expect("Failed to serialize JSON");
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
    let mut entries: Vec<(String, bool)> = Vec::new();

    for entry_result in WalkDir::new(dir_path).max_depth(1).into_iter() {
        match entry_result {
            Ok(entry) => {
                let path = entry.path();
                if path == Path::new(dir_path) {
                    continue;
                }

                let is_dir = entry.file_type().is_dir();
                let name_str = match path.file_name() {
                    Some(name_osstr) => {
                        let mut name_str = name_osstr.to_string_lossy().to_string();
                        if is_dir {
                            name_str.push('/');
                        }
                        (name_str, is_dir)
                    }
                    None => {
                        (path.to_string_lossy().to_string(), is_dir)
                    }
                };
                entries.push(name_str);
            }
            Err(err) => {
                entries.push((err.to_string(), false));
            }
        }
    }

    entries.sort_unstable_by(|a, b| {
        match (a.1, b.1) {
            (true, true) | (false, false) => a.0.cmp(&b.0),
            (true, false) => Ordering::Less,
            (false, true) => Ordering::Greater,
        }
    });

    entries.into_iter().map(|(name, _)| name).collect()
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

    mount_points
}

#[tauri::command]
fn run_file(file_path: &str) {
    let output = if cfg!(target_os = "windows") {
        Command::new("cmd")
            .args(&["/C", "start", "", file_path])
            .output()
            .expect("Failed to open file")
    } else if cfg!(target_os = "linux") {
        Command::new("xdg-open")
            .arg(file_path)
            .output()
            .expect("Failed to open file")
    } else {
        panic!("Unsupported operating system");
    };

    if !output.status.success() {
        eprintln!("Error opening file: {:?}", output);
    }
}

#[tauri::command]
fn get_last_update_date() -> String {
    let path = Path::new("tauri.conf.json");

    match metadata(path) {
        Ok(meta) => {
            match meta.modified() {
                Ok(modified_time) => {
                    let datetime: DateTime<Local> = DateTime::from(modified_time);
                    datetime.format("%m/%y").to_string()
                }
                Err(_) => "undefined".to_string(),
            }
        }
        Err(_) => "undefined".to_string(),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_config,
            set_config,
            get_files,
            get_mount_points,
            get_last_update_date,
            run_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
