# Changelog

Records CODEXSUN releases, database impact, and completed application changes.

## Version State

Current version: 1.0.43

Release tag: v-1.0.43

Changelog label: v 1.0.43

### 2026-09-25 - Runtime port configuration alignment

- Aligned CRM, Q Cafe, and Auditor environment examples with their registered runtime ports.
- Added missing platform mobile, CXForge, Zetro2, and Zuno host port configuration examples.
- Wired the platform mobile Vite host to `PLATFORM_MOBILE_PORT` and refreshed the application port reference.

### 2026-09-25 - Projex add-on catalog

- Added the authenticated Projex Add-ons page and side-menu entry.
- Added the `projex.addons` API module and `GET /api/v1/projex/addons` catalog endpoint.
- Extended add-on registry manifests with purpose, areas, contracts, and published events for a single catalog source.

### [v 1.0.42] 2026-09-25 - Add-on module and API boundaries

#### Database Changes

- Database update: No schema changes. All add-ons now use the shared repository port with an in-memory development adapter.

#### App Codebase Changes

- Added module-owned provider declarations, module tests, API route contracts, and module README files for all eleven add-ons.
- Added shared `AddonRepository`, `InMemoryAddonRepository`, and protected CRUD route definitions to `@codexsun/addon-runtime`.
- Added purpose-specific backend actions for email, messages, tasks, events, notes, pages, notifications, posts, meetings, pull requests, and workflows.
- Updated each add-on test command to include its module test suite.
- Verification: all add-on type checks and all add-on module and provider tests passed. The full repository boundary audit remains affected by pre-existing unrelated violations.

### [v 1.0.42] 2026-09-25 - Business add-on ecosystem foundation

#### Database Changes

- Database update: No schema, migration, or seeder changes. The current add-on services use in-memory foundation records.

#### App Codebase Changes

- Added nested `packages/addons/*` workspace support and updated the add-on scaffold for `packages/addons/<id>`.
- Added the shared `@codexsun/addon-runtime` provider, service, and frontend workspace contracts.
- Added Mailer, Chatty, Taskez, Calendy, Notez, Wikiz, Notifyz, Socialix, Meety, Gitflow, and Flowix package foundations.
- Added registry manifests and enabled all eleven add-ons in the development profile.
- Added package READMEs, provider tests, agent operating documentation, and the phased task register.
- Verification: registry verification, eleven add-on type checks, runtime type check, twelve focused test suites, provider composition imports, and add-on scoped diff checks passed.
- Limitation: npm lock refresh is blocked by the existing remote `@tailwindcss/oxide-wasm32-wasi` package restriction. Persistence, external adapters, application route composition, and production deployment remain follow-up work.

This changelog starts fresh from the CODEXSUN foundation. Earlier copied application history does not represent this workspace.

New entries must keep database-facing work and application code work separate.

### [v 1.0.42] 2026-09-25 - Registry-driven development runners

#### Database Changes

- Database update: No schema, migration, or seed changes.

#### App Codebase Changes

- Added registry-driven combined `dev:<application>` commands for all registered applications.
- Replaced per-application API and web development scripts with dynamic `dev:api -- --<application>` and `dev:web -- --<application>` loaders.
- Kept desktop and mobile development commands for their native hosts.
- Updated the development runner documentation with the new command format.
- Verification: root package JSON parsing, runner syntax, and scoped diff checks passed. Host startup remains dependent on each configured port being available.

### [v 1.0.42] 2026-09-25 - Consolidated root stack commands

#### Database Changes

- Database update: No schema, migration, or seed changes.

#### App Codebase Changes

- Replaced repeated root test and build script chains with `tools/stack.mjs`, supporting short selectors such as `npm.cmd run test -- --projex`, `npm.cmd run test -- --hrms`, and matching build selectors.
- Consolidated add-on checks and tests behind `npm.cmd run addons -- --<addon>` while retaining registry list and lifecycle operations.
- Added `npm.cmd run dev:zuno` to run the Zuno API and web preflight hosts concurrently.
- Verification: root package JSON parsing, Projex and HRMS stack tests, add-on check, add-on listing, Projex stack build, and combined Zuno launcher preflight were exercised. The combined Zuno smoke was blocked by an existing listener on port 6411; no unrelated process was stopped.

### [v 1.0.42] 2026-09-25 - Projex workspace control plane

#### Database Changes

- Created no shared schema. Projex reads the existing local registry, environment files, application documentation, and app-owned SQLite identity stores without changing their data.

#### App Codebase Changes

- Created `devkits/projex` with the foundation and workspace providers, registry manifest, development profile wiring, authenticated workspace snapshot route, and scoped agent documentation.
- Added the Projex dashboard for overview, project stages, running/configured hosts, ports, providers, and documentation inventory.
- Added `registered`, `configured`, and `running` stage reporting for every registry host, including API, web, desktop, and mobile host kinds.
- Added local Projex API/web environment wiring on ports 6360/6361 and documented the authenticated layers, storage boundary, commands, and verification workflow.
- Reinitialized the local Projex identity database from the current local seed values, preserved the prior SQLite files as a local backup, and left development auto-login enabled with seed refresh disabled.
- Projex runtime composition is intentionally limited to its platform, foundation, and workspace providers so the control plane remains usable while unrelated optional add-on packages are incomplete.
- Verification: Projex type checks, lints, tests, app registry verification, root-layout validation, authenticated workspace snapshot, API health, web HTTP smoke, and web-to-API proxy health passed. The MariaDB integration test remains skipped without an integration URL.

### [v 1.0.42] 2026-09-25 - New application identity, SQLite storage, and local runtime wiring

#### Database Changes

- Created local development SQLite identity stores for Ecommerce, HRMS, Billing, Accounts, Auditor, and Garments under `storage/apps/<application>/private/data/`.
- Each store initialized five identity migrations, fourteen identity tables, and three development seed users.

#### App Codebase Changes

- Added ignored API and web `.app.env` files for all six applications with local ports, API origins, identity settings, and development credentials.
- Aligned root `.env` and `.env.example` entries with the application ports and web/API URLs.
- Moved Auditor to ports 6340/6341 because Codeitz already owns 6320/6321.
- Verification: all twelve preflight checks, six API health checks, six web HTTP smoke checks, and SQLite identity queries passed.

### [v 1.0.42] 2026-09-25 - Ecommerce, HRMS, Billing, Accounts, Auditor, and Garments application foundations

#### Database Changes

- Database update: No schema, migration, or seed changes.

#### App Codebase Changes

- Created six business application foundations under `apps/`: `ecommerce`, `hrms`, `billing`, `accounts`, `auditor`, and `garments`.
- Registered API and web hosts, foundation providers, development profile providers, root workspace scripts, Turbo build outputs, package-lock entries, and MDI catalog entries for each app.
- Added an explicit generated API configuration return type to prevent TypeScript TS2742 errors in new application scaffolds.
- Verification: application registry, app-CLI tests, root-layout check, focused typechecks, focused lints, and generated API/web test commands passed. MariaDB integration checks remain skipped without an integration URL; generated web hosts currently have no test files.

## v-1.0.43

### [v 1.0.43] 2026-09-25 10:25 am - Q Cafe Phases 7 to 9 and single design system

#### Database Changes

- Database update: Yes (manual).
- Q Cafe QC-0701–0705: appended `qcafe.documents.001`–`005` for documents, printer profiles/routes, print jobs/attempts with idempotency keys, preview confirmations, dispatch decisions, delivery consents, and channel deliveries.
- Q Cafe QC-0706: appended `qcafe.backup.001` for desktop data folders, backup schedules, checksum-recorded backups, and restore checks.
- Q Cafe QC-0801–0802: appended `qcafe.sync.001` for device profiles, the sequenced change log, per-device cursors, and conflict records; no schema change for the push/pull session.
- Q Cafe QC-0803–0804: appended `qcafe.marketplace.001`–`002` for partners, menu mappings, idempotent intake, events, settlements, POS order links, and delivery fulfillments.
- Q Cafe QC-0805: appended `qcafe.accounting.001` for the 8-account chart, balanced journals, and journal lines, plus a one-word coordinated change adding the `journal` number-sequence kind.
- Q Cafe QC-0901–0903: no new tables; the reports module reads posted records and the policies module is stateless. Full clean-database dry run applied 29 migrations and verified 32 ledger records with zero mismatches (see `assist/records/2026-09-24-qcafe-migration-dryrun.md`).

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.43.
- Q Cafe Phase 7 (QC-0701–0706): new `qcafe.documents` module (durable documents, printer profiles/routes, idempotent print jobs, preview confirmations, adapter dispatch with fallbacks, consent-gated email/WhatsApp delivery) and new `qcafe.backup` module (data folders, schedules, checksum backups, restore drills, recovery instructions).
- Q Cafe Phase 8 (QC-0801–0805): new `qcafe.sync` module (devices, change log, cursors, explicit conflict resolution, push/pull session) and new `qcafe.marketplace` module (official adapter contracts, idempotent intake, fulfillment, reconciliation); new `qcafe.accounting` module per the approved statutory contracts in `assist/records/2026-09-24-qcafe-accounting-contracts.md` (8-account chart, balanced draft-then-post journals, CSV export).
- Q Cafe Phase 9 (QC-0901–0905): new read-only `qcafe.reports` module (nine posted-record reports with location/business-day scope plus five linked dashboard alerts); new stateless `qcafe.policies` module (cashier/waiter/kitchen/manager/owner matrix enforced on money-sensitive billing endpoints with HTTP 403 denials); legacy ledger-count tests now derive expectations from `lifecycleDescriptorTotal()`; release evidence in `assist/records/2026-09-25-qcafe-release-verification.md`.
- Single design system: extended shared `Field` with an optional `label` variant (no new components), deleted all 15 app-local form helper copies and raw select/button/table elements in favor of shared `Field`, `NativeSelect`, `Table`, `Checkbox`, `Button`, and `Empty`; added seven operator screens (Inventory, Documents, Backup, Sync, Marketplace, Accounting, Reports) composed from published `@codexsun/ui` exports with API workspace registration.
- Marked QC-0701 through QC-0905 complete in `apps/qcafe/agent/exec/qcafe-task.md`; the register holds no unchecked items.
- Verification: `qcafe-api` typecheck, full suite 62 passed / 0 failed (1 MariaDB opt-in skip), ESLint, production build; `qcafe-web` typecheck, ESLint, production build; `@codexsun/ui` typecheck and lint; `git diff --check` clean for touched areas. Browser E2E, live MariaDB, Docker, and production were not tested.

## v-1.0.42

### [v 1.0.42] 2026-09-24 8:58 pm - Zetro2 Phase 2 source import, provenance, container build, and Layer-1 product defaults

#### Database Changes

- Database update: No. No schema, migration, or seed changes.

#### App Codebase Changes

- Completed Zetro2 task register items 2.3, 2.4, 2.5, 2.6, and 2.7 in `devkits/zetro2/agent/task.md`.
- 2.3: excluded Git metadata, dependencies, caches, generated output, secrets, and runtime data from the imported ZVcode tree; fixed root `.gitignore` `logs/` over-exclusion for six upstream source files (staged, not committed); `git ls-files` count 9,287.
- 2.4: retained licenses and notices; recorded upstream revision `2418d06f9dc8a0622bb8e8d46a5ff915edbe5845`, raw aggregate checksum `54b13e275e628a301ae2ec40898c0085b3de5a708615bbcc9fe17e3300097c0f` over 9,287 files (146,202,173 bytes), and exactly five local modifications; added `devkits/zetro2/editor/zvcode-manifest.mjs` and `verify-zvcode.mjs` (product identity v1.110.0, distro `bd187e45`).
- 2.5: added host-isolated container build under `devkits/zetro2/.container/` — multi-stage `Editor.Dockerfile` (pinned `node:22.22.0-bookworm@sha256:20a424ec…` base, `toolchain` → `source` → `deps` → `build` → `export`), Dockerfile-specific ignore file, `build-editor.ps1` wrapper, and `.container/README.md` documenting pins, stages, commands, and limitations; default export destination `dist/zetro2/editor/`; in-image-only git init and selfhost extension stubs keep the provenance-locked import unchanged on the host.
- 2.6: added `devkits/zetro2/editor/source-change-map.md` + `source-change-map.json` (layer/risk/verify per path) and `check-change-map.mjs` asserting live upstream diff equals the map; documented optional `upstream-update-procedure.md` (reference-tree refresh, no Git rebase).
- 2.7: applied Layer-1 Product customization in `devkits/zetro2/zvcode` — `product.json` telemetry off; `telemetryService.ts` / `desktop.contribution.ts` defaults off; `workbench.startupEditor` default `none`; status bar brand `Codexsun ZVcode` / tooltip `Zetro2` with `$(remote)` offline-alert prefix preserved; `extensions.allowed` default deny-by-default allowlist of the three built-in marketplace extensions; change map updated to 10 paths (planned 2.7 rows removed).
- Evidence: `devkits/zetro2/agent/baseline/2.3-import-exclusions.md`, `devkits/zetro2/agent/baseline/2.4-licenses-upstream-revision-checksums.md`, `devkits/zetro2/agent/baseline/2.5-container-build.md`, `devkits/zetro2/agent/baseline/2.6-editor-source-customization-change-map-upstream-update.md`, `devkits/zetro2/agent/baseline/2.7-product-branding-default-settings-extension-config.md`.
- Verification: exclusion scans zero across 9,286 files; `node devkits/zetro2/editor/verify-zvcode.mjs` pass; `docker build --check` no warnings; `--target toolchain` and `--target source` smoke builds pass on host-windows (Docker 29.8.0); `node devkits/zetro2/editor/check-change-map.mjs` pass (10 mapped paths after 2.7); `npm run test:zetro2` → 45/45 pass; `git diff --check` clean for Zetro2. Limitation: full `deps`/`build`/`export` compile and artifact version read deferred to task 2.8; 2.7 defaults are source assertions only until live editor proof (2.9); upstream source-update procedure documented but not executed; builtin-extension and Electron/Node header downloads remain network-dependent at build time.

### [v 1.0.42] 2026-09-24 7:40 pm - Zetro2 Phase 1 access foundation exit

#### Database Changes

- Database update: No schema redeploy required. Zetro2 module-owned SQLite migrations (`zetro2.workspace-access.001`/`002`) already run repeat-safely from the module lifecycle plan.

#### App Codebase Changes

- Completed Zetro2 task register items 1.10a and 1.11 (Phase 1 exit) in `devkits/zetro2/agent/task.md`.
- 1.10a: append-only access/action audit with pre-persistence secret redaction and `workspace.admin`-gated audit query (`devkits/zetro2/api/src/modules/workspace-access/`).
- 1.11: added `devkits/zetro2/api/test/workspace-access-phase1-exit.test.mjs` proving the five-role HTTP capability matrix (read, write, membership.manage, workspace.admin, change.approve) and zero upstream proxy hits for unauthenticated, invalid-token, and non-member gateway requests.
- Evidence: `devkits/zetro2/agent/baseline/1.10a-baseline-append-only-audit-and-redaction.md`, `devkits/zetro2/agent/baseline/1.11-phase-1-exit.md`.
- Verification: `npm run test:zetro2` → 45/45 pass on host-windows; `git diff --check` clean for changed Zetro2 files. Limitation: mock upstreams and in-memory SQLite only; Docker, live editor, and browser flows remain Phase 2–3 work.

### 2026-09-24 - AgentCrew local assistant foundation

#### Database Changes

- Added app-scoped SQLite migration `assistant.001` with a recorded SHA-256 checksum for tasks, runs, and operational events.
- Added model-scoped Qdrant collections for explicitly submitted notes. No existing application database was migrated.

#### App Codebase Changes

- Added `devkits/agentcrew` with a bearer-protected API and shared-UI dashboard for Ollama/Qwen 3, task results, logs, connection checks, retries, and notes.
- Added paused-by-default recurring prompts, explicit enable/pause actions, run budgets, cancellation, queue deduplication, and bounded transient retries.
- Added chunked Qdrant retrieval, content-based note IDs, embedding caching, and coding/personal assistant skill templates without execution tools.
- Added loopback-only Docker composition, optional GPU configuration, persistent model/vector/state volumes, and detailed setup and safety documentation.
- Verified API/web checks, lint, builds, seven module tests, and a browser integration flow with fake upstreams. Live inference remains unverified.
- Recorded Docker dependency audit warnings and repository-wide audit limitations in `devkits/agentcrew/verification.md`. Preserved existing version 1.0.42.
- Added manual Ollama setup, update, and drop scripts with explicit model downloads and guarded data purge. No database schema change.
- Added automatic creation or reuse of `codexsun-network` for the web gateway, without exposing model or vector services on that network.
- Renamed AgentCrew Docker resources to `cx-agentcrew` and updated lifecycle scripts, purge confirmation, tests, and migration notes. Existing volumes remain untouched.
- Deployed `cx-agentcrew` locally with Qwen 3 and embeddings. Verified authenticated dashboard connection and Qdrant note retrieval, but recorded the unresolved full-task inference timeout.
- Fixed Docker dashboard navigation defaults using public registry metadata without copying root secrets. No database schema change.

### [v 1.0.42] 2026-09-24 7:10 pm - Codeitz multi-modal capabilities, codebase graph mapping, and Git change tooling

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Implemented Codeitz Capabilities module (`devkits/codeitz/api/src/modules/capabilities/`):
  - 10 multi-modal and automated tools: Prompt spelling correction, web search, browser automation, computer vision, image generation, text-to-speech (TTS), multi-model reasoning, computer use, Excel analysis, and PDF analysis.
  - Zod schemas and type contracts in `capabilities-contracts.ts` mounted at `/api/v1/codeitz/capabilities`.
  - Comprehensive unit test suite in `capabilities.test.ts` (11 passing test cases).
- Implemented Codebase Knowledge Graph service (`devkits/codeitz/api/src/modules/engineering/service/codebase-graph.service.ts`):
  - Traverses monorepo workspace (`apps/`, `devkits/`, `packages/`, `core/platforms/`), extracting nodes, dependencies, and cluster topologies.
  - Exposes `/api/v1/codeitz/swe/codebase-graph` with DAG circularity checks and density scoring for large-scale projects.
- Implemented Git Change Management and Sensible Auto-Commit service (`devkits/codeitz/api/src/modules/engineering/service/git-ops.service.ts`):
  - Provides working tree status, unified diff extraction, conventional commit message auto-generation (`feat(scope): ...` with verification status), and one-click undo (`git restore .`).
  - Endpoints at `/api/v1/codeitz/swe/git/status`, `/api/v1/codeitz/swe/git/diff`, `/api/v1/codeitz/swe/git/auto-commit`, and `/api/v1/codeitz/swe/git/undo`.
- Upgraded Codeitz Web Desk (`devkits/codeitz/web/src/app.tsx` & `codeitz-api.ts`):
  - Real-time prompt spellchecking banner with one-click "Fix Prompt" action.
  - Multi-modal capability pills in composer toolbar (Web, Browser, OS, Gen, Attach).
  - Multi-file attachment support for Vision (images), Excel (.xlsx/.csv), and PDF documents.
  - Native Web Speech API integration for TTS spoken narration on assistant messages.
  - Multi-model reasoning selector (Gemini 3.8 Flash, Gemini 1.5 Pro, Claude 3.5 Sonnet, GPT-4o, DeepSeek-R1, and Multi-Model Consensus with confidence badge).
  - Codebase Architecture Graph Drawer with module filtering and search.
  - Git Manager Drawer with diff review, auto-commit, and one-click AI change rollback.
- Verification: 24 API unit tests passing, 6 Web unit tests passing, TypeScript typecheck clean across API and Web, ESLint clean, and root layout valid.

### [v 1.0.42] 2026-09-24 6:21 pm - Q Cafe Phase 6 inventory and stock ledger

#### Database Changes

- Database update: Yes (manual).
- Q Cafe QC-0601: appended `qcafe.inventory.001` with stock units, items, adjustments, and the source-linked movement ledger.
- Q Cafe QC-0602: appended `qcafe.inventory.002` with recipe revisions (effective dates, revision numbers, source links) and recipe components.
- Q Cafe QC-0603: appended `qcafe.inventory.003` with daily plans (unique per location and date) and demand-sourced plan lines.
- Q Cafe QC-0604: appended `qcafe.inventory.004` with stock reservations for events, plans, specials, and orders.
- Q Cafe QC-0605: appended `qcafe.inventory.005` with purchase orders, goods receipts, stock lots, stock counts, and waste events; appended `qcafe.inventory.006` to rebuild the movement ledger without the adjustment-only source foreign key while preserving rows.
- Q Cafe QC-0606: appended `qcafe.inventory.007` with recipe consumption records for sales and events.
- All seven descriptors run serially in the single `qcafe.inventory` lifecycle plan. No seeders were added.

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.42.
- Q Cafe QC-0601: unit/item/adjustment contracts, repository, service, routes (`/inventory`, `/units`, `/items`, `/adjustments`), and ledger tests. Reductions need an approver; untracked items cannot move.
- Q Cafe QC-0602: recipe create/revise contracts, service, routes (`/recipes`, `/recipes/:id/revisions`), and revision-history tests.
- Q Cafe QC-0603: daily plan create/line/confirm service, routes, and demand-source tests.
- Q Cafe QC-0604: reservation hold/release/consume service, routes, availability (`on-hand`, `reserved`, `available`) in the workspace, and hold tests.
- Q Cafe QC-0605: purchase order, goods receipt with lot assignment, stock lot, stock count, and waste service plus routes and procurement tests.
- Q Cafe QC-0606: recipe consumption for sales and events with availability enforcement, consumption route, and sale/event traceability tests.
- Split inventory persistence into `inventory.repository.ts` and `inventory-procurement.repository.ts` so every authored file stays within the 700-line limit.
- Marked QC-0601 through QC-0606 complete in `apps/qcafe/agent/exec/qcafe-task.md` and documented each stage in the inventory module README.
- Verification: `qcafe-api` typecheck, 13 inventory tests passed, ESLint, production build, and `git diff --check` clean for `apps/qcafe`. Browser E2E, live MariaDB, Docker, and production were not tested.

## v-1.0.41

### [v 1.0.41] 2026-09-24 5:47 pm - Release workflow and line-ending normalization

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.41.
- Increased the Git file-list buffer used by the line-ending tool so large workspaces no longer fail with `spawnSync git ENOBUFS`.
- Preserved file bytes during LF normalization and skipped legacy files that are not valid UTF-8.
- Set the repository-local Git policy to `core.autocrlf=false` and `core.eol=lf` to match `.gitattributes`.
- Completed Q Cafe daily-plan repository, service, and route behavior for scoped plan creation, line additions, confirmation, and inventory reads.
- Implemented Codeitz prioritized Task Queue, Scheduler, Continuous Task Runner, and live execution history in `devkits/codeitz`:
  - Added `SweTaskRunnerService` with prioritized task queues (`critical`, `high`, `medium`, `low`), background scheduler, continuous auto-progress loop, and action audit trail.
  - Exposed Fastify endpoints for queue management (`/swe/queue`, `/swe/queue/enqueue`, `/swe/queue/:taskId`), runner execution control (`/swe/runner/start`, `/swe/runner/pause`, `/swe/runner/step`, `/swe/runner/continue/:taskId`), and live action audit logs (`/swe/runner/logs`).
  - Enhanced Codeitz Chat to Action frontend with interactive pipeline phase stepper (`intake` → `grounding` → `planning` → `execution` → `verification` → `review` → `completed`), runner status indicator, continuous auto-runner toggle, task queue manager, and live audit telemetry stream ("what exactly is going on").
  - Added shortcut `⌘⏎` / `Ctrl+Enter` and interactive `[Continue Runner ⌘⏎]` buttons on action confirmation cards and completion reports to automatically advance the runner to next phases and queued tasks.
- Verification: line-ending tests and the line-ending check passed; commit and push are part of this release operation.

## v-1.0.40

### [v 1.0.40] 2026-09-24 5:36 pm - working on all apps

#### Database Changes

- Database update: No (manual).
- No database migrations, schema alterations, or seed changes introduced for Codeitz bootstrap.

#### App Codebase Changes

- Created `devkits/codeitz` application as per repository standard with `@codexsun/codeitz-api` (port 6320) and `@codexsun/codeitz-web` (port 6321), registered under task prefix `k`.
- Implemented autonomous Agentic Software-Engineering system inside Codeitz with dedicated modules:
  - `foundation`: application lifecycle, health reporting, and platform runtime wiring (`codeitz.foundation`).
  - `engineering`: phased SWE execution pipeline (`intake`, `grounding`, `planning`, `execution`, `verification`, `review`, `completed`), orchestrator service, and gated verification checks (`codeitz.engineering`).
  - `learning`: self-learning episodic memory bank, retrospective error diagnosis, pattern/anti-pattern classification, and heuristic retrieval/reinforcement (`codeitz.learning`).
  - `skills`: dynamic agent skill registry, validation harness, and automatic distillation of verified trajectories into `SKILL.md` documents (`codeitz.skills`).
- Built interactive Codeitz Web Desk composing `@codexsun/ui` layout with SWE pipeline stepper, self-learning memory bank, and skill distillation studio.
- Added repository-level self-learning skills in `.agents/skills/`:
  - `agentic-swe-pipeline`: disciplined multi-phase software engineering loop.
  - `swe-self-learning`: retrospective analysis, root cause diagnosis, and heuristic synthesis.
  - `codeitz-skill-distiller`: formalization of repeatable patterns into standardized agent skills.
- Registered Codeitz in `core/registry/applications/codeitz.json`, `core/registry/profiles/development.json`, and root scripts.
- Verification: all Codeitz API and Web test suites passed (13 total passed, 1 skipped); zero architecture and module boundary violations.

## v-1.0.39

### [v 1.0.39] 2026-09-24 11:21 am - DOCX repository documentation viewer and documentation standards

#### Database Changes

- Database update: No (manual).
- Q Cafe QC-0601: added append-only `qcafe.inventory.001` for stock units, items, adjustments, and source-linked movement ledger.

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.39 and synchronized workspace manifests and the lockfile.
- DOCX API: added authenticated repository Markdown discovery with dependency, build, Git, and vendored editor exclusions; no database migrations or schema changes.
- DOCX web: replaced sample content and authoring controls with an application-grouped Markdown library, content search, preview/source modes, document links, copy-link and download actions, and 15-second library refreshes.
- Kept filtered navigation synchronized when the document library loads or refreshes; added catalog grouping and relative-link tests.
- Corrected the DOCX Vite React source matcher to use the devkits path.
- Documented Markdown heading and indexing conventions, DOCX runtime behavior, and application port assignments.
- Verification: DOCX tests passed (five passed, MariaDB integration skipped); web type check, API/web lint and builds, version alignment, and changed-file whitespace/LF checks passed.
- Known verification limits: API type check reports four existing TS2835 import-extension errors; repository-wide line-ending tooling fails with Git ENOBUFS, so LF verification was scoped to changed source files. Browser E2E and live deployment were not tested.
- Q Cafe QC-0601: added inventory unit/item/adjustment contracts, repository, service, routes, lifecycle wiring, and focused ledger tests; verification: qcafe-api typecheck, inventory tests (2 passed), lint, build, and `git diff --check` passed.

## v-1.0.38

### [v 1.0.38] 2026-09-24 7:30 am - Zetro2 bootstrap, Zbrowser preview ports, and tmnext preview domains

#### Database Changes

- Database update: No (manual).
- No migrations, schema changes, or seed updates in this version.

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.38.
- Editor: added `.vscode/extensions.json` recommending `codexsun.zcode-os`.
- Vite: allowed `.tmnext.in` hosts across CRM, HIMSX, LMS, Q Cafe, Sites, Docx, Orship, Zetro, UIUX, Zuno, platform, and ZVcode web/desktop/mobile configs.
- Zcode remote previews: added `ZCODE_PREVIEW_BIND_HOST`, `ZCODE_PREVIEW_PUBLIC_HOST/SCHEME`, `ZCODE_PREVIEW_URL_TEMPLATE` (`https://{port}.tmnext.in/`), and `ZCODE_PREVIEW_ALLOWED_HOST` examples; made Compose preview bindings configurable while keeping `127.0.0.1` defaults.
- Zcode Compose/Zbrowser: published fixed Zetro2 preview port `6155` (`ZCODE_ZETRO2_PREVIEW_PORT` / `ZBROWSER_ZETRO2_PORT`), added `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS`, and kept UIUX on `6133` plus `6140-6148` for other apps.
- Zbrowser catalog: replaced sequential port assignment with fixed `preview-ports.json` reservations by app ID; added API/web port reporting, `--strictPort` startup, and updated catalog/runner/server tests.
- Codexsun OS: added shared `preview-url.js` resolution (template/host/scheme override), API/Web/Zbrowser open actions with configured `apiPort`/`webPort`/`zbrowserPort`, and `preview-url` plus action tests.
- Zetro2 bootstrap: added registry entry, API health service on `6300` (`/api/v1/zetro2/health`), standalone web on `6310` with API proxy, root `dev:zetro2-api/web` and `test:zetro2` scripts, and documented Zbrowser preview on `6155`.
- Zetro2 planning: completed baselines `0.2` upstream inventory, `0.3` chat/tools, and `0.4` Copilot comparison; advanced next task from `0.2` to `0.5`.
- Verification: live editor/API/proxy deployment, full test suite, and browser E2E remain pending for this working tree.

## v-1.0.37

### [v 1.0.37] 2026-09-24 10:20 am - Workspace progress, deployment controls, and ZVcode source import

#### Database Changes

- Database update: Yes (pending workspace changes; migrations not applied in this review).
- Split CRM lead qualification column additions into separate schema operations for SQLite compatibility.
- Added Orship deployment migration definitions for providers, targets, applications, environments, deployments, events, logs, rollback references, health, and audit records.
- Changed HIMSX container storage from a named data volume to a repository storage bind mount and adjusted database path resolution.
- Added application-specific development role permissions to the shared identity configuration and seed behavior.

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.37.
- Recorded all pending workspace areas in the [dated change log](../records/workspace-v1.0.37-2026-09-24.md), including untracked source and documentation.
- CRM: added customer/contact, lead qualification/conversion, enquiry activity, and communication routes, plus lead workflow controls in the web app.
- HIMSX: documented persistent SQLite storage and added app storage removal to the explicit drop operation. Existing volume migration remains unverified.
- Orship: added a deployment provider interface, Dokploy adapter, MariaDB store, permission-protected routes, deployment UI, and provider tests.
- Orship: added provider configuration, secret-reference wiring, deployment documentation, explicit ESM import extensions, and expanded validation scripts.
- Platform identity: allowed applications to extend development admin and user role permissions without replacing the base permissions.
- ZCode: added named local Compose profiles, host preview-port mapping, profile validation, lifecycle script support, and catalog tests.
- ZCode and Zetro2: added phased task registers, separate agent-run history, task context, executable acceptance plans, Memory Bank, and governed automation designs.
- Zetro2: copied OpenVSCode source into ZVcode, changed product/package identities, preserved upstream notices, and added focused source verification.
- Zetro2: planned bounded Docker coding, authorized-device access, mobile approval notifications, and critical-action approval gates. Runtime implementation remains pending.
- Local evaluations: added Dokploy container wrappers and a Gitpod Classic preview wrapper. Updated ignore rules for temporary sources and local secrets.
- Publication: the user approved keeping the repository public. Private runtime access remains a separate requirement; upstream license obligations remain unchanged.
- Verification: version alignment and ZVcode source checks passed. All three Zbrowser catalog tests passed. Working-tree whitespace checks passed with a CRLF warning.
- Live deployment, editor compilation, complete application tests, database upgrades, and browser E2E checks were not performed in this review.

## v-1.0.36

### 2026-09-24 - Unattended Zetro2 coding and roaming approvals

#### Database Changes

- None. Planning only.

#### App Codebase Changes

- Defined bounded Docker coding profiles that preauthorize routine work and reserve approval for critical actions.
- Planned authorized-device access, a durable approval inbox, mobile notification delivery, and exact-action resume.
- Added backend conformance, zero-routine-prompt, offline delivery, concurrent decision, and recovery acceptance checks.

### 2026-09-24 - ZVcode editor source import

#### Database Changes

- None.

#### App Codebase Changes

- Copied OpenVSCode source into devkits/zetro2/zvcode without changing the source folder.
- Set ZVcode product, server command, package, data directory, and protocol identities.
- Preserved upstream notices and documented build boundaries and pending runtime wiring.
- Added focused branding/package/notice verification and updated Zetro2 documentation paths.

### 2026-09-24 - Zetro2 private coding environment plan

#### Database Changes

- None. Documentation only.

#### App Codebase Changes

- Established Zetro2-owned planning documents under devkits/zetro2/agent.
- Defined copied and directly customized OpenVSCode source, app-owned Zbrowser,
  and the web-plan, agent-code, private-preview, human-feedback workflow.
- Planned a private Docker environment with persistent development checkout,
  authenticated ingress, preview isolation, and separate control-service code.
- Preserved existing ZCode documents and upstream license obligations.

### 2026-09-24 - ZCode daily coding architecture and task plan

#### Database Changes

- None. This update changes planning documents only.

#### App Codebase Changes

- Refined the ZCode plan and numbered task register for identity-first workspace
  access, an imported OpenVSCode source build, and shared multi-provider chat.
- Planned OpenCode and OpenHands backends, LangGraph workflow ownership,
  language intelligence, skills, MCP, Playwright, and isolated computer use.
- Added phased E2E acceptance for permissions, coding, recovery, and upgrades.
- Extended the plan with project hierarchy, complete task records, board/status
  mapping, dependency and review gates, and criterion-linked execution evidence.
- Added Phase 3A and TASK-1024 lifecycle fixtures to the implementation register.
- Separated task intent from run-owned activity and added context composition,
  executable acceptance criteria, typed dependencies, engineering board views,
  and human/agent assignment with preserved attempt history.
- Planned approved task.md execution by selected phase and order, with durable
  progress, bounded retries, evidence-backed checkboxes, and scope-change checks.
- Added mobile/laptop API triggers, asynchronous status and controls, scoped
  approval, retry deduplication, and cross-device verification tasks.
- Planned shared automation templates, cross-repository/team workflows,
  organization policies, usage budgets, audit coverage, and automated review.
- Extracted detailed automation design into a linked document and added
  Phases 13–16 with explicit team-automation acceptance checks.
- Reviewed execution order, moved organization controls before team sharing,
  and scheduled fixtures, persistence, and backend contracts before their consumers.
- Clarified early fixture coverage, live integration gates, mandatory reliability,
  optional computer-use deferral, and final M0–M4 completion evidence.
- Added the Memory Bank design and Phase 3B for reviewed project documentation,
  provenance, stale-content checks, scoped retrieval, export, and recovery.
- Added context/run integration and final knowledge E2E checks; clarified early
  audit requirements and exclusion of examples from executable task checklists.

### [v 1.0.36] 2026-09-23 7:32 pm - remote MCP and Logicx SSH operations

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.36.

## v-1.0.35

### [v 1.0.35] 2026-09-23 10:50 am - working on new zcode editor

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.35.
- Added app-owned Docker deployments for CRM, HIMSX, LMS, and Sites. Each
  deployment includes production API and Nginx web images, SQLite identity
  preparation, persistent data and backup volumes, setup/update/verify/drop
  scripts, health checks, and restart-persistence verification.

## v-1.0.34

### [v 1.0.34] 2026-09-22 2:14 pm - Q Cafe browser compatibility and container access

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.34.
- Made Q Cafe's development auto-login unavailable from production builds.
- Added a shared RFC 4122 v4 correlation-ID helper with compatibility fallbacks
  for browsers that do not implement `crypto.randomUUID`.
- Updated Q Cafe booking, foundation, menu, POS, and settings requests, plus
  shared browser session IDs, to use the compatibility helper.
- Exposed Q Cafe development and local container web ports on all interfaces
  to allow access from the host network.

## v-1.0.33

### [v 1.0.33] 2026-09-21 1:35 pm - Zetro container development lifecycle

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.33.
- Added a Zetro multi-stage Docker build, Compose stack, Nginx API proxy, API
  and web health checks, and loopback-only published development ports.
- Added Zetro setup, update, and drop scripts. Setup creates or reuses the
  shared external `codexsun-network`; drop retains SQLite data unless invoked
  with `--purge`.
- Added an explicit container-only API listener setting so the web container
  can reach Zetro without relaxing the default local loopback restriction.
- Documented Zetro container development, retained SQLite storage, and Zuno
  connectivity configuration.

## v-1.0.32

### [v 1.0.32] 2026-09-20 10:40 pm - working on cxforge

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.32.
- Added the Q Cafe SQLite container deployment with production API and Nginx
  images, explicit migration and identity preparation, persistent data and
  backup volumes, guarded setup/update/drop scripts, health checks, and
  restart-persistence verification.

## v-1.0.31

### [v 1.0.31] 2026-09-20 8:34 pm - Complete auto-login desk wiring

#### Database Changes

- Database update: Yes (manual).
- Added `qcafe.settings.001` for runtime policy and safe connector metadata.
- Added the append-only `qcafe.menu.002` migration. It completes the M01-M15
  Menu schema for catalog hierarchy, scoped price books, campaigns, modifiers,
  storage-backed media metadata, availability windows, and allergens.
- Applied and SHA-verified all seven Q Cafe lifecycle records on the configured
  SQLite and MariaDB databases.

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.31.
- Completed shared `AUTO_LOGIN_DESK` wiring for all identity-enabled apps.
- Added explicit configuration return types to every app API so the shared
  identity configuration remains portable under TypeScript project checks.
- Verified all nine identity-enabled API projects compile with the selected
  auto-login desk configuration.
- Restricted development auto-login to the requested desk from each browser
  tab. Opening another desk now requires its normal login flow.
- Added the auto-login desk header to API CORS allowlists and generated app
  servers.
- Added the Q Cafe Settings provider, database lifecycle diagnostics,
  persisted cloud-sync policy, connector registry, and correlated audit events.
- Added dedicated Database, Cloud sync, and Connectors pages behind the fixed
  Q Cafe sidebar Settings entry.
- Preserved the shared MDI feature switches on a dedicated Workspace settings
  page and kept them wired to the existing persisted interface state.
- Added typed Kysely records for the complete Menu schema, expanded menu items
  with the packaged type, and retained the existing effective-price behavior.
- Added migration coverage for all M01-M15 tables and repeated-run idempotency.
- Added Platform Storage-backed Menu image uploads, authenticated image reads,
  SHA-256 metadata, MIME signature validation, item assignments, and activity events.
- Added a Menu image manager with private authenticated thumbnails and usage,
  dimensions, ordering, and checksum details.
- Added M13 Menu availability commands and effective-rule lookup by outlet,
  service channel, variant, and time window, with correlated activity events.
- Added a shared availability guard for future POS order entry and a Menu
  manager panel for scheduled unavailable periods and available overrides.
- Added M08-M10 modifier groups, options, price adjustments, and idempotent
  item or variant assignments with manager APIs and audit events.
- Added M14-M15 allergen masters and idempotent item or variant declarations,
  plus a tabbed Modifiers and Allergens manager workspace.
- Added the `qcafe.menu.saleability.v1` decision contract and reusable POS guard
  for catalog, outlet, channel, price-book, effective-price, availability, and
  required-modifier validation with stable blocking reason codes.
- Added the Menu manager saleability checker for item, variant, outlet,
  service-channel, price-book, and sale-time diagnostics.
- Added focused Menu rejection and boundary coverage for inclusive price dates,
  owner-scoped duplicate codes, inactive catalog levels, availability start and
  end semantics, and invalid cross-outlet service-channel rules.
- Completed M06-M07 campaign pricing with business or outlet scope, schedules,
  priorities, fixed or percentage rules, usage limits, audit events, and
  deterministic duplicate-target rejection.
- Integrated campaign pricing into the authoritative saleability result while
  preserving the normal price as the audit baseline, and added the Campaign
  pricing manager workspace with effective promotional amounts.

## v-1.0.30

### [v 1.0.30] 2026-09-20 8:30 pm - Configurable development auto-login desk

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.30.
- Added `AUTO_LOGIN_DESK` to the shared identity configuration. It accepts
  `user`, `admin`, or `super-admin` and selects exactly one development desk.
- Kept auto-login development-only. Production ignores auto-login settings.
- Added the variable to every installed app environment example, local app
  environment, and the application scaffold template.
- Added coverage proving auto-login uses only the configured desk seed.

## v-1.0.29

### [v 1.0.29] 2026-09-20 8:18 pm - Repository flow verification and migration gate cleanup

#### Database Changes

- Database update: Yes (manual).
- Added SHA-recorded Q Cafe activity and Menu migrations for audit events,
  categories, items, variants, price books, and effective-dated prices.

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.29.
- Verified the framework, Platform Core, Platform API, Platform Web, UI,
  Zetro, Zuno, desktop, mobile, CLI, module, boundary, architecture, and
  build test gates.
- Fixed stale worktree and app-build tests that used the removed `docs` scope.
  Both tests now use the registered `qcafe` application scope.
- Removed 55 forbidden generated directories under `apps/temp`. The root
  layout and version alignment checks now pass.
- Confirmed MariaDB integration tests remain opt-in and skip without an
  explicit test database URL.
- Verified DOCX, Q Cafe, CRM, HIMSX, LMS, Sites, and Orship application test
  suites. Each suite passed its available tests.
- Updated Q Cafe Foundation verification fixtures to include the recorded
  activity migration and its lifecycle record.
- Approved Q Cafe platform capability boundaries and added authenticated,
  correlated audit events to Foundation and Menu commands.
- Added the Menu setup API and workspace for categories, items, variants,
  price books, and location or service-channel prices.

## v-1.0.28

### [v 1.0.28] 2026-09-20 - Q Cafe Foundation Setup module

#### Database Changes

- Database update: Yes.
- Added repeat-safe Q Cafe Foundation migrations for businesses, locations,
  business days, service channels, and document number sequences.
- Added Kysely table types and repositories that support local SQLite and
  cloud MariaDB through the platform data-provider contracts.
- Added a repository `DB_DRIVER` switch, explicit Q Cafe SQLite and identity
  storage paths, and a credential-safe smoke verifier for both drivers.
- Added the global `platform_lifecycle_state` recorder with serial migration and
  seeder positions, SHA-256 integrity checks, timestamps, and seeder run counts.
- Added the repeat-safe `qcafe.foundation.seed.001` readiness seeder and a
  legacy migration-state adoption path for existing SQLite and MariaDB stores.

#### App Codebase Changes

- Removed the retired MDI profile theme selector and temporary canvas-end spacer
  prop while keeping the shared theme provider available to application settings.
- Verified the UIUX production chunk split: the largest JavaScript chunk is below
  the documented 400 KB warning budget.

- Revised the Master List gallery to expose four working variants, including the
  restored v4 route with a full-width application header and centered list body.
- Added ITO coverage for Master List desk headers, titles, actions, quick filters,
  column filter rows, table regions, and pagination controls.
- Added delete wiring to the generic gallery preview and documented the new
  Master List variant and ITO layers.

- Added authenticated Foundation Setup read and command APIs for the first
  business and outlet, additional outlets, and business-day opening.
- Added the Business setup workspace with deployment-mode and sync status,
  default service channels, default document sequences, and outlet controls.
- Kept Overview as the first standalone menu, followed by Foundation and the
  Cafe group for POS, KOT, and Booking.
- Added Foundation service and persistence tests and browser-verified the
  desktop and mobile workspace without console errors or horizontal overflow.
- Wired Q Cafe MariaDB mode to the shared root `DB_*` settings instead of an
  application-specific connection URL.
- Added explicit Q Cafe migration and verification commands. Development runs
  lifecycle updates; production startup verifies state and fails closed.

### [v 1.0.28] 2026-09-20 6:28 pm - working on zetro , zuno ,cxforge

#### Database Changes

- Database update: Yes (manual).

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.28.
- Added shared provider contracts for messaging, chat, printing, object storage, search, webhooks, data exchange, localization, secrets, tenant resolution, and workflow transitions.
- Added explicit environment secret resolution, HMAC webhook helpers, and CSV import/export utilities with spreadsheet formula protection.
- Documented capability ownership and adapter boundaries. No vendor credentials, app business schemas, or tenant isolation were added.
- Added one shared MariaDB connection resolver for repository services. It accepts the DB_* settings and keeps app-level DATABASE_URL overrides.
- Moved Platform Identity startup to its Kysely database repository with migration and seed execution in development.
- Added a production migration-state check that refuses to change schema at startup.
- Documented the master-database and per-application-database deployment topology.
- Added optional scoped file and database session/cache providers with secure cookie defaults and migration-backed database tables.
- Extended application-local identity migration records with SHA-256 checksums
  and serial positions. Production now rejects missing or changed identity
  history instead of modifying the database during startup.

## v-1.0.27

### [v 1.0.27] 2026-09-20 - Q Cafe owner module catalog

#### App Codebase Changes

- Added Q Cafe provider declarations for menu, POS, kitchen, booking, inventory, billing, and devices.
- Added Q Cafe module ownership documentation and an application provider catalog test.
- Registered Q Cafe provider declarations through the Q Cafe API composition root.
- Added Q Cafe local SQLite and cloud MariaDB persistence configuration with repeat-safe foundation migrations.

### [v 1.0.27] 2026-09-20 - Master list template

#### App Codebase Changes

- Added reusable Master List and Master Form blocks with configurable fields, table and card views, and create/edit callbacks.
- Added a UIUX Templates section with an interactive Master List preview. Preview records remain in memory; applications own persistence.
- Added Master List v1, v2, and v3 as separate UIUX pages under one expandable side-menu item.
- Updated Master List v2 with the Frappe Desk list structure: compact actions, quick filters, dense selectable rows, activity metadata, and load-more controls.
- Darkened master-list row hover states for clearer scanning and aligned v3 with the v2 Desk-style list layout.
- Removed the temporary page-version switcher from Master List previews and moved the shared workspace-appearance control to the lower edge.
- Replaced dense-list activity metadata with a reusable row action menu for Edit, Suspend, and Delete on Master List v2 and v3.
- Added the reusable StatusBadge component and a separate UIUX Status Template page with colored check-mark states.
- Simplified the Status Template preview to show only distinct badge variants.
- Wired the shared StatusBadge rendering into Master List v1, v2, and v3 status fields.
- Added a separate first filter row below the unchanged Master List v3 column header and removed its top filter strip; v2 keeps the top filters.
- Marked the v3 filter strip as a dedicated first data-table row, separate from the header row.
- Standardized Master List table border colors and changed filter inputs to small rounded corners.
- Matched the v3 filter row bottom border to the light data-row separator.
- Darkened the table header bottom border, removed the filter-row bottom border, and removed visible filter placeholders.
- Hid the UIUX topology-inspection button and positioned the workspace-appearance control above the status bar.
- Replaced the UIUX workspace-appearance button with the ITO inspection control.
- Moved the ITO control down to sit just above the status bar.
- Shifted the ITO control slightly left for clearer visibility.
- Removed the shared theme/appearance button and wired ITO visibility to MDI workspace settings for all apps and forms.
- Removed page variant cards and their theme/default controls from the UIUX page documentation preview.
- Added global status variants for draft, open, won, lost, pending, processing, failed, cancelled, archived, suspended, queued, attention, and idle, with spacing around the Status Template preview.
- Added Master List v4 with the v1 table and its title and New action moved into the application header.
- Adjusted the v4 application header to sit flush with the preview top edge, added its bottom border, and spaced the search strip below it.
- Scoped ITO inspection to the active template preview canvas so only its boundary and metadata are shown.
- Added current-preview ITO sections for the application header, search strip, data table, and pagination, with highlighted boundaries brought above the preview content.
- Raised the ITO inspector above the preview with a translucent glass surface and backdrop blur.
- Moved the ITO inspector and control into a dedicated transparent overlay layer above the canvas.
- Removed ITO backdrop blur and restored the visible current-preview component names in the inspector list.
- Moved ITO borders into a top overlay layer and matched each border hue to its component badge.
- Standardized all ITO markers and highlight borders to the shared purple accent.
- Added per-section copy buttons to the ITO sidebar for copying technical names.
- Added a leading icon to the New category action and kept ITO child-section badges on the shared purple accent.
- Added nested ITO entries for title, New button, search bar, column filter, row header, rows, page size, and page navigation.
- Wired nested ITO highlights to the search controls, table header and rows, and pagination controls.
- Improved Master List v4 responsiveness with a wider search bar, status filter menu, icon-only action column, fixed serial/action lanes, and hidden horizontal scrollbar.
- Removed the redundant Master List readiness message from the preview footer.

### [v 1.0.27] 2026-09-19 5:25 pm - Application-local RBAC administration

#### Database Changes

- Added `identity.004`, which stores each identity user's `active` or `disabled` state.
- Disabling a user revokes active server sessions and prevents future authentication.

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.27.
- Added protected, application-local RBAC APIs for users, roles, permissions,
  user-role assignments, and role-permission assignments.
- Added the shared super-admin identity desk using the package-owned Table and
  Form blocks. All installed identity apps now expose its five RBAC pages.
- New application scaffolds include the same protected RBAC API and super-admin
  identity desk.

## v-1.0.26

### [v 1.0.26] 2026-09-19 3:45 pm - App-scoped identity sessions

#### Database Changes

- Added `identity_login_limits`, `identity_password_reset_tokens`, and
  `identity_audit_events` through `identity.003`.
- Login limits, reset-token hashes, audit records, and server sessions now use
  each application SQLite database. No in-memory identity state is used.
- Added app-scoped identity roles, permissions, role assignments, user role
  assignments, and session records.
- Added one server session ID and one browser session ID for each login.
- Development starts identity migrations and optional seed refreshes.
- Production verifies the identity schema. It does not create tables or seed users.
- `npm run identity:migrate -- <application-id>` applies identity schema changes before production startup.

#### App Codebase Changes

- Added three role-checked login portals: `/login`, `/admin/login`, and
  `/sa/login`.
- Added separate normal-user, administrator, and super-administrator desks.
  Administrator menus hide maintenance and higher-end reporting controls.
- Added optional normal-user seed variables to each identity app example.
- Added one shared Fastify Helmet policy for the Platform API, installed
  identity APIs, and future app scaffolds.
- The policy blocks objects and framing, limits sources to self, and sends a
  no-referrer policy. It keeps the internal Swagger reference usable.
- Added username-or-email login, durable failed-login limits, and safe audit
  events for login, logout, and password-reset actions.
- Added password-reset request and confirmation API contracts. The request
  response does not reveal whether an account exists.
- A successful password reset consumes its token and revokes active sessions.
- Added configurable identity login and reset-token lifetime variables to app
  examples and the app scaffold.
- Added app claims and session claims to login tokens.
- API requests now validate the app ID, server session ID, and browser session ID.
- Logout now revokes the server session before the browser returns to login.
- Browser session storage restores a valid session for 15 minutes without using URLs or query strings.
- An authenticated Q Cafe user who returns to `/` redirects to `/overview`.
- Added login, development login, logout, and protected API wiring for Q Cafe,
  CRM, DOCX, Orship, HIMSX, LMS, and Sites.
- Added `PLATFORM_JWT_SECRET` and `REFRESH_IDENTITY_SEED` to the app examples.
- Login now accepts a seeded username or email address. App examples include
  explicit usernames for each seeded account.
- Added tests for session isolation, wildcard permission checks, logout revocation,
  and production database protection.
- Bumped CODEXSUN workspace version to 1.0.26.

## Identity checkpoint before v-1.0.26

### [v 1.0.26] 2026-09-19 - Q Cafe and CRM identity/database boundary approved

#### Database Changes

- Planned separate SQLite databases for Q Cafe and CRM.
- Q Cafe will own `storage/apps/qcafe/private/data/qcafe_db.sqlite`.
- CRM will own `storage/apps/crm/private/data/crm_db.sqlite`.
- Each application database will contain its own identity, session, role,
  permission, and business tables.

#### App Codebase Changes

- Approved login-only access for Q Cafe and CRM. Registration remains disabled.
- Platform remains the shared framework and contract owner. It will not own
  Q Cafe or CRM database tables.
- The applications will reuse `@codexsun/ui/blocks/auth` for login screens.
- This is a rollback checkpoint before identity and database implementation.

#### Database Changes

Records schema, migration, seed, tenant provisioning, and data compatibility changes.

#### App Codebase Changes

Records UI, API, service logic, tooling, packaging, and documentation changes.

- Added the DevKit-based Rich Text Editor to the shared UI package. It provides
  write, Markdown, HTML, and preview modes with package-owned formatting tools.
  UIUX Gallery now shows a live editor specimen. No UI positions changed.

- Added in-memory Rich Text Editor draft saves. Applications can provide an
  async draft-save callback. A status circle at the toolbar end shows pending,
  saving, saved, and failed states. Replaced browser prompts with editor forms.

- Completed Rich Text Editor Markdown conversion for headings, marks, links,
  images, lists, quotes, and code blocks. Image upload now uses an optional
  application-owned callback.

- Split Zetro Codex Settings into separate Local Codex and Device code cards.
  Local rechecks visibly refresh the installed CLI session state, while the
  device-code generator is explicitly enabled with a connection-mode switch.
- Decoupled Zetro's local Codex recheck from device-code status loading. A
  transient device-code request can no longer hide a successful local CLI
  result, and the check controls now show their in-progress state.
- Made Zetro's Windows local Codex probe resolve the installed Codex executable
  directly before falling back to `PATH`, so API restarts preserve the same
  connection behavior as an interactive terminal.
- Replaced Zetro's runtime placeholders with the active local Codex model and
  reasoning settings. Model and reasoning selections now update the user-owned
  Codex configuration and are re-read after every reconnect.
- Made Zetro chat behavior durable and agent-safe: conversation rename, pin,
  and delete actions now persist in SQLite; an active response cannot overwrite
  a conversation selected mid-stream; handover selections remain browser-local.
  Images are passed to Codex as real image inputs and text attachments are
  explicitly added to the turn context through temporary, removed-on-complete files.

- Added the repository-owned `zetro-idea-workshop` skill. Zetro now invokes it
  for local Codex idea conversations. The skill supports idea discovery,
  option comparison, revision, and final briefs. It cannot create tasks,
  worktrees, commands, code changes, or approvals.

- Restored UI and UIUX Gallery compliance. Markdown renderers no longer pass
  parser nodes to DOM elements. Gallery specimen categories now load on demand.
  The shared UI validation command, Gallery task records, Static Pages route
  documentation, MainWorkspace terminology, and preview spacer documentation
  are current. Removed the duplicate UI export and duplicate UIUX host setting.
  No UI positions changed.

- Replaced Zetro's placeholder runtime selectors with a live local Codex
  runtime probe. Provider, model, and reasoning selections now travel with the
  next read-only Codex run. The header shows a glowing green connection
  indicator when available and a Reconnect control when unavailable.

- Added Zetro's compact raw Codex event trace. Redacted JSONL events are shown
  in a shimmer-backed Compacting auto accordion while a turn runs, then collapse
  when the final response is saved. Assistant responses now render safe GFM
  Markdown, links, tables, code, task lists, and locally bundled Mermaid
  diagrams. Removed inactive handoff, task, and presentation controls from
  message history.

- Added live, read-only local Codex streaming to Zetro chat. The API now emits
  validated processing, command, response, completion, and error events over
  Server-Sent Events. The web workspace displays the redacted raw event data
  during a response, then refreshes its persistent conversation history. Stop
  now closes the active local Codex child process. No credentials, auth files,
  or device codes are sent to the browser or persisted in chat history.

- Removed rounded outer corners from UIUX MDI layout previews. The Main Workspace
  top menu remains square. Browser indicator dots remain round.

- Added a reusable Browser Frame around every UIUX Gallery preview. The frame
  shows three browser dots and the preview name. Preview content stays unchanged.

- Made Main Workspace side-menu and content scrollbars 4px wide. Added a 48px
  green scroll-end gap inside the canvas. The gap is hidden by default and apps
  can enable it with `showCanvasEndSpacer`. No component placement changed.

- Moved Site Header, E-Commerce Header, and Blog Header from UIUX Layouts to
  Static Pages. The Gallery now uses static-page routes for these examples.
  The page labels now identify them as Static Pages. No component layout changed.

- Aligned the UIUX Gallery with the shared UI package contract. The Gallery now
  declares its UI-only provider and module test, and the public UI entry point
  exports its MDI shell. Shared components now use the package-owned `cn`
  utility rather than an unresolved external module. No UI positions or visual
  layout changed.

- Wired all browser workspaces to their owned shared shell. Docs now mounts the
  Documentation Workspace. Zetro now mounts the Agent Workspace inside
  `MdiMain`. Platform web and Platform desktop now use the current `MdiMain`
  contract. The MDI catalog recognizes UIUX as the UI workspace.
  Docs accepts root or app-local web port configuration. Added missing Docs
  Catalog and Zetro Chat module records. Application architecture and module
  boundary checks pass. No database change.

- Split the Ecommerce Header into small layout parts for its announcement,
  search, actions, navigation, and mobile drawer. The header keeps its current
  placement and public API. Documented the MDI and standalone header boundary.
  Exported the shared Chat Runtime Controls block. No database change.

- Removed the default MDI empty-workspace placeholder. The canvas now stays
  empty until an application supplies workspace children. Removed the unused
  placeholder export. No database change.

- Renamed the shared `MdiMain` component to `MainWorkspace`. Updated the public
  package entry point, application hosts, Docs adapter, and UIUX layout guide.
  The old MDI entry point now exposes only internal MDI helpers. No database
  change.

- Added the plain `Mdi` layout and its UIUX Gallery preview. The layout centers
  its label or application content without workspace shell chrome. No database
  change.

- Replaced the copied Zetro feature modules with a fresh chat vertical slice.
  Zetro now uses the public `MdiMain` shell, private SQLite conversation
  history, public chat contracts and routes, and a read-only ephemeral local
  Codex CLI runner. Device-code login, final briefs, task handover, and worker
  execution remain out of scope. The preserved copied modules are under
  `devkits/zetro/temp/legacy-copy-2026-09-17/`. No existing storage records were
  removed.

- Added the Docs `docs-index.001` SQLite migration, allowlisted source discovery, metadata change detection, stale-record removal, and repository-path containment checks.
- Docs starts with a derived index sync. The index reads source files in place and does not author them.

- Added the standalone Docs API and web foundations, public Docs contracts, shared Framework provider registration, validated Docs configuration, and Docs startup preflight targets.
- Docs uses its own `DOCS_API_PORT` and `DOCS_WEB_PORT`. The SQLite index remains a planned D-1220 data change.

- Added Docs agent guidance for source-in-place Markdown and MDX discovery, SQLite indexing, link resolution, backlinks, graph metadata, and verification.
- Added a phased Docs application plan and a Docs-specific task register. No Docs application code changed.
- Added Zetro agent skills for reviewed planning, task splitting, guidance snapshots, isolated worktrees, evidence, and manual merge approval.
- Added a phased Zetro delivery plan and task register. No Zetro runtime code or SQLite migration changed.
- Added standalone Zetro API and web hosts with the `zetro.foundation` provider, public health contract, Zetro-specific ports, and host `.app.env` examples.
- Z-1201 validates the SQLite baseline configuration only. It creates no Zetro SQLite schema, migration, or worker runtime.
- Added Zetro SQLite readiness through Platform Core, private storage policy, backup owner, seven-day retention, and recovery-check documentation. Z-1202 creates no workflow schema or migration.
- Completed U-1201. The UI registry now rejects incomplete metadata and has a focused test for all 18 active published UI items. No database change.
- Completed U-1202. UIUX now filters registry layers and shows accessible selected-item metadata. Browser verification passed. No database change.
- Replaced the Zetro delivery plan with the chat-first workflow: idea chat,
  revision, final brief, and future task handover are now explicitly separated
  from worker execution and local Codex authentication.
- Added the Zetro web chat workspace using published `@codexsun/ui` exports and
  `MdiMain`. The current interaction is browser-memory-only and cannot create
  work, persist an idea, or access credentials. The local Codex device-code
  boundary remains the separately planned Z-1204 task. No database change.
- Added the Platform Core JWT signer and a local Platform JWT generator. The
  generator writes the ignored root `.env`, keeps the signing secret private,
  creates a local operator token, and removes issuer and audience overrides.
  Platform Core now provides the fixed issuer and audience defaults. No database
  change.
- Added idempotent Platform API shutdown handling for `SIGINT` and `SIGTERM`.
  Preflight now starts npm without a Windows shell and ends only its known child
  process tree if graceful shutdown does not finish. Added the reservation-scoped
  `stop:api` command, which confirms the configured port is released. No
  database change.
- Changed `dev:api` to restart only an existing reservation owned by the Platform
  API workspace, then wait for the configured port before starting the next
  process. No database change.
- Added Fastify Helmet security headers and origin-restricted Fastify CORS for
  the configured Platform web host. No database change.
- Added Pino structured API logging with colorized development console output,
  authorization-header redaction, and Chalk preflight status output. No database
  change.
- Added the Platform API LoggerProvider and explicit Fastify request and response
  lifecycle logs with readable timestamps, request metadata, status codes, and
  response durations. No database change.
- Added the API root redirect to the configured frontend when runtime readiness
  passes, plus the compact `/healthz` readiness endpoint. No database change.
- Set Platform API Pino timestamps explicitly to `Asia/Kolkata` and label them
  as Indian Standard Time (`IST`). No database change.
- Changed development Pino output to one line per event and shortened the
  explicit India timestamp to `YYYY-MM-DD HH:mm:ss`. No database change.
- Reduced request lifecycle console logs to method, path, response status, and
  duration. Request IDs and remote addresses remain out of console output. No
  database change.
- Expanded the isolated UIUX web gallery with live previews of published public
  UI exports and preview-only theme, density, surface, and state controls. No
  database change.
- Changed `dev:uiux` to safely restart its verified UIUX reservation before
  Vite starts, matching the Platform API startup behavior. No database change.
- Added the generated shadcn `sidebar-08` navigation block to `@codexsun/ui`,
  including package-owned `lucide-react`, public composition exports, registry
  metadata, and UIUX gallery preview coverage. No database change.
- Added the generated shadcn `sidebar-16` navigation block under the versioned
  `sidemenu/v16` package path, with public header and sidebar exports plus UIUX
  gallery preview coverage. No database change.

## v-1.0.25

### [v 1.0.25] 2026-09-19 11:51 am - Installed DOCX, Q Cafe, and CRM applications

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Removed the Docs application and its dedicated contracts package. DOCX is now
  the active documentation application and owns the documentation portal.

- Replaced the DOCX web health placeholder with an application-owned
  documentation portal. It now composes the shared documentation workspace and
  rich-text editor with documentation-style navigation, reader actions, document helper,
  Ideas pages, and in-memory authoring drafts. No database change.

- Bumped CODEXSUN workspace version to 1.0.25.
- Installed DOCX, Q Cafe, and CRM through the app builder.
- Added API and web hosts for each application. Each host has local ports,
  environment files, MDI registration, development-profile enablement, test
  scripts, and Turbo build outputs.

## v-1.0.24

### [v 1.0.24] 2026-09-19 11:33 am - Platform wiring and runtime hardening

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.24.
- Made the Platform API factory the live server path. It now starts the
  protected OpenAPI reference, request correlation, request scope, telemetry,
  security, error mapping, readiness, and graceful shutdown hooks.
- Added direct API and web dependencies. Platform Web now uses TanStack Query
  with typed API parsing, retries, cancellation, cache defaults, and tests.
- Added profile owner and provider checks. Enabled add-ons now load as runtime
  providers for Platform, Docs, and Zetro hosts.
- Added outbox lock recovery and a transaction-capable durable event bridge.
- Added root test wiring and a Platform MDI browser smoke test.

## v-1.0.23

### [v 1.0.23] 2026-09-19 10:00 am - Application lifecycle tooling

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.23.
- Added application create, sync, and remove commands. The CLI creates API and
  web hosts, registry bindings, MDI entries, API contracts, and local ports.
- Added a scoped application uninstaller. It removes one stopped application,
  its profile bindings, MDI entry, workspace lock records, and local MDI port.
- Verified the Q Cafe scaffold through API health, protected OpenAPI access,
  browser API queries, production builds, type checks, lint, and architecture checks.

## v-1.0.22

### [v 1.0.22] 2026-09-19 8:48 am - Harden application registry and module boundaries

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Added Zetro's complete idea handover flow: Explore, Compare, Revise, Final
  brief, and prepared agent task. Final briefs store selected response UUIDs
  and project scope. A prepared task can target one referred project or all
  projects. It cannot start a worker or change a repository.
- Bumped CODEXSUN workspace version to 1.0.22.
- Added the registry-owned application CLI with manifest validation, profile
  lifecycle commands, and registry-driven build, preflight, architecture, and
  worktree tooling.
- Rejected unsafe profile paths, duplicate runtime targets, and stale host
  workspace bindings before a profile can be changed or a target can start.
- Replaced Zetro's private Chat and Brief implementation imports with public
  reader contracts, and added Brief and Task module documentation and tests.
- Excluded the preserved temporary dependency-repair backup from linting and
  removed the remaining Docs API lint violations.

## v-1.0.21

### [v 1.0.21] 2026-09-19 8:24 am - Zetro agent chat and workspace alignment

#### Database Changes

- Database update: Yes (manual).
- Updated Zetro's private SQLite conversation schema with persistent pin state.
  Existing local databases add the column at startup; no shared deployment
  database is changed by this release.

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.21.
- Released the current workspace alignment: removed the retired Garments and
  Orship application trees, updated app and package manifests, and refreshed
  Framework, Platform, UIUX, Assist, runtime tooling, and architecture records.
- Added Zetro local-agent chat improvements: persistent history actions,
  streamed Codex responses, local runtime controls, browser-local handover
  selections, and temporary attachment inputs for image and text context.

## v-1.0.20

### [v 1.0.20] 2026-09-18 1:30 pm - Working on garments project

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.20.

## v-1.0.19

### [v 1.0.19] 2026-09-18 10:37 am - UIUX Gallery Build Compliance

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Added a reusable `@codexsun/ui` Codex connection-settings sheet and opened it
  from Zetro's right utility rail and unavailable header reconnect control.
  It reports the real local `codex login status`, offers the browser URL and
  copyable `codex login --device-auth` command, and keeps device codes outside
  Zetro APIs, logs, storage, and chat history.
- Moved Zetro's live Codex trace into the active assistant response. Request,
  review, command, change, response, processing, and completion events now
  arrive in order inside one collapsible turn instead of a separate panel.
  Event payloads remain redacted and transient.
- Added Zetro's handover stack for idea consolidation. Each persisted chat
  request and response already has a UUID; selected assistant responses can
  now be collected from their action row, reviewed with source UUIDs, removed,
  and consolidated into one revised idea through the local read-only Codex
  conversation. This creates no task, worker, repository action, or approval.
- Added operator-controlled device-code authentication to Zetro Settings. It
  can probe the installed local Codex CLI, generate a one-time App Server
  device code, copy that code or its verification URL, and open the browser
  flow. The code lives only in the running service memory and is excluded from
  storage, chat records, and logs.
- Bumped CODEXSUN workspace version to 1.0.19.
- Fixed UI and UIUX Gallery compliance. The UI lint, Gallery validation,
  root-layout check, and UIUX production build now pass.
- Split Gallery component and vendor code. Every JavaScript production chunk
  is within the 400 KB budget. No UI positions changed.

## v-1.0.18

### [v 1.0.18] 2026-09-17 10:44 pm - working on uiux refactor

#### Database Changes

- Database update: Yes (manual).

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.18.

## v-1.0.17

### [v 1.0.17] 2026-09-17 6:31 pm - Platform API lifecycle and logging

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Moved shared UI runtime dependencies to the root workspace installation.
- Removed workspace-local `node_modules` folders and moved Vite caches to `dist/.vite`.
- Renamed the shared application shell to `MdiMain` and wired all web and desktop hosts to it.
- Added the MDI shell Playwright check and fixed copied UI package import and type errors.

- Added optional, trace-only OTLP export for Platform API manual request spans.
  It starts only when `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` is configured; no
  automatic instrumentation, metrics pipeline, or collector is bundled.

- Bumped CODEXSUN workspace version to 1.0.17.
- Added local Platform JWT generation and fixed issuer and audience defaults.
- Added safe Platform API restart and stop commands with port reservations.
- Added Fastify CORS, Helmet, a frontend root redirect, and `/healthz` readiness.
- Added the Platform API LoggerProvider with Pino and Chalk console output.
- Console request logs now use India time, one line, method, path, status, and duration.
- Made `MdiMain` the Platform web starting shell. Removed dashboard, identity, and API content from startup.
- Added Fastify Zod request and response schemas, generated OpenAPI 3 coverage for
  public Platform routes, and a JWT- and permission-protected internal API
  reference at `/api/internal/reference`. No database change.
- Added Platform API factory composition, correlation IDs, OpenTelemetry API spans,
  TanStack Query server-state handling, and a transactional Platform Core migration
  runner with SQLite clean/upgrade/repeat-seed coverage. No database change.

## v-1.0.16

### [v 1.0.16] 2026-09-17 3:49 pm - Worktree planning and verification governance

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.16.
- Verified the clean Zetro worktree through the required pre-development lifecycle checks.
- Added the verified worktree gate, short app task IDs, app planning and task registers, and add-on record templates.
- Kept active Docs and UIUX task work outside this release because their worktrees contain unreviewed changes.

## v-1.0.15

### [v 1.0.15] 2026-09-17 3:15 pm - App worktree workflow

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.15.
- Added the root CODEXSUN app-worktree CLI for create, develop, review, approval, and fast-forward merge lifecycle commands.
- Added local worktree lifecycle records, scoped check execution, clean-worktree review checks, and a shared-package change gate.
- Added the isolated app session skill and the single Assist guide for agent development, review evidence, manual approval, and merge rules.

## v-1.0.14

### [v 1.0.14] 2026-09-17 3:04 pm - Line ending governance

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.14.
- Added root `.gitattributes` rules that store repository text files with LF endings and preserve binary assets.
- Added text-file line-ending normalization and validation commands with a binary-safe test suite.
- Updated `github:now` to normalize before its change review and validate again before Git staging.
- Documented the required pre-staging workflow for developers and coding agents.
- Added the CODEXSUN app worktree CLI, local lifecycle records, scoped review checks, explicit human approval, and fast-forward-only merge gate.
- Added the isolated app session skill for one-agent worktree development and review handoff.
- Added one app-facing Assist guide for the required worktree, development, review, approval, and merge lifecycle.
- Added a required read-only worktree verification stage before agent development begins.
- Added standard per-app planning and task records, short task-ID prefixes, phased execution status, and add-on planning templates.
- Replaced legacy Zetro planning and task records with the agentic IDE governance plan and phased task register. No Zetro runtime code changed.
- Added the Platform-specific runtime, module, host, deployment, and extension planning phases with a phased task register. No Platform runtime code changed.
- Added Framework shared-package planning and task records with compatibility and consumer-review gates. No Framework code changed.
- Added UIUX catalog, visual-quality, accessibility, and design-system handoff phases with a phased task register. No UIUX code changed.
- Added Docs source-in-place parsing, graph, workspace, and verification phases with a phased task register. No Docs runtime code changed.

- Added UI package component inventory, public-contract, component-expansion, and consumer-verification planning. No UI package code changed.

## v-1.0.13

### [v 1.0.13] 2026-09-17 2:57 pm - Application architecture audit and isolated Turbo workflow

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.13.
- Added app-scoped Turbo commands and root cache namespaces for Platform, Docs, Zetro, UIUX, and shared packages.
- Added isolated worktree, local environment, shared-package review, and manual merge rules for parallel development.
- Added `check:app-architecture` and its test suite to the required root check.
- The audit verifies declared app profiles, host configuration, public `@codexsun/ui` composition, provider ownership, module tests, private imports, and event declarations.
- Extended Framework provider manifests with explicit published and consumed event lists.
- Updated active module records and documented UIUX as the permitted UI-only catalog profile.
- Added repository-owned LF normalization and validation before Git staging, with a binary-safe test suite and `.gitattributes` authority.

## v-1.0.12

### [v 1.0.12] 2026-09-17 2:39 pm - Release version alignment correction

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.12.
- Restored the required match between the current version reference, changelog entry, and Git commit subject.
- This correction does not add database schema, seed, or application behavior changes.
- Added app-isolated Turbo cache scopes, worktree environment rules, shared-package change gates, and manual merge confirmation requirements.
- Added the application architecture audit and explicit provider event declarations for modular, DDD, and event-driven boundary checks.

## v-1.0.11

### [v 1.0.11] 2026-09-17 2:38 pm - #10 - Cross-application verification and release alignment

#### Database Changes

- Database update: Yes (manual).

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.11.

## v-1.0.10

### [v 1.0.10] 2026-09-17 2:35 pm - Cross-application verification and release alignment

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.10.
- Verified Platform, Docs, Zetro, and UIUX source checks in the root workspace.
- Verified the Platform workspace browser flow with the root Playwright installation.
- Verified public UI and API contract usage plus module route ownership checks.
- Verified the non-desktop and non-mobile application build outputs under the root `dist/` directory.
- Restored and verified the root-only `node_modules`, `.turbo`, and `dist/` layout after checks.
- Marked Phase 5 and Phase 7 completion evidence in the Framework and Platform plan.
- Deferred Redis, Docker runtime, desktop, mobile, database migration execution, and production deployment checks by scope.

## v-1.0.9

### [v 1.0.9] 2026-09-17 1:48 pm - Platform API contracts and UI system

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.9.
- Added the completed shared UI theme, registry, base components, composition layers, Platform MDI integration, and standalone UIUX gallery.
- Added the public API contracts package, centralized route composition, stable API error codes, and Platform module visibility.
- Added Docs and Zetro documentation records supplied in this workspace.
- Added the Playwright Platform workspace test source and root command. It requires the declared package to be installed before it can run locally.
- Added the optional Redis runtime configuration scaffold and operator runbook. Database-backed outbox delivery remains the current queue direction; no Redis service, worker, or database change was introduced.
- Added the Platform Operations module with the unrun `operations.001` migration for outbox, idempotent-consumer, and audit tables. Database update: Yes when a selected deployment runs this migration.
- Added database-backed outbox record, claim, retry, failed-record, idempotent-consumer, and state-count contracts with SQLite coverage. Redis and BullMQ remain deferred.
- Added the scoped Storage Provider, structured operation-entry contract, Docker Compose assets, Aaran deployment profile, and backup and recovery runbook.
- Validated the Docker Compose model with `.env.example`. Live Docker startup remains pending because the local Docker Desktop Linux daemon is unavailable.
- Added the Platform Tauri desktop host with a narrow Rust runtime-metadata command, default capability policy, public contracts, shared UI, root Cargo target output, and desktop checks.
- Added the Platform Ionic and Capacitor mobile host with public API contracts, desktop-import boundary coverage, root mobile web output, and Capacitor configuration. Android and iOS device checks remain pending SDK selection.
- Completed the Aaran profile selection for Platform API, web, desktop, and mobile. Docker, migration, and production execution remain deferred by scope.

## v-1.0.8

### [v 1.0.8] 2026-09-17 1:16 pm - Design system theme foundation

#### Database Changes

- Database update: Yes (manual).
- Includes the unrun module-owned `settings.001` migration and `settings.seed.001` source. No shared database changed.

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.8.
- Added semantic dark and light theme tokens, compact/default/relaxed density tokens, and the public `ThemeProvider` API in `@codexsun/ui`.
- Updated shared UI controls, blocks, pages, and the MDI template to use semantic tokens instead of fixed palette classes.
- Wired the Platform web host to the shared default theme and added a focused UI theme-contract test to root validation.
- Completed U-601. The next design-system task is U-602 public component registry metadata.
- Added the public `uiRegistry` metadata contract for shared UI components, blocks, pages, and templates.
- Added stable registry IDs, variant and state metadata, accessibility notes, example data, lifecycle status, and focused validation tests.
- Completed U-602. The next design-system task is U-603 base shadcn-compatible UI components.
- Added documented public form, feedback, surface, dialog, table, empty-state, and skeleton components in `@codexsun/ui`.
- Registered every base component with variants, states, and accessibility guidance. Completed U-603.
- Added reusable UI composition exports and wired Platform web through the public default MDI template.
- Added the standalone UIUX gallery host with a public registry view and preview-only theme and density Tweak panel.
- Added UIUX root preflight, environment, Turbo output, and `dist/uiux/web` wiring. Completed U-604 to U-606 and Phase 6.
- Added the public `@codexsun/contracts` package and centralized Platform API route composition through provider-resolved services.
- Added validated Platform health and module contracts plus Platform web module visibility. Phase 7 remains active for API error policy and Playwright coverage.
- Added stable API error codes, centralized not-found and internal-error mapping, and a declared Playwright Platform workspace flow.
- Completed A-603 and Phase 7 source work. Playwright execution needs its declared package installed in the root workspace.

## v-1.0.7

### [v 1.0.7] 2026-09-17 12:57 pm - Identity and module foundation

#### Database Changes

- Database update: Yes (manual).
- Added the unrun `identity.001` migration and `identity.seed.001` source. No shared database changed.
- Added the unrun `settings.001` migration and `settings.seed.001` source. No shared database changed.

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.7.
- Added Platform Identity contracts, module-owned persistence files, signed JWT verification, and actor-isolation checks.
- Added the in-memory Platform web session provider and browser-safe identity contract entry.
- Added the Aaran single-tenant deployment policy. Multi-tenancy remains an add-on.
- Scoped Turbo build artifacts to host-specific root `dist/` paths.
- Added the guarded module generator and focused checks for generated ownership shape and unsafe input.
- Completed M-501.
- Added static module boundary checks for root providers, owner declarations, README files, and private relative imports.
- Added boundary-check tests and completed M-502.
- Added module test conventions and generated test guidance for new modules.
- Moved the System health route test into its owner module and completed M-503.
- Added the module-owned Platform Settings provider, controller, service, repository, migration, seeder, route, tests, and data documentation.
- Added the protected non-secret settings API and completed M-504. Phase 5 is complete.

## v-1.0.6

### [v 1.0.6] 2026-09-17 10:46 am - Data lifecycle policy

#### Database Changes

- Database update: No (manual).
- Added the unrun `identity.001` module migration and `identity.seed.001` seeder source. No shared database changed.

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.6.
- Added Framework seeder descriptors and a Platform policy for module-owned data lifecycle records.
- Added focused checks for descriptor ownership, duplicate IDs, and compatibility rollback limits.
- Added lifecycle, migration, backup, restore, and deployment evidence rules with a reusable record template.
- Completed D-305. Phase 3 integration evidence remains pending the first data-owning module.
- Added Platform Core public actor, role, permission, session, and authorization contracts.
- Added schema and authorization tests that keep credentials, tokens, and role-derived permissions out of the public contract.
- Added the module-owned Platform Identity provider, actor route, controller, service, repositories, migration, repeat-safe seeder, and tests.
- Added isolated SQLite migration and identity repository checks. No shared MariaDB migration has run.
- Completed I-402 and Phase 3 exit evidence. I-403 must protect Identity routes before a production release.
- Added signed JWT bearer verification for the Platform Identity actor route.
- JWT token subjects now resolve to module-owned actors. Tokens never grant permissions directly.
- Enforced signed-actor isolation: self reads are allowed, cross-actor reads require `identity.read`.
- Added configuration validation and focused unauthenticated, invalid-token, unauthorized, authorized, and not-found route checks.
- Completed I-403. Token issuance, browser sessions, revocation, and tenant selection remain later Identity work.
- Added the authenticated current-actor API route for browser session verification.
- Added the Platform web Identity session provider and authenticated request boundary.
- Kept JWT bearer tokens only in React memory. The web host does not persist or expose them.
- Added focused web session gateway checks. Completed I-404.
- Added a browser-safe Platform Core identity-contract export and web build coverage.
- Scoped Turbo build cache outputs to each Platform host. The shared root cache is no longer a build artifact.
- Added the Aaran single-tenant deployment policy and validated deployment and bootstrap administrator configuration.
- Added the Aaran deployment profile. No tenant schema, migration, seed, or JWT tenant claim was added.
- Completed I-405. Multi-tenancy remains a future add-on.

## v-1.0.5

### [v 1.0.5] 2026-09-17 10:40 am - SQLite Platform data adapter

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.5.
- Added a Platform SQLite factory that creates a Kysely-backed local data provider from an explicit filename.
- Enabled SQLite foreign-key checks, WAL mode, and a 5-second busy timeout for local runtime use.
- Added real SQLite commit and rollback tests with an isolated in-memory database.
- Extended the Kysely provider with a transaction-scoped query callback.
- Added a Platform MariaDB factory with validated root-managed connection URLs and focused creation tests.
- Updated `mysql2` to 3.24.4 after dependency audit review.

## v-1.0.4

### [v 1.0.4] 2026-09-17 10:30 am - Platform data contract foundation

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.4.
- Added Framework repository, transaction, unit-of-work, and migration contracts without a database driver.
- Added commit and rollback contract tests for Framework transaction work.
- Completed deployable module-enablement policy work with explicit provider selection and dependency closure checks.
- Added the Platform Core Kysely transaction adapter with commit, rollback, shutdown, and focused contract tests.
- Updated Kysely to 0.29.6 after dependency audit review.

## v-1.0.3

### [v 1.0.3] 2026-09-17 10:21 am - Platform runtime foundation

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.3.
- Added provider manifests, lifecycle dependency checks, public contracts, runtime configuration, readiness reporting, and focused tests.
- Added Platform runtime composition, safe health reporting, repository skills, and execution handover records.

## v-1.0.2

### [v 1.0.2] 2026-09-17 9:28 am - Repository ignore policy

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.2.
- Added CODEXSUN ignore rules for generated output, runtime data, credentials, test reports, desktop/mobile binaries, and deployment overrides.
- Added planning-only Framework and Platform phase records with task status and approval gates.
- Added design-system and application rollout boundaries before Framework kernel implementation.
- Completed the Framework provider manifest, dependency graph, lifecycle cleanup, public contracts, and focused test harness.
- Wired Platform Core and Platform System into the Framework manifest lifecycle, including API startup and shutdown hooks.
- Added Framework compatibility and extension guidance.
- Added the repository-owned progressive development skill for repeatable implementation and handover.
- Added module ownership and workspace runtime skills for developer handover.
- Consolidated the task register into active work, next task, completed milestones, and planning-only queues.
- Completed the Platform runtime registry and explicit API provider composition. Health now reports selected provider IDs without configuration values.
- Completed shared Zod runtime configuration contracts for API, web, desktop, and mobile hosts. The web host receives only declared public values.
- Completed provider readiness tracking and safe health reporting. The Platform health API now reports provider IDs and lifecycle state without provider values or configuration data.

## v-1.0.1

### [v 1.0.1] 2026-09-17 9:26 am - CODEXSUN foundation setup

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.1.

## v-1.0.0

### [v 1.0.0] 2026-09-17 8:11 am - Assist foundation and architecture rules

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Added the Assist documentation structure.
- Added the core technology stack plan.
- Added the modular-monolith, DDD, event-driven, provider, and module ownership rules.
- Added coding-agent rules for reuse, file size, verification, and changelog updates.
- Added root storage, container, and deployment boundary guidance.
- Added root dependency, build-output, TypeScript, and environment-configuration rules.
- Completed the Assist foundation guides, templates, and operational decision records.
- Made single-root `dist/` mandatory for every application, add-on, package, module, client host, and tool.
- Set app output paths to `dist/<app-name>/<target>/`.
- Added the initial npm workspace, Platform provider engine, Fastify API, and Tailwind MDI web shell.
- Verified the provider health API and Vite web entrypoint locally.
- Removed nested workspace cache and dependency folders and added root-layout enforcement.
- Routed normal check and build workflows through root-layout cleanup before final validation.
- Replaced copied version and Git helper assumptions with CODEXSUN single-version tooling.
- Enforced the root package version as the version authority, including workspace, lockfile, changelog, and Git subject checks.
- Replaced the copied preflight behavior with CODEXSUN port checks, reservations, and safe root startup commands.
- Wired the Platform web host to the configured preflight port through root `.env` and app `.app.env` loading.
- Removed the unused secret-writing tool and moved Platform host configuration into `.env` and `.app.env`.
- Enabled TypeScript-aware root linting for all CODEXSUN source and tools.
- Completed a repository-wide source review and removed unused root dependencies.
