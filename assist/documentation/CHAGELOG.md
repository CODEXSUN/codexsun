# Changelog

## Version State

Current version: 1.0.7

Release tag: v-1.0.7

Changelog label: v 1.0.7

This changelog starts fresh from the CODEXSUN foundation. Earlier copied application history does not represent this workspace.

New entries must keep database-facing work and application code work separate.

#### Database Changes

Records schema, migration, seed, tenant provisioning, and data compatibility changes.

#### App Codebase Changes

Records UI, API, service logic, tooling, packaging, and documentation changes.

## v-1.0.7

### [v 1.0.7] 2026-09-17 12:57 pm - Identity and module foundation

#### Database Changes

- Database update: Yes (manual).
- Added the unrun `identity.001` migration and `identity.seed.001` source. No shared database changed.

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.7.
- Added Platform Identity contracts, module-owned persistence files, signed JWT verification, and actor-isolation checks.
- Added the in-memory Platform web session provider and browser-safe identity contract entry.
- Added the Aaran single-tenant deployment policy. Multi-tenancy remains an add-on.
- Scoped Turbo build artifacts to host-specific root `dist/` paths.
- Added the guarded module generator and focused checks for generated ownership shape and unsafe input.
- Completed M-501.

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
