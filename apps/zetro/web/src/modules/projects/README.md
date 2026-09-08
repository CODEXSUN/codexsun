# Zetro Projects Web

## Contract

- Module ID: `zetro.projects.web`
- Version: `0.2.0`
- Owner: Zetro web

The module owns active project state and the sidebar project switcher. It reuses
the shared sidebar-07 menu and dropdown primitives. The Add project dialog sends
the name and local repository path to `zetro.projects.api`.

Selecting a project keeps the browser on `/zetro`, returns to Chat, and updates
the context consumed by conversation history, provider turns, and tasks. The
module stores no project records in browser storage.

Each project row has Rename, Settings, and Archive actions. These actions open
one foreground properties layer. Close hides the layer without changing the
current Chat or Tasks workspace. Rename and Archive use the Projects API.

## Verification

Run the Zetro web type check and production build. Open `/zetro`, inspect the
project menu, and confirm project selection updates Chat and Tasks.

## Development records

- [2026-09-08 Project workspace binding](../../../../../../assist/records/zetro/2026-09-08-project-workspace-binding.md)
