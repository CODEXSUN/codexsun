# Zetro Project Properties Layer

Date: 2026-09-08

## Outcome

Each project row now has a vertical actions menu. Rename, Settings, and Archive
open one foreground project properties layer. Close hides the layer and returns
to the current workspace.

## Ownership and persistence

- `zetro.projects.web` owns the row menu and project properties layer.
- `zetro.projects.api` owns project names and archive state.
- Existing project records receive an inactive archive flag during startup.
- The API keeps at least one active project.

## Interface

Rename saves the project name. Settings shows repository and record dates.
Archive removes the project from the active switcher after another project is
available. The properties layer uses the shared Sheet and menu components.

## Verification

- Passed the Zetro API and web type checks and production builds.
- Passed the project service test and focused lint checks.
- Passed module documentation, module boundary, format, and Git whitespace
  checks.
- Verified the vertical row menu and all properties sections in Chrome at
  `/zetro`.
- Verified that Close returns to Chat and the final-project archive guard is
  visible and disabled.

No commit or push was created.
