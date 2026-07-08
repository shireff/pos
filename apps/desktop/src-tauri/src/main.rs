// Smart Retail OS — Tauri Desktop Shell
// Rust main entry point

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize)]
struct AuthUser {
    id: String,
    email: String,
    name: String,
    companyId: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct AuthSessionStorageEntry {
    token: String,
    user: Option<AuthUser>,
}

fn auth_session_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    app_handle
        .path_resolver()
        .app_data_dir()
        .map(|dir| dir.join("auth-session.json"))
        .ok_or_else(|| "Could not resolve app data directory.".to_string())
}

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

// ─── Auth Session Storage Commands ────────────────────────────────────────────

#[tauri::command]
fn get_auth_session(app_handle: tauri::AppHandle) -> Result<Option<AuthSessionStorageEntry>, String> {
    let path = auth_session_path(&app_handle)?;
    if !path.exists() {
        return Ok(None);
    }

    let contents = fs::read_to_string(&path).map_err(|err| err.to_string())?;
    let session = serde_json::from_str(&contents).map_err(|err| err.to_string())?;
    Ok(Some(session))
}

#[tauri::command]
fn save_auth_session(
    app_handle: tauri::AppHandle,
    session: AuthSessionStorageEntry,
) -> Result<(), String> {
    let path = auth_session_path(&app_handle)?;
    if let Some(dir) = path.parent() {
        fs::create_dir_all(dir).map_err(|err| err.to_string())?;
    }

    let data = serde_json::to_string_pretty(&session).map_err(|err| err.to_string())?;
    fs::write(&path, data).map_err(|err| err.to_string())?;
    Ok(())
}

#[tauri::command]
fn clear_auth_session(app_handle: tauri::AppHandle) -> Result<(), String> {
    let path = auth_session_path(&app_handle)?;
    if path.exists() {
        fs::remove_file(&path).map_err(|err| err.to_string())?;
    }
    Ok(())
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
        .invoke_handler(tauri::generate_handler![
            health_check,
            get_app_data_dir,
            get_auth_session,
            save_auth_session,
            clear_auth_session,
            desktop_health_status,
        ])
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
