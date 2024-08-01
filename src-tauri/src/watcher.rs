use notify::{watcher, RecursiveMode, DebouncedEvent};
use std::sync::{mpsc, Arc};
use std::time::Duration;
use tauri::api::event::emit;
use std::fs;


#[tauri::command]
pub fn start_file_watcher(path: String) {
    let (tx, rx) = mpsc::channel();
    let path = Arc::new(path);

    // Create the watcher with a delay of 1 second
    let mut watcher = watcher(tx, Duration::from_secs(1)).expect("Failed to create watcher");

    // Watch the directory
    watcher
        .watch(path.as_ref(), RecursiveMode::NonRecursive)
        .expect("Failed to watch path");

    // Spawn a new thread to handle file system events
    std::thread::spawn(move || {
        loop {
            match rx.recv() {
                Ok(event) => match event {
                    DebouncedEvent::Write(file_path) => {
                        // Read file content
                        let content = match fs::read_to_string(&file_path) {
                            Ok(content) => content,
                            Err(_) => String::from("Error reading file"),
                        };

                        // Emit the file change event to the frontend
                        let path_str = file_path.to_string_lossy().to_string();
                        emit("file-changed", (path_str, content)).expect("Failed to emit event");
                    }
                    _ => {}
                },
                Err(e) => eprintln!("Error while watching file: {:?}", e),
            }
        }
    });
}