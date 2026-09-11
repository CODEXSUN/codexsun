# Zetro Concurrent Durable Chat

Date: 2026-09-11

## Outcome

Zetro accepts a prompt as a durable turn before Codex execution starts. The browser
then follows a separate, sequence-numbered Server-Sent Events stream. A refresh or
transport interruption replays stored events from the last received sequence and
continues the same active turn without duplicating output.

Separate conversations can execute at the same time. One conversation permits one
active turn so its provider context stays ordered. SQLite persistence and browser
delivery are not a global execution queue.

## Ownership

- `@codexsun/zetro-contracts` owns accepted-turn, stored-event, history, and stream schemas.
- `zetro.chat.api` 1.1.0 owns turn coordination, Codex sessions, SQLite, and SSE routes.
- `zetro.shell.web` 2.2.0 owns the session cursor, reconnect loop, and restored view state.

## Runtime contract

`POST /api/zetro/v1/chat/turns` stores the turn and request event, then returns HTTP
202 with the session and turn IDs. `GET /api/zetro/v1/chat/turns/:turnId/events`
accepts an `after` sequence, replays newer durable events, and follows live events
until a terminal event. Every route requires the browser session header.

The API commits every event to SQLite before notifying stream subscribers. This adds
a small local write cost but prevents a displayed event from disappearing after a
restart. WAL mode keeps reads available while events are written.

## Provider recovery

The installed Codex app-server schema confirms `thread/resume` with a required
`threadId`. Zetro starts non-ephemeral, read-only threads and stores only their IDs;
credentials remain owned by Codex. After an API restart, the next turn resumes that
thread. If Codex cannot resume it, Zetro records a visible `thread/recovery` activity
and starts a clean context. It never silently replays a prior prompt or command.

An API restart or Codex process failure during an active turn keeps all committed
partial events and marks that turn failed. The user can continue with a new turn.

## Verification

- Contract, API, and web type checks passed.
- Contract, API, and web lint passed.
- The SQLite restart test passed with ordered event envelopes and provider thread data.
- A live prompt returned HTTP 202 in 76 ms and streamed seven ordered events.
- Two separate conversations were accepted in 93 ms and both completed concurrently.
- A second active turn in one conversation returned HTTP 409; stop returned HTTP 200.
- A provider thread retained the test token `ORANGE-COMET-741` across a full API restart.

## Next refinement

Add explicit named conversations and a conversation picker. This will make concurrent
sessions visible and controllable instead of relying on one browser-tab session ID.
