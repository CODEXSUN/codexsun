# Zetro Developer Tools Web

## Contract

- Module ID: `zetro.developer-tools.web`
- Version: `1.0.0`
- Owner: Zetro web

The module owns the floating repository monitor and all developer tool controls.
The same React bundle runs in the browser and the Tauri desktop app.

The panel accepts a composition slot below its header. Zetro Desk uses this slot
for the separately owned Git Delivery flow builder.

## Workspace surface

The collapsed control shows the active branch and changed-file count. The expanded
panel shows staged files, untracked files, ahead and behind counts, and request latency.

Users can refresh, fetch, create a branch, compare, commit, push, revert a commit, open an editor,
open the file browser, or open Windows Terminal. Remote actions require confirmation.

The repository workspace adds changed-file navigation, side-by-side review, file
and hunk staging, file history, blame, conflict resolution, test and build tasks,
merged-branch cleanup, stash management, and draft pull-request creation.

Monitoring runs at the effective project interval. It pauses while the document is
hidden and resumes after the user returns to Zetro.

## Settings

The Developer tools settings page owns global defaults. The project properties layer
has a Tools section with an inherit toggle and isolated project values.

## Verification

Run the Zetro web type check, lint, production build, and browser review. Test the
same built bundle in the Tauri desktop app.

## Development records

- [2026-09-09 Developer tools](../../../../../../assist/records/zetro/2026-09-09-developer-tools.md)
