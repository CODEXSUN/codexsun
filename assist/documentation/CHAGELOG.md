# Changelog

## Version State

Current version: 1.0.16

Release tag: v-1.0.16

Changelog label: v 1.0.16

This changelog starts fresh from the CODEXSUN foundation. Earlier copied application history does not represent this workspace.

New entries must keep database-facing work and application code work separate.

#### Database Changes

Records schema, migration, seed, tenant provisioning, and data compatibility changes.

#### App Codebase Changes

Records UI, API, service logic, tooling, packaging, and documentation changes.

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

## v-1.0.16

### [v 1.0.16] 2026-09-17 3:49 pm - Worktree planning and verification governance

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.16.
- Verified the clean Zetro and Orship worktrees through the required pre-development lifecycle checks.
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
- Replaced legacy Orship planning and task records with Platform-first infrastructure, monitoring, and deployment phases. No Orship runtime or Docker configuration changed.
- Added the Platform-specific runtime, module, host, deployment, and extension planning phases with a phased task register. No Platform runtime code changed.
- Added Framework shared-package planning and task records with compatibility and consumer-review gates. No Framework code changed.
- Added UIUX catalog, visual-quality, accessibility, and design-system handoff phases with a phased task register. No UIUX code changed.
- Added Docs source-in-place parsing, graph, workspace, and verification phases with a phased task register. No Docs runtime code changed.

## v-1.0.13

### [v 1.0.13] 2026-09-17 2:57 pm - Application architecture audit and isolated Turbo workflow

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.13.
- Added app-scoped Turbo commands and root cache namespaces for Platform, Docs, Orship, Zetro, UIUX, and shared packages.
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
- Verified Platform, Docs, Orship, Zetro, and UIUX source checks in the root workspace.
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
- Added Docs, Zetro, and Orship documentation records supplied in this workspace.
- Added the standalone Orship API and web hosts with isolated local ports,
  Orship host configuration, Platform Core composition, and the first guarded
  orchestration state machine. Completed O-1201 without a database change.
- Added Orship revision-bound private attempt records and typed verification
  checks. Required failed checks now block approval requests. Completed O-1202
  without a database change.
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
