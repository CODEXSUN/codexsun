# Zetro Codex Connection API

## Contract

- Module ID: `zetro.codex-connection.api`
- Version: `0.8.0`
- Owner: Zetro API
- Routes: status, device-code start, activation refresh, and disconnect under `/api/v1/settings/codex`

The module owns one local `codex app-server` process and communicates over its JSONL stdio protocol. Codex owns token storage and refresh.

Zetro never reads or returns the Codex auth cache. An optional `ZETRO_CODEX_API_KEY` becomes `OPENAI_API_KEY` only inside the App Server child process.

The child environment removes Zetro supervisor, desktop-session, and connected-application access tokens.

## Device activation

The optional `onProgress` callback publishes only public agent text and tool lifecycle
events. Reasoning notifications are excluded. Supervisor coalesces these events into
bounded task snapshots. See the [0.1.21 record](../../../../../../assist/records/zetro/2026-09-10-desktop-0.1.21.md).

`POST /api/v1/settings/codex/device-code` starts `chatgptDeviceCode` login and returns `loginId`, `verificationUrl`, and `userCode`. The user enters the code on the OpenAI verification page. `POST /api/v1/settings/codex/activate` refreshes account state for that login attempt.

Starting another device-code flow cancels older pending attempts. `POST /api/v1/settings/codex/disconnect` calls the App Server account logout contract and clears pending codes. An explicit `ZETRO_CODEX_API_KEY` cannot be removed by the HTTP route; it must be removed from the root `.env` file.

The module requires the local `codex` executable. On Windows, the default command first resolves the newest Codex desktop executable below `%LOCALAPPDATA%\OpenAI\Codex\bin`. An explicit `ZETRO_CODEX_COMMAND` value remains authoritative.

A missing or invalid command returns a controlled service error. It does not stop the Zetro API or web process. Device-code login must be enabled in the user's ChatGPT security settings or workspace permissions.

## Task execution

The public client starts one ephemeral Codex thread for each turn. Ephemeral threads do not enter the durable Codex task history.

Each turn can select a supported Codex model and a low, medium, or high
reasoning effort. The model overrides `ZETRO_CODEX_MODEL` for that turn. The
account or environment default still applies when the request omits a model.

Each Zetro conversation uses one detached Git worktree. The worktree path is `<ZETRO_WORKTREE_ROOT>/<conversation-id>` and starts from repository `HEAD`.
Worktree Git commands set `core.longpaths=true` per command for deep Windows desktop paths.
This does not change the global or repository Git configuration.
Ownership checks compare resolved filesystem paths to support Windows AppData redirection.
Thread and turn requests both receive the resolved working directory. Failed command details
are redacted and limited to 2,000 characters. The 20-item activity summary keeps failures first.
Desktop worktrees use the user's `.zetro/worktrees` directory so the Windows sandbox can access them.

The chat workspace scope maps its repository-relative folder into this
worktree. The App Server starts from that folder. Its instructions limit normal
inspection to the connected application or module. Repository guidance and
declared dependencies remain readable when the task needs them.

The thread uses workspace-write access for its worktree. Codex can read and search files, edit files, run commands, run tests, and review Git changes.

The client collects completed command, file-change, and MCP activity. It returns this activity with the final visible response.

The client tracks the App Server thread and turn for each active conversation.
The default provider deadline is ten minutes. Timeout requests interruption before failure.
If interruption fails, the client closes its provider connection and rejects pending work.
An interrupt calls `turn/interrupt` with both IDs. An interrupt requested while
the turn starts runs as soon as the App Server returns the turn ID.

Each turn uses one workflow: `deliver`, `develop`, `document`, `review`, or `test`. The workflow adds focused instructions to the common repository and worktree rules.

The delivery workflow runs plan, observe, review, assign, implement, verify, document, version, and publish stages in order. Each final response must show a status and evidence for every stage.

The publish stage requires an explicit user request for both commit and push. Codex must verify staged files, branch, upstream, and required checks before publication.

Deliver turns use an App Server output schema. The response contains the user answer and exactly nine ordered stage records.

Zetro validates each stage ID, status, and evidence string. It adds the server timestamp and computes publication readiness after validation.

The documentation workflow uses current code and repository documents as evidence. It checks links, paths, and commands before it reports completion.

## Lifecycle and persistence

Install creates no data. Activate starts the App Server lazily. Version 0.5.3 needs no data migration.

Deactivate closes the child process. Uninstall leaves credentials and worktrees untouched. Version 0.7.0 needs no data migration.

## Verification

Run the API typecheck, build, connection tests, workflow tests, history tests, and worktree integration test. Inspect account status and device-code endpoints.

A complete activation requires user sign-in in the browser. A live coding turn must prove file edits and command activity.

## Development records

- [Stable release workflow](../../../../../../assist/records/zetro/2026-09-10-stable-release-workflow.md)

- [Desktop supervisor bridge](../../../../../../assist/records/zetro/2026-09-10-desktop-supervisor.md)

- [2026-09-09 Codex model selection](../../../../../../assist/records/zetro/2026-09-09-codex-model-selection.md)
- [2026-09-09 Chat turn stop](../../../../../../assist/records/zetro/2026-09-09-chat-turn-stop.md)
