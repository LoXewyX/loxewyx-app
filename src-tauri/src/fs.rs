use jwalk::WalkDir;
use mountpoints::mountpaths;
use notify::{Config, Event, EventKind, RecommendedWatcher, Watcher};
use serde_json::{Map, Value};
use std::collections::HashMap;
use std::fs::{read_to_string, write, File, OpenOptions};
use std::io::{Read, Write};
use std::path::Path;
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc, Mutex,
};
use std::time::{Duration, Instant};
use tauri::Emitter;

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
pub fn get_config(key: String) -> Option<Value> {
    let data = read_json();

    data.get(&key).cloned()
}

#[tauri::command]
pub fn set_config(key: String, value: Value) {
    let mut data = read_json();
    data.insert(key, value);
    save_json(&data);
}

/* Files */

#[tauri::command]
pub fn get_files(dir_path: String) -> Vec<String> {
    let mut entries = Vec::new();

    for entry in WalkDir::new(&dir_path)
        .max_depth(1)
        .into_iter()
        .filter_map(Result::ok)
    {
        let path = entry.path();

        if path != Path::new(&dir_path) {
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

// File analyzer

#[tauri::command]
pub fn get_file_content(file_path: String) -> String {
    match read_to_string(Path::new(&file_path)) {
        Ok(content) => content,
        Err(e) => {
            eprintln!("Error reading file: {:?}", e);
            "".to_string()
        }
    }
}

#[tauri::command]
pub fn save_file_content(file_path: String, content: String) -> Result<(), String> {
    match write(&file_path, content) {
        Ok(_) => Ok(()),
        Err(e) => {
            eprintln!("Error saving file: {:?}", e);
            Err(e.to_string())
        }
    }
}

#[derive(Clone)]
struct WatcherHandle {
    is_watching: Arc<AtomicBool>,
}

lazy_static::lazy_static! {
    static ref WATCHERS: Mutex<HashMap<String, WatcherHandle>> = Mutex::new(HashMap::new());
}

#[tauri::command]
pub async fn start_file_watcher<R: tauri::Runtime>(window: tauri::Window<R>, file_path: String) {
    let (tx, rx) = std::sync::mpsc::channel();
    let window = Arc::new(Mutex::new(window));
    let last_event_time = Arc::new(Mutex::new(Instant::now()));
    let is_watching = Arc::new(AtomicBool::new(true));

    {
        let mut watchers = WATCHERS.lock().unwrap();
        if watchers.contains_key(&file_path) {
            eprintln!("Watcher already exists for this file path.");
            return;
        }
        watchers.insert(
            file_path.clone(),
            WatcherHandle {
                is_watching: is_watching.clone(),
            },
        );
    }

    tokio::task::spawn({
        let tx = tx.clone();
        let window = window.clone();
        let last_event_time = last_event_time.clone();
        let is_watching = is_watching.clone();

        async move {
            let mut watcher = match RecommendedWatcher::new(tx, Config::default()) {
                Ok(w) => w,
                Err(e) => {
                    eprintln!("Error creating watcher: {:?}", e);
                    return;
                }
            };

            if let Err(e) =
                watcher.watch(Path::new(&file_path), notify::RecursiveMode::NonRecursive)
            {
                eprintln!("Error watching file: {:?}", e);
                return;
            }

            println!("Watching file for modifications...");

            loop {
                if !is_watching.load(Ordering::SeqCst) {
                    println!("Stopping file watcher...");
                    break;
                }

                match rx.recv() {
                    Ok(event) => {
                        let now = Instant::now();
                        let mut last_event_time = last_event_time.lock().unwrap();
                        if now.duration_since(*last_event_time) < Duration::from_millis(100) {
                            continue;
                        }
                        *last_event_time = now;

                        if let Ok(Event {
                            kind: EventKind::Modify(_),
                            ref paths,
                            ..
                        }) = event
                        {
                            for path in paths.iter() {
                                if path.to_str().map_or(false, |p| p == file_path) {
                                    println!("File modified: {:?}", path);

                                    match read_to_string(path) {
                                        Ok(content) => {
                                            let _ = window
                                                .lock()
                                                .unwrap()
                                                .emit("watch_for_changes", content);
                                        }
                                        Err(e) => {
                                            eprintln!("Error reading file: {:?}", e);
                                            continue;
                                        }
                                    };
                                } else {
                                    println!("Ignored event for non-watched file: {:?}", path);
                                }
                            }
                        }
                    }
                    Err(e) => {
                        eprintln!("Watch error: {:?}", e);
                    }
                }
            }
        }
    });
}

#[tauri::command]
pub fn stop_file_watcher(file_path: String) {
    let mut watchers = WATCHERS.lock().unwrap();
    if let Some(handle) = watchers.remove(&file_path) {
        handle.is_watching.store(false, Ordering::SeqCst);
        println!("Watcher stopped for file: {}", file_path);
    } else {
        eprintln!("No watcher found for file: {}", file_path);
    }
}
