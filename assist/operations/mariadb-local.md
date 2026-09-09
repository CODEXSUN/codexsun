# Local MariaDB

## Purpose

This guide installs or reuses one local MariaDB server. It provisions a database-scoped CODEXSUN application account.

## Configuration

Set these application values in the root `.env`:

- `DB_DRIVER`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_MASTER_NAME`

Set these setup-only values:

- `MARIADB_ADMIN_HOST`
- `MARIADB_ADMIN_PORT`
- `MARIADB_ADMIN_USER`
- `MARIADB_ADMIN_PASSWORD`
- `MARIADB_APPLICATION_HOST`

Both application runtimes and database tools read the same `DB_*` values. `MARIADB_ADMIN_*` values are optional setup overrides for environments that use separate administrator credentials.

## Installation plan

1. Check for an existing MariaDB Windows service.
2. Reuse the service when it listens on the configured host and port.
3. Install MariaDB Server with its Windows installer only when the service is absent.
4. Keep the service on loopback for local development.
5. Store the administrator password only in the root `.env`.
6. Set a separate application password before shared or production use.
7. Run the setup and lifecycle commands.
8. Start Platform and check readiness.

## Commands

```powershell
Get-Service MariaDB
npm.cmd run mariadb:setup
npm.cmd run mariadb:smoke
npm.cmd run test:mariadb:foundation
npm.cmd run dev:api
Invoke-RestMethod http://127.0.0.1:6010/health/ready
```

The setup command is repeatable. It creates the configured database, updates the application account authentication, and grants access only to that database.

The smoke command opens an application connection and runs a query. Platform API preflight runs this smoke test before it reserves port `6010`.

The lifecycle test creates a temporary database. It tests migration installation, restart behavior, schema drift rejection and repair, lock contention, rollback, recovery, and cleanup. Cleanup revokes the temporary grant before it removes the database.

## Security rules

- Never use the administrator account in an application server.
- Never log database passwords or connection strings.
- Require a nonempty application password in production.
- Restrict the application account to its database and configured host.
- Keep `.env` outside source control.
