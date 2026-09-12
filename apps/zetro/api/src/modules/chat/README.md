# Zetro Chat API Module

- Module ID: `zetro.chat.api`
- Version: `2.4.0`
- Owner: Zetro API

## Purpose

This module runs chat through the provider selected by `zetro.providers.api` and stores browser chat history in SQLite.
It stores supported image attachments below private application storage and passes them only to Local Codex as `localImage` turn inputs. CXZ image input remains unavailable until its shared artifact mount exists. It does not own tasks, Git, settings, or desktop behavior.

The API owns the conversation registry. The web application consumes its public contracts.

## Contracts

- `POST /api/zetro/v1/chat/turns` durably accepts a raw prompt and client turn ID.
- `GET /api/zetro/v1/chat/turns/:turnId/events` replays and follows ordered events.
- `POST /api/zetro/v1/chat/stop` accepts an exact turn ID and interrupts only that turn.
- `GET /api/zetro/v1/chat/history` returns stored turns and ordered stream events.
- `POST /api/zetro/v1/chat/images` stores one private PNG, JPEG, or WebP attachment for the active conversation.
- `GET /api/zetro/v1/chat/handoff-tray` returns the durable Working Set.
- `PUT /api/zetro/v1/chat/handoff-tray/:turnId` selects or classifies completed prompt or response evidence.
- `GET /api/zetro/v1/chat/turns/:turnId/decisions` returns saved inline answers for detected Open Decisions questions.
- `PUT /api/zetro/v1/chat/turns/:turnId/decisions` saves a Yes, No, Skip, or custom answer and adds it to the Working Set.
- `GET /api/zetro/v1/chat/conversations` lists active, archived, or all conversations.
- `POST /api/zetro/v1/chat/conversations` creates an empty conversation.
- `PATCH /api/zetro/v1/chat/conversations/:conversationId` renames, archives, or restores it.
- `PATCH /api/zetro/v1/chat/conversations/:conversationId/provider` verifies and stores that conversation's provider, model, and reasoning selection.
- Every route requires the UUID `x-zetro-conversation-id` header.
- `@codexsun/zetro-contracts` owns request, event, status, and history schemas.
- Agent Tasks may read one completed prompt and response through the public task-source query.

## Persistence

The module owns `chat_conversations`, `chat_turns`, `chat_turn_events`, and the durable
Working Set evidence registry. The database
uses WAL mode, foreign keys, and normal synchronous writes. Each event is committed
before it is published to the browser. Migration declarations
stay in `infrastructure/chat.migrations.ts`. The migration ledger rejects a changed
checksum. Turn acceptance stores the row and request event in one transaction. Turn
completion stores its terminal event and status in one transaction. Startup marks an
unfinished turn as failed and keeps its saved partial events. The third migration
renames stored session identity to conversation identity without replacing records.
The fourth migration adds titles and archive times. It derives each existing title
from its first prompt. It preserves every existing ID, provider thread, turn, and event.
The ninth migration adds conversation-owned inline decisions; saving an answer makes a durable
decision item available in the same Working Set without changing the source response.
The fifth migration adds the immutable provider connection, model, and reasoning snapshot
captured when a turn is accepted. The sixth migration stores the current provider selection on
each conversation and stores one runtime thread per `(conversation, connection)` pair.

The default database path is `storage/app/private/zetro/chat-v2.sqlite`. Uninstall and
shutdown preserve this file. The API closes SQLite and the Codex process on shutdown.

## Runtime

The API listens on `127.0.0.1:6050` by default. Liveness does not query storage.
Readiness checks the open SQLite connection. Each conversation has an independent, verified
provider selection and one durable provider thread per connection. An unverified connection
cannot accept a prompt. Connection verification reserves that conversation until its smoke test
ends, so a turn cannot start during a switch. Changing a conversation connection never changes
another conversation's selection or thread. A conversation has at most one active turn. Separate
conversations run concurrently through
the shared app-server process. After an API restart, `thread/resume` restores the saved
provider thread before the next prompt. A failed resume creates a visible recovery
activity and starts a clean provider context instead of replaying commands. Thread start
and resume receive runtime-owned identity metadata. When asked, local Codex reports
the selected model and configured reasoning label without exposing private reasoning.
Direct runtime/model/reasoning questions are answered deterministically from the active
persisted provider connection instead of relying on model self-report.
Shutdown rejects active Codex work, waits for each turn to store its failure, and then
closes SQLite. A 5-second SQLite busy timeout handles short concurrent writer waits.
An archived conversation remains readable but rejects new turns until it is restored. OpenAI-compatible connections receive the stored conversation messages through the isolated gateway.

## Tests

Tests cover registry routes, create, list, rename, archive, restore, migration, concurrent
conversations, the active-turn guard, exact stop identity, shutdown, recovery, provider
context, and event order.

## Development records

- [SQLite chat history](../../../../../../../assist/records/zetro/2026-09-11-zetro-sqlite-chat-history.md)
- [Concurrent durable chat](../../../../../../../assist/records/zetro/2026-09-11-zetro-concurrent-durable-chat.md)
- [Chat alignment review](../../../../../../../assist/records/zetro/2026-09-11-zetro-chat-alignment-review.md)
- [Conversation registry](../../../../../../../assist/records/zetro/2026-09-11-zetro-conversation-registry.md)
- [Provider connections](../../../../../../../assist/records/zetro/2026-09-11-zetro-provider-connections.md)
- [Multi-chat and task drafts](../../../../../../../assist/records/zetro/2026-09-11-multi-chat-task-drafts.md)
- [Conversation-owned providers](../../../../../../../assist/records/zetro/2026-09-11-conversation-owned-providers.md)
- [Provider safety and task queue](../../../../../../../assist/records/zetro/2026-09-11-provider-safety-and-task-queue.md)
