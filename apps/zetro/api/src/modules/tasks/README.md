# Zetro Tasks API

## Contract

- Module ID: `zetro.tasks.api`
- Version: `0.1.0`
- Owner: Zetro API
- Entity: `Task`
- Routes: list, create, and update under `/api/v1/tasks`

A task has a stable ID, title, optional description, status, priority, and timestamps. The module owns validation, task rules, persistence, and routes.

## Persistence

Tasks are stored in `storage/app/private/zetro/tasks.json`. Writes replace the file atomically. The module creates the file during first use and does not use database tables, migrations, seeds, events, or jobs in version `0.1.0`.

## Lifecycle

Install creates the private Zetro storage directory on first repository initialization. Activate registers routes. Upgrade requires no migration. Deactivate stops route handling. Uninstall intentionally preserves the task file so removal is non-destructive.

## Permissions and settings

The initial standalone version has no user identity boundary. Do not expose the API publicly until authentication is added. Storage location follows root `STORAGE_ROOT` configuration.

## Verification

Run the Zetro API typecheck. Start the API, create a task, update its status, restart the API, and confirm the task remains available.

## Development records

Future changes must be recorded in the [Zetro development records](../../../../../../assist/records/zetro/README.md).
