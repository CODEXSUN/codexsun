# AI Rules

## Role

Act as a senior full-stack architect and implementation agent for a Node.js, TypeScript, React, Electron-ready ERP platform.

## Required Reading Order

Before making changes, read:

1. `ASSIST/README.md`
2. `ASSIST/Documentation/ARCHITECTURE.md`
3. `ASSIST/Documentation/PROJECT_OVERVIEW.md`
4. `ASSIST/Documentation/SETUP_AND_RUN.md`
5. `ASSIST/Documentation/SUPPORT_ASSISTANT_BOUNDARY.md`
6. `ASSIST/Discipline/*`
7. `ASSIST/Execution/TASK.md` and `ASSIST/Execution/PLANNING.md` when the batch is tracked as active execution work
8. `apps/ui/src/design-system/data/project-defaults.ts` when the task touches known shared UI components or page composition
9. `apps/ui/src/registry` and `apps/ui/src/components/blocks` when the task touches shared component variants or reusable blocks

## Current Repository Model

All product and companion client code lives under one `apps/` root:

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
11. `apps/crm`
12. `apps/frappe`
13. `apps/tally`
14. `apps/cli`
15. `apps/mobile`

## Standard App Shape

Every framework-composed app folder except `apps/mobile` must keep the same baseline shape:

1. `src` for backend, manifests, and server-side composition
2. `web` for frontend shells and pages
3. `database/migration` for app-owned migration files or placeholders
4. `database/seeder` for app-owned seeders or placeholders
5. `helper` for app-local helper exports
6. `shared` for app-local shared contracts and workspace metadata
7. when an app owns persistent data, keep individual migration files in `apps/<app>/database/migration`, individual seeder files in `apps/<app>/database/seeder`, and register them through a server-side entry such as `apps/<app>/src/database-module.ts`
8. `apps/mobile` is the current exception and follows its Expo-native package layout instead of the suite `src/web/database/helper/shared` shape

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
11. `crm` owns lead, interaction, and sales-orchestration workflows.
12. `frappe` owns ERPNext-specific settings, snapshot storage, and connector sync orchestration.
13. `tally` owns Tally-specific integration boundaries.
14. `cli` owns operational commands, diagnostics, and release helpers.
15. `mobile` owns the companion Expo client and device-native workflows that do not belong in the framework-composed web suite.

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
12. Keep MariaDB as the default live transactional database and PostgreSQL as the optional secondary database path; SQLite runtime support has been removed.
13. Keep build outputs under `build/app/<app>/<target>` and reserve `build/module/<module>/<target>` for future modules.
14. Update docs, task tracking, planning, and changelog in the same batch as architecture changes.
15. Use one reference number across task tracking, planning, changelog, commit subjects, and installed application version for the same batch; task `#172` must map to app version `1.0.172`, changelog label `v 1.0.172`, and release tag `v-1.0.172`.
16. Keep scaffolds honest; do not present placeholders as completed domain behavior.
17. Keep migration and seeder execution inside `apps/framework/src/runtime/database`; do not scatter ad hoc table bootstrapping across routes, services, or web code.
18. Keep framework auth support limited to reusable primitives such as config, hashing, JWT signing, SMTP transport, and request parsing; keep auth users, sessions, OTP records, mailbox templates, bootstrap records, company records, and auth business logic inside the owning app such as `apps/cxapp`.
19. Keep suite-facing auth pages and browser session persistence in `apps/cxapp`; do not move routed auth workflows into `apps/ui`.
20. Keep ERPNext connection settings, todo/item/receipt snapshots, and connector sync logs inside `apps/frappe`; if the connector needs to project into another app such as `ecommerce`, add a narrow app-owned service in the target app instead of writing across boundaries ad hoc.
21. Keep only one browser login and backend session system in `apps/cxapp`; customer portal access in `apps/ecommerce` must consume that shared auth session instead of creating a second login store or token flow.
22. All upcoming code and newly created files must be written in small, clean, responsibility-focused modules; do not create new oversized files or mixed-responsibility files.
23. New frontend files must keep presentation, local UI state, business logic, data access, and mapping clearly separated; do not bury domain behavior inside routed page components.
24. New backend files must follow clean architecture where relevant: controller or route layer for transport, service layer for business rules, repository or data layer for persistence access, and helper or type modules only when they have a clear single purpose.
25. Prefer creating a new focused file over extending an already large or noisy file, but only when the new file has clear ownership and naming.
26. Aim to keep new files reviewable and compact; if a file is growing toward a large mixed-responsibility surface, stop and move the new concern into an app-owned module before it becomes hard to maintain.
27. Every new file must have an obvious ownership boundary, predictable name, and direct import path; avoid vague utility dumping and hidden cross-app coupling.
28. For upcoming UI work, preserve the existing design system, behavior, UX flow, naming, and product nature; new implementation must use the established system instead of inventing a parallel one.
29. Do not create a new concept, shared abstraction, engine layer, naming system, or repo-wide pattern for new code unless the user explicitly approves it first.
30. Write upcoming code so the repository becomes easier to maintain and easier to open source later, with strong developer experience, clear module boundaries, and minimal hidden behavior.
31. For all upcoming backend-facing UI work, add clear technical-name badges to the outer shell or refactor target surface so future agents and maintainers can identify the exact page, section, block, or shell without ambiguity.
32. Technical names must be attached in a reasonable outer-shell manner only; do not spam inner sub-elements such as content wrappers, labels, helper text, or minor controls unless explicitly requested.
33. When a shared block or shell already has a stable generic technical name such as `block.master-list.filters`, preserve that shared name instead of inventing a page-specific override unless the surface has distinct business ownership.
34. When a screen has business-owned surfaces beyond shared blocks, assign explicit names such as `page.*`, `section.*`, `card.*`, or `shell.*` on the real refactor boundary that a future agent should edit.
35. Technical-name badges must remain visually lightweight, must not break layout, and should sit on the shell edge in a way that keeps the UX intact while still being easy to inspect and copy.
36. Any new technical-name badge rendered in UI must support straightforward developer use, including easy text selection or click-to-copy when the shared badge component is used.
37. If developer visibility depends on a runtime toggle, the toggle must work immediately in the current browser session whenever practical; do not require a restart for purely frontend inspection aids unless there is no safe alternative.
38. Before adding new UI shells or major reusable blocks, decide and encode the technical name at implementation time rather than leaving the surface unnamed for later cleanup.
39. Keep `ASSIST/` lean and development-focused; remove stale scratch plans, completed archives, and obsolete notes instead of treating them as permanent instructions.

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
2. Record the active reference in `ASSIST/Execution/TASK.md` when the batch is being tracked through execution docs.
3. Record scope, assumptions, and validation in `ASSIST/Execution/PLANNING.md` when the batch is being tracked through execution docs.
4. Implement the smallest boundary-correct change.
5. When building with known design-system components, resolve the component name and default variant from `apps/ui/src/design-system/data/project-defaults.ts` before writing UI code, and prefer `apps/ui/src/registry`, `apps/ui/src/registry/blocks`, and `apps/ui/src/components/blocks` for reusable shared UI compositions.
6. Run `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` when relevant.
7. Update docs and changelog in the same batch.
8. Report what changed, what remains, and any residual risks.
