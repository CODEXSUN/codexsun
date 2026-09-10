# Chat live stream

## Cause and ownership

Codex Connection already emitted public response snapshots and tool activity.
Supervisor tasks consumed them, but normal Chat returned only the final JSON response.
Chat now offers an opt-in NDJSON response. Agent Chat renders public updates while the turn runs.
This joins the pending shared-package scope changes. No installed release has been replaced.

## Contract

Send `Accept: application/x-ndjson` to the existing authenticated `POST /api/v1/chat/responses` route.
Request validation, conversation ownership, folder validation, and sandbox enforcement remain required.
Archived conversations and projects cannot start a turn.
Existing callers without that Accept header retain the JSON response contract.

Stream frames use `type`: `status`, `progress`, `heartbeat`, `result`, or `error`.
Progress includes `id`, `kind` (`response` or `tool`), and `text`.
Response updates replace the snapshot for the same provider item, not append duplicate text.
The final `result.response` retains the existing response schema and remains authoritative.
Once streaming starts, failures arrive as error frames rather than an HTTP status change.

No private reasoning or raw command output is streamed. Common credential patterns are redacted from progress.
Tool labels are bounded. Each public message snapshot keeps its latest 8,000 characters.
The UI retains at most 80 live items and renders text without interpreting HTML.
Live updates are transient. Existing conversation persistence saves the final result, not the live transcript.

## Failure behavior

Heartbeats keep idle connections active. They do not claim task progress.
A disconnected consumer requests interruption. There is no automatic retry or full-access fallback.
Slow-consumer buffering is bounded. The client rejects oversized frames and incomplete streams.
An interrupted task can already have changed files. Review its worktree before another attempt.

## Verification

The HTTP test confirms public progress arrives before the provider is released to finish.
Parser tests cover split UTF-8 frames, explicit errors, terminal results, and premature EOF.
History and HTTP streaming tests: 12 passed. Provider and sandbox tests: 17 passed.
Web response-contract and stream-parser tests: 6 passed.
API/web typechecks, lint, and Zetro web/API/CLI builds passed without reported warnings.
Shared UI ownership, module documentation, and module boundary checks passed.
The initial file-length check found 704 lines in the provider client. Event construction was simplified to meet the limit.
Installed-desktop streaming, browser visual acceptance, and production proxy behavior remain unverified.
No installer, installation, commit, or push is included.

## References

- [Chat API](../../../../apps/zetro/api/src/modules/chat/README.md)
- [Agent Chat web](../../../../apps/zetro/web/src/modules/agent-chat/README.md)
- [Codex Connection](../../../../apps/zetro/api/src/modules/codex-connection/README.md)
