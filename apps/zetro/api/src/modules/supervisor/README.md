# Zetro Supervisor API

## Contract

- Module ID: `zetro.supervisor.api`
- Version: `0.2.0`
- Owner: Zetro API
- Dependencies: Chat `^0.14.0`, Projects `^0.5.0`, System Tasks `^1.1.0`.

This technical adapter accepts approved local agent jobs. Module-prefixed files separate
validation, routes, and coordination. It has no business entities or independent domain layers.

## Routes and bindings

All routes use `/api/v1/supervisor` and require `Authorization: Bearer <token>`.

| Route                     | Result                                                 |
| ------------------------- | ------------------------------------------------------ |
| `GET /capabilities`       | Protocol version, workflows, limits, and requirements  |
| `GET /projects`           | Existing active registered repositories                |
| `POST /projects`          | Registers a reviewed local repository through Projects |
| `POST /jobs`              | HTTP 202 with `{task}` and its durable task ID         |
| `GET /jobs`               | Recent supervisor jobs as `{tasks}`                    |
| `GET /jobs/:taskId`       | `{task}` with status, steps, error, and final result   |
| `POST /jobs/:taskId/stop` | Requests cancellation of an owned job                  |

Submit `projectId`, `prompt`, `scope: {application, module, folderPath}`, and `approved: true`.
Project registration requires `name`, an absolute `repositoryPath`, and `approved: true`.
Projects validates Git ownership and rejects duplicate repositories through its public service.
Optional fields are `workflow`, `model`, and `reasoningEffort`. Review is the default workflow.
Develop, document, and test are also available. Deliver is not exposed by this adapter.
The strict schema rejects extra fields and limits prompts to 20,000 characters.

The result contains `conversationId`, the assistant message, model, and execution metadata.
Chat owns saved messages. System Tasks owns status, steps, failure text, and result persistence.
Failed provider tool actions fail the job even when the model returns an answer.
Chat retains that answer and bounded, redacted command failure details for diagnosis.
Completion means the provider turn finished without reported tool failures, not that all release gates passed.
Zetro displays these records through its existing Chat and System Tasks screens.

## Configuration and permissions

Live progress uses versioned `zetro.progress.v1:` JSON snapshots in task steps.
Each snapshot holds the latest 40 observed tool actions and up to 8,000 public response
characters. Updates coalesce every two seconds and flush before completion or failure.
The final result remains authoritative. Reasoning and raw tool output are excluded.
Common credential patterns are redacted. This does not replace secret handling by callers.
See the [0.1.21 record](../../../../../../assist/records/zetro/2026-09-10-desktop-0.1.21.md).

Set `ZETRO_SUPERVISOR_TOKEN` to a random value with at least 32 characters before desktop launch.
An empty value disables access. The desktop inherits this setting from its launch environment.
The API requires a loopback host and rejects browser Origin headers and non-loopback callers.
The supervisor token does not authorize desktop settings, generic Git, or other API routes.
The Codex child does not inherit supervisor, desktop-session, or connected-application tokens.

The token represents a trusted local supervisor. `approved: true` records that caller's decision.
It is not a separate human approval engine. Review each job before submission.
The underlying provider has workspace-write access. Folder scope is agent guidance, not an OS boundary.
Provider prompts and repository content must come from trusted sources.

## Lifecycle, storage, and recovery

The module owns no tables, migrations, seeds, events, or independent worker.
It registers the `supervisor.agent-turn` System Tasks handler before the queue starts.
Only one active supervisor job per project is accepted by this desktop process.
Cross-process admission coordination is not supported. Desktop uses the local queue.
Each job creates a separate conversation and detached worktree based on committed repository HEAD.
Uncommitted checkout edits are not copied. Commit the reviewed baseline before dispatch.

Agent jobs cannot retry. Interrupted attempts become blocked on restart.
Inspect history and the worktree before submitting another job. A lost HTTP response does not
prove rejection. List jobs before submitting again because submission has no idempotency key.
Shutdown requests provider interruption through System Tasks. Uninstall preserves history.

## Verification

Run the API supervisor and System Tasks tests, API typecheck, and desktop release checks.
Tests cover authentication, validation, durable results, cancellation, and replay prevention.
Live provider access requires a connected Codex account and an existing registered repository.

## Development records

- [Desktop supervisor bridge](../../../../../../assist/records/zetro/2026-09-10-desktop-supervisor.md)
