# Zetro Chat API Module

- Module ID: `zetro.chat.api`
- Version: `2.0.0`
- Owner: Zetro API

## Purpose

This module runs the local Codex chat and stores browser chat history in SQLite.
It does not own tasks, files, Git, settings, attachments, or desktop behavior.

## Contracts

- `POST /api/zetro/v1/chat/turns` durably accepts a raw prompt and client turn ID.
- `GET /api/zetro/v1/chat/turns/:turnId/events` replays and follows ordered events.
- `POST /api/zetro/v1/chat/stop` accepts an exact turn ID and interrupts only that turn.
- `GET /api/zetro/v1/chat/history` returns stored turns and ordered stream events.
- Every route requires the UUID `x-zetro-conversation-id` header.
- `@codexsun/zetro-contracts` owns request, event, status, and history schemas.

## Persistence

The module owns `chat_conversations`, `chat_turns`, and `chat_turn_events`. The database
uses WAL mode, foreign keys, and normal synchronous writes. Each event is committed
before it is published to the browser. Migration declarations
stay in `infrastructure/chat.migrations.ts`. The migration ledger rejects a changed
checksum. Turn acceptance stores the row and request event in one transaction. Turn
completion stores its terminal event and status in one transaction. Startup marks an
unfinished turn as failed and keeps its saved partial events. The third migration
renames stored session identity to conversation identity without replacing records.

The default database path is `storage/app/private/zetro/chat-v2.sqlite`. Uninstall and
shutdown preserve this file. The API closes SQLite and the Codex process on shutdown.

## Runtime

The API listens on `127.0.0.1:6050` by default. Liveness does not query storage.
Readiness checks the open SQLite connection. Each conversation has one durable Codex
thread and at most one active turn. Separate conversations run concurrently through
the shared app-server process. After an API restart, `thread/resume` restores the saved
provider thread before the next prompt. A failed resume creates a visible recovery
activity and starts a clean provider context instead of replaying commands.
Shutdown rejects active Codex work, waits for each turn to store its failure, and then
closes SQLite. A 5-second SQLite busy timeout handles short concurrent writer waits.

## Tests

Tests cover concurrent conversations, the one-active-turn guard, exact stop identity,
shutdown drain, atomic recovery, provider context, event order, and the version 2 to
version 3 database migration.

## Development records

- [SQLite chat history](../../../../../../../assist/records/zetro/2026-09-11-zetro-sqlite-chat-history.md)
- [Concurrent durable chat](../../../../../../../assist/records/zetro/2026-09-11-zetro-concurrent-durable-chat.md)
- [Chat alignment review](../../../../../../../assist/records/zetro/2026-09-11-zetro-chat-alignment-review.md)
