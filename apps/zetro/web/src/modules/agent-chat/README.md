# Zetro Agent Chat Web

## Contract

- Module ID: `zetro.agent-chat.web`
- Version: `0.13.5`
- Owner: Zetro web
- Flow: open history, select a conversation, and send a provider-backed turn

The module owns project-scoped agent chat state, conversation history UI, message stream,
prompt composer, attachments, voice input, workflow selection, and API client.

The composer reads and updates its default workflow through the public
`zetro.settings.web` preference contract. The Settings workspace and composer
therefore show the same workflow without separate browser state.
The Zetro Desk module only supplies the sidebar and workspace surfaces.

Chat defaults to Plan. Plan and Review only expose read-only provider workspaces.
An assistant Plan response can create a task draft. The handoff does not start coding or mark a task accepted.
Task execution moves to the governed task workflow when its execution binding is available.

## Dependency bindings

- `zetro.chat.api`: `^0.16.0`
- `zetro.desk.web`: `^0.8.0`
- `zetro.projects.web`: `^0.5.0`
- `zetro.project-tasks.web`: `^0.4.1`
- `zetro.settings.web`: `^0.6.0`

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

Before submission, Chat calls the public Settings readiness check. Missing scope or stale security preserves the draft and attachments.
`sendMessage` returns whether the user message was accepted into conversation storage. Only accepted messages clear the composer.
A synchronous admission guard prevents duplicate submission before React updates busy state.
Final response text remains visible if its last history write fails. No automatic replay follows a failed request.
Live updates follow the viewport only while the reader is near the bottom. Scrolling upward pauses follow mode.
See the [daily coding record](../../../../../../assist/records/zetro/2026-09-10-daily-coding-readiness.md).

History rows use public `SidebarMenuButton` with `variant="accented"` and `size="comfortable"`.
The shared package owns 40px rows, left alignment, selected markers, text contrast, and focus treatment.
Zetro supplies `isActive`, `aria-current`, the full title, and selection callbacks.
A nested title span truncates without moving the action menu. Rename, Pin, Archive, and scope actions remain Zetro-owned.
See the [sidebar integration record](../../../../../../assist/records/zetro/2026-09-10-sidebar-integration.md).

During an active turn, Chat renders streamed public message snapshots and tool status below its timer.
The final response replaces this transient view. No private reasoning or simulated percentage is shown.
See the [stream record](../../../../../../assist/records/zetro/2026-09-10-chat-live-stream.md).

The workspace drawer offers Application and Shared package scope types. For shared UI,
select Shared package, enter `ui`, and connect `packages/ui`. Leave Module empty for the whole package.
Switching type clears the draft owner, path, module, and documentation permissions before confirmation.
See the [scope record](../../../../../../assist/records/zetro/2026-09-10-shared-package-scopes.md).

The Desk sidebar shows unpinned conversation titles as a flat list. Pinned
conversations stay in a separate group. It has no history or Chats heading.
New chat is the black primary action above Archived chats at the sidebar bottom.
Each chat row has one three-dot menu on hover or keyboard focus. The menu opens
the connected folder drawer and contains Rename, Pin, and Archive actions.

The Archived chats workspace supports title search, restore, permanent deletion,
and Delete all. Destructive actions require confirmation. Permanent deletion
removes conversation history but preserves the isolated worktree.

The workspace uses 80 percent of the available canvas width. It contains a
scrolling message stream and a bottom prompt composer. The composer accepts
images and files from the picker, drag and drop, and the clipboard. It shows an
image preview before submission. A paste of 4,000 or more characters becomes a
named text attachment instead of filling the editor. The composer accepts at
most four attachments of 4 MB each.

The same shared composer runs in the browser and the Tauri desktop application.
It sends images through the multimodal input path. Other files, including long
pastes, become isolated conversation inputs that Codex can open from the scoped
worktree. No browser-only OCR or duplicate desktop upload path is used.
The shared workspace context bar shows Chat on the left. A compact Codex control
on the right selects the model and the Light, Medium, or Hard reasoning level.
The control is disabled during an active turn. Light maps to `low`, Medium maps
to `medium`, and Hard maps to `high` in the API request.

Assistant responses render CommonMark and GitHub Flavored Markdown as semantic
HTML. The renderer styles headings, paragraphs, lists, links, quotes, code,
tables, task lists, and separators. It ignores raw HTML from provider output.
User prompts keep their original plain-text formatting.
Markdown tables use the public `@codexsun/ui/components/table` primitives.

The Markdown renderer loads as a separate local chunk. This keeps the main
startup chunk below the 400 KB limit. The renderer uses no syntax highlighter,
remote asset, or runtime network request.

The context bar three-dot menu opens the Chat workspace drawer. The drawer
stores the application, optional module, and repository-relative folder. The
folder browser stays below the active project root. Sending a provider turn
without a folder opens this drawer.

Each conversation turn combines one user prompt and its assistant response. One
bottom border separates the complete turn from the next turn. The message
spacing is always relaxed. A compact toolbar appears on hover or keyboard
focus. A user prompt shows only Copy and Analysis. An assistant
response shows Copy, Actions, Review prompt, Review chat, Send to task, and the
three-dot menu. Send to task creates a medium-priority task from the response.
It selects the new task and opens Tasks. The task waits for the user to start it.
The other review menus remain staged for later bindings.
The three-dot menu can archive the active chat. Permanent deletion remains in
Archived chats. The chat does not show the workflow, worktree path, or internal
identifier.

The message stream adds a date section before the first turn of each local day.
Today and yesterday use relative labels. Other sections show the calendar date.
Each label also shows the time of the first turn in that section. While a Codex
turn runs, a live elapsed timer appears inside the active turn above its bottom
separator. The last turn border is hidden when the next turn starts a new day,
so the date section is the only boundary. Other loading actions do not start
this timer.

The working row is a stop button. It shows a spinner by default. Hover and
keyboard focus reveal an orange stop state. Clicking it interrupts the matching
Codex turn, aborts the browser response request, and keeps the saved user prompt.
The composer send button changes to the same stop control while that turn runs.

## States

- Loading: the history list shows a small loading indicator.
- Empty: the workspace shows a short prompt and suggested starts.
- Error: the history or composer shows the API error without hiding saved UI.
- Busy: the composer disables duplicate submission and shows the live working time.
- Success: the assistant response and execution summary appear in the stream.

## Persistence and lifecycle

The API owns conversation persistence, workspace scope, and isolated task worktrees. This web
module owns no table, migration, seed, event, job, or browser storage record.
The web module does not store a display-density preference. The Settings module
stores the selected model and reasoning level for both web and desktop use.

## Verification

Run the Zetro web type check and production build. Open `/zetro` and verify the
history, empty state, prompt composer, attachment control, voice control, and
80-percent workspace width. Also verify hover archive, archive search, restore,
and deletion confirmation. A live turn needs the Zetro API and Codex connection.

Run `npm.cmd run test --workspace @codexsun/zetro-web` to verify attachment
conversion, semantic HTML output, raw HTML removal, and model selection.

## Development records

- [0.1.27 stability candidate](../../../../../../assist/records/zetro/2026-09-10-stability-0.1.27.md)

The scope drawer waits for server validation before confirming new-chat scope. Failed validation stays visible in the drawer.
This validates requested paths. It is not proof of operating-system sandbox enforcement.

- [0.1.26 scope binding](../../../../../../assist/records/zetro/2026-09-10-scope-binding.md)

The scope bar shows the selected application, module, code folder, and approved documentation folders before sending.
The drawer requires explicit scope confirmation. Folder selection clears stale module and documentation values.
Selecting a different application label without its matching folder is rejected.

- [2026-09-10 Activity details contract repair](../../../../../../assist/records/zetro/2026-09-10-chat-activity-details.md)

Execution activities accept optional `details` strings up to 2,000 characters, matching the API contract.
The same strict schema validates turn responses and saved history. Unknown fields remain rejected.
Run `npm.cmd run test:chat-contract --workspace @codexsun/zetro-web` for this regression.

- [2026-09-09 Chat input capture](../../../../../../assist/records/zetro/2026-09-09-chat-input-capture.md)
- [2026-09-09 Codex model selection](../../../../../../assist/records/zetro/2026-09-09-codex-model-selection.md)
- [2026-09-08 Agent chat foundation](../../../../../../assist/records/zetro/2026-09-08-agent-chat-foundation.md)
- [2026-09-08 Archived chats](../../../../../../assist/records/zetro/2026-09-08-archived-chats.md)
- [2026-09-08 Compact sidebar navigation](../../../../../../assist/records/zetro/2026-09-08-compact-sidebar-navigation.md)
- [2026-09-08 Task details and workspace context](../../../../../../assist/records/zetro/2026-09-08-task-details-workspace-context.md)
- [2026-09-09 Dated chat timeline](../../../../../../assist/records/zetro/2026-09-09-dated-chat-timeline.md)
- [2026-09-09 Chat turn stop](../../../../../../assist/records/zetro/2026-09-09-chat-turn-stop.md)
- [2026-09-09 Chat task handoff](../../../../../../assist/records/zetro/2026-09-09-chat-task-handoff.md)
- [2026-09-09 Markdown chat rendering](../../../../../../assist/records/zetro/2026-09-09-markdown-chat-rendering.md)
