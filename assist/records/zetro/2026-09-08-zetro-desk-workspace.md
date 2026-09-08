# Zetro Desk Workspace

Status: Superseded by the [Empty Desk reset](2026-09-08-empty-desk-reset.md).

## Outcome

Zetro now has one public page at `/zetro`. Zetro Desk uses the shared MDI shell
and composes Task System as its first approved region.

The obsolete Chat, voice, history, and Development frontend code is removed.
Settings remains in source without a public route or visible navigation.

## Authoritative references

- Application contract: `apps/zetro/README.md`
- Module owner: `apps/zetro/web/src/modules/desk/README.md`
- Application catalog: `assist/modules/zetro.md`
- Shared layout: `packages/ui/src/layouts/mdi-main`

## Ownership and boundaries

The Desk web module owns the page and topology region `15`. The Task System
module owns the task region and behavior. The Zetro composition root mounts
only Zetro Desk. The shared MDI shell remains the layout owner.

## Binding properties

| Producer          | Consumer              | Binding              | Version |
| ----------------- | --------------------- | -------------------- | ------- |
| Zetro composition | Zetro Desk            | `/zetro`             | `0.1.0` |
| Zetro Desk        | Shared ITO controller | topology region `15` | `0.1.0` |
| Zetro Desk        | Task System           | public module import | `0.2.0` |

## Parallel work

The repository contains concurrent Task System, Docs, Platform, notification,
profile, runtime, and workspace changes. This work preserves those source files.

## Decisions

- Decision: Keep only `/zetro` as a public Zetro page.
- Reason: The user wants one desk that grows through visual approval.
- Decision: Remove the unused Chat and Development frontend code.
- Reason: Zetro Desk now starts from one clean, approved Task System surface.
- Decision: Keep Settings without mounting it.
- Reason: The local connection UI remains a planned Desk region.
- Decision: Use Tailwind utilities for new Zetro Desk work.
- Reason: Shared tokens and utilities keep the page consistent with MDI.
- Decision: Add custom CSS only when Tailwind has no suitable option.
- Reason: This prevents a second visual system from growing inside Zetro.

## Verification

- Passed the Zetro web type check and production build.
- Passed Zetro tests, lint, documentation, line, and diff checks.
- Formatted all files changed for Zetro Desk and ITO.
- Opened `http://127.0.0.1:6060/zetro` in Chrome.
- Confirmed Zetro Desk, the MDI shell, and the ITO inspection control.
- Confirmed old hash routes normalize to `/zetro`.
- Root typecheck remains blocked by unrelated concurrent DevKit and shared table errors.
- Root format check remains blocked by unrelated concurrent DevKit and shared table files.

## Follow-up work

Add one approved visual region at a time to the empty Zetro Desk.
