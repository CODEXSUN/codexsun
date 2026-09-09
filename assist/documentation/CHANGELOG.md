# CODEXSUN Changelog

## Changelog Rules

- Keep this file as the only CODEXSUN changelog.
- Add the newest root release section immediately after this rules section.
- Use this exact entry heading: `### [v X.Y.Z] YYYY-MM-DD - Title`.
- Use the root package version in the heading. State a module version in the title or body.
- Write completed work only. Do not log plans, guesses, or unverified outcomes.
- Include Database Changes, App Codebase Changes, and Verification for a detailed entry.
- State commands that passed. State checks that did not run.
- Keep entries concise and link the owning development record for details.
- Run `npm.cmd run github:now -- --dry-run` before a release commit.
- Keep this file at 700 lines or fewer.

## Version State

- Current version: 0.1.9
- Release tag: v-0.1.9
- Changelog label: v 0.1.9

## v-0.1.9

### [v 0.1.9] 2026-09-09 - Zetro SQLite, recoverable tasks, and repository tooling

### [v 0.1.9] 2026-09-09 2:47 pm - Identity portal foundation

- Database Changes: Added module-owned Identity tables, an immutable default super-administrator seed, and a live schema fingerprint.
- App Codebase Changes: Added three isolated portals, Argon2 credentials, hashed sliding sessions, registration control, development login, canonical environment settings with explicit aliases, and shared presentation-only auth blocks. Bumped to 0.1.9. See `assist/records/platform/2026-09-09-identity-portals.md`.
- Verification: Identity tests, Platform builds and E2E, MariaDB foundation tests, module checks, live portal smoke, browser checks, and `git diff --check` passed. The full check is blocked by concurrent Zetro persistence tests that still call old repository constructors.

## v-0.1.8

### [v 0.1.8] 2026-09-09 1:46 pm - Identity foundation readiness

- Database update: Yes. Added and verified the database-scoped `codexsun@localhost` account while keeping administrator access setup-only.
- Bumped the workspace to 0.1.8 and aligned npm, Tauri, and Cargo versions. Fixed runtime-holder IPC shutdown, Windows process-tree cleanup, and Button gallery build errors. MariaDB and Platform lifecycle checks passed. See `assist/records/platform/2026-09-09-identity-foundation-readiness.md`.

### [v 0.1.8] 2026-09-09 - Shared Button system

- Database update: No. Added matching `Default Version` cards for Button and Button Group with 40px controls in three borderless, scrollbar-free rows. See `assist/records/platform/2026-09-08-ui-layout-documentation.md`.

## v-0.1.7

### [v 0.1.7] 2026-09-09 1:38 pm - Add Zetro Git delivery flow

- Database update: No (manual).
- Bumped the workspace and installer to 0.1.7. Added the module-owned Git Delivery system task, repository release preview, changelog and version controls, merge or rebase pull, reviewed commit and push, flow history, and global or project settings. See `assist/records/zetro/2026-09-09-git-delivery-flow.md`.

## v-0.1.6

### [v 0.1.6] 2026-09-09 - Zetro desktop Markdown history

- Bumped the workspace and installer to 0.1.6. Added safe Markdown chat history, developer tools, and the status-bar build version. Added Module Runtime schema version 1.1.0, MariaDB preflight smoke, automatic queue reporting, and module-owned schema drift checks. See `assist/records/zetro/2026-09-09-build-version-status.md` and `assist/records/platform/2026-09-09-migration-preflight-schema-integrity.md`.

## v-0.1.5

### [v 0.1.5] 2026-09-09 - MariaDB and environment foundation

- Added and verified the shared environment loader, MariaDB setup, temporary integration database, standard `DB_*` contract, readiness checks, and lifecycle commands. See `assist/records/platform/2026-09-09-mariadb-environment-foundation.md`.

### [v 0.1.5] 2026-09-09 - UI component display page

- Database update: No. Added `UiComponentDisplayPage`, numbered variant cards, Accordion motion, persistent defaults, copy actions, and code dialogs. See `assist/records/platform/2026-09-08-ui-layout-documentation.md`.

### [v 0.1.5] 2026-09-09 - Alert callout specimen

#### Database Changes

- No database or storage change.

#### App Codebase Changes

- Replaced the generic Alert specimen with success, information, warning, and error callouts.
- Added matching semantic icons, tones, titles, and copyable default code.

#### Verification

- Verification is recorded in `assist/records/platform/2026-09-08-ui-layout-documentation.md`.

### [v 0.1.5] 2026-09-09 - UI workspace identity

#### Database Changes

- No database or storage change.

#### App Codebase Changes

- Changed the `/ui` browser title and MDI command-bar identity from `Platform` to `UI`.
- Kept the Platform system workspace identity unchanged.

#### Verification

- Verification is recorded in `assist/records/platform/2026-09-08-application-browser-titles.md`.

### [v 0.1.5] 2026-09-09 - Pre-Identity foundation hardening

#### Database Changes

- No application database schema changed.
- Added an isolated MariaDB integration harness that creates and removes a PID-scoped test database.

#### App Codebase Changes

- Added module-owned readiness probes with safe messages, owner metadata, and timeouts.
- Added neutral actor context and deny-by-default authorization contracts for the future Identity adapter.
- Added shared parsing for application-owned Zod configuration.
- Added a fail-closed complete-profile startup, health, shutdown, marker, and port-release smoke command.
- Added the Orship Failure Center and version `1.1.0` failure contracts.
- Added preflight dependency builds before listener replacement to prevent stale local package exports.
- Bumped workspace version to `0.1.5`.

#### Verification

- Passed the repository source, build, tooling, framework, runtime-holder, Orship, Zetro, Platform runtime, Platform web, and production server lifecycle gates.
- Started Orship through preflight and verified its Failure Center in the browser.
- MariaDB proof is blocked by `auth_gssapi_client` on the configured account.
- Profile smoke stopped safely because Platform web owned port `6021`.
- See `assist/records/platform/2026-09-09-pre-identity-hardening.md` and `assist/records/orship/2026-09-09-failure-center.md`.

### [v 0.1.5] 2026-09-09 - Zetro Tauri Windows desktop

#### Database Changes

- No database change. Desktop records use the existing private file repositories.

#### App Codebase Changes

- Added a Tauri 2 Windows host for the current Zetro web and API applications.
- Bundled a private Node runtime and the Zetro API into the WiX installer.
- Added application-data storage, loopback-only API access, owned process shutdown, and a native repository picker.
- Replaced unsafe size-based vendor splitting with dependency-owned chunks after it caused a blank installed WebView.
- Added a production build check that rejects circular static imports between JavaScript chunks.
- Added the first x64 MSI at `dist/apps/zetro/desktop/target/release/bundle/msi/Zetro_0.1.5_x64_en-US.msi`.

#### Verification

- Passed Rust type checks, Clippy, formatting, and one native lifecycle test.
- Passed the Zetro web production build and bundled API health check.
- Built the WiX MSI and verified the release executable starts and stops its bundled API.
- Verified the packaged WebView renders the standalone Zetro workspace without runtime exceptions.
- Confirmed installation for the earlier build. Replacement installation, uninstall, and code signing did not run.
- See `assist/records/zetro/2026-09-09-tauri-desktop.md`.

### [v 0.1.5] 2026-09-09 - Centralized Zetro settings

#### Database Changes

- No database change. Zetro stores interface preferences in browser local storage.

#### App Codebase Changes

- Mounted one Settings workspace inside the existing `/zetro` route.
- Centralized the default chat workflow and ITO visibility.
- Added theme and shared MDI feature controls.
- Kept Codex account state and device login in the existing Settings owner.
- Replaced the old Settings custom CSS with Tailwind and shared UI components.
- Made desktop packaging refresh Platform Core API before it bundles the Zetro API.
- Removed the Zetro Settings footer divider and the duplicate top folder action.

#### Verification

- Passed shared UI and Zetro web type checks and the Zetro production build.
- Verified all Settings sections and the ITO toggle in the browser.
- Built the Zetro WiX MSI with the centralized Settings workspace.
- See `assist/records/zetro/2026-09-09-centralized-settings.md`.

## v-0.1.4

### [v 0.1.4] 2026-09-09 - Runtime log organization

#### Database Changes

- No database change. Added central runtime diagnostic and failure files under private storage.

#### App Codebase Changes

- Replaced noisy repeated local logger fields with compact application and component lines.
- Retained complete JSONL records and added failure-only capture for warnings, errors, spawn failures, and unexpected exits.
- Reduced request-start and successful health-check noise to debug level.
- Added size-based rotation and the `npm.cmd run logs:failures` operator command.
- Kept Orship on the existing readable component log contract and removed duplicate runtime-holder file writes.

#### Verification

- Passed the complete repository check, including runtime log capture, Platform Core, runtime-holder, application, build-output, and server lifecycle tests.
- See `assist/records/platform/2026-09-09-runtime-log-organization.md`.

### [v 0.1.4] 2026-09-09 - Zetro chat task handoff

#### Database Changes

- No database or storage change.

#### App Codebase Changes

- Bound Send to task to project task creation and selection.
- Kept a posted task waiting until the user starts it.
- Added Review and Split task header menus.

#### Verification

- Passed the Zetro web type check, production build, and all 21 Zetro tests.
- Passed module contracts, affected lint and formatting, and browser checks.
- See `assist/records/zetro/2026-09-09-chat-task-handoff.md`.

### [v 0.1.4] 2026-09-09 8:08 am - Build and observability foundation

#### Database Changes

- No database or storage change.

#### App Codebase Changes

- Added dependency-aware Turbo tasks with root-owned caches and unique build outputs.
- Excluded the root pseudo-workspace from affected CI execution to prevent wrapper recursion.
- Added cached ESLint runs, incremental TypeScript metadata, and affected-workspace CI execution.
- Added shared Pino logging, secret redaction, request correlation, error serialization, and production JSON output.
- Added opt-in OpenTelemetry HTTP traces, request metrics, OTLP exporters, and safe exporter shutdown.
- Bound Platform, Docs, Zetro, DevKit, and Orship APIs to the shared observability adapter.
- Kept Vite and API process ownership in the existing runtime holder and central Orship log path.
- Added preflight controller ownership to prevent a replaced development stack from restarting stopped listeners.

#### Verification

- Passed five Platform Core observability tests, including local OTLP trace and metric export.
- Passed the complete repository check, Turbo output ownership contract, production chunk budget, API lifecycle E2E tests, and runtime-holder tests.
- Started the eight-service main development profile with JSON logs, verified request and correlation headers, confirmed central log capture, stopped it through Ctrl+C, and confirmed ports `6010` through `6080` were released.
- See `assist/records/platform/2026-09-09-build-observability-foundation.md`.

## v-0.1.3

### [v 0.1.3] 2026-09-09 - Zetro chat turn stop

#### Database Changes

- No database or storage change.

#### App Codebase Changes

- Removed the turn border before each new date section.
- Changed the working row and composer action to accessible stop controls with orange hover states.
- Added project-scoped turn interruption through the Codex App Server.
- Kept the saved user prompt when the active response stops.

#### Verification

- Passed the Zetro API and web builds, type checks, and all 21 Zetro tests.
- Passed module contracts, affected lint and formatting, build output, and browser checks.
- The live interruption was not exercised. The repository format check remains
  blocked by unrelated concurrent Orship and Platform Core changes.
- See `assist/records/zetro/2026-09-09-chat-turn-stop.md`.

### [v 0.1.3] 2026-09-09 - Standard MDI Main documentation page

#### Database Changes

- No database or storage change.

#### App Codebase Changes

- Kept MDI Main as the only Layout entry in the UI workspace.
- Rebuilt the MDI Main page with the shared Table documentation structure.
- Removed obsolete Dashboard, Sidebar, and Documentation previews from the Layout gallery.
- Linked MDI Main and Table through the standard bottom documentation navigation.
- Replaced the MDI section sampler with an embedded instance of the shared MDI shell.
- Rendered the real top menu, sidebar, plain workspace canvas, and status bar in the preview.
- Removed the extra empty band above the shared sidebar Overview action.
- Changed the shared Overview action from black to a neutral gray surface with foreground text.
- Replaced the generic MDI usage copy with a numbered shell structure description.
- Added ITO inspection actions to the MDI structure list and reused the existing child topology data.

#### Verification

- Passed the shared UI type check, Platform production build, lint, application and
  module documentation checks, authored-file line check, and `git diff --check`.
- Verified the MDI Main page, one-item Layout menu, live MDI composition, usage code,
  and MDI Main to Table navigation in the browser. The browser console stayed clean.
- Verified the embedded top menu, sidebar, plain canvas, status bar, and notification
  dropdown in Chrome after replacing the section sampler.
- Verified the numbered MDI structure description above the code panel in Chrome.
- Verified that a structure inspection action opens the matching ITO section and child items.
- See `assist/records/platform/2026-09-08-ui-layout-documentation.md`.

### [v 0.1.3] 2026-09-09 - Zetro dated chat timeline

#### Database Changes

- Added a creation time to each stored chat message.
- Migrated legacy messages to their conversation creation time during startup.

#### App Codebase Changes

- Added local-day sections with the first turn time to the chat timeline.
- Added a live elapsed timer only while a Codex response runs.
- Kept the active user prompt and working state inside one conversation turn.

#### Verification

- Passed the Zetro API and web builds, type checks, and all seven chat history tests.
- Verified the migrated date section and clean browser console at `/zetro`.
- The live provider timer was not exercised. The full repository check remains
  blocked by unrelated Orship formatting and type errors.
- See `assist/records/zetro/2026-09-09-dated-chat-timeline.md`.

### [v 0.1.3] 2026-09-09 - Persistent UI sidebar position

#### Database Changes

- No database or durable storage change. Sidebar state uses browser-tab session storage.

#### App Codebase Changes

- Preserved expanded UI navigation groups across page selection and refreshes.
- Restored the UI sidebar to its previous scroll position after navigation.
- Kept a new Overview session collapsed until the user opens a navigation group.

#### Verification

- Passed the shared UI type check, Platform production build, lint, application
  documentation check, authored-file line check, and `git diff --check`.
- Verified navigation from Aspect Ratio to Input Group and a browser refresh. The
  Components group and sidebar scroll position remained unchanged.
- See `assist/records/platform/2026-09-08-ui-layout-documentation.md`.

### [v 0.1.3] 2026-09-09 12:20 am - Separate Orship development runtime

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped workspace version to 0.1.3.
- Added `main-development` for Platform, Docs, Zetro, and DevKit.
- Kept Orship on its focused `dev:orship` command and added `dev:all` for the complete profile.
- Hid Windows helper processes used during lookup, build, restart, and forced shutdown.
- Fixed preflight to stop the marker-owned watch tree and reject unverified healthy listeners.
- Split Platform router values from React fallback components to preserve Fast Refresh.

#### Verification

- Validated the four-application main profile and the five-application complete profile.
- Passed ten Runtime Holder and Windows lifecycle tests.
- Started the main profile and received HTTP 200 from all eight selected components.
- Confirmed Orship ports `6090` and `6091` stayed free during the main run.
- Stopped the main profile and confirmed all ten development ports were released.
- See `assist/records/orship/2026-09-09-separate-development-runtime.md`.

## v-0.1.2

### [v 0.1.2] 2026-09-09 - Component variant cleanup

#### Database Changes

- No database or storage change.

#### App Codebase Changes

- Removed the generic component preview card and Compact variant.
- Limited component pages to variants implemented by the selected component.
- Marked a component with one composition using one green Default badge.

#### Verification

- Passed the shared UI type check, Platform production build, lint, application
  documentation check, authored-file line check, and `git diff --check`.
- Verified the Accordion page in the live browser without the preview card or Compact control.
- See `assist/records/platform/2026-09-08-ui-layout-documentation.md`.

### [v 0.1.2] 2026-09-09 - Docs sidebar tree navigation

#### Database Changes

- No database or storage change.

#### App Codebase Changes

- Added reusable nested MDI sidebar navigation with animated child headers.
- Grouped Docs as Assists → area → file and app/package → surface → file.
- Kept documents as selectable leaves and indexed those leaves in global search.

#### Verification

- Passed `npm.cmd run typecheck --workspace @codexsun/ui`.
- Passed `npm.cmd run typecheck --workspace @codexsun/docs-web`.
- Passed `npm.cmd run build --workspace @codexsun/docs-web` and `git diff --check`.
- Restarted the Docs stack and verified the tree in the browser.
- See `assist/records/docs/2026-09-08-repository-documentation-index.md`.

### [v 0.1.2] 2026-09-09 - Direct Docs overview navigation

#### Database Changes

- No database or storage change.

#### App Codebase Changes

- Replaced the expandable Overview → Index menu with one clickable Overview destination.
- Kept the Overview destination bound to the repository index page and document-selection reset.

#### Verification

- Passed the Docs web type check and production build.
- See `assist/records/docs/2026-09-08-repository-documentation-index.md`.

### [v 0.1.2] 2026-09-08 - Zetro chat workspace scope

#### Database Changes

- Extended the private conversation JSON contract with an optional workspace scope.
- Kept existing conversations readable and unscoped until the user connects a folder.

#### App Codebase Changes

- Added application, module, and connected folder settings to each Zetro chat.
- Added one hover three-dot menu to chat rows and a matching header action.
- Started Codex from the connected folder inside the isolated conversation worktree.
- Rejected root, missing, absolute, and out-of-project folder scopes.

#### Verification

- See `assist/records/zetro/2026-09-08-chat-workspace-scope.md`.

### [v 0.1.2] 2026-09-08 - Non-interactive Windows startup

#### Database Changes

- No database or storage change.

#### App Codebase Changes

- Changed Windows preflight to force-stop only the verified repository-owned listener.
- Removed the automatic port-replacement path that could open an interactive batch prompt.
- Added a Windows process lifecycle regression test to the runtime-holder test command.

#### Verification

- Passed all seven runtime-holder and Windows lifecycle tests.
- Started the complete development profile and reached ready state for all ten components.
- Confirmed that automatic listener replacement did not request terminal input.
- MariaDB readiness remains blocked by the local account's unsupported `auth_gssapi_client` plugin.
- See `assist/records/platform/2026-09-08-deployment-assembly-runtime.md`.

### [v 0.1.2] 2026-09-08 11:49 pm - Repository boundary audit

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped workspace version to 0.1.2.
- Corrected six incompatible Zetro module dependency ranges.
- Added a module manifest dependency compatibility check.
- Added version consistency and the complete Zetro suite to the root quality gate.

#### Verification

- Passed the complete root `check` gate with 22 workspaces and 14 module manifests.
- Passed all web builds with 190 production chunks below the 400 KB limit.
- Passed framework, runtime, Orship, Zetro, Platform runtime, Platform web, and server lifecycle tests.
- See `assist/records/platform/2026-09-08-repository-boundary-audit.md`.

## v-0.1.1

### [v 0.1.1] 2026-09-08 - Dedicated UI component variants

#### Database Changes

- No database or storage change.

#### App Codebase Changes

- Replaced repeated category galleries with a dedicated live specimen for every UI component route.
- Added Default and Compact component variants with a stable default resolver and URL selection.
- Kept Table and Form block pages bound to their composed defaults without component variant controls.
- Updated the UI template-page guide with the dedicated-page and default-binding rules.

#### Verification

- Passed the shared UI type check, Platform production build, lint, documentation checks,
  authored-file line check, format check, and `git diff --check`.
- Verified dedicated navigation, form, and overlay component pages in the live browser.
- Verified the Table block remains bound to its default composition.
- See `assist/records/platform/2026-09-08-ui-layout-documentation.md`.

### [v 0.1.1] 2026-09-08 - Application browser titles

#### Database Changes

- No database or storage change.

#### App Codebase Changes

- Aligned every web document title with its MDI application name.
- Changed the Platform title to `Platform` and the Docs title to `Docs`.
- Bound the shared MDI document title to its `applicationName` property.
- Removed the shared UI Gallery override that replaced the Platform title.
- Added the exact-title rule to the application and web UI guides.

#### Verification

- Verified the Platform, Docs, DevKit, Zetro, and Orship HTML titles.
- See `assist/records/platform/2026-09-08-application-browser-titles.md`.

### [v 0.1.1] 2026-09-08 - Grouped Orship service operations 1.0.1

#### Database Changes

- No database or storage change.

#### App Codebase Changes

- Replaced separate service rows with numbered application rows and connected API and web nodes.
- Added balanced row-edge padding and simplified status and process metrics.
- Moved the selected service metrics and runtime logs into a full-width bottom inspector.

#### Verification

- Passed focused Orship type checks, tests, and a warning-free production build.
- Verified grouping, spacing, selection, bottom logs, and console health in the live browser.
- See `assist/records/orship/2026-09-08-grouped-service-operations.md`.

### [v 0.1.1] 2026-09-08 - Repository documentation index

#### Database Changes

- No schema change.

#### App Codebase Changes

- Indexed repository Markdown and MDX files while excluding generated and dependency directories.
- Added an ordered Docs index and matching sidebar groups for repository documentation.

#### Verification

- Passed Docs API and web type checks.

### [v 0.1.1] 2026-09-08 - Container source root

#### Database Changes

- No database or storage change.

#### App Codebase Changes

- Renamed the root deployment source folder from `deployments` to `.container`.
- Updated Runtime Holder, Orship discovery, Docker template, test, governance, and documentation bindings.
- Kept generated artifacts below `dist/deployments` to preserve the single root build-output rule.

#### Verification

- Passed runtime validation, the platform-only plan and Compose generation, Runtime Holder tests, and Orship tests.
- See `assist/records/platform/2026-09-08-container-source-root.md`.

### [v 0.1.1] 2026-09-08 10:44 pm - Orship operations application

#### Database Changes

- No database schema change. Local runtime markers and logs remain below the central private storage root.

#### App Codebase Changes

- Added Orship contracts, Fastify API, and shared-MDI web workspaces for live service health, process metrics, logs, and guarded local start or stop actions.
- Registered Orship in preflight, the development deployment profile, Runtime Holder, and the shared application switcher.
- Added root-owned process markers so Orship controls only verified repository listeners and protects its own control-plane components.
- Bumped the workspace release version to 0.1.1.

#### Verification

- Passed the complete root gate, focused Orship tests, deployment catalog validation, an owned Docs API stop/start/log cycle, and Orship stack shutdown with port release.
- See `assist/records/orship/2026-09-08-operations-foundation.md`.

## v-0.1.0

### [v 0.1.0] 2026-09-08 - Shared Form block and complete UI documentation catalog

#### Database Changes

- No database or storage change.

#### App Codebase Changes

- Added the reusable Form block with animated tabs, searchable lookup fields, active state,
  and icon actions.
- Moved the Form title and actions into one compact top toolbar and removed the lower action
  footer to save vertical space.
- Split the Form toolbar and body into separate bordered surfaces with a small gap.
- Split the UI workspace navigation into Layouts, Blocks, and Components.
- Set the UI workspace browser title to `CODEXSUN UI` and increased the space below
  the documentation tool strip.
- Restyled UI navigation with compact section headers, indented child rails, and
  collapsed sections at initial load.
- Added related Layouts, Blocks, and Components header icons and smoother rail transitions.
- Registered Table and Form as blocks and generated component documentation routes from the
  complete shared component catalog.

#### Verification

- Passed the shared UI type check, Platform production build, lint, documentation checks,
  authored-file line check, and `git diff --check`.
- Verified the live Form route, lookup options, Blocks navigation, and Accordion component route.
- See `assist/records/platform/2026-09-08-ui-layout-documentation.md`.

### [v 0.1.0] 2026-09-08 - DevKit Project Registry 0.7.1 shared profile tables

#### Database Changes

- No schema or JSON storage change.

#### App Codebase Changes

- Replaced all DevKit profile tables with `@codexsun/ui/blocks/table`.
- Added compact section-table support for profile details and specifications.

#### Verification

- Passed shared UI and DevKit web type checks, the production build, and the raw-table source scan.
- Selectable multi-application deployment runtime
- Added the runtime catalog, profiles, selected workspace builds, immutable plans, and Compose templates.
- Registered Platform, Docs, DevKit, and Zetro in the complete development profile.
- Passed the runtime test suite and the complete root gate. Docker engine testing remains pending.
- Durable modular runtime and event foundation
- Added module lifecycle state, immutable migration checksums, request context, and versioned in-process events.
- Passed framework, Platform Core, API, and production lifecycle checks. Live MariaDB recovery remains pending.
- Platform and framework foundation
- Added the first module, application, development-record, and runtime standards.
- Added Platform System API and web modules with health, readiness, and lifecycle verification.
- Connected Docs workspace and release workflow
- Added the connected MDX Docs API and web workspace with Obsidian-compatible source links.
- Added repository version and interactive GitHub release tooling.
- CODEXSUN foundation
- Established the CODEXSUN application platform, documentation workspace, and module ownership baseline.
- Zetro agent workspace
- Added Zetro API and web workspaces, JSON persistence, Codex connection flow, task management, and release workflow.
- Passed Zetro focused checks and browser reviews recorded in the Zetro development records.
- Zetro project workspaces
- Added project identity and tagline settings, repository browsing, project workspaces, chat and task lists, archived-task restore, provider context, and Codex worktrees.
- DevKit hierarchical module planning
- Added project-to-module drill-down, guarded node upserts, profile entry upserts, and profile tabs.
- DevKit terminal module profiles
- Made modules terminal and opened profiles directly from module names.
- Migrated legacy planning records without changing their IDs.
- DevKit access-control registry
- Moved User endpoint data into User and added Role, Permission, User role, and Role permission profiles.
- Zetro response actions
- Simplified message actions and removed workflow and worktree details from user-facing chat messages.
- Zetro archived chats
- Added archive, restore, and archived-chat navigation behavior.
- Zetro Codex launch recovery
- Added recovery states for failed Codex launch and worktree setup.
- Zetro agent chat foundation
- Added the agent-chat module, typed fallback behavior, and shared workspace integration.
- UI layout documentation workspace
- Added UI layout documentation, live previews, and copyable usage examples.
- UI workspace reset
- Reset the workspace composition and removed obsolete local layout behavior.
- Dynamic MDI sidebar and isolated ITO desks
- Added application-owned MDI navigation and isolated interface topology desks.
- ITO desk selector
- Added a selector for shared and application interface topology desks.
- Shared design system and workspace blocks
- Added shared theme behavior, workspace blocks, action cards, and metric surfaces.
- Reusable data-table block and DevKit registry table
- Added the TanStack and shadcn table block with filters, columns, totals, actions, and pagination.
- Zetro Task System
- Added task creation, lifecycle controls, task details, and persisted task workflows.
- Zetro empty Desk reset
- Added an explicit empty Desk state and reset path.
- MDI top-menu controls
- Added shared global search, notifications, app switching, and profile controls.
- DevKit project registry
- Added the DevKit API, web workspace, JSON registry, preflight startup, and planning confirmation flow.
- Cross-app interface topology
- Added shared cross-application topology contracts and browser-visible inspections.
- Durable module runtime preparation
- Prepared durable module runtime ownership, repository contracts, and migration boundaries.
- Docs library experience
- Added connected Docs navigation, rendering, loading, retry, and empty states.
- Safe runtime manifest boundary
- Added manifest validation and composition safeguards for runtime modules.
- Extensible application and add-on foundation
- Added extension points, compatibility checks, and add-on composition rules.
- Docs Ideas development plan
- Added the Docs Ideas page with planning flow charts and linked development phases.
- Smooth global Docs loader
- Added the shared Docs loader and reduced refresh flicker.
- Shared UI gallery and interface topology
- Added shared UI Gallery documentation and interface topology controls.
- Docs global loading transition
- Added Docs loading transitions for route and document refreshes.
- Framework capability roadmap
- Added the framework capability roadmap and implementation guidance.
- Docs navigation refinement
- Refined Docs navigation, grouping, and reader width.
- Centralized UI and MDI application layout
- Centralized shared MDI layout ownership in `@codexsun/ui`.
