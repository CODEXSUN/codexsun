# Zetro Task Register

Read `planning.md` before work starts.

## Active Execution

- [x] Z-1203: Persistent Chat Idea Workspace
  - Status: complete on 2026-09-17.
  - Owner: `apps/zetro/api/modules/chat` and `apps/zetro/web`.
  - Delivered: public chat contracts, provider-owned private SQLite history,
    conversation routes, a local read-only ephemeral Codex CLI runner, MDI chat
    workspace, and history side menu.
  - Exclusions: device-code login, credential access, final brief persistence,
    worker dispatch, repository commands, and task creation.
  - Data impact: private SQLite stores conversation metadata and messages only.
    Authentication material is not stored.
  - Acceptance criteria:
    1. The workspace uses the published `@codexsun/ui` controls and `MainWorkspace`.
    2. A user can create, select, and continue a persistent conversation.
    3. A message is passed to the existing local Codex CLI with read-only and
       ephemeral execution options; its response or failure is saved to history.
    4. The history and composer are keyboard-accessible.
  - Verification: API and web type checks; four API tests; web health test;
    live API create/read verification; and browser-visible verification at
    `http://127.0.0.1:6131/`.

## Queued Execution

- [ ] Z-1204: Local Codex Connection Status and Device-Code Boundary
  - Requires a reviewed adapter contract, secret-redaction policy, explicit
    local-runtime ownership, and an operator-approved device-code flow.

- [ ] Z-1205: Final Brief and Handover Records
  - Requires module-owned lifecycle records, handover contract, and tests.

## Completion Rule

Mark a task complete only after its acceptance criteria and named verification
pass. A human must approve a merge, deployment, release, tag, or push.
