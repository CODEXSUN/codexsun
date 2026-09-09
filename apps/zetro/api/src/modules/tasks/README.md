# Zetro Tasks API

## Contract

- Module ID: `zetro.tasks.api`
- Version: `0.3.0`
- Owner: Zetro API
- Entity: `Task`
- Routes: list, create, and update under `/api/v1/tasks`

A task has a stable ID, project ID, title, optional description, status,
priority, pinned state, archived state, and timestamps. List and update routes
require the project ID. The list route accepts the `archived` query filter.

The `zetro.project-tasks.web` module consumes this contract inside `/zetro`.

## Dependency bindings

- `zetro.projects.api`: `^0.4.0`

## Persistence

Tasks are stored in `storage/app/private/zetro/tasks.json`. Writes replace the
file atomically. Existing records receive the default project ID during
initialization. Existing records receive false pinned and archived values. The
module does not use database tables, migrations, seeds, events, or jobs in
version `0.3.0`.

## Lifecycle

Install creates the private Zetro storage directory on first repository initialization. Activate registers routes. Upgrade requires no migration. Deactivate stops route handling. Uninstall intentionally preserves the task file so removal is non-destructive.

## Permissions and settings

The initial standalone version has no user identity boundary. Do not expose the API publicly until authentication is added. Storage location follows root `STORAGE_ROOT` configuration.

## Verification

Run the Zetro API typecheck. Start the API, create a task, update its status, restart the API, and confirm the task remains available.

## Development records

Future changes must be recorded in the [Zetro development records](../../../../../../assist/records/zetro/README.md).

- [2026-09-08 Task System master-detail workflow](../../../../../../assist/records/zetro/2026-09-08-task-system.md)
- [2026-09-08 Empty Desk reset](../../../../../../assist/records/zetro/2026-09-08-empty-desk-reset.md)
- [2026-09-08 Task sidebar actions](../../../../../../assist/records/zetro/2026-09-08-task-sidebar-actions.md)
