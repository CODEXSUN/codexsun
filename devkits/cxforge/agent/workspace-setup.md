# Workspace setup

Zuno sends one approved setup contract. CXForge clones the repository and runs the setup.
The checkout is `/workspace`. Worker state, logs, and caches are under `/var/lib/cxforge`.
CXForge defaults to SQLite. Set `databaseDriver: "mariadb"` only for a configured shared database.

## Environment

Use `PUT /api/v1/cxforge/control/workspace/environment` with the worker client key.
Send `directory`, `values`, and optional `overwrite: true`.
The service copies `../../../.env.example` only when `.env` is missing.
Existing values remain unless the caller explicitly requests replacement.
Secret values are written to `.env`, not task history. The response does not return values.
Environment files use mode 0600. Tracked `.env` files and symlinks are rejected.

SQLite uses `DB_DRIVER=sqlite` and `CXFORGE_SQLITE_PATH`.
The application must use that path or an application-specific path configured by Zuno.
Different frameworks require different database URL formats. CXForge does not guess them.

Shared MariaDB requires `DB_DRIVER=mariadb`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_MASTER_NAME`.
Use a database and restricted user owned by this workspace.
The service checks authentication with `SELECT 1`. It does not create, reset, or drop shared databases.
There is no automatic fallback from a failed MariaDB connection to SQLite.

## Setup contract

Send `POST /api/v1/cxforge/control/workspace/setup`:

```json
{
  "requestId": "project-setup-001",
  "title": "Prepare project",
  "directory": ".",
  "databaseDriver": "sqlite",
  "sqlitePath": ".cxforge/workspace.sqlite",
  "approved": true,
  "repository": {"name": "Project", "repository": "https://github.com/owner/project.git", "defaultBranch": "main", "gitConnectionId": "saved-connection-id"},
  "environment": {"APP_MODE": "production"},
  "install": {"argv": ["npm", "ci"], "timeoutSeconds": 300},
  "migrationStatus": {"argv": ["npm", "run", "db:status"], "timeoutSeconds": 30},
  "migrate": {"argv": ["npm", "run", "db:migrate"], "timeoutSeconds": 120},
  "migrationVerify": {"argv": ["npm", "run", "db:verify"], "timeoutSeconds": 30},
  "previewCommand": "npm run dev -- --port {port} --host 0.0.0.0"
}
```

These command names are examples, not automatically detected scripts.
Zuno must supply commands that exist in the selected project.
Each command must exit zero. The verification command must reject pending or invalid migrations.
Setup stops the old preview before configuration and migrations.
The existing task status, events, output limits, cancellation, and idempotency rules apply.
The current container timeout limits the entire setup to 300 seconds by default.
The default npm cache is `/var/lib/cxforge/cache/npm`, outside the small `/tmp` filesystem.
Migration commands must be safe to repeat. CXForge does not undo partially completed migrations.

Successful setup returns a task in `review` with a workspace-ready report.
The live frontend is also available at the first preview port root, such as `http://localhost:7300/`.
This root route forwards to the active live preview only. It does not expose workspace files.

## Zuno preset

The supplied Zuno helper checks its existing identity migration ledger before setup.
It prepares identity, handoff, and portal SQLite stores through their existing implementations.
Verification checks identity checksums and order, required tables, and SQLite integrity.
It does not convert Zuno's SQLite-specific stores to MariaDB.
The preview supervisor waits for the API health endpoint before starting Vite.
It loads app-catalog ports from the repository registry without starting other apps.

`api/live-zuno-setup.ts` uses the typed client to submit this preset.
Its environment values and generated credentials are for an isolated local preview, not a production account.
Set `preset: "zuno"`. Go installs the bundled helpers from the image. No manual copying is required.
The live helper submits repository, environment, installation, migration, and preview configuration in one request.
Existing `../../../.env` values remain unchanged on repeat setup. Use the environment endpoint for explicit changes.

## Generic projects

Omit `repository` to reuse the existing checkout. Existing checkouts are never reset or silently pulled.
Public HTTPS clones can omit `gitConnectionId`. Private clones use a saved connection with clone permission.
Use `databaseDriver: "none"` for projects without a database. Omit all three migration steps in that mode.
Setup environment values are encrypted outside the checkout. Task history contains only their reference.
Run `.container/cxforge-workspace.sh setup.json` to submit a saved recipe through the API.
Start with `agent/setup.example.json`. Replace the repository and commands with your project's values.
The Go worker executes it. The shell script does not perform the project work.
For compiled frontends, use an install step that builds the app, then a foreground serving command.

Database files survive restart and the update script's archive restore.
Dropping the container deletes in-container SQLite data. Keep backups for data that must survive removal.
