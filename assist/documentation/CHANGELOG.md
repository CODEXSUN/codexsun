# CODEXSUN Changelog

## Version State

Current version: 0.1.0

Release tag: v-0.1.0

Changelog label: v 0.1.0

Record database changes and application code changes separately for every version.

## v-0.1.0

### [v 0.1.0] 08/09/2026 12:20 pm - Cross-app interface topology

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Added shared MDI topology for command, navigation, workspace, status, appearance, and feature controls.
- Added app-owned topology for Platform, Docs, and Zetro workspaces.
- Added named parent banners and numbered child stickers.
- Added validation for IDs, technical names, and parent-child links.

#### Verification

- Passed the shared UI, Platform web, Docs web, and Zetro web type checks.
- Verified the combined inspector in Platform, Docs, and Zetro browsers.
- Verified named banners and nested Settings items through level three.

### [v 0.1.0] 08/09/2026 11:57 am - Durable module runtime preparation

#### Database Changes

- Database update: No.
- Recorded the planned installation and migration records. No table or migration was created.

#### Preparation Changes

- Defined framework, Platform Core API, Platform API, business module, add-on, and System ownership boundaries.
- Defined planned module installation fields, migration ledger fields, and runtime states.
- Required Fastify liveness to start without waiting for MariaDB.
- Required database and module failures to affect readiness and diagnostics.
- Defined migration ordering, checksums, transactions, database locking, restart recovery, and data-preservation rules.
- Added the ten-step implementation order for repository, schema, coordinator, diagnostics, lifecycle, and integration work.
- Added acceptance tests for installation, restart, upgrades, checksum mismatch, rollback, locking, degraded startup, recovery, signals, and port release.
- Recorded parallel work boundaries for framework, Platform runtime, modules, and System diagnostics.

#### Verification

- Confirmed the existing liveness, readiness, framework, and root dependency boundaries from the completed foundation checks.
- Did not run MariaDB integration tests because this entry records preparation only.

### [v 0.1.0] 08/09/2026 11:55 am - Docs library experience

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Added source-indexed documentation search for titles, tags, aliases, descriptions, and paths.
- Added overview-first browsing, hash deep links, request cancellation, and rendered-document caching.
- Added reader outlines, wiki-link navigation, backlinks, and tag-related document discovery.

#### Verification

- Passed Docs API, Docs web, and shared UI type checks.
- Verified the overview, search, deep-link reload, and reader outline in the browser.

### [v 0.1.0] 08/09/2026 11:49 am - Safe runtime manifest boundary

#### Database Changes

- Database update: No.

#### Framework Changes

- Added strict Zod parsing for unknown module and add-on manifest input.
- Rejected missing fields, unknown fields, invalid nested values, and invalid lifecycle functions before semantic validation.
- Changed module registration to parse unknown input before reading manifest properties.
- Preserved semantic version, duplicate, dependency, extension, and lifecycle checks as a separate semantic validation stage.
- Added a test that proves malformed add-on input returns aggregated typed issues without a runtime `TypeError`.

#### Boundary Decisions

- Kept Zod in the framework because manifest parsing is a framework trust boundary.
- Kept MariaDB, Kysely, degraded startup, and durable module state in Platform API.
- Required future database-backed module state to affect readiness without blocking liveness routes.

#### Verification

- Passed the complete root workspace, line, documentation, formatting, lint, type, build, chunk, framework, web composition, and server E2E checks.
- Passed eleven framework tests.
- Confirmed the repository still uses one root dependency installation.

### [v 0.1.0] 08/09/2026 11:32 am - Extensible application and add-on foundation

#### Database Changes

- Database update: No.

#### Framework Changes

- Added `core`, `feature`, `addon`, and `adapter` module kinds.
- Added versioned extension point declarations with `one` or `many` cardinality.
- Added ordered add-on contribution declarations with compatible point version ranges.
- Required add-ons to declare a module dependency on each extension point owner.
- Added pre-start validation for missing points, incompatible versions, duplicate identifiers, missing owner dependencies, and cardinality conflicts.
- Added deterministic immutable extension resolution to the module composition plan.
- Added framework tests for valid add-on resolution and aggregated invalid-binding failures.

#### Architecture and Documentation Changes

- Added the application and add-on extension standard.
- Defined application modules, reusable add-ons, technical adapters, shared UI, and framework ownership boundaries.
- Added add-on layout, compatibility, security, scale, install, removal, documentation, and acceptance rules.
- Added an add-on README template and extended the module README template.
- Wired the extension standard into agent onboarding, governance, application guidance, framework guidance, and the root README.

#### Verification

- Passed the complete root workspace, line, documentation, formatting, lint, type, build, chunk, framework, web composition, and server E2E checks.

### [v 0.1.0] 08/09/2026 11:28 am - Docs Ideas development plan

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Added the Docs Ideas navigation tab with a visual capability-delivery flow, framework ownership pattern, five-stage roadmap, and guardrails based on the repository capability roadmap.

### [v 0.1.0] 08/09/2026 11:07 am - Smooth global Docs loader

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Made the shared global loader delay short refresh indicators, keep visible loaders on screen long enough to read, and fade them in and out while Docs retains its current page during fast document changes.

### [v 0.1.0] 08/09/2026 11:15 am - Shared UI gallery and interface topology

#### Database Changes

- Database update: No.

#### Shared UI Changes

- Added a runnable component gallery at `@codexsun/ui/templates/ui-gallery`.
- Added live foundation, form, data, layout, and overlay previews.
- Added the complete shared component and template inventory.
- Added reusable Interface Topology Inspection with numbered glass labels.
- Added label visibility persistence, clipboard copy, region selection, and boundary highlighting.
- Used a floating white inspector with purple controls and contrasting glass region stickers.

#### Application Integration

- Added the Platform `/ui` route through the `ui-gallery` web module.
- Added the UI Gallery item through the public navigation contribution.

#### Verification

- Passed the complete root check with all workspace, documentation, format, lint, type, build, chunk, framework, web composition, and server gates.
- Passed the 400 KB production JavaScript budget for 103 chunks.
- Passed eight framework tests, three Platform web composition tests, and six Platform server tests.
- Verified the gallery route, 62 component records, four templates, search filter, live Forms tab, topology controls, glass labels, selected detail, and boundary ring in the browser.

### [v 0.1.0] 08/09/2026 11:00 am - Docs global loading transition

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Added the shared packages/ui loader block and made Docs keep one full-reader loading state from document-list loading through selected-document rendering, removing the overview and document flicker during refresh.

### [v 0.1.0] 08/09/2026 10:57 am - Framework capability roadmap

#### Database Changes

- Database update: No.

#### Architecture and Documentation Changes

- Compared official Fastify, NestJS, AdonisJS, Hono, Node.js, and OpenTelemetry patterns for scalable Node runtimes.
- Defined the allowed feature boundary for the framework kernel, Platform Core, application composition, and business modules.
- Added preferred class responsibilities for composition, lifecycle, request context, health, shutdown, module state, migrations, events, jobs, and telemetry.
- Recorded implemented, pre-Identity, consumer-driven, deferred, and rejected capabilities.
- Added a five-stage delivery order beginning with durable module state and module-owned migrations.
- Added a framework development skill and wired the roadmap into the framework README and Assist index.

#### Verification

- Passed the complete root check with no formatting, lint, type, build, chunk, test, documentation, workspace-layout, or file-size warning.
- Preserved and formatted concurrent interface-topology and UI-gallery work; corrected its explicit custom `data-*` property type when the root type check exposed the issue.

### [v 0.1.0] 08/09/2026 10:54 am - Docs navigation refinement

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Tightened the Docs rail header and category rows, added animated expand and collapse controls with hover feedback, moved slim scrollbars to the pane edges, and widened the documentation reading canvas to 90 percent.

### [v 0.1.0] 08/09/2026 10:46 am - Centralized UI and MDI application layout

#### Database Changes

- Database update: No.

#### Shared UI Changes

- Established `packages/ui` as the shared owner for shadcn primitives, layouts, templates, hooks, tokens, and Tailwind assets.
- Kept dashboard, sidebar, and documentation compositions as package-owned templates.
- Moved the MDI workspace from `templates/mdi-workspace` to the public `layouts/mdi-main` entry point.
- Split the MDI layout into focused top-menu, app-switcher, profile, sidebar, status, empty-state, settings, persistence, and composition files.
- Matched the supplied header with an application label, rounded search field, notification state, application grid, and profile menu.
- Added a contained shadcn sidebar and a workspace status bar.
- Added per-application feature settings for the top menu, notifications, application switcher, profile menu, and status bar.
- Stored feature visibility by `applicationId` in browser local storage.
- Kept the appearance tweak panel and linked it to the feature settings screen.

#### Application Integration

- Wired Platform, Docs, and Zetro through `@codexsun/ui/layouts/mdi-main`.
- Bound Platform module navigation to the shared sidebar without changing its router ownership.
- Bound Docs document navigation to the shared sidebar and removed its duplicate shell.
- Bound Zetro Chat and Settings navigation to the shared sidebar and removed its duplicate application header.
- Kept Zetro chat, tasks, history, connection settings, and appearance controls inside the Zetro application.
- Scoped Zetro form and focus styles so they do not override shared layout controls.

#### Repository Cleanup

- Kept reusable browser UI under `packages/ui` and application-specific screens under their owning applications.
- Kept one hoisted root `node_modules` directory and no nested installation under `apps` or `packages`.
- Kept all MDI source files below 300 lines.

#### Verification

- Passed the complete root check, including workspace layout, formatting, lint, type checks, builds, documentation, and line limits.
- Passed the 400 KB production JavaScript chunk budget for 97 chunks.
- Passed eight framework tests, three Platform web composition tests, and six Platform server tests.
- Verified Platform, Docs, and Zetro in Chrome with the shared top menu, sidebar, and bottom status bar.
- Verified the application switcher, profile menu, sidebar control, feature settings, and persisted top-menu toggle.
- Confirmed that a fresh Zetro browser session produced no warning or error.

### [v 0.1.0] 08/09/2026 10:44 am - Platform and framework foundation

#### Database Changes

- Database update: No.
- Kept durable installed-module state as follow-up work until MariaDB verification is available.

#### Framework Changes

- Expanded module manifests with owners, descriptions, Platform compatibility, configuration, public contracts, capabilities, and events.
- Added full manifest validation, aggregated dependency errors, complete cycle paths, and deterministic dependency order.
- Added immutable composition plans and blocked late registration after planning.
- Added install, upgrade, activate, deactivate, and uninstall execution.
- Added reverse-order shutdown and rollback after an activation or installation failure.
- Added eight framework tests for validation, planning, compatibility, lifecycle order, upgrades, and rollback.

#### Platform API Changes

- Added injectable MariaDB and storage dependencies for isolated tests.
- Added separate MariaDB and storage readiness components.
- Added private-storage write, read, and delete probes.
- Added ordered shutdown tasks, shared shutdown signals, and module lifecycle cleanup.
- Added shared Zod schemas for HTTP envelopes, response metadata, health responses, and System runtime data.
- Added the System API module and `GET /api/system/runtime` contract at version `1.0.0`.

#### Platform Web Changes

- Added TanStack Router and TanStack Query foundations.
- Added typed `VITE_PLATFORM_API_URL` configuration and Zod response validation.
- Added Platform Core route and navigation contribution contracts.
- Added the System web module with loading, error, retry, and runtime module states.
- Bound composed System navigation and routing through the existing shared MDI layout properties.
- Kept every production JavaScript chunk below the 400 KB limit.

#### Documentation and Governance Changes

- Added the application standard, application README template, and application documentation gate.
- Added development record rules and a reusable development record template.
- Required every module README to link its development records.
- Updated agent onboarding, golden rules, architecture references, module catalogs, and local API, web, server, and modular-monolith guides.
- Recorded ownership, reference contracts, binding properties, parallel work, decisions, verification, and follow-up work.
- Added the Platform development record at `assist/records/platform/2026-09-08-platform-framework-foundation.md`.

#### Repository Cleanup

- Corrected Platform and Docs development port references.
- Added safe Platform preflight port defaults.
- Kept one root `node_modules` after deduplicating Zod and removing the nested Platform web installation.
- Added the required TypeScript configuration for the version tools workspace.
- Removed one unused Zetro type import found by the zero-warning gate.

#### Verification

- Passed the full root check with no build, lint, formatting, type, documentation, line-limit, workspace-layout, or chunk warnings.
- Passed eight framework tests, three Platform web composition tests, and six Platform server tests.
- Verified production API startup, health, System runtime metadata, SIGTERM, supervisor IPC, shutdown, and port release.
- Verified the MDI System workspace and navigation in a browser on isolated ports `6110` and `6120`.
- Confirmed that the browser produced no warning or error.
- Did not verify live MariaDB readiness.

### [v 0.1.0] 08/09/2026 10:42 am - Connected Docs workspace and release workflow

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Added the connected MDX documentation workspace, structured Obsidian-compatible source links, accordion tree navigation, manual Docs refresh behavior, and repository-local version and interactive GitHub tooling.

### [v 0.1.0] 2026-09-08 9:00 am - CODEXSUN foundation

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Established the CODEXSUN platform foundation and connected documentation workspace.

### [v 0.1.0] 2026-09-08 10:20 am - Zetro agent workspace

#### Database Changes

- Database update: No.
- Added private JSON storage for Zetro tasks and conversation history.

#### App Codebase Changes

- Added standalone Zetro web and API workspaces on ports `5310` and `4310`.
- Added Codex-backed text and image chat, file attachments, voice input, and spoken replies.
- Added local Codex device-code setup, connection status, account switching, and confirmed sign-out.
- Kept Codex tokens in the Codex credential store and kept API keys in the root environment.
- Added persistent conversation history with short titles, rename, pin, and pinned-first ordering.
- Added a responsive left history drawer with an icon toggle and a bottom new-chat action.
- Added task management, appearance controls, module documentation, and conversation history tests.
- Added one detached Git worktree for each Zetro conversation.
- Kept Zetro Codex threads ephemeral so they do not enter the durable Codex task history.
- Enabled worktree file edits, commands, tests, Git review, and completed tool activity summaries.
- Moved the Zetro API and web to ports `6050` and `6060` with shared preflight startup.
- Added explicit development, documentation, review, and test workflows to the Zetro composer.
- Bound each workflow to focused Codex instructions and stored it in the execution summary.
- Added a governed Deliver workflow from planning through documentation and versioning.
- Added an explicit publication gate for commit and push after file, branch, upstream, and check review.
- Added validated, timestamped delivery records that persist with assistant messages.
- Added a delivery progress panel with stage evidence and publication readiness.
- Added validated delivery context to follow-up turns so a conversation can resume its pipeline.

#### Verification

- Passed the Zetro API and web type checks, builds, lint, formatting, module documentation, line limits, and chunk budget.
- Passed history tests, live Codex response checks, connection API checks, and desktop and mobile browser reviews.
