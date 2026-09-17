use serde::Serialize;

#[derive(Serialize)]
struct DesktopRuntime {
    platform: &'static str,
    version: &'static str,
}

#[tauri::command]
fn desktop_runtime() -> DesktopRuntime {
    DesktopRuntime {
        platform: std::env::consts::OS,
        version: env!("CARGO_PKG_VERSION"),
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![desktop_runtime])
        .run(tauri::generate_context!())
        .expect("CODEXSUN Platform desktop could not start");
}
