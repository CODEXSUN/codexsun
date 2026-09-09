# Zetro Desk Web

## Contract

- Module ID: `zetro.desk.web`
- Version: `0.7.1`
- Owner: Zetro web
- Flow: open one Zetro Desk canvas inside the shared MDI shell

The module owns the only public Zetro page, its sidebar surface, and its
workspace surface. It composes the project switcher, Agent Chat, and project
tasks without taking ownership of their behavior.
It mounts the developer-tools monitor for the active repository.

The composition root shows the shared global loader during initial paint. It
removes the overlay after the MDI shell completes two animation frames. The
loader stays visible for at least 280 milliseconds to prevent a startup flash.
Only the spinner is visible. Assistive technology can still read the loading
label.

New Zetro Desk work must use Tailwind utilities. Add custom CSS only when
Tailwind has no suitable option.

Project Chat, Tasks, and Settings use internal Desk views. Settings replaces
the project sidebar with its application settings navigation and returns to the
active workspace without adding a public route.

The Desk sidebar shows Chat and Tasks as compact icon tabs. Each tab keeps an
accessible label, a hover title, and its current count.

The workspace context bar shows the selected project and active Chat or Tasks
view. It shows the Codex connection state and the compact model selector on the
right. The selector replaces the static Provider and Model labels.
The Chat three-dot menu opens the connected-folder drawer. The context bar does
not show a separate folder action.

The Zetro Settings action has no top divider. Other shared MDI applications
keep the standard footer divider unless they provide their own footer style.
The right status slot shows the Zetro package version in gray 600 text.
The repository tools panel composes the Git Delivery flow builder in its top slot.
Zetro Desk owns only this placement.

The Desk module has no services, queries, schemas, persistence records,
migrations, permissions, events, or jobs.

## Verification

Run the Zetro web type check and production build. Open `/zetro` and confirm
that the global loader fades into Agent Chat without a content flash.

## Interface topology

The module owns topology region `15` as the whole Zetro Desk group. Its two
components are `15.1` for the Zetro workspace and `15.2` for the Zetro Desk
sidebar.
The shared MDI shell renders `ZetroDeskSidebar` through `sidebarContent` and
opens the Zetro-owned Settings workspace from its footer. The Zetro ITO
inspector has one desk, so it hides the selector and all shared MDI labels.

Agent Chat owns the child regions inside the workspace and sidebar.

## Development records

Future changes must update the [Zetro development records](../../../../../../assist/records/zetro/README.md).

- [2026-09-09 Codex model selection](../../../../../../assist/records/zetro/2026-09-09-codex-model-selection.md)
- [2026-09-08 Zetro Desk workspace](../../../../../../assist/records/zetro/2026-09-08-zetro-desk-workspace.md)
- [2026-09-08 Legacy frontend cleanup](../../../../../../assist/records/zetro/2026-09-08-legacy-frontend-cleanup.md)
- [2026-09-08 Empty Desk reset](../../../../../../assist/records/zetro/2026-09-08-empty-desk-reset.md)
- [2026-09-08 ITO desk selector](../../../../../../assist/records/platform/2026-09-08-ito-desk-selector.md)
- [2026-09-08 Dynamic MDI sidebar](../../../../../../assist/records/platform/2026-09-08-dynamic-mdi-sidebar.md)
- [2026-09-08 Agent chat foundation](../../../../../../assist/records/zetro/2026-09-08-agent-chat-foundation.md)
- [2026-09-08 Compact sidebar navigation](../../../../../../assist/records/zetro/2026-09-08-compact-sidebar-navigation.md)
- [2026-09-08 Task details and workspace context](../../../../../../assist/records/zetro/2026-09-08-task-details-workspace-context.md)
- [2026-09-09 Developer tools](../../../../../../assist/records/zetro/2026-09-09-developer-tools.md)
- [2026-09-09 Build version status](../../../../../../assist/records/zetro/2026-09-09-build-version-status.md)
