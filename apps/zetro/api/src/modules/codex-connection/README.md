# Zetro Codex Connection API

## Contract

- Module ID: `zetro.codex-connection.api`
- Version: `0.5.0`
- Owner: Zetro API
- Routes: status, device-code start, activation refresh, and disconnect under `/api/v1/settings/codex`

The module owns one local `codex app-server` process and communicates over its JSONL stdio protocol. Codex owns token storage and refresh.

Zetro never reads or returns the Codex auth cache. An optional `ZETRO_CODEX_API_KEY` becomes `OPENAI_API_KEY` only inside the App Server child process.

## Device activation

`POST /api/v1/settings/codex/device-code` starts `chatgptDeviceCode` login and returns `loginId`, `verificationUrl`, and `userCode`. The user enters the code on the OpenAI verification page. `POST /api/v1/settings/codex/activate` refreshes account state for that login attempt.

Starting another device-code flow cancels older pending attempts. `POST /api/v1/settings/codex/disconnect` calls the App Server account logout contract and clears pending codes. An explicit `ZETRO_CODEX_API_KEY` cannot be removed by the HTTP route; it must be removed from the root `.env` file.

The module requires the local `codex` executable. Device-code login must be enabled in the user's ChatGPT security settings or workspace permissions.

## Task execution

The public client starts one ephemeral Codex thread for each turn. Ephemeral threads do not enter the durable Codex task history.

Each Zetro conversation uses one detached Git worktree. The worktree path is `<ZETRO_WORKTREE_ROOT>/<conversation-id>` and starts from repository `HEAD`.

The thread uses workspace-write access for its worktree. Codex can read and search files, edit files, run commands, run tests, and review Git changes.

The client collects completed command, file-change, and MCP activity. It returns this activity with the final visible response.

Each turn uses one workflow: `deliver`, `develop`, `document`, `review`, or `test`. The workflow adds focused instructions to the common repository and worktree rules.

The delivery workflow runs plan, observe, review, assign, implement, verify, document, version, and publish stages in order. Each final response must show a status and evidence for every stage.

The publish stage requires an explicit user request for both commit and push. Codex must verify staged files, branch, upstream, and required checks before publication.

Deliver turns use an App Server output schema. The response contains the user answer and exactly nine ordered stage records.

Zetro validates each stage ID, status, and evidence string. It adds the server timestamp and computes publication readiness after validation.

The documentation workflow uses current code and repository documents as evidence. It checks links, paths, and commands before it reports completion.

## Lifecycle and persistence

Install creates no data. Activate starts the App Server lazily. Version 0.5.0 needs no data migration.

Deactivate closes the child process. Uninstall leaves credentials and worktrees untouched. The module has no tables, seeds, events, or jobs.

## Verification

Run the API typecheck, build, workflow tests, history tests, and worktree integration test. Inspect account status and device-code endpoints.

A complete activation requires user sign-in in the browser. A live coding turn must prove file edits and command activity.

## Development records

Future changes must be recorded in the [Zetro development records](../../../../../../assist/records/zetro/README.md).
