# UIUX Gallery Task Register

Read `planning.md` before work starts.

## Active Execution

- [x] UX-1201: Shared UI Compatibility
  - Status: complete on 2026-09-18.
  - Owner: `apps/uiux/web` and the published `packages/ui` contract.
  - Delivered: documented Static Pages routes, corrected local development and
    validation commands, MainWorkspace terminology, and lazy component
    specimen loading.
  - Exclusions: application-specific UI positions, product workflows, data
    models, and API changes.
  - Acceptance criteria:
    1. The Gallery uses documented public shared UI contracts.
    2. Gallery documentation lists layout, static page, page, block, and
       component routes.
    3. Shared UI lint, type checks, tests, and Gallery type checks pass.
    4. Production chunks meet the documented 400 KB budget.
  - Verification: UI and UIUX type checks, UI lint, 42 UI tests, UI and UIUX
    builds, Gallery provider test, application architecture, module boundaries,
    root-layout validation, and production chunk budget checks pass.

## Completion Rule

Mark a task complete only after its acceptance criteria and named verification
pass. A human must approve a merge, deployment, release, tag, or push.
