# Zetro API

The API composes the `zetro.foundation`, `zetro.storage`, and `zetro.chat`
providers. It uses the shared Framework lifecycle and Platform Core runtime.

The API validates `ZETRO_DATABASE_URL`, `ZETRO_DATABASE_PATH`, and
`ZETRO_STORAGE_ROOT`. The chat provider owns its SQLite conversation schema and
uses the shared StorageProvider for temporary attachment files.

The local Codex adapter only runs `codex exec` with read-only and ephemeral
options. Device codes exist only in running process memory. The API does not
write device codes, tokens, or authentication files to storage or chat history.

Set `PLATFORM_HOST`, `ZETRO_API_PORT`, `ZETRO_DATABASE_URL`,
`ZETRO_DATABASE_PATH`, and `ZETRO_STORAGE_ROOT` in `api/.app.env`.

Run `npm.cmd run test:zetro-api` and `npm.cmd run check --workspace @codexsun/zetro-api`.
