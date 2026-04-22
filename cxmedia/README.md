# cxmedia

`cxmedia` is a root-level standalone media storage and CDN service that lives in the same repository as Codexsun but runs independently from the suite shell.

## Scope

- JWT-protected standalone multi-user login
- Multipart image upload API
- S3-compatible object storage
- Public and signed-private delivery URLs
- Prefix-based file listing and folder navigation
- Signed upload and download URLs
- Thumbor-backed transform URL generation
- Standalone React file-manager UI with admin user and runtime settings panels

## Run

1. Copy `.env.example` to `.env` and fill the values.
2. Run `npm run cxmedia:dev` for the API server and `npm run cxmedia:dev:web` for the standalone React file browser.
3. Open `http://localhost:4174` for frontend development or `http://localhost:4100` after a production build.

Runtime state:

- `cxmedia/data/users.json` stores standalone operators, roles, and password hashes.
- `cxmedia/data/runtime-settings.json` stores admin-editable non-secret runtime settings such as allowed mime types and default upload visibility.
- `CXMEDIA_ADMIN_*` remains the bootstrap admin path for first startup or recovery.

## Build

- `npm run cxmedia:typecheck`
- `npm run cxmedia:build`
- `npm run cxmedia:start`
- `npm run cxmedia:test`
- `npm run cxmedia:test:thumbor` for the Docker-backed Thumbor transform validation
- `npm run cxmedia:test:e2e` for the standalone browser flow against the single-container image

## Delivery Paths

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/admin/users`
- `POST /api/admin/users`
- `PATCH /api/admin/users`
- `GET /api/settings`
- `PATCH /api/settings`
- `POST /api/upload`
- `GET /api/files?prefix=/user/folder/`
- `DELETE /api/file?path=/user/folder/file.jpg`
- `GET /api/file/<path>` authenticated origin read
- `POST /api/signed-url`
- `PUT /signed-upload/<path>?token=...`
- `GET /f/<path>` public CDN-style read
- `GET /p/<path>?token=...` signed private read
- `GET /resize/<size>/<path>?format=webp`
- `GET /crop/<size>/<path>?format=jpeg`

## Deployment

`cxmedia` now ships as one Docker image that contains the standalone app, Garage, and Thumbor.

### Docker Stack

- `npm run cxmedia:docker:up` seeds missing Garage bootstrap secrets into `cxmedia/.env`, builds the single image, and starts one `cxmedia-app` container on port `4100`.
- The container internally boots Garage, applies the single-node layout, provisions the configured bucket and access key, starts Thumbor on an internal port, and then starts the standalone app.
- Docker now persists standalone user and runtime-setting state in the `cxmedia_state` volume, separate from Garage object data volumes.
- The container runs with production-mode config validation, strict CORS origins, and HTTP security headers by default.
- `npm run cxmedia:docker:down` stops the stack.
