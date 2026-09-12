# Zetro execution todos

## Docker OCR capability

Status: deferred until Docker Desktop is available.

- Add one local `zetro-ocr` container with Tesseract and selected language data.
- Mount only the Zetro private chat-artifact directory read-only.
- Expose a loopback-only OCR route with bounded file size and duration.
- Add a Zetro image-processing setting: Connected Codex Vision or Private Docker OCR.
- Verify OCR with a fixture image, an unavailable-engine response, and a Docker health check.

The current chat path uses Connected Codex Vision. It passes a user-selected image as a
private local image input to the installed Codex app-server. It does not run OCR in Docker.
