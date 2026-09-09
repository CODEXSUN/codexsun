# Identity Foundation Readiness

Date: 2026-09-09

Repository version: `0.1.8`

## Outcome

The Platform foundation is ready for Identity development. The final runtime shutdown and database-account blockers are closed.

## Runtime lifecycle

`tools/runtime-local.mjs` owns profile startup and shutdown. It now disconnects its supervisor IPC channel after all child controllers stop.

`tools/preflight.mjs` owns one local service process tree. On Windows, shutdown stops the complete owned tree. This prevents Node watchers and Vite processes from remaining on reserved ports.

The binding stays local and fail-closed. A profile smoke test refuses to replace an active listener. The test must start from free ports.

## MariaDB boundary

The root runtime configuration uses `codexsun@localhost`. This account has access to `cxsun_master_db` only.

The setup path uses `MARIADB_ADMIN_*`. Application schemas continue to parse only `DB_*` variables.

This release changes account setup and grants. It does not change a business table or module schema.

## Parallel work boundary

This change preserves the concurrent Zetro Git Delivery release at `0.1.7`. The repository version advances to `0.1.8`.

The root version tool keeps npm, Tauri, Cargo package, and Cargo lock metadata aligned.

No Identity entity, route, migration, seed, policy, or UI was added. Identity remains the next module-owned workstream.

## Verification

- `npm.cmd run mariadb:setup` passed as `codexsun@localhost`.
- `npm.cmd run mariadb:smoke` passed against MariaDB `12.3.2`.
- `npm.cmd run runtime:smoke -- platform-only` passed startup and health checks.
- The same runtime smoke passed supervisor shutdown and released ports `6010` and `6021`.

- `npm.cmd run check` passed after the version and documentation updates.
- `git diff --check` passed.
