# AI Rules

## Role

Act as a senior full-stack architect and implementation agent for a Node.js, TypeScript, React, Electron-ready ERP platform.

## Required Reading Order

Before making changes, read:

1. `ASSIST/Documentation/ARCHITECTURE.md`
2. `ASSIST/Documentation/PROJECT_OVERVIEW.md`
3. `ASSIST/Documentation/SETUP_AND_RUN.md`
4. `ASSIST/Documentation/SUPPORT_ASSISTANT_BOUNDARY.md`
5. `ASSIST/Discipline/*`
6. `ASSIST/Execution/TASK.md`
7. `ASSIST/Execution/PLANNING.md`
8. the relevant guide under `ASSIST/Planning`
9. `apps/ui/src/design-system/data/project-defaults.ts` when the task touches known shared UI components or page composition
10. `apps/ui/src/registry` and `apps/ui/src/components/blocks` when the task touches shared component variants or reusable blocks

## Current Repository Model

All product code lives under one `apps/` root:

1. `apps/framework`
2. `apps/cxapp`
3. `apps/core`
4. `apps/api`
5. `apps/site`
6. `apps/ui`
7. `apps/billing`
8. `apps/ecommerce`
9. `apps/demo`
10. `apps/task`
11. `apps/frappe`
12. `apps/tally`
13. `apps/cli`

## Standard App Shape

Every app folder must keep the same baseline shape:

1. `src` for backend, manifests, and server-side composition
2. `web` for frontend shells and pages
3. `database/migration` for app-owned migration files or placeholders
4. `database/seeder` for app-owned seeders or placeholders
5. `helper` for app-local helper exports
6. `shared` for app-local shared contracts and workspace metadata
7. when an app owns persistent data, keep individual migration files in `apps/<app>/database/migration`, individual seeder files in `apps/<app>/database/seeder`, and register them through a server-side entry such as `apps/<app>/src/database-module.ts`

## Ownership Rules

1. `framework` owns runtime infrastructure, DI, config, database runtime, HTTP host wiring, and app composition.
2. `cxapp` is the main suite-facing product shell and owns the active frontend and server entry wrappers.
3. `core` owns shared business masters and reusable ERP-common foundations only.
4. `api` owns only route definitions and contracts, split into internal and external surfaces.
5. `site` owns static and presentation-only public surfaces.
6. `ui` owns the reusable design system, shared styles, and neutral UX building blocks.
7. `billing` owns accounting, inventory, vouchers, and reporting behavior.
8. `ecommerce` owns storefront, catalog presentation, cart, checkout, payments, order tracking, and customer commerce flows.
9. `demo` owns demo-data installation, sample business data generation, and demo showcase administration.
10. `task` owns task, workspace, and team workflow behavior.
11. `frappe` owns ERPNext-specific settings, snapshot storage, and connector sync orchestration.
12. `tally` owns Tally-specific integration boundaries.
13. `cli` owns operational commands, diagnostics, and release helpers.

## Mandatory Rules

1. Keep `ASSIST/Documentation/ARCHITECTURE.md` as the single source of truth.
2. Keep framework reusable; do not bury business logic inside `apps/framework`.
3. Keep `cxapp` as the active product shell while framework stays the reusable composition root beneath it.
4. Keep every app inside the standard `src`, `web`, `database`, `helper`, and `shared` shape.
5. Keep internal API routes under `apps/api/src/internal`.
6. Keep external API routes under `apps/api/src/external`.
7. Keep shared masters in `apps/core`.
8. Keep shared UI in `apps/ui`; do not move app-specific business screens back into the shared UI package.
9. Shared `apps/ui/src/features/*` code is allowed only for neutral cross-app surfaces such as dashboard shell presentation or design-system docs.
10. For known shared UI components, use `apps/ui/src/design-system/data/project-defaults.ts` as the project source of truth for component names and default variants.
11. For reusable shared UI compositions, source them from `apps/ui/src/registry/blocks` or `apps/ui/src/components/blocks` rather than recreating page fragments inside docs or app shells.
12. Keep MariaDB as the default live transactional database, SQLite as the offline desktop option, and PostgreSQL as the optional analytics path.
13. Keep build outputs under `build/app/<app>/<target>` and reserve `build/module/<module>/<target>` for future modules.
14. Update docs, task tracking, planning, and changelog in the same batch as architecture changes.
15. Use one reference number across task tracking, planning, changelog, and commit subjects for the same batch.
16. Keep scaffolds honest; do not present placeholders as completed domain behavior.
17. Keep migration and seeder execution inside `apps/framework/src/runtime/database`; do not scatter ad hoc table bootstrapping across routes, services, or web code.
18. Keep framework auth support limited to reusable primitives such as config, hashing, JWT signing, SMTP transport, and request parsing; keep auth users, sessions, OTP records, mailbox templates, bootstrap records, company records, and auth business logic inside the owning app such as `apps/cxapp`.
19. Keep suite-facing auth pages and browser session persistence in `apps/cxapp`; do not move routed auth workflows into `apps/ui`.
20. Keep ERPNext connection settings, todo/item/receipt snapshots, and connector sync logs inside `apps/frappe`; if the connector needs to project into another app such as `ecommerce`, add a narrow app-owned service in the target app instead of writing across boundaries ad hoc.
21. Keep only one browser login and backend session system in `apps/cxapp`; customer portal access in `apps/ecommerce` must consume that shared auth session instead of creating a second login store or token flow.

## Implementation Style

1. Prefer direct, readable files over vague abstraction.
2. Keep DI and composition explicit.
3. Keep app boundaries visible in imports and folder ownership.
4. Add comments only when the logic is genuinely non-obvious.

## Prohibited Actions

1. Do not let `apps/core` become a dumping ground.
2. Do not let `apps/ui` absorb app-specific routes, auth, or desk logic.
3. Do not mix internal and external API routes in one file.
4. Do not bypass framework runtime and start hidden hosts from app code.
5. Do not create app-local build output folders outside the shared `build/` root.
6. Do not claim connector, accounting, or auth flows are production-ready when they are only scaffolded.
7. Do not move auth domain tables, mailbox storage, or role/permission rules into `apps/framework`; those stay app-owned even when framework provides the runtime plumbing.

## Delivery Pattern

1. Read the required docs.
2. Record the active reference in `ASSIST/Execution/TASK.md`.
3. Record scope, assumptions, and validation in `ASSIST/Execution/PLANNING.md`.
4. Implement the smallest boundary-correct change.
5. When building with known design-system components, resolve the component name and default variant from `apps/ui/src/features/design-system/data/project-defaults.ts` before writing UI code, and prefer `apps/ui/src/features/component-registry/blocks` for reusable multi-component page sections.
6. Run `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` when relevant.
7. Update docs and changelog in the same batch.
8. Report what changed, what remains, and any residual risks.
