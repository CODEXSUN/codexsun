# Zetro Git Delivery Web

## Contract

- Module ID: `zetro.git-delivery.web`
- Version: `0.1.0`
- Owner: Zetro web
- Dependency: `zetro.git-delivery.api@^0.1.0`

The module owns the interactive Git delivery flow builder. The same builder runs in
the browser and the Tauri desktop application.

## Flow builder

The builder appears at the top of the floating repository tools panel. It collects:

1. A release title and changelog note.
2. The repository-owned version update choice.
3. A pull strategy of rebase, merge, or no pull.
4. A reviewed commit message and optional push.

The confirmation view lists every reviewed changed file. The API rejects the flow when
HEAD or the changed-file list differs from this preview.

## Settings

The main Settings workspace owns global defaults. Project properties can inherit them
or store an isolated configuration.

## Verification

Run the Zetro web type check, lint, build, and browser review. Verify the same bundle
inside the Tauri desktop app.

## Development records

- [2026-09-09 Git delivery flow](../../../../../../assist/records/zetro/2026-09-09-git-delivery-flow.md)
