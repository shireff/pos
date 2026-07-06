// Smart Retail OS — Tauri Desktop Shell
// Rust main entry point

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

// ─── Health Check Command ────────────────────────────────────────────────────

/// Returns the current app health status.
/// Called from the frontend as: invoke('health_check')
#[tauri::command]
fn health_check() -> serde_json::Value {
    serde_json::json!({
        "status": "ok",
        "version": env!("CARGO_PKG_VERSION"),
        "platform": "desktop",
    })
}

// ─── App Data Directory Command ──────────────────────────────────────────────

/// Returns the path to the app-local data directory.
/// Used by the Node.js bootstrap to locate the MongoDB data files.
#[tauri::command]
fn get_app_data_dir(app_handle: tauri::AppHandle) -> Result<String, String> {
    app_handle
        .path_resolver()
        .app_data_dir()
        .map(|p| p.to_string_lossy().to_string())
        .ok_or_else(|| "Could not resolve app data directory.".to_string())
}

// ─── Desktop Health Status Command ─────────────────────────────────────────────

#[tauri::command]
fn desktop_health_status() -> serde_json::Value {
    serde_json::json!({
        "dbConnected": false,
        "encryptionActive": false,
    })
}

// ─── Main ────────────────────────────────────────────────────────────────────

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![health_check, get_app_data_dir, desktop_health_status])
        .setup(|app| {
            if let Some(data_dir) = app.path_resolver().app_data_dir() {
                std::fs::create_dir_all(&data_dir).map_err(|e| {
                    eprintln!("[Smart Retail OS] Failed to create data dir: {e}");
                    e
                })?;
                println!(
                    "[Smart Retail OS] App data directory: {}",
                    data_dir.display()
                );
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Smart Retail OS desktop application");
}
