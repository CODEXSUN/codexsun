# Zetro Operations API

## Contract

- Module ID: `zetro.operations.api`
- Version: `1.0.0`
- Owner: Zetro API
- Data schema: `1`
- Dependencies: System Tasks and Codex Connection

The module owns local runtime metrics, connected application status samples,
operations settings, and diagnostics export.

## Routes

- `GET /api/v1/operations/metrics` returns host, API, Codex, task, disk, and worktree metrics.
- `GET /api/v1/operations/diagnostics` downloads a secret-free JSON package.
- `GET` and `PATCH /api/v1/operations/settings` manage retention and automatic sweeps.
- `POST /api/v1/connected-apps/metrics` receives status metrics from connected applications.

## Security and sync

Connected applications send only status, labels, and numeric metrics. Set
`ZETRO_CONNECTED_APP_TOKEN` and send it through `X-Zetro-App-Token`. This route
does not accept application records, commands, files, credentials, or logs.

## Persistence

The module stores settings and metric samples in module-owned SQLite or MariaDB tables.
SQLite uses the shared WAL connection. MariaDB uses the database-scoped application user.

## Verification

Run the Zetro API type check. Post one authenticated metric and verify its latest value.
Download diagnostics and scan it for credentials before release.

## Development records

- [2026-09-09 Production foundation](../../../../../../assist/records/zetro/2026-09-09-production-foundation.md)
