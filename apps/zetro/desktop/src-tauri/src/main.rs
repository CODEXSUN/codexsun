#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod runtime;

use runtime::DesktopRuntime;
use serde::Serialize;
use std::path::PathBuf;
use tauri::{AppHandle, Manager, State};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DesktopStatus {
    api_url: String,
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
        api_url: runtime.api_url().to_string(),
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
            match DesktopRuntime::start(app.handle()) {
                Ok(runtime) => {
                    app.manage(runtime);
                    Ok(())
                }
                Err(error) => {
                    rfd::MessageDialog::new()
                        .set_level(rfd::MessageLevel::Error)
                        .set_title("Zetro could not start")
                        .set_description(error.to_string())
                        .show();
                    Err(error)
                }
            }
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
