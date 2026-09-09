#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod runtime;

use runtime::DesktopRuntime;
use serde::Serialize;
use std::path::PathBuf;
use tauri::{AppHandle, Manager, State};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DesktopStatus {
    api_url: &'static str,
    app_data_directory: String,
    log_file: String,
    runtime_owner: String,
    session_token: String,
    version: &'static str,
    worktree_directory: String,
}

#[tauri::command]
fn desktop_status(
    app: AppHandle,
    runtime: State<'_, DesktopRuntime>,
) -> Result<DesktopStatus, String> {
    let paths = runtime.paths();
    Ok(DesktopStatus {
        api_url: runtime::API_URL,
        app_data_directory: display(app.path().app_data_dir().map_err(display_error)?),
        log_file: display(paths.log_file.clone()),
        runtime_owner: runtime.owner(),
        session_token: runtime.session_token().to_string(),
        version: env!("CARGO_PKG_VERSION"),
        worktree_directory: display(paths.worktree_directory.clone()),
    })
}

#[tauri::command]
fn pick_repository_folder(start_path: Option<String>) -> Option<String> {
    let mut dialog = rfd::FileDialog::new().set_title("Choose a Git repository");
    if let Some(path) = start_path.filter(|value| PathBuf::from(value).is_dir()) {
        dialog = dialog.set_directory(path);
    }
    dialog.pick_folder().map(display)
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let runtime = DesktopRuntime::start(app.handle())?;
            app.manage(runtime);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            desktop_status,
            pick_repository_folder
        ])
        .run(tauri::generate_context!())
        .expect("Zetro desktop failed");
}

fn display(path: PathBuf) -> String {
    path.to_string_lossy().into_owned()
}

fn display_error(error: impl std::fmt::Display) -> String {
    error.to_string()
}
