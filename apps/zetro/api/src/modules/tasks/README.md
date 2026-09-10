# Zetro Tasks API

## Contract

- Module ID: `zetro.tasks.api`
- Version: `0.5.2`
- Owner: Zetro API
- Entity: `Task`
- Routes: list, create, and update under `/api/v1/tasks`

A task has a stable ID, project ID, title, optional description, status,
priority, pinned state, archived state, planning kind, optional parent task,
optional workflow binding, and timestamps. A reviewed plan has source scope,
acceptance criteria, checks, and an origin conversation. Starting it creates
one linked Supervisor System Task attempt. List and update routes
require the project ID. The list route accepts the `archived` query filter.

The `zetro.project-tasks.web` module consumes this contract inside `/zetro`.

## Dependency bindings

### Planning integrity

Parent tasks must exist in the same project and remain open and unarchived when child work starts.
A parent cannot become done while any direct child remains unfinished, including archived children.
Reopen the parent before reopening a completed child. Invalid transitions return HTTP 409.
Manual done remains a planning status, not verified implementation or human release acceptance.
Starting requires a reviewed plan and an explicit local user action. It does not
authorize commits, publication, deployment, or final acceptance.
See the [governed workflow task](../../../../../../assist/tasks/zetro-governed-development.md).

- `zetro.projects.api`: `^0.4.0`

## Persistence

Tasks are stored in the module-owned `zetro_tasks` database table. The legacy
`storage/app/private/zetro/tasks.json` file imports once when no database rows
exist. Existing records receive false pinned and archived values, a root planning
kind, and empty parent and workflow values. The module does not use events or
jobs in version `0.5.0`.

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
- [2026-09-09 Task planning actions](../../../../../../assist/records/zetro/2026-09-09-task-planning-actions.md)
