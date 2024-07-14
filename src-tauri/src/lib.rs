// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
use chrono::{DateTime, Local};
use jwalk::WalkDir;
use mountpoints::mountpaths;
use serde_json::{Map, Value};
use std::fs::{metadata, File, OpenOptions};
use std::io::{Read, Write};
use std::path::Path;
// use std::process::Command;

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
    let mut entries = Vec::new();

    for entry in WalkDir::new(dir_path)
        .max_depth(1)
        .into_iter()
        .filter_map(Result::ok)
    {
        let path = entry.path();

        if path != Path::new(dir_path) {
            if let Some(name_osstr) = path.file_name() {
                let name = name_osstr.to_string_lossy();

                if path.is_dir() {
                    entries.push(format!("{}/", name));
                } else if path.extension().map_or(false, |ext| ext == "eki") {
                    entries.push(name.into_owned());
                }
            }
        }
    }

    entries.sort_unstable_by(|a, b| match (a.ends_with('/'), b.ends_with('/')) {
        (false, false) | (true, true) => a.cmp(b),
        (false, true) => std::cmp::Ordering::Less,
        (true, false) => std::cmp::Ordering::Greater,
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

    mount_points
}

/*#[tauri::command]
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
}*/

#[tauri::command]
fn get_last_update_date() -> String {
    let path = Path::new("tauri.conf.json");

    match metadata(path) {
        Ok(meta) => match meta.modified() {
            Ok(modified_time) => {
                let datetime: DateTime<Local> = DateTime::from(modified_time);
                datetime.format("%m/%y").to_string()
            }
            Err(_) => "undefined".to_string(),
        },
        Err(_) => "undefined".to_string(),
    }
}

#[tauri::command]
fn read_file_content(file_path: &str) -> String {
    let mut file = match File::open(file_path) {
        Ok(file) => file,
        Err(_) => {
            return String::new();
        }
    };

    let mut content = String::new();
    match file.read_to_string(&mut content) {
        Ok(_) => content,
        Err(_) => String::new(),
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
            read_file_content,
            // run_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
