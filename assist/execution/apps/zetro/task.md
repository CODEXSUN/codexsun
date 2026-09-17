# Zetro Task Register

Read `planning.md` before work starts.

## Active Execution

- [ ] Z-1203: Chat Idea Workspace and Connection-Settings Shell
  - Status: active. User-directed fresh-start scope on 2026-09-17.
  - Owner: `apps/zetro/web` composition root.
  - Expected paths: `apps/zetro/web/src/app.tsx`, Zetro planning and task
    records, and the changelog record.
  - Exclusions: API routes, SQLite schema, persistent idea records, real Codex
    login, device-code polling, credential access, worker dispatch, and task
    creation.
  - Data impact: none. All chat and settings state is browser memory only.
  - Risks: a draft UI could be mistaken for an approval or live connection.
    Labels must make the local-only state clear.
  - Acceptance criteria:
    1. The workspace uses only published `@codexsun/ui` components, blocks,
       pages, and the `MdiMain` template for its UI composition.
    2. A user can send an idea, request a revision, mark the draft final, and
       prepare it for later task handover without any repository action.
    3. Connection settings explain the planned local Codex device-code flow
       without displaying or persisting an actual code or credential.
    4. The connection and handover states are readable and keyboard-accessible.
  - Verification: `test:zetro-web`,
    `npm.cmd run check --workspace @codexsun/zetro-web`,
    `preflight:zetro-web`, `lint`, `git diff --check`, and browser-visible local
    verification.

## Queued Execution

- [ ] Z-1204: Local Codex Connection Boundary
  - Requires a reviewed adapter contract, secret-redaction policy, explicit
    local-runtime ownership, and an operator-approved device-code flow.

- [ ] Z-1205: Persisted Idea and Handover Records
  - Requires module-owned SQLite migration, repository, lifecycle record,
    contract, and tests.

## Completion Rule

Mark a task complete only after its acceptance criteria and named verification
pass. A human must approve a merge, deployment, release, tag, or push.
