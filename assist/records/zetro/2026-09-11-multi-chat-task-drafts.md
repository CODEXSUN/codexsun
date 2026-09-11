# Zetro multi-chat and task draft handoff

Date: 2026-09-11

## Outcome

This change keeps active browser streams alive per conversation and lets independent
conversations process concurrently. A completed assistant response can be handed to the
separate Agent Tasks module as one durable, awaiting-approval draft.

## Ownership and bindings

- `zetro.chat.api` owns conversation turns, immutable turn provider snapshots, and the
  public task-source query.
- `zetro.shell.web` owns per-conversation browser runtime state and background stream
  observation.
- `zetro.agent-tasks.api` owns task draft validation, SQLite records, and routes.
- `zetro.agent-tasks.web` owns the task registry and draft detail workspace.
- `@codexsun/zetro-contracts` owns the public chat-provider snapshot and task schemas.

Agent Tasks depends on the Chat module public query. It does not read Chat tables. Handoff
is synchronous because the user needs the created draft immediately. The source snapshot
is immutable and origin turn uniqueness makes retries idempotent.

## Decisions

One conversation still permits one active turn so context stays ordered. Different
conversations may run together. Provider selection is captured when the API accepts a
turn, so a later global selection cannot reroute that turn. Task execution, approval,
subtasks, verification, and repository access remain later capabilities.

## Verification

- All 20 Zetro API tests passed, including simultaneous conversations, active-turn
  ordering, immutable provider snapshots, task handoff idempotency, and SQLite restart.
- Zetro API and web type checks and lint passed.
- The shared UI ownership audit passed with no Zetro violations.
- The production Zetro build passed after the Markdown renderer was split from the
  main bundle. The final main chunk is 343.49 KB and the build-output audit passed.
- Live Chrome verification showed two conversations working together, preserved the
  first stream after selecting the second chat, and returned `MULTI-A` and `MULTI-B`.
- Live handoff created one awaiting-approval draft from an existing completed response.
  Retrying the same action retained one draft and reopened the same immutable source.

Approval, execution, subtasks, desktop packaging, and release publication did not run
because they are outside this phase.
