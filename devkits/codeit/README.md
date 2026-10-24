# Codeit

Codeit is a standalone development workspace under `devkits/codeit`.
It uses the shared CODEXSUN Main Layout, controls, and UIUX visual pattern.

## Run

Run `npm run dev:codeit` from the repository root.
Open `http://127.0.0.1:7070/codeit/overview`.
Settings are at `/codeit/settings`.
Set `CODEXSUN_CODEIT_WEB_PORT` to change the port. The default is 7070.
The Vite server binds to loopback and rejects an occupied port.
Platform does not start Codeit. Codeit does not require Platform to run.

Run `npm run build:codeit` to build into `dist/devkits/codeit`.

## Integration

Platform registers the optional `codeit` application in its API catalog and web launcher.
Super Admin can enable it through Tenant Apps. It is not enabled for existing tenants automatically.
Platform provides `/app/codeit/overview` and `/app/codeit/settings` as read-only launch pages.
The settings shortcut opens Codeit settings when Codeit is the active application.
Local launch links use the configured Codeit port.
For hosted launch links, set `CODEXSUN_CODEIT_WEB_URL` to the separately hosted Codeit URL before building Platform Web.
Hosted Platform pages do not infer a loopback address for remote users.
Existing databases need the normal Platform registry seed to create the catalog row. No new table or migration is required.

## Ownership and supported scope

`src/codeit-app.tsx` owns standalone navigation and history.
`src/modules/overview` owns the overview and runtime settings content.
The public `@codexsun/codeit` entry exports only `CodeitOverview` and `CodeitSettings`.
Platform composes these read-only pages without embedding the standalone app shell.
`@codexsun/ui` supplies reusable layout and controls. React and Lucide supply rendering and icons.

This release is a read-only app shell, with no API, database, authentication, file access, or command execution.
The local shell contains no tenant records and does not treat Platform activation as runtime authorization.
Future tenant data capabilities need server-side identity, activation, and permission checks before they can ship.
The overview module is exempt from CRUD roles because it has no persistence or data operations.

## Verification

Run `npm run typecheck -w @codexsun/codeit`, `npm run lint -w @codexsun/codeit`, and `npm run build:codeit`.
Run `node tools/check-module-boundaries.mjs codeit` and the component documentation checks.
See [tasks](agent/TASK.md), [plan](agent/PLAN.md), and [working rules](agent/SKILLS.md).
