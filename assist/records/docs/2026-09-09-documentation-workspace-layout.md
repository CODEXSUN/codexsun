# Documentation Workspace Layout

Date: 2026-09-09

## Outcome

Docs now consumes `DocumentationWorkspace`, a shared layout exported by `packages/ui`. The UI
showcase documents it as a live Layout variant alongside MDI Main and Agent Workspace.

## Ownership

- `packages/ui` owns only the reusable shell defaults: Docs identity, search prompt, persistent
  sidebar key, status label, and workspace title.
- `apps/docs` continues to own document discovery, navigation, reading, editing, repository data,
  topology, settings, and persistence.
- `apps/ui` owns the layout documentation record, example code, and live specimen.

## Database Changes

None.

## Verification

- Shared UI, Docs web, and UI web type checks and builds.
- UI design-system, module-boundary, documentation, and workspace checks.
