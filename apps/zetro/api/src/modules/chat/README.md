# Zetro Chat API

## Contract

- Module ID: `zetro.chat.api`
- Version: `0.15.0`
- Owner: Zetro API
- Routes: provider turns and conversation history under `/api/v1/chat`
- Entities: a provider turn and a persisted conversation

The response route requires a Zetro conversation ID. The service sends text and
images through the public App Server client. Images remain multimodal inputs.
Other files are written to the isolated conversation input directory and named
in the prompt. The prompt asks Codex to identify each file format and inspect
visible text, screenshots, diagrams, and drawings before acting.

## Dependency bindings

The internal optional `onProgress` callback passes public provider events to Supervisor.
It is not accepted from HTTP JSON. See the [0.1.21 record](../../../../../../assist/records/zetro/2026-09-10-desktop-0.1.21.md).

The public index exports `ChatService`, `ChatConversationService`, and scope validation.
The application injects them into Supervisor. Chat remains the only owner of conversation storage.

- `zetro.codex-connection.api`: `^0.9.0`
- `zetro.projects.api`: `^0.5.0`

The required project ID scopes conversation lists and creation. The API resolves
the registered repository before a provider turn. The conversation ID and
project select an isolated worktree.

Each conversation can store one workspace scope with an application label,
module label, and repository-relative folder. A provider turn requires this
scope. The API rejects root, missing, absolute, and out-of-project folders.

The response route accepts a `workflow` value. Valid values are `deliver`, `develop`, `document`, `review`, and `test`. The route defaults to `develop` for older clients.

The response route also accepts an optional supported Codex `model` and a
`reasoningEffort` value. The effort accepts `low`, `medium`, or `high` and
defaults to `medium`. An omitted model uses the account or environment default.

Delivery responses expose an expanded tool catalog for assignment, documentation, changelog, versioning, commit, and push work. Tool availability does not bypass the publication gate.

A delivery response includes nine validated stage records. Each record contains its stage ID, status, evidence, and server timestamp.

The web client sends the latest validated delivery record with the next turn. Codex can continue from that evidence and must recheck stale facts.

## Turn stop

`POST /api/v1/chat/responses/:conversationId/stop?projectId=...` stops the active
provider turn. The API verifies that the conversation belongs to the project.
The Codex connection then sends `turn/interrupt` with the active thread and turn
IDs. A stop requested during turn startup runs when the turn ID becomes available.

## Archive and deletion

- `GET /api/v1/chat/conversations?projectId=...` lists active project conversations.
- `GET /api/v1/chat/conversations?projectId=...&archived=true` lists archived project conversations.
- `PATCH /api/v1/chat/conversations/:conversationId` archives or restores a conversation with the optional `archived` field.
- `DELETE /api/v1/chat/conversations/:conversationId` permanently deletes one archived conversation.
- `DELETE /api/v1/chat/conversations/archived?projectId=...` deletes the project's archived conversations.

The API rejects permanent deletion for an active conversation. Archiving clears its pin state. Permanent deletion removes only the saved conversation. It preserves the isolated worktree for a separate cleanup flow.

## Configuration

- A Codex device login in Zetro Settings enables live local App Server responses.
- `ZETRO_CODEX_API_KEY` optionally supplies API-key authentication to the local App Server.
- `ZETRO_CODEX_BASE_URL` defaults to `https://api.openai.com/v1`.
- `ZETRO_CODEX_COMMAND` defaults to `codex`.
- `ZETRO_CODEX_MODEL` optionally overrides the model. An empty value uses the Codex account default.

## Lifecycle and persistence

The module stores conversations in its SQLite or MariaDB table. Initialization imports legacy
`storage/app/private/zetro/conversations.json` records once through its owned migration adapter.

Assistant messages can store optional execution metadata, the selected workflow,
and a delivery record. Every stored message includes its creation time. During
repository initialization, existing messages receive their conversation creation
time and existing records receive the default project ID. Existing conversations
remain unscoped until the user connects a folder.

The module owns its conversation table and migration. It has no seeds, events, or jobs.
Uninstall keeps conversation history unless a separate data removal flow runs.

## Safety and limits

The route accepts at most 24 messages and four attachments per user message.
Each encoded attachment is limited to 6 MB. The web composer applies a stricter
4 MB source-file limit before Data URL encoding. Zetro returns visible final
output only and does not expose provider reasoning.

## Verification

Run the Zetro API typecheck, conversation tests, workflow tests, and worktree test. Exercise a coding turn with device authorization or an API key.

## Development records

- [0.1.26 scope binding](../../../../../../assist/records/zetro/2026-09-10-scope-binding.md)

Scope accepts optional `documentationPaths`: at most eight existing directories below `assist`.
Application labels must match `apps/<application>` folders. Scope validation rejects redirected folders and broad or escaped documentation paths.
Existing history without documentation paths remains valid. The stored scope is authoritative, not the prompt text.

- [Desktop supervisor bridge](../../../../../../assist/records/zetro/2026-09-10-desktop-supervisor.md)

- [2026-09-09 Chat input capture](../../../../../../assist/records/zetro/2026-09-09-chat-input-capture.md)
- [2026-09-09 Codex model selection](../../../../../../assist/records/zetro/2026-09-09-codex-model-selection.md)
- [2026-09-09 Chat turn stop](../../../../../../assist/records/zetro/2026-09-09-chat-turn-stop.md)
