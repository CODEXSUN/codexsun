# Codeit overview

Codeit is a standalone developer-kit shell in `devkits/codeit`.
It uses the same shared layout and controls as UIUX.

## Open the app

Run `npm run dev:codeit` from the repository root.
Open `http://127.0.0.1:7070/codeit/overview`.
Use Settings to view the runtime address and supported scope.
`CODEXSUN_CODEIT_WEB_PORT` changes the default port.
Platform does not start the Codeit process.

## Platform integration

The optional `codeit` registry entry connects Tenant Apps, the launcher, overview, and settings.
Existing databases need the normal registry seed before the app appears in Tenant Apps.
Enable Codeit for the selected tenant. Platform launch pages respect that tenant activation.
The overview launch button opens the separate runtime.
Hosted links require `CODEXSUN_CODEIT_WEB_URL` before the Platform web build.

## Module contract

The `overview` module owns read-only overview and runtime settings content.
Its public exports are `CodeitOverview` and `CodeitSettings` from `@codexsun/codeit`.
It has no tables, HTTP endpoints, credentials, persistence, or execution permissions.
The standalone app owns history, search, and shell navigation.
The five regions use the shared Main Layout technical names.

## Current limits

Project storage, code editing, AI actions, file access, and command execution are not configured.
The local shell does not authenticate users or access tenant data.
Future data and execution capabilities require backend authorization and separate verification.
