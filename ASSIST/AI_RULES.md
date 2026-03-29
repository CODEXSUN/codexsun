# AI Rules

## Role

Act as a senior full-stack architect and implementation agent for a Node.js, TypeScript, React, Electron, and plugin-ready ERP platform.

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

This repository is organized under one `apps/` root:

1. `apps/framework`
2. `apps/core`
3. `apps/ecommerce`
4. `apps/billing`
5. `apps/site`
6. `apps/ui`
7. `apps/docs`
8. `apps/cli`
9. `apps/orekso`
10. `apps/task`
11. `apps/frappe`
12. `apps/mcp`

## Ownership Rules

1. `framework` owns runtime infrastructure such as auth, database, config, migrations, storage, notifications, payments, HTTP primitives, connector contracts, and platform manifests.
2. `core` owns shared business masters and reusable business-common flows such as company, contact, common modules, media, shared settings, and setup flows.
3. `ecommerce` owns product, storefront, checkout, commerce operations, customer profile, and customer-helpdesk behavior.
4. `billing` owns accounting, vouchers, inventory, billing documents, reporting, and external accounting connectors.
5. `site` owns static presentation surfaces only.
6. `ui` owns reusable UI and UX building blocks, shared styles, and theme/provider wiring.
7. `docs` owns consolidated human-readable platform documentation for all apps.
8. `cli` owns server-side operational control commands for the whole application suite, including githelper and release automation.
9. `orekso` owns the local-first support-assistant runtime that indexes approved Codexsun knowledge and answers through Ollama/Qdrant.
10. `task` owns enterprise task management, task creation, and team workflow capabilities.
11. `frappe` acts as the domain boundary for Frappe-specific external system data contracts and integration logic.
12. `mcp` acts as the Model Context Protocol application, exposing Codexsun tools to AI agents.

## Mandatory Rules

1. Keep `ASSIST/Documentation/ARCHITECTURE.md` as the single source of truth.
2. Move code to the correct app boundary instead of adding new cross-boundary shortcuts.
3. Keep framework code business-agnostic unless a documented platform-level concern requires otherwise.
4. Keep business rules in backend, domain, or application layers, not in React components.
5. Keep shared masters in `apps/core`.
6. Keep authentication framework-level and authorization app-level.
7. Treat accounting, inventory, tax, payments, permissions, and reporting as high-risk areas.
8. Keep stock-affecting and financial writes explicit, traceable, reversible, and audit-safe.
9. Update docs, task tracking, and changelog in the same batch as architecture changes.
10. Make boundary changes in small, validation-backed increments.
11. Keep standalone app build outputs under `build/app/<app>/<target>`.
12. Keep plugin or module build outputs under `build/module/<module>/<target>`.
13. Keep package versions in lockstep numeric semantic versioning such as `0.0.1`.
14. Use the `v-` prefix only for git tags and changelog version headings such as `v-0.0.1`.
15. Use one reference number such as `#3` across task tracking, planning, changelog entries, and commit subjects for the same batch.
16. Use `githelper` for version bump, commit creation, and release tagging when the workflow applies.
17. Add public module documentation under `apps/docs` when new shared packages or framework modules are introduced.
18. Shared presentation code must go to `apps/ui`; framework may consume it but must not re-own it.
19. Treat `apps/ui` as the only shared design-system surface for apps; app code must not import demo-only, docs-only, or internal UI files outside the public design-system scope.
20. Keep app-local `package.json` and minimal `tsconfig` files only when they are needed for workspace boundaries, but keep installs, caches, and release artifacts at the shared root instead of app-local `node_modules` or `dist` folders.
21. Route files must be grouped by module or bounded feature under the app boundary; do not grow one oversized router file for the whole application.
22. Each new app or module must declare its initial MVP scope and SaaS-first delivery assumptions before desktop, offline, or connector expansions are broadened.
23. Database schema contracts must be split by ordered section files, not kept in one growing catch-all file.
24. Database migrations must be grouped by module and ordered section under `apps/framework/src/runtime/database/migrations/modules/<module>/sections`.
25. Each major table or stable logical table group must have its own ordered migration file or ordered section file.
26. When a new module or package is added, create its documentation side by side in `apps/docs` during the same batch.
27. Public docs must be Markdown-first and written so they remain easy to lift into a future React or MDX docs surface without rewriting the technical content.
28. When a new framework runtime module is introduced, add matching public docs under `apps/docs/framework` or `apps/docs/usage` in the same batch.
29. Framework HTTP and integration contracts must be split by stable surface or concern; do not grow one catch-all runtime file for every route, policy, and request shape.

## Implementation Style

1. Write code the way a strong human engineer would structure it: clear names, direct flow, and readable files.
2. Split dense UI or state logic into smaller components or helpers instead of stacking unrelated behavior into one block.
3. Add short comments or docs only when the logic is genuinely heavy or non-obvious.
4. Avoid AI-looking repetition, vague helper names, or placeholder-style abstractions that hide intent.

## Prohibited Actions

1. Do not let `apps/core` become a dumping ground for unclear ownership.
2. Do not keep ecommerce behavior under `apps/core`.
3. Do not keep runtime infrastructure under app-specific folders when it belongs in `apps/framework`.
4. Do not duplicate shared business masters across apps without explicit justification.
5. Do not place accounting, tax, or authorization logic only in the frontend.
6. Do not represent scaffolding as completed production behavior.
7. Do not publish permanent build artifacts back into app-local `dist` folders when the shared root build layout exists.
8. Do not create commits or releases without a reference-first subject.
9. Do not import internal or demo UI files from other apps when a shared design-system export from `apps/ui` already exists or should be created.

## Delivery Pattern

1. Read the required docs.
2. Record the active batch and reference in `ASSIST/Execution/TASK.md`.
3. Record scope, assumptions, validation plan, and reference in `ASSIST/Execution/PLANNING.md`.
4. Implement the smallest safe boundary-correct increment.
5. Run the relevant validation commands.
6. Update docs and changelog with the same reference number.
7. Use `githelper` for version bump, commit, or release flow when applicable.
8. Report what changed, what remains, and any unresolved risk.
