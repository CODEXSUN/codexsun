# Zetro Agent Chat Web

## Contract

- Module ID: `zetro.agent-chat.web`
- Version: `0.4.4`
- Owner: Zetro web
- Flow: open history, select a conversation, and send a provider-backed turn

The module owns project-scoped agent chat state, conversation history UI, message stream,
prompt composer, attachments, voice input, workflow selection, and API client.
The Zetro Desk module only supplies the sidebar and workspace surfaces.

## API bindings

- `GET /api/v1/chat/conversations` lists conversation summaries.
- `GET /api/v1/chat/conversations?archived=true` lists archived summaries.
- `GET /api/v1/chat/conversations/:conversationId?projectId=...` opens one conversation.
- `POST /api/v1/chat/conversations` creates a conversation after the first message.
- `PATCH /api/v1/chat/conversations/:conversationId?projectId=...` saves messages, titles, pin state, and archive state.
- `DELETE /api/v1/chat/conversations/:conversationId?projectId=...` permanently deletes one archived chat.
- `DELETE /api/v1/chat/conversations/archived` permanently deletes all archived chats.
- `POST /api/v1/chat/responses` sends a provider-backed turn.

The client validates every response with Zod. It sends at most four attachments
and the latest 24 messages to the provider route.

## Interface

The Desk sidebar shows unpinned conversation titles as a flat list. Pinned
conversations stay in a separate group. It has no history or Chats heading.
New chat is the black primary action above Archived chats at the sidebar bottom.
Users can rename, pin, archive, and reopen saved conversations. Row actions
appear on hover and keyboard focus.

The Archived chats workspace supports title search, restore, permanent deletion,
and Delete all. Destructive actions require confirmation. Permanent deletion
removes conversation history but preserves the isolated worktree.

The workspace uses 80 percent of the available canvas width. It contains a
scrolling message stream and a bottom prompt composer. The composer supports
text, files, images, voice input, workflow selection, and keyboard submission.
The shared workspace context bar shows Chat on the left and the connected Codex
provider and current model on the right.

Each conversation turn combines one user prompt and its assistant response. One
bottom border separates the complete turn from the next turn. The message
spacing is always relaxed. A compact toolbar appears on hover or keyboard
focus. A user prompt shows only Copy and Analysis. An assistant
response shows Copy, Actions, Review prompt, Review chat, Send to task, and the
three-dot menu. The review and task menus are placeholders for later bindings.
The three-dot menu can archive the active chat. Permanent deletion remains in
Archived chats. The chat does not show the workflow, worktree path, or internal
identifier.

## States

- Loading: the history list shows a small loading indicator.
- Empty: the workspace shows a short prompt and suggested starts.
- Error: the history or composer shows the API error without hiding saved UI.
- Busy: the composer disables duplicate submission and shows agent progress.
- Success: the assistant response and execution summary appear in the stream.

## Persistence and lifecycle

The API owns conversation persistence and isolated task worktrees. This web
module owns no table, migration, seed, event, job, or browser storage record.
The web module does not store a display-density preference.

## Verification

Run the Zetro web type check and production build. Open `/zetro` and verify the
history, empty state, prompt composer, attachment control, voice control, and
80-percent workspace width. Also verify hover archive, archive search, restore,
and deletion confirmation. A live turn needs the Zetro API and Codex connection.

## Development records

- [2026-09-08 Agent chat foundation](../../../../../../assist/records/zetro/2026-09-08-agent-chat-foundation.md)
- [2026-09-08 Archived chats](../../../../../../assist/records/zetro/2026-09-08-archived-chats.md)
- [2026-09-08 Compact sidebar navigation](../../../../../../assist/records/zetro/2026-09-08-compact-sidebar-navigation.md)
- [2026-09-08 Task details and workspace context](../../../../../../assist/records/zetro/2026-09-08-task-details-workspace-context.md)
