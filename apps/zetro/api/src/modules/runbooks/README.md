# Runbooks API

Runbooks own reusable local work instructions and their isolated executions.

A runbook stores a title, prompt, repository, approved module scope, and run mode.
A one-time run starts only from the explicit Start now action. A repeating runbook
stores an interval and starts disabled. An enabled schedule creates one sibling Git worktree per due run.
The Local Codex CLI works only in that worktree. It cannot commit, push, merge,
open a pull request, deploy, remove the worktree, or change files outside it.

The module owns `runbooks` and `runbook_runs` in Zetro SQLite. It records the
trigger source, branch, worktree, status, timestamps, and bounded CLI report.
Another Zetro module can call `POST /api/zetro/v1/runbook-initiations` with its
module ID, selected item ID, runbook ID, and mode. One-time initiation starts a
run and returns it. Repeating initiation enables the saved schedule.
The scheduler wakes every 15 seconds. A runbook allows only one active run.

Routes:

- `GET /api/zetro/v1/runbooks`
- `POST /api/zetro/v1/runbooks`
- `PATCH /api/zetro/v1/runbooks/:runbookId`
- `POST /api/zetro/v1/runbooks/:runbookId/start`
- `POST /api/zetro/v1/runbook-initiations`
- `POST /api/zetro/v1/runbook-runs/:runId/stop`
- `GET /api/zetro/v1/runbook-runs`

Runbooks do not create commits, push branches, request pull requests, merge,
deploy, or remove worktrees. Those actions remain explicit human workflows.
