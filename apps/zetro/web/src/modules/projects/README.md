# Zetro Projects Web

## Contract

- Module ID: `zetro.projects.web`
- Version: `0.5.0`
- Owner: Zetro web

The module owns active project state and the sidebar project switcher. It reuses
the shared sidebar-07 menu and dropdown primitives. The Add project dialog sends
the name and local repository path to `zetro.projects.api`.

When no project exists, the switcher shows a Connect project state. The same
Add project dialog runs in the browser and the desktop app. The desktop app can
open the native folder picker. The browser accepts a server-visible folder path.

Selecting a project keeps the browser on `/zetro`, returns to Chat, and updates
the context consumed by conversation history, provider turns, and tasks. The
module stores no project records in browser storage.

Each project row has Settings and Archive actions. These actions open one
foreground properties layer. The bold project label has an inline edit action.
Settings edits the repository path, GitHub URL, logo text, logo color, and tagline.
Close hides the layer without changing the current Chat or Tasks workspace.
The Tools section can inherit global developer and Git delivery defaults. It can
also save isolated values for each settings owner.

The shared ProjectLogo renders the stored text and color in the switcher,
project rows, properties preview, and workspace header. The tagline replaces the
fixed project subtitle in the switcher and appears in each project menu row.

## Dependency bindings

- `zetro.projects.api`: `^0.4.0`
- `zetro.desk.web`: `^0.8.0`
- `zetro.developer-tools.web`: `^0.2.0`
- `zetro.git-delivery.web`: `^0.1.0`

## Verification

Run the Zetro web type check and production build. Open `/zetro`, inspect the
project menu, and confirm project selection updates Chat and Tasks.

## Development records

- [2026-09-08 Project properties layer](../../../../../../assist/records/zetro/2026-09-08-project-properties-layer.md)
- [2026-09-08 Project workspace binding](../../../../../../assist/records/zetro/2026-09-08-project-workspace-binding.md)
- [2026-09-09 Desktop project onboarding](../../../../../../assist/records/zetro/2026-09-09-desktop-project-onboarding.md)
