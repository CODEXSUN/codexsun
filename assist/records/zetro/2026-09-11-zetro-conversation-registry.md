# Zetro Conversation Registry

Date: 2026-09-11

## Outcome

The Zetro API now owns a durable conversation registry. It lists existing conversations
and supports create, rename, archive, and restore actions. The web application binds the
registry to the shared Agent Workspace layout.

## Ownership and contracts

- `@codexsun/zetro-contracts` owns registry request, query, summary, and response schemas.
- `zetro.chat.api` 2.1.0 owns registry behavior and SQLite persistence.
- `zetro.shell.web` 2.4.0 owns registry selection and browser interaction.
- `GET /api/zetro/v1/chat/conversations` lists `active`, `archived`, or `all` records.
- `POST /api/zetro/v1/chat/conversations` creates a conversation.
- `PATCH /api/zetro/v1/chat/conversations/:conversationId` changes its title or archive state.

## Persistence

SQLite migration 4 adds `title` and `archived_at` to `chat_conversations`. It gets the
title of an existing conversation from its first prompt. The migration keeps all existing
conversation IDs, provider thread IDs, turns, events, and sequence values.

A new conversation gets its title from its first prompt unless the user named it first.
The registry sorts records by their last update. An archived conversation remains readable.
It rejects new turns until the user restores it. A working conversation cannot be archived.

## Verification

- Repository tests cover create, generated titles, ordering, counts, last status, rename,
  archive, restore, and blocked archived turns.
- The migration test starts with a version 2 session database and checks its restored title,
  history, and provider thread.
- The route test covers create, active list, rename, archive list, and restore.
- The existing concurrency, exact stop, shutdown, and recovery tests remain active.
- The focused type checks, lint checks, and production Zetro build passed.
- Chrome showed the Agent Workspace rails, sidebar, canvas, composer, and status bar.
- Browser create, inline rename, archive view, restore, and selection checks passed.
- Strict React initialization produced one conversation after an empty database restart.

## Frontend composition

`MdiMain.agentWorkspace` composes the public `@codexsun/ui/layouts/agent-workspace`
contract. Zetro passes typed rail items and owns the conversation data and callbacks.
No reusable layout or control was copied into the application.
