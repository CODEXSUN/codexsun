# MariaDB and Environment Foundation

Date: 2026-09-09

## Outcome

All API applications now use one shared root environment loader before their application-owned Zod schemas run. The Platform and Docs database clients now share one validated MariaDB environment contract.

## References and bindings

- `PlatformEnvironmentLoader` owns file loading, process precedence, aliases, defaults, and global publication.
- Each application config owns its schema and typed result.
- `tools/mariadb-local.mjs` owns setup-only administrator parsing and database grants.
- `tools/mariadb-setup.mjs` provisions the configured application database and account.
- `tools/platform-mariadb.integration.mjs` uses the administrator only for temporary database setup and cleanup.
- [Local MariaDB](../../operations/mariadb-local.md) defines the operator workflow.

The Platform runtime and database tools use one contract: `DB_DRIVER`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_MASTER_NAME`. The Platform runtime does not parse optional `MARIADB_ADMIN_*` setup credentials.

## Decisions

- Reuse the installed MariaDB service instead of installing another server.
- Keep application schemas decentralized and application-owned.
- Use one `DB_*` database contract for internal runtime code and external environment files.
- Keep `MARIADB_ADMIN_*` as optional setup-only overrides.
- Reject an empty application password in production.

## Parallel work

The repository contained concurrent application, UI, deployment, and desktop changes. This work did not replace or revert them.

## Verification

- Detected the running MariaDB Windows service and MariaDB `12.3.2`.
- Connected with the existing setup credentials without printing secrets.
- Provisioned and connected to the configured `DB_MASTER_NAME` without printing credentials.
- Passed environment loader tests and focused API type checks.
- Passed clean install, restart idempotency, lock contention, rollback, recovery, database cleanup, and temporary-grant cleanup against live MariaDB.
- Started Platform API and received ready status for database, storage, and module runtime.
