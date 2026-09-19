# Changelog

## Version State

Current version: 1.0.25

Release tag: v-1.0.25

Changelog label: v 1.0.25

This changelog starts fresh from the CODEXSUN foundation. Earlier copied application history does not represent this workspace.

New entries must keep database-facing work and application code work separate.

## v-1.0.26 (checkpoint)

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
  `apps/zetro/temp/legacy-copy-2026-09-17/`. No existing storage records were
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
