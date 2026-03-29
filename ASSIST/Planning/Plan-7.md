# Workspace Desk, UI Scope, And Module Routing

## Purpose

Rewrite the desk and workspace plan for the real repository shape, with `apps/framework` consuming a single shared design system from `apps/ui`.

## Goal

Implement a framework-driven desk shell that is cleanly modular, backed by shared UI and UX components, and structured for SaaS-first MVP delivery before broader app expansion.

## Scope

- `apps/framework/src/app`
- `apps/ui/src/components/ui`
- `apps/ui/src/components/ux`
- `apps/ui/src/theme`
- `apps/ui/src/types`
- `apps/docs/framework`
- `apps/docs/ui`
- `ASSIST/Documentation`
- `ASSIST/Execution`

## Canonical Decisions

- `apps/ui` is the only shared design-system surface for all apps.
- Other apps may consume the public `@codexsun/ui` package, but they must not import internal demo, docs, or registry files from `apps/ui`.
- Shared desk shell pieces belong in `apps/ui`, while app-specific route registries, page metadata, and business flows stay inside the app.
- Route files must be grouped by module or stable feature boundary instead of growing one oversized router file.
- Framework starts with a desk shell and placeholder workspace pages for the MVP SaaS surface, not a fake fully-finished ERP.
- Desktop and offline delivery remain planned extensions of the shared runtime, not the first implementation target.

## Assumptions

- The existing sidebar primitives in `apps/ui/src/components/ui/sidebar.tsx` remain the base desk primitive layer.
- The framework browser entry remains the active host for the first desk implementation batch.
- SaaS-first hosted delivery remains the fastest way to stabilize routing, permissions, theming, and data boundaries.
- Additional apps such as billing, ecommerce, and task will eventually consume the same shared desk and design-system pieces.

## Execution Plan

1. Move shared desk shell and dashboard presentation patterns into `apps/ui/src/components/ux`.
2. Tighten `apps/ui` so the public design-system build and typecheck scope only includes stable shared package files.
3. Remove duplicate or accidental shared-package files from the public scope and record the design-system boundary in docs.
4. Refactor `apps/framework` to consume shared desk components from `@codexsun/ui` instead of owning desk presentation locally.
5. Split framework route files by module under `apps/framework/src/app/modules/<module>`.
6. Add route metadata so the shared desk shell can resolve page title, summary, and future permission or navigation state.
7. Build the first framework workspace pages for Overview, System, Data, Integrations, and Deployment.
8. Add a frontend-only login page, protected dashboard route flow, and local-session placeholder until the backend auth host lands.
9. Keep the initial framework workspace explicitly MVP-scoped and SaaS-first.
10. Document design-system scope, desk ownership, route grouping rules, and the current frontend flow in both `ASSIST` and `apps/docs`.
11. Validate package typecheck, framework typecheck, shared UI build, framework build, and root workspace checks.

## Validation Plan

- Run `npm run typecheck --workspace @codexsun/ui`
- Run `npm run build --workspace @codexsun/ui`
- Run `npm run typecheck --workspace @codexsun/framework`
- Run `npm run build --workspace @codexsun/framework`
- Run `npm run typecheck`
- Run `npm run build`

## Validation Status

- [x] `npm run typecheck --workspace @codexsun/ui`
- [x] `npm run build --workspace @codexsun/ui`
- [x] `npm run typecheck --workspace @codexsun/framework`
- [x] `npm run build --workspace @codexsun/framework`
- [x] `npm run typecheck`
- [x] `npm run build`

## Risks And Follow-Up

- `apps/ui` still contains internal reference and demo material that must stay out of the public design-system dependency graph.
- If future apps bypass the shared desk components and rebuild their own shells, the suite will drift quickly.
- Desk shell reuse must stay presentation-focused; app routes, permissions, and workflow logic must remain app-owned.
- Desktop and offline flows should keep branching from SaaS-proven contracts rather than expanding the MVP desk prematurely.
