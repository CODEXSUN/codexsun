# Task System Master-Detail Workflow

Date: 2026-09-08

Status: Retired from the Zetro web page on 2026-09-08. The Tasks API and stored
task data remain available. See the [Empty Desk reset](2026-09-08-empty-desk-reset.md).

## Outcome

Renamed the visible Zetro task experience to Task System and composed it as the first feature inside the public `/zetro` Zetro Desk. Added a master-detail workspace that lists every task with its priority, opens one selected task, and keeps its actions at the bottom. One upsert form now owns both create and edit behavior.

## Authoritative references

- [Zetro application](../../../apps/zetro/README.md)
- [Task System API module](../../../apps/zetro/api/src/modules/tasks/README.md)
- [Zetro module catalog](../../modules/zetro.md)

## Ownership and boundaries

- `zetro.tasks.web` owns list, selection, detail, form, state, and task actions.
- `zetro.tasks.api` continues to own validation, task rules, routes, and private JSON persistence.
- The Zetro composition root owns navigation and selects the Task System topology.
- The stable module IDs remain unchanged. Only the user-facing name and web module minor version changed.

## Binding properties

- `GET /api/v1/tasks` loads all tasks for the list.
- `POST /api/v1/tasks` handles create mode in the upsert form.
- `PATCH /api/v1/tasks/:taskId` handles edit mode and status actions.
- A selected task ID binds the list row to the detail pane.
- Priority and status values remain validated by the module-owned Zod contracts.

## Parallel-work notes

Concurrent changes to the Zetro development canvas, shared MDI topology, Docs, DevKit, and root tooling were preserved. This change touched only the Task System surface and small composition or catalog references required to expose it.

## Decisions

- Keep `zetro.tasks.web` and `zetro.tasks.api` as compatibility-safe technical IDs.
- Use one form for create and edit instead of duplicating field rules.
- Keep the complete list visible while showing the selected task beside it.
- Place lifecycle actions after task content so they remain predictable on desktop and mobile layouts.
- Reuse the existing API update route. No API implementation or storage migration was required.

## Database changes

Database update: No. Task records remain in the module-owned private JSON store.

## Verification

- Passed the focused Zetro web TypeScript check.
- Passed the focused Zetro web production build without warnings.
- The largest generated JavaScript chunk was below the 400 KB repository budget.
- Verified create, edit, list selection, priority labels, and the bottom Complete action in Chrome.
- Verified the completed task persisted after a controlled Zetro stack stop and restart.
- Verified a clean browser session with no console warnings or errors.
- Passed all Zetro API history, workflow, and worktree tests.
- The complete root gate reached repository type checking, then stopped on concurrent DevKit contract exports and shared table generic errors outside this module.

## Follow-up

Recreate a task screen only after the user approves its visual structure.
