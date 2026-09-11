# Zetro 2.0

Reference: [Application standard](../../assist/architecture/application-standard.md)

## Purpose

Zetro 2.0 provides a focused browser workflow: select a provider and model, enter prompts,
and display responses as Markdown. A small local API
stores conversations, chat turns, and raw stream events in SQLite. The browser displays
the API conversation registry through the shared Agent Workspace layout. Independent chats
can run together, and a completed response can become a durable task draft awaiting approval.
Zetro has no task execution, automation, Git, repository, attachment, or voice workflow.

## Ownership

- `api` owns the conversation registry, provider selection, Codex execution, task drafts, and SQLite state.
- `cxz` owns a warm, isolated Codex chat runtime and its same-container control page.
- `contracts` owns the public chat request, stream, and history schemas.
- `web` owns chat composition, registry selection, concurrent stream observation, and task draft views.
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
Each browser profile keeps one durable conversation ID and one durable, read-only
Codex thread outside the repository. Follow-up prompts share context without loading
repository guidance.
The API reads each enabled provider's live model catalog and stores the selected provider, model,
and reasoning level in SQLite. The top-right chat switcher changes that durable selection.
Local Codex reuses its local device login. CXZ runs Codex in a hardened Docker container and
persists its separate device login in a named volume. No alternate provider adapter is included.
The API
atomically accepts each turn before execution and streams sequence-numbered Server-Sent Events.
SQLite stores each event before publication and restores it after refresh, reconnect,
or restart. Separate conversations execute concurrently. One conversation permits one
active turn. The stop control interrupts that exact turn and retains partial output.
The saved Codex thread ID restores follow-up context after an API restart. Shutdown
drains active failures before SQLite closes. Stop requests identify the exact turn.
Prompts are not trimmed or extended. The request contains text only.
Completed responses expose an explicit Send to Agent Tasks action. The task module stores an
immutable prompt and response snapshot, returns the same draft when the action is retried,
and provides no approval or execution action in this phase.

## Runtime configuration

`ZETRO_WEB_PORT` selects the browser development port and defaults to `6060`.
`ZETRO_API_PORT` selects the local API port and defaults to `6050`.
`ZETRO_DATABASE_PATH` selects the SQLite file below private storage.
`VITE_ZETRO_API_URL` selects the browser API origin.
`ZETRO_CODEX_PATH` can select an explicit Codex executable when it is not on the
API process `PATH`.
`ZETRO_CXZ_URL` selects the CXZ container and defaults to `http://127.0.0.1:6155`.
CXZ stores Codex credentials only in its named volume and serves its control page at `/`.
The production output is a static frontend under `dist/apps/zetro/web`. The Vite
frontend requires the Zetro API for chat and history.

## Health and shutdown

The web component uses `/` as its static readiness path. The API provides `/health`,
`/health/live`, and `/health/ready`. Codex turns have a bounded timeout. API shutdown
closes the Codex process and SQLite. Zetro has no desktop runtime.

## Verification

Run `npm.cmd run build:zetro`, `npm.cmd run test --workspace @codexsun/zetro-api`,
`npm.cmd run test --workspace @codexsun/zetro-cxz`.
The repository-wide checks validate shared UI, module boundaries, and runtime assembly.

## Module catalog

See [Zetro modules](../../assist/modules/zetro.md).

## Rebuild rule

Add one reviewed product capability at a time. Define its public contracts,
module owner, state model, boundaries, and verification before adding behavior.
Do not copy v1 source back into the active application. Use it only to compare
interaction and visual ideas.
