# Changelog

## Version State

Current version: 1.0.3

Release tag: v-1.0.3

Changelog label: v 1.0.3

This changelog starts fresh from the CODEXSUN foundation. Earlier copied application history does not represent this workspace.

New entries must keep database-facing work and application code work separate.

#### Database Changes

Records schema, migration, seed, tenant provisioning, and data compatibility changes.

#### App Codebase Changes

Records UI, API, service logic, tooling, packaging, and documentation changes.

## v-1.0.3

### [v 1.0.3] 2026-09-17 10:21 am - version update

#### Database Changes

- Database update: Yes (manual).

#### App Codebase Changes

- Bumped CODEXSUN workspace version to 1.0.3.

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
