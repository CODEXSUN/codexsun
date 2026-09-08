# Zetro Task Sidebar Actions

Date: 2026-09-08

## Outcome

Task rows now show Archive, Rename, and Pin controls on hover or keyboard focus.
The Tasks sidebar shows Archived tasks below the primary New task action.

## Ownership and persistence

- `zetro.project-tasks.web` owns the row actions and archived task workspace.
- `zetro.tasks.api` owns the pinned and archived task fields.
- Existing task records receive false values during repository initialization.
- The task file remains in module-owned private storage.

## Interface

Archive removes a task from the active list. Rename edits the title in place.
Pin moves a task above unpinned tasks. Archived tasks lists hidden records and
supports restore.

## Verification

- Passed the Zetro API and web type checks and production builds.
- Passed the task service test and focused lint checks.
- Passed module-boundary and Git whitespace checks.
- Verified the task controls, inline rename, pin toggle, archive, restore, and
  footer order in Chrome at `/zetro`.
- The shared module documentation check remains blocked by the unrelated missing
  `assist/modules/orship.md` file.

No commit or push was created.
