use serde::{Deserialize, Serialize};
use std::{
    ffi::OsString,
    io::{BufRead, BufReader, Write},
    net::{TcpListener, TcpStream},
    os::windows::ffi::OsStrExt,
    sync::mpsc,
    thread,
    time::Duration,
};
use windows_service::{
    define_windows_service,
    service::{ServiceControl, ServiceControlAccept, ServiceExitCode, ServiceState, ServiceStatus, ServiceType},
    service_control_handler::{self, ServiceControlHandlerResult},
    service_dispatcher,
};
use windows_sys::{
    Win32::{
        Foundation::{GetLastError, HANDLE},
        Graphics::Printing::{
            ClosePrinter, EndDocPrinter, EndPagePrinter, OpenPrinterW, StartDocPrinterW,
            StartPagePrinter, WritePrinter, DOC_INFO_1W,
        },
    },
};

const SERVICE_NAME: &str = "CODEXSUNQCafePrint";
const SERVICE_ADDRESS: &str = "127.0.0.1:4181";
const MAX_RECEIPT_BYTES: usize = 16 * 1024;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PrintRequest {
    printer_name: String,
    document_name: String,
    receipt: String,
}

#[derive(Serialize)]
struct PrintResponse {
    ok: bool,
    job_id: Option<u32>,
    message: String,
}

define_windows_service!(ffi_service_main, service_main);

fn main() -> windows_service::Result<()> {
    if std::env::args().any(|argument| argument == "--self-test") {
        return run_self_test();
    }
    service_dispatcher::start(SERVICE_NAME, ffi_service_main)
}

fn run_self_test() -> windows_service::Result<()> {
    let payload = raw_receipt_bytes("Q Cafe printer service test\n");
    if payload.len() < 8 || !payload.starts_with(&[0x1b, b'@']) || !payload.ends_with(&[0x1d, b'V', 0]) {
        return Err(windows_service::Error::Winapi(std::io::Error::other("Raw receipt payload is invalid.")));
    }
    println!("Q Cafe raw printer service self-test passed.");
    Ok(())
}

fn service_main(_: Vec<OsString>) {
    let (shutdown_sender, shutdown_receiver) = mpsc::channel();
    let status_handle = match service_control_handler::register(SERVICE_NAME, move |event| match event {
        ServiceControl::Stop | ServiceControl::Shutdown => {
            let _ = shutdown_sender.send(());
            ServiceControlHandlerResult::NoError
        }
        _ => ServiceControlHandlerResult::NotImplemented,
    }) {
        Ok(handle) => handle,
        Err(_) => return,
    };

    let running = ServiceStatus {
        service_type: ServiceType::OWN_PROCESS,
        current_state: ServiceState::Running,
        controls_accepted: ServiceControlAccept::STOP | ServiceControlAccept::SHUTDOWN,
        exit_code: ServiceExitCode::Win32(0),
        checkpoint: 0,
        wait_hint: Duration::default(),
        process_id: None,
    };
    if status_handle.set_service_status(running).is_err() {
        return;
    }

    if let Ok(listener) = TcpListener::bind(SERVICE_ADDRESS) {
        let _ = listener.set_nonblocking(true);
        while shutdown_receiver.try_recv().is_err() {
            match listener.accept() {
                Ok((stream, _)) => {
                    let _ = handle_connection(stream);
                }
                Err(error) if error.kind() == std::io::ErrorKind::WouldBlock => thread::sleep(Duration::from_millis(100)),
                Err(_) => thread::sleep(Duration::from_millis(250)),
            }
        }
    }

    let _ = status_handle.set_service_status(ServiceStatus {
        service_type: ServiceType::OWN_PROCESS,
        current_state: ServiceState::Stopped,
        controls_accepted: ServiceControlAccept::empty(),
        exit_code: ServiceExitCode::Win32(0),
        checkpoint: 0,
        wait_hint: Duration::default(),
        process_id: None,
    });
}

fn handle_connection(mut stream: TcpStream) -> std::io::Result<()> {
    let request = read_request(&stream);
    let response = match request {
        Ok(request) => match print_raw_receipt(&request) {
            Ok(job_id) => PrintResponse { ok: true, job_id: Some(job_id), message: "Receipt sent directly to the selected printer.".to_string() },
            Err(message) => PrintResponse { ok: false, job_id: None, message },
        },
        Err(message) => PrintResponse { ok: false, job_id: None, message },
    };
    let json = serde_json::to_string(&response).expect("print response serializes");
    stream.write_all(json.as_bytes())?;
    stream.write_all(b"\n")
}

fn read_request(stream: &TcpStream) -> Result<PrintRequest, String> {
    let mut line = String::new();
    BufReader::new(stream)
        .read_line(&mut line)
        .map_err(|_| "Q Cafe print service could not read the receipt.".to_string())?;
    if line.len() > MAX_RECEIPT_BYTES * 2 {
        return Err("The receipt is too large to print.".to_string());
    }
    let request = serde_json::from_str::<PrintRequest>(&line)
        .map_err(|_| "Q Cafe print service received an invalid receipt.".to_string())?;
    if request.printer_name.trim().is_empty() || request.document_name.trim().is_empty() || request.receipt.trim().is_empty() {
        return Err("The printer, document name, and receipt are required.".to_string());
    }
    if request.receipt.as_bytes().len() > MAX_RECEIPT_BYTES {
        return Err("The receipt is too large to print.".to_string());
    }
    Ok(request)
}

fn print_raw_receipt(request: &PrintRequest) -> Result<u32, String> {
    let printer_name = wide(&request.printer_name);
    let document_name = wide(&request.document_name);
    let raw_data_type = wide("RAW");
    let mut printer: HANDLE = std::ptr::null_mut();
    unsafe {
        if OpenPrinterW(printer_name.as_ptr(), &mut printer, std::ptr::null()) == 0 {
            return Err(last_error("Q Cafe could not open the selected printer"));
        }
        let document = DOC_INFO_1W {
            pDocName: document_name.as_ptr() as *mut _,
            pOutputFile: std::ptr::null_mut(),
            pDatatype: raw_data_type.as_ptr() as *mut _,
        };
        let job_id = StartDocPrinterW(printer, 1, &document as *const _ as *const _);
        if job_id == 0 {
            ClosePrinter(printer);
            return Err(last_error("Q Cafe could not start the print job"));
        }
        if StartPagePrinter(printer) == 0 {
            EndDocPrinter(printer);
            ClosePrinter(printer);
            return Err(last_error("Q Cafe could not start the receipt page"));
        }
        let payload = raw_receipt_bytes(&request.receipt);
        let mut written = 0u32;
        let written_ok = WritePrinter(printer, payload.as_ptr() as *const _, payload.len() as u32, &mut written);
        EndPagePrinter(printer);
        EndDocPrinter(printer);
        ClosePrinter(printer);
        if written_ok == 0 || written as usize != payload.len() {
            return Err(last_error("Q Cafe could not send the complete receipt"));
        }
        Ok(job_id)
    }
}

fn raw_receipt_bytes(receipt: &str) -> Vec<u8> {
    let mut payload = Vec::with_capacity(receipt.len() + 16);
    payload.extend_from_slice(&[0x1b, b'@']);
    payload.extend_from_slice(receipt.replace('\r', "").as_bytes());
    payload.extend_from_slice(b"\n\n\n");
    payload.extend_from_slice(&[0x1d, b'V', 0]);
    payload
}

fn wide(value: &str) -> Vec<u16> {
    OsString::from(value).encode_wide().chain(Some(0)).collect()
}

fn last_error(prefix: &str) -> String {
    format!("{prefix}. Windows error {}.", unsafe { GetLastError() })
}

#[cfg(test)]
mod tests {
    use super::{raw_receipt_bytes, PrintRequest};

    #[test]
    fn receipt_uses_esc_pos_initialize_and_cut_commands() {
        let payload = raw_receipt_bytes("Bill 1\n");
        assert!(payload.starts_with(&[0x1b, b'@']));
        assert!(payload.ends_with(&[0x1d, b'V', 0]));
        assert!(payload.windows(6).any(|window| window == b"Bill 1"));
    }

    #[test]
    fn print_request_uses_the_desktop_camel_case_contract() {
        let request = serde_json::from_str::<PrintRequest>(
            r#"{"printerName":"Thermal","documentName":"Bill 1","receipt":"Total Rs.10"}"#,
        )
        .expect("desktop print request parses");
        assert_eq!(request.printer_name, "Thermal");
        assert_eq!(request.document_name, "Bill 1");
    }
}
