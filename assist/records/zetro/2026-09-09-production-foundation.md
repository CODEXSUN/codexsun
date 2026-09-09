# Zetro Production Foundation

Date: 2026-09-09

## Decision

Zetro desktop remains the trusted repository execution node. The browser and
desktop use the same web modules and API contracts. Desktop starts a loopback API
with a new random session token after every restart.

SQLite with WAL is the standalone default. MariaDB is an optional large-data
provider through the same module-owned migrations. The local queue is the desktop
default. BullMQ is optional for a shared backend queue.

## Database changes

- Added an immutable migration ledger with checksum validation.
- Added module-owned tables for projects, conversations, tasks, settings, Git
  delivery flows, system tasks, execution steps, operations settings, and metrics.
- Added one-time imports from existing JSON storage when a module table is empty.
- Kept attachments, logs, and Git worktrees as files.

## Application changes

- Added desktop session authentication and a connected-app metrics token.
- Added durable system tasks with stop, retry, restart recovery, and execution history.
- Moved Git delivery and repository test scripts onto the system-task queue.
- Added worktree inventory, disk usage, retention sweeps, and safe removal.
- Added host, API, Codex, database, task, worktree, and connected-app metrics.
- Added a redacted diagnostics download.
- Added staging, review, history, blame, conflict, test, branch, stash, and pull-request tools.

## Safety

Repository commands use executable argument arrays and registered repository
roots. File operations reject paths outside the repository. Cleanup rejects dirty
worktrees. Push and pull-request actions require explicit settings. Protected
branches reject direct pushes.

## Verification

- `npm.cmd run test:zetro`
- `npm.cmd run typecheck --workspace=@codexsun/zetro-api`
- `npm.cmd run typecheck --workspace=@codexsun/zetro-web`

The WiX build produced `Zetro_0.1.9_x64_en-US.msi`. Desktop check, lint, Rust
tests, and the packaged native SQLite load passed. The MSI SHA-256 is
`4FFC42A7C20A9C2BADA914B381967BFC24699C7D6834453702772D090E5EF934`.
