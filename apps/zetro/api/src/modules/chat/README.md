# Zetro Chat API

## Contract

- Module ID: `zetro.chat.api`
- Version: `0.5.0`
- Owner: Zetro API
- Routes: provider turns and conversation history under `/api/v1/chat`
- Entities: a provider turn and a persisted conversation

The response route requires a Zetro conversation ID. The service sends text and images through the public App Server client.

The conversation ID selects an isolated worktree. The response includes the worktree path, available coding tools, and completed tool activity.

The response route accepts a `workflow` value. Valid values are `deliver`, `develop`, `document`, `review`, and `test`. The route defaults to `develop` for older clients.

Delivery responses expose an expanded tool catalog for assignment, documentation, changelog, versioning, commit, and push work. Tool availability does not bypass the publication gate.

A delivery response includes nine validated stage records. Each record contains its stage ID, status, evidence, and server timestamp.

The web client sends the latest validated delivery record with the next turn. Codex can continue from that evidence and must recheck stale facts.

## Configuration

- A Codex device login in Zetro Settings enables live local App Server responses.
- `ZETRO_CODEX_API_KEY` optionally supplies API-key authentication to the local App Server.
- `ZETRO_CODEX_BASE_URL` defaults to `https://api.openai.com/v1`.
- `ZETRO_CODEX_COMMAND` defaults to `codex`.
- `ZETRO_CODEX_MODEL` optionally overrides the model. An empty value uses the Codex account default.

## Lifecycle and persistence

The module stores conversations in `storage/app/private/zetro/conversations.json`. Writes replace the file atomically.

Assistant messages can store optional execution metadata, the selected workflow, and a delivery record. Existing conversation records remain valid without a migration.

The module has no tables, migrations, seeds, events, or jobs. Uninstall keeps conversation history unless a separate data removal flow runs.

## Safety and limits

The route accepts at most 24 messages and four attachments per user message. Each encoded attachment is limited to 6 MB. Zetro returns visible final output only and does not expose provider reasoning.

## Verification

Run the Zetro API typecheck, conversation tests, workflow tests, and worktree test. Exercise a coding turn with device authorization or an API key.

## Development records

Future changes must be recorded in the [Zetro development records](../../../../../../assist/records/zetro/README.md).
