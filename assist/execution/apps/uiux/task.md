# UIUX Gallery Task Register

Read `planning.md` before work starts.

## Active Execution

- [x] UX-1211: Shared Rich Text Editor
  - Status: complete on 2026-09-19.
  - Owner: `packages/ui` with Gallery composition in `apps/uiux/web`.
  - Delivered: a published Tiptap rich text editor with write, Markdown, HTML,
    and preview modes plus format, list, alignment, link, image, and history
    controls. It saves drafts in memory and exposes an optional application save
    callback. The Gallery provides a live Form component preview.
  - Exclusions: product content persistence, file uploads, and application
    business behavior.
  - Verification: UI and UIUX type checks, UI lint, UIUX production build,
    and live Gallery verification pass.

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
