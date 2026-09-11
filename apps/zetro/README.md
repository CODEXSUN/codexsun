# Zetro 2.0

Reference: [Application standard](../../assist/architecture/application-standard.md)

## Purpose

Zetro 2.0 provides one browser workflow: enter a prompt, invoke the locally
authenticated Codex CLI, and display its response as plain text. A small local API
stores chat turns and raw stream events in SQLite. Zetro has no task, automation,
Git, repository, settings, archive, attachment, or voice workflow.

## Ownership

- `api` owns Codex execution and SQLite chat history.
- `contracts` owns the public chat request, stream, and history schemas.
- `web` owns the chat composition and browser session identity.
- `web/src/modules/shell` owns the Zetro chat module declaration.
- `packages/ui` remains the only owner of reusable controls and layouts.

The previous implementation is outside the repository at
`E:\new workspace\codexsun-zetro-v1-backup-20260911`. It is reference material,
not an npm workspace or runtime dependency.

## Workspaces and commands

```powershell
npm.cmd run dev:zetro
npm.cmd run build:zetro
```

The browser application runs at `http://127.0.0.1:6060/zetro`. The local API runs at
`http://127.0.0.1:6050` and keeps one Codex app-server process warm.
Each loaded browser session gets one durable, read-only thread outside the
repository, so follow-up prompts share context without loading repository guidance.
The API uses the fast
`gpt-5.3-codex-spark` model with low reasoning, reuses the local Codex login, and
accepts each turn before execution and streams sequence-numbered Server-Sent Events.
SQLite stores each event before publication and restores it after refresh, reconnect,
or restart. Separate conversations execute concurrently. One conversation permits one
active turn. The stop control interrupts that exact turn and retains partial output.
The saved Codex thread ID restores follow-up context after an API restart.
Prompts are not trimmed or extended. The request contains text only.

## Runtime configuration

`ZETRO_WEB_PORT` selects the browser development port and defaults to `6060`.
`ZETRO_API_PORT` selects the local API port and defaults to `6050`.
`ZETRO_DATABASE_PATH` selects the SQLite file below private storage.
`VITE_ZETRO_API_URL` selects the browser API origin.
`ZETRO_CODEX_PATH` can select an explicit Codex executable when it is not on the
API process `PATH`.
The production output is a static frontend under `dist/apps/zetro/web`. The Vite
frontend requires the Zetro API for chat and history.

## Health and shutdown

The web component uses `/` as its static readiness path. The API provides `/health`,
`/health/live`, and `/health/ready`. Codex turns have a bounded timeout. API shutdown
closes the Codex process and SQLite. Zetro has no desktop runtime.

## Verification

Run `npm.cmd run build:zetro` and `npm.cmd run test --workspace @codexsun/zetro-api`.
The repository-wide checks validate shared UI, module boundaries, and runtime assembly.

## Module catalog

See [Zetro modules](../../assist/modules/zetro.md).

## Rebuild rule

Add one reviewed product capability at a time. Define its public contracts,
module owner, state model, boundaries, and verification before adding behavior.
Do not copy v1 source back into the active application. Use it only to compare
interaction and visual ideas.
