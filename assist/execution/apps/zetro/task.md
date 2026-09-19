# Zetro Task Register

Read `planning.md` before work starts.

## Active Execution

- [x] Z-1203: Persistent Chat Idea Workspace
  - Status: complete on 2026-09-17.
  - Owner: `apps/zetro/api/modules/chat` and `apps/zetro/web`.
  - Delivered: public chat contracts, provider-owned private SQLite history,
    conversation routes, a local read-only ephemeral Codex CLI runner, MDI chat
    workspace, and history side menu.
  - Exclusions: final brief persistence, worker dispatch, repository commands,
    and task creation.
  - Data impact: private SQLite stores conversation metadata and messages only.
    Authentication material is not stored.
  - Acceptance criteria:
    1. The workspace uses the published `@codexsun/ui` controls and `MainWorkspace`.
    2. A user can create, select, and continue a persistent conversation.
    3. A message is passed to the existing local Codex CLI with read-only and
       ephemeral execution options; its response or failure is saved to history.
    4. The history and composer are keyboard-accessible.
  - Verification: API and web type checks; seven API tests; web health test;
    live API create/read verification; and browser-visible verification at
    `http://127.0.0.1:6131/`.

## Queued Execution

- [x] Z-1204: Local Codex Connection Status and Device-Code Boundary
  - Status: complete on 2026-09-19.
  - Owner: `apps/zetro/api/modules/chat` and `packages/ui` connection blocks.
  - Delivered: local CLI status, active model and reasoning settings, a
    reconnect action, and transient App Server device-code authentication.
  - Boundary: the API returns a code and verification URL only while the
    process holds an active request. It does not persist these values in
    SQLite, storage, chat history, or logs.
  - Verification: Zetro API type, lint, and test checks. Live local CLI status
    and runtime endpoint checks passed on 2026-09-19.

- [x] Z-1205: Final Brief and Handover Records
  - Status: complete on 2026-09-19.
  - Owners: `apps/zetro/api/modules/brief`,
    `apps/zetro/api/modules/task`, and the shared UI handover workspace.
  - Delivered: persisted idea stages, editable final briefs, selected source
    response UUIDs, project or all-projects scope, and prepared task records.
  - Boundary: a task must use a finalized brief and retain its project scope.
    It does not create a worktree, run an agent, or modify a repository.
  - Verification: contract, UI, API, and web type checks passed. Ten Zetro API
    tests passed. Live verification created a final brief with one source UUID
    and a prepared task scoped to `codexsun`.

## Completion Rule

Mark a task complete only after its acceptance criteria and named verification
pass. A human must approve a merge, deployment, release, tag, or push.
