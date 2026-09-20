# Q Cafe API

The API exposes typed Zod routes and a protected internal OpenAPI reference.

## Data Mode

Set `QCAFE_DATA_MODE=local` for an outlet installation. Q Cafe uses local SQLite with WAL mode.

Set `QCAFE_DATA_MODE=cloud` for the cloud service. Set `QCAFE_CLOUD_DATABASE_URL` to a `mysql://` MariaDB URL.

Set `QCAFE_SYNC_CLOUD_URL` on a local installation when the approved cloud sync API is available. This value is server-only.
