# Zetro Project Tasks Web

## Contract

- Module ID: `zetro.project-tasks.web`
- Version: `0.4.2`
- Owner: Zetro web

The module lists tasks for the selected project, creates tasks, and advances a
task through To do, In progress, and Done. The sidebar shows a flat task-title
list. Selecting a title opens its full details in the 80-percent-width workspace.
The New task action uses a black primary button at the bottom of the Tasks
sidebar. It opens the form in the main workspace.

A new task waits until the user selects Start task. The task header includes
Review and Split menus. Review saves the `review` workflow binding and opens a
deterministic scorecard for outcome, context, verification, workflow, and plan
readiness. Split creates and persists three linked phase or subtask records;
repeat splits of the same kind are rejected in the client.

Task rows show Archive, Rename, and Pin actions on hover or keyboard focus.
Archived tasks opens below New task and provides a restore workspace.

All records come from `zetro.tasks.api`. The module owns no browser persistence.

## Dependency bindings

- `zetro.projects.web`: `^0.5.0`
- `zetro.tasks.api`: `^0.5.2`

## Verification

Run the Zetro web type check and production build. Open Tasks, create a task,
change its status, switch projects, and confirm task isolation.

## Development records

- [2026-09-08 Project workspace binding](../../../../../../assist/records/zetro/2026-09-08-project-workspace-binding.md)
- [2026-09-08 Task details and workspace context](../../../../../../assist/records/zetro/2026-09-08-task-details-workspace-context.md)
- [2026-09-08 Task sidebar actions](../../../../../../assist/records/zetro/2026-09-08-task-sidebar-actions.md)
- [2026-09-09 Chat task handoff](../../../../../../assist/records/zetro/2026-09-09-chat-task-handoff.md)
- [2026-09-09 Task planning actions](../../../../../../assist/records/zetro/2026-09-09-task-planning-actions.md)
