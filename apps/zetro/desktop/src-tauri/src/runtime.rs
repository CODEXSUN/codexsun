use rand::RngCore;
use std::{
    fs::{self, OpenOptions},
    io::{Read, Write},
    net::{Shutdown, TcpListener, TcpStream},
    path::PathBuf,
    process::{Child, Command, Stdio},
    sync::Mutex,
    thread,
    time::{Duration, Instant},
};
use tauri::{path::BaseDirectory, AppHandle, Manager};

const DEVELOPMENT_API_ADDRESS: &str = "127.0.0.1:6050";
const DEVELOPMENT_API_URL: &str = "http://127.0.0.1:6050";
const DESKTOP_API_PORT: u16 = 16050;

#[derive(Clone)]
pub struct RuntimePaths {
    pub log_file: PathBuf,
    pub worktree_directory: PathBuf,
}

pub struct DesktopRuntime {
    child: Mutex<Option<Child>>,
    owner: &'static str,
    paths: RuntimePaths,
    api_url: String,
    session_token: String,
}

impl DesktopRuntime {
    pub fn start(app: &AppHandle) -> Result<Self, Box<dyn std::error::Error>> {
        let paths = prepare_paths(app)?;
        let session_token = create_session_token();
        if cfg!(debug_assertions) && api_is_ready(DEVELOPMENT_API_ADDRESS) {
            return Ok(Self {
                child: Mutex::new(None),
                owner: "existing",
                paths,
                api_url: DEVELOPMENT_API_URL.to_string(),
                session_token,
            });
        }
        if cfg!(debug_assertions) {
            return Err("The Zetro development API did not start on port 6050.".into());
        }

        let endpoint = reserve_loopback_endpoint()?;
        let child = spawn_api(app, &paths, &session_token, endpoint.port)?;
        if !wait_for_api(&endpoint.address, Duration::from_secs(20)) {
            let mut child = child;
            stop_process_tree(&mut child);
            return Err(format!(
                "The bundled Zetro API did not start. Read {}.",
                paths.log_file.display()
            )
            .into());
        }
        Ok(Self {
            child: Mutex::new(Some(child)),
            owner: "desktop",
            paths,
            api_url: endpoint.url,
            session_token,
        })
    }

    pub fn owner(&self) -> String {
        self.owner.to_string()
    }

    pub fn paths(&self) -> &RuntimePaths {
        &self.paths
    }

    pub fn api_url(&self) -> &str {
        &self.api_url
    }

    pub fn session_token(&self) -> &str {
        &self.session_token
    }

    fn stop(&self) {
        if let Ok(mut guard) = self.child.lock() {
            if let Some(child) = guard.as_mut() {
                stop_process_tree(child);
            }
            *guard = None;
        }
    }
}

impl Drop for DesktopRuntime {
    fn drop(&mut self) {
        self.stop();
    }
}

fn prepare_paths(app: &AppHandle) -> Result<RuntimePaths, Box<dyn std::error::Error>> {
    let app_data = app.path().app_data_dir()?;
    let worktree_directory = app_data.join("worktrees");
    fs::create_dir_all(app_data.join("storage"))?;
    fs::create_dir_all(app_data.join("workspace"))?;
    fs::create_dir_all(&worktree_directory)?;
    let log_directory = app.path().app_log_dir()?;
    fs::create_dir_all(&log_directory)?;
    Ok(RuntimePaths {
        log_file: log_directory.join("zetro-api.log"),
        worktree_directory,
    })
}

fn spawn_api(
    app: &AppHandle,
    paths: &RuntimePaths,
    session_token: &str,
    port: u16,
) -> Result<Child, Box<dyn std::error::Error>> {
    let runtime_directory = app.path().resolve("runtime", BaseDirectory::Resource)?;
    let node = runtime_directory.join("node.exe");
    let app_data = app.path().app_data_dir()?;
    let output = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&paths.log_file)?;
    let errors = output.try_clone()?;
    let mut command = Command::new(node);
    command
        .arg("zetro-api.mjs")
        .current_dir(runtime_directory)
        .env("HOST", "127.0.0.1")
        .env("NODE_ENV", "production")
        .env("DB_DRIVER", "sqlite")
        .env("STORAGE_ROOT", app_data.join("storage"))
        .env(
            "ZETRO_ALLOWED_ORIGINS",
            "http://tauri.localhost,https://tauri.localhost",
        )
        .env("ZETRO_API_PORT", port.to_string())
        .env("ZETRO_DESKTOP_SESSION_TOKEN", session_token)
        .env("ZETRO_DESKTOP_PARENT_PID", std::process::id().to_string())
        .env("ZETRO_PROJECT_ROOT", app_data.join("workspace"))
        .env("ZETRO_WEB_PORT", "6060")
        .env("ZETRO_WORKTREE_ROOT", &paths.worktree_directory)
        .stdin(Stdio::null())
        .stdout(Stdio::from(output))
        .stderr(Stdio::from(errors));
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(0x08000000);
    }
    Ok(command.spawn()?)
}

struct RuntimeEndpoint {
    address: String,
    port: u16,
    url: String,
}

fn reserve_loopback_endpoint() -> Result<RuntimeEndpoint, Box<dyn std::error::Error>> {
    let listener = TcpListener::bind(("127.0.0.1", DESKTOP_API_PORT))
        .or_else(|_| TcpListener::bind("127.0.0.1:0"))?;
    let port = listener.local_addr()?.port();
    drop(listener);
    Ok(RuntimeEndpoint {
        address: format!("127.0.0.1:{port}"),
        port,
        url: format!("http://127.0.0.1:{port}"),
    })
}

fn create_session_token() -> String {
    let mut bytes = [0_u8; 32];
    rand::rng().fill_bytes(&mut bytes);
    bytes.iter().map(|byte| format!("{byte:02x}")).collect()
}

fn wait_for_api(address: &str, timeout: Duration) -> bool {
    let deadline = Instant::now() + timeout;
    while Instant::now() < deadline {
        if api_is_ready(address) {
            return true;
        }
        thread::sleep(Duration::from_millis(200));
    }
    false
}

fn api_is_ready(address: &str) -> bool {
    let Ok(mut stream) = TcpStream::connect_timeout(
        &address.parse().expect("valid API address"),
        Duration::from_millis(250),
    ) else {
        return false;
    };
    let _ = stream.set_read_timeout(Some(Duration::from_millis(500)));
    if stream
        .write_all(
            format!("GET /health/live HTTP/1.1\r\nHost: {address}\r\nConnection: close\r\n\r\n")
                .as_bytes(),
        )
        .is_err()
    {
        return false;
    }
    let _ = stream.shutdown(Shutdown::Write);
    let mut response = String::new();
    stream.read_to_string(&mut response).is_ok()
        && response.contains("200 OK")
        && response.contains("\"service\":\"zetro-api\"")
}

#[cfg(windows)]
fn stop_process_tree(child: &mut Child) {
    let mut command = Command::new("taskkill");
    command
        .args(["/PID", &child.id().to_string(), "/T", "/F"])
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());
    use std::os::windows::process::CommandExt;
    command.creation_flags(0x08000000);
    let _ = command.status();
    let _ = child.wait();
}

#[cfg(not(windows))]
fn stop_process_tree(child: &mut Child) {
    let _ = child.kill();
    let _ = child.wait();
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn desktop_api_endpoint_is_loopback_only() {
        let endpoint = reserve_loopback_endpoint().expect("reserve desktop API endpoint");
        assert!(endpoint.address.starts_with("127.0.0.1:"));
        assert!(endpoint.url.starts_with("http://127.0.0.1:"));
        assert!(endpoint.port > 0);
    }

    #[test]
    fn session_tokens_are_random_and_long() {
        let first = create_session_token();
        let second = create_session_token();
        assert_eq!(first.len(), 64);
        assert_ne!(first, second);
    }
}
