# Q Cafe API

The API exposes typed Zod routes and a protected internal OpenAPI reference.

## Database Driver

Set `DB_DRIVER=sqlite` in the ignored repository `.env` file for an outlet
installation. Q Cafe uses the file from `QCAFE_SQLITE_PATH` with foreign keys,
WAL mode, and a busy timeout.

Set `DB_DRIVER=mariadb` for the shared service. Q Cafe resolves the global
`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_MASTER_NAME` values
through Platform Core. It does not store another connection URL.

Set `QCAFE_SYNC_CLOUD_URL` on a local installation when the approved cloud sync API is available. This value is server-only.

Run `npm run database:smoke --workspace @codexsun/qcafe-api` to create the
configured MariaDB database when needed, run both SQLite and MariaDB migrations,
and verify each connection with a read query. The command does not print
credentials.

## Migration Flow

Development runs ordered migrations and repeat-safe seeders during API startup.
Every descriptor is recorded with its SHA-256 checksum and serial position.

For production, back up the database and run:

```text
npm run database:migrate --workspace @codexsun/qcafe-api
npm run database:verify --workspace @codexsun/qcafe-api
```

Production API startup does not change schema or seed data. It verifies the
complete lifecycle ledger and fails before serving traffic when history is
missing, reordered, or changed.
