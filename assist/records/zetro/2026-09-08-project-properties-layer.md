# Zetro Project Properties Layer

Date: 2026-09-08

## Outcome

Each project row now has a vertical actions menu. Settings and Archive open one
foreground project layer. The project label is the compact title and supports
inline editing. Close hides the layer and returns to the current workspace.

## Ownership and persistence

- `zetro.projects.web` owns the row menu and project properties layer.
- `zetro.projects.api` owns labels, repository paths, GitHub URLs, identity, and archive state.
- Existing records receive archive and identity defaults during startup.
- The API keeps at least one active project.

## Interface

The header edits the project label without renaming the repository directory.
Settings edits the repository path through text or the local folder browser.
It also edits the GitHub URL, logo text, and logo color. Project identity appears
in the switcher and workspace header. Archive removes the project from the active
switcher after another project is available.

The project tagline is part of the stored branding. Settings edits it, and the
switcher and project menu use it instead of a fixed subtitle.

## Verification

- Passed the Zetro API and web type checks and production builds.
- Passed the project service test and focused lint checks.
- Passed module documentation, module boundary, format, and Git whitespace
  checks.
- Verified the vertical row menu and all properties sections in Chrome at
  `/zetro`.
- Verified that Close returns to Chat and the final-project archive guard is
  visible and disabled.
- Verified the compact label header, inline label editor, two-section menu,
  repository browser, identity preview, and project logos in Chrome.
- Verified the stored tagline in Project Settings, the project switcher subtitle,
  the project menu row, and the identity preview in Chrome.

No commit or push was created.
