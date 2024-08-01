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
pub fn get_config(key: &str) -> Option<Value> {
    let data = read_json();

    data.get(key).cloned()
}

#[tauri::command]
pub fn set_config(key: String, value: Value) {
    let mut data = read_json();
    data.insert(key, value);
    save_json(&data);
}

/* Files */

#[tauri::command]
pub fn get_files(dir_path: &str) -> Vec<String> {
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
pub fn get_mount_points() -> Vec<String> {
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
pub async fn load_file(path: String) -> Result<String, String> {
    match std::fs::read_to_string(&path) {
        Ok(content) => Ok(content),
        Err(e) => Err(format!("Failed to read file: {}", e)),
    }
}

#[tauri::command]
pub async fn save_file(path: String, content: String) -> Result<(), String> {
    match std::fs::write(&path, content) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to write file: {}", e)),
    }
}