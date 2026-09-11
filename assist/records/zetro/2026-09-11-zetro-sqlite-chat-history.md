# Zetro SQLite Chat History

Date: 2026-09-11

## Outcome

Zetro now stores chat sessions, turns, and ordered raw stream events in SQLite.
The browser reloads the current session after a refresh. The later
[concurrent durable chat](2026-09-11-zetro-concurrent-durable-chat.md) change replaces
the original ephemeral execution contract with persisted Codex thread recovery.

## Ownership

- `@codexsun/zetro-contracts` owns the public request, event, and history schemas.
- `zetro.chat.api` owns Codex execution, SQLite migrations, storage, and routes.
- `zetro.shell.web` owns the browser conversation ID and restored screen state.
- The root runtime owns local API and web startup through the Zetro stack.

## Binding

The API listens on port `6050`. The browser reads `VITE_ZETRO_API_URL` and sends
`x-zetro-conversation-id` on each request. The default database is
`storage/app/private/zetro/chat-v2.sqlite`. This path does not reuse the retired Zetro
database.

The API stores each raw stream event in order. The history route returns those events
through the shared Zod schema. The browser rebuilds the same activity and response
timeline from this data.

## Decisions

SQLite uses WAL mode, foreign keys, and normal synchronous writes. The first migration
creates module-owned tables and an immutable checksum ledger. Startup changes unfinished
turns to failed and preserves their partial events.

The first implementation did not store Codex credentials or an app-server thread ID.
The follow-up migration stores only the provider thread ID and still stores no credential.

The previous Zetro backend was not restored. Tasks, files, Git, settings, attachments,
desktop behavior, queues, and online sync remain outside this change.

## Verification

- Zetro contract, API, and web type checks
- Zetro API SQLite restart test
- Zetro API and web production builds
- API liveness and SQLite readiness checks
- Shared UI, module, runtime, format, lint, and line gates

## Follow-up

Add explicit conversation creation and selection before more than one saved chat is shown.
