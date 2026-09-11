# Zetro Chat Alignment Review

Date: 2026-09-11

## Outcome

The review aligned one Zetro conversation across the browser, HTTP contracts,
application service, Codex thread, SQLite rows, stored events, and restored history.
The browser now keeps the current conversation ID across browser restarts.

The change fixes lifecycle gaps found after the first concurrent chat release. Turn
acceptance and turn completion are now atomic database transactions. Stop targets one
turn. API shutdown drains active turn failures before it closes SQLite. Temporary
stream failures reconnect with bounded backoff and a visible state.

## Ownership and bindings

- `@codexsun/zetro-contracts` owns conversation, turn, stop, cursor, event, and history schemas.
- `zetro.chat.api` 2.0.0 owns conversation records, turn execution, event order, and recovery.
- `zetro.shell.web` 2.3.0 owns the current browser conversation ID and stream cursor.
- The chat application service depends on inward-owned store and runner ports.
- SQLite migration 3 renames session storage to conversation storage and preserves IDs.

The HTTP header is `x-zetro-conversation-id`. The accepted response and history use
`conversationId`. A turn keeps one UUID from prompt acceptance through stop, stream,
history, and recovery. The provider thread ID stays attached to its conversation.

## Decisions

SQLite commits the request event in the same transaction as the working turn. It
commits the terminal event in the same transaction as the final status. Browser
delivery happens only after each event commit.

Codex startup runs after the HTTP acceptance cycle. This keeps cold prompt acceptance
fast even when executable discovery and app-server startup take time.

The browser retries network and retryable HTTP failures from its last stored sequence.
It stops on permanent 4xx errors. A stale stop request cannot stop a newer turn.

## Verification

- Seven API tests passed for concurrency, ordering, stop identity, shutdown, recovery, provider context, and migration preservation.
- A fresh app-server accepted a durable turn in 70 ms and completed the response.
- Cursor replay returned only sequences 5, 6, and 7 after sequence 4.
- A stale stop returned HTTP 409. The exact stop returned HTTP 200 and stored `stopped`.
- A live shutdown preserved partial events and restored the active turn as `failed`.
- The upgraded database uses `chat_conversations` and `conversation_id`.
- SQLite `PRAGMA quick_check` returned `ok`.
- Chrome reloaded the Zetro screen and loaded history through the new conversation header.

## Remaining boundaries

The browser still exposes one current conversation. It has no conversation list,
rename, archive, delete, or older-history pagination. The loopback API has exact-origin
CORS but no desktop session token. Add the token with the desktop host because a plain
browser cannot keep a local process secret.

## Next ideas

1. Add a conversation registry with create, list, select, rename, and archive actions.
2. Add cursor-based turn history pages before long conversations become large.
3. Add a production-artifact API lifecycle test with port-release proof.
4. Add a desktop-issued session token when the Tauri host returns.
