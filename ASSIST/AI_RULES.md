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
9. `apps/task`
10. `apps/frappe`
11. `apps/tally`
12. `apps/cli`

## Standard App Shape

Every app folder must keep the same baseline shape:

1. `src` for backend, manifests, and server-side composition
2. `web` for frontend shells and pages
3. `database/migration` for app-owned migration files or placeholders
4. `database/seeder` for app-owned seeders or placeholders
5. `helper` for app-local helper exports
6. `shared` for app-local shared contracts and workspace metadata

## Ownership Rules

1. `framework` owns runtime infrastructure, DI, config, database runtime, HTTP host wiring, and app composition.
2. `cxapp` is the main suite-facing product shell and owns the active frontend and server entry wrappers.
3. `core` owns shared business masters and reusable ERP-common foundations.
4. `api` owns only route definitions and contracts, split into internal and external surfaces.
5. `site` owns static and presentation-only public surfaces.
6. `ui` owns the reusable design system, shared styles, and neutral UX building blocks.
7. `billing` owns accounting, inventory, vouchers, and reporting behavior.
8. `ecommerce` owns storefront, catalog, checkout, and customer commerce flows.
9. `task` owns task, workspace, and team workflow behavior.
10. `frappe` owns Frappe-specific integration boundaries.
11. `tally` owns Tally-specific integration boundaries.
12. `cli` owns operational commands, diagnostics, and release helpers.

## Mandatory Rules

1. Keep `ASSIST/Documentation/ARCHITECTURE.md` as the single source of truth.
2. Keep framework reusable; do not bury business logic inside `apps/framework`.
3. Keep `cxapp` as the active product shell while framework stays the reusable composition root beneath it.
4. Keep every app inside the standard `src`, `web`, `database`, `helper`, and `shared` shape.
5. Keep internal API routes under `apps/api/src/internal`.
6. Keep external API routes under `apps/api/src/external`.
7. Keep shared masters in `apps/core`.
8. Keep shared UI in `apps/ui`; do not move app-specific screens back into the shared UI package.
9. Treat dormant or incomplete app-specific code under `apps/ui/src/features` as out of active build scope until it is moved to the correct app boundary.
10. Keep MariaDB as the default live transactional database, SQLite as the offline desktop option, and PostgreSQL as the optional analytics path.
11. Keep build outputs under `build/app/<app>/<target>` and reserve `build/module/<module>/<target>` for future modules.
12. Update docs, task tracking, planning, and changelog in the same batch as architecture changes.
13. Use one reference number across task tracking, planning, changelog, and commit subjects for the same batch.
14. Keep scaffolds honest; do not present placeholders as completed domain behavior.

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

## Delivery Pattern

1. Read the required docs.
2. Record the active reference in `ASSIST/Execution/TASK.md`.
3. Record scope, assumptions, and validation in `ASSIST/Execution/PLANNING.md`.
4. Implement the smallest boundary-correct change.
5. Run `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` when relevant.
6. Update docs and changelog in the same batch.
7. Report what changed, what remains, and any residual risks.
