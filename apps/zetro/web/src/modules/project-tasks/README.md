# Zetro Project Tasks Web

## Contract

- Module ID: `zetro.project-tasks.web`
- Version: `0.3.0`
- Owner: Zetro web

The module lists tasks for the selected project, creates tasks, and advances a
task through To do, In progress, and Done. The sidebar shows a flat task-title
list. Selecting a title opens its full details in the 80-percent-width workspace.
The New task action uses a black primary button at the bottom of the Tasks
sidebar. It opens the form in the main workspace.

Task rows show Archive, Rename, and Pin actions on hover or keyboard focus.
Archived tasks opens below New task and provides a restore workspace.

All records come from `zetro.tasks.api`. The module owns no browser persistence.

## Verification

Run the Zetro web type check and production build. Open Tasks, create a task,
change its status, switch projects, and confirm task isolation.

## Development records

- [2026-09-08 Project workspace binding](../../../../../../assist/records/zetro/2026-09-08-project-workspace-binding.md)
- [2026-09-08 Task details and workspace context](../../../../../../assist/records/zetro/2026-09-08-task-details-workspace-context.md)
- [2026-09-08 Task sidebar actions](../../../../../../assist/records/zetro/2026-09-08-task-sidebar-actions.md)
