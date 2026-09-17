# Zetro SQLite Data Lifecycle

## Current Storage

The local Zetro profile stores SQLite at
`storage/apps/private/zetro/runtime/zetro.sqlite`. The Zetro API owns this
private file. The browser host never accesses it.

## Backup And Recovery

The Zetro operator owns local backups. Keep seven daily backup copies under
`storage/apps/private/zetro/backups/`. Before a selected deployment, restore a
backup into an isolated file and run the Zetro SQLite readiness check.

## Current Limit

Z-1202 creates no tables or migrations. A successful readiness check proves
that the file opens and accepts `SELECT 1`. It does not prove workflow data
recovery until a data-owning Zetro module exists.
