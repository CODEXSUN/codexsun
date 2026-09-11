# Zetro Agent Tasks API Module

- Module ID: `zetro.agent-tasks.api`
- Version: `1.0.0`
- Owner: Zetro API

## Purpose

This module owns durable Agent Task drafts created explicitly from completed chat turns.
It stores the originating conversation and turn IDs, the exact prompt and assistant result,
and an awaiting-approval state. It does not execute agents, approve work, edit chat history,
or own provider credentials.

## Contracts

- `GET /api/zetro/v1/agent-tasks` lists task draft summaries.
- `GET /api/zetro/v1/agent-tasks/:taskId` returns one complete draft.
- `POST /api/zetro/v1/agent-tasks/from-chat` creates or returns the draft for one chat turn.
- `@codexsun/zetro-contracts` owns request and response validation.

The module synchronously reads a completed turn through the public Chat task-source query.
It never reads Chat tables directly. One origin turn can create only one task draft.

## Persistence

The module owns `agent_task_drafts` and `zetro_agent_task_migrations` in the Zetro SQLite
database. The origin IDs are references, not cross-module foreign keys. The source prompt
and response are immutable snapshots so later conversation changes cannot rewrite a draft.
SQLite WAL mode and an immutable migration checksum ledger are enabled.

## Lifecycle

Install applies owned migrations. Activate registers task routes. Deactivate closes the
module database connection. Uninstall preserves drafts. Draft approval, subtasks, attempts,
verification, delivery, and release are intentionally outside version 1.0.0.

## Tests

Tests cover idempotent handoff, source validation, persistence, list/detail routes, and
restart restoration.

## Development records

- [Multi-chat and task draft handoff](../../../../../../../assist/records/zetro/2026-09-11-multi-chat-task-drafts.md)
