# CODEXSUN Changelog

## Changelog Rules

- Keep this as the only CODEXSUN changelog; add the newest root release after these rules with the exact heading `### [v X.Y.Z] YYYY-MM-DD - Title`, using the root version and stating module versions in the title or body.
- Log completed work only. For a detailed entry, include Database Changes, App Codebase Changes, and Verification with passed and unrun checks.
- Keep entries concise and link the owning record. Run `npm.cmd run github:now -- --dry-run` before a release commit, and keep this file at 700 lines or fewer.

## Version State

- Current version: 0.1.33
- Release tag: v-0.1.33
- Changelog label: v 0.1.33

## v-0.1.33

### [v 0.1.33] 11/09/2026 10:28 am - Zetro concurrent durable chat

#### Database Changes

- Database update: Yes.

#### App Codebase Changes

- Zetro Chat API 1.1.0 and Shell Web 2.2.0 add accepted turns, durable sequence events, reconnectable SSE, concurrent conversations, single-turn ordering, and Codex thread recovery. See the [development record](../records/zetro/2026-09-11-zetro-concurrent-durable-chat.md).

#### Verification

- Passed focused type checks, lint, SQLite tests, production builds, API health, concurrent conversation, same-conversation guard, stop, and provider-thread restart checks.

### [v 0.1.33] 2026-09-11 9:29 am - working on zetro again

- Database update: Yes (auto-check).
- Bumped workspace version to 0.1.33.

## v-0.1.32

### [v 0.1.32] 2026-09-10 9:17 pm - Zetro governed task foundation

- Database changes: None. Existing Zetro task records remain compatible.
- App changes: Chat defaults to read-only planning. Reviewed plans create scoped Project Tasks, and Start creates one linked System Task attempt.
- Verification: The Zetro daily gate and Windows MSI checks are recorded in the [desktop build record](../records/zetro/2026-09-10-desktop-0.1.32.md). Verify, human acceptance, delivery, and installed acceptance remain separate open gates.

## v-0.1.31

### [v 0.1.31] 2026-09-10 7:54 pm - Zetro daily coding readiness and startup verification

- Database changes: None. Workspace versions now use 0.1.31. App changes: Added startup verification, explicit shared-package scopes, live chat updates, readable sidebar selection, draft protection, and scroll following.
- Verification: Daily coding checks, warning-free MSI build, and packaged API lifecycle test passed. The installer is unsigned and was not installed or published. See the [desktop build record](../records/zetro/2026-09-10-desktop-0.1.31.md) for artifact evidence and remaining acceptance checks.

### [v 0.1.30] 2026-09-10 5:42 pm - Platform Identity fixture experiment through Zetro

- No database changes. Identity 1.3.0 gains test-only disposable three-portal fixture support with connection and empty-schema guards. Zetro's candidate run failed inspection commands. The supervisor corrected the patch. See the [experiment record](../records/platform/2026-09-10-p001-fixture-experiment.md). The unsigned 0.1.30 MSI build and packaged runtime test passed. See the [desktop release log](../records/zetro/2026-09-10-desktop-0.1.30.md).

### [v 0.1.29] 2026-09-10 5:14 pm - Zetro sandbox working directory repair

- No database changes. Codex Connection 0.10.1 resolves physical sandbox paths. Desktop probes use home storage instead of protected MSIX AppData.
- Regression tests and both live execution probes passed. See the [repair record](../records/zetro/2026-09-10-sandbox-path-repair.md) for installed verification and release limits.

### [v 0.1.28] 2026-09-10 4:44 pm - Zetro verified sandbox and chat readiness

- Database Changes: None. Existing accounts, conversations, and migrations are preserved. App Codebase Changes: Codex Connection API 0.10.0 and Settings web 0.5.0 add verified Windows sandbox gating, explicit localhost policy, status controls, and short host-written probes.
- Verification: Live chat and sandbox evidence, release checks, artifact details, and remaining production gates are recorded in the [0.1.28 release log](../records/zetro/2026-09-10-desktop-0.1.28.md).

### [v 0.1.27] 2026-09-10 3:17 pm - Zetro scope validation and stability checks

- No database changes. Chat API 0.16.0, Agent Chat web 0.13.1, Codex Connection 0.9.1, and Supervisor API 0.3.0 fix scope validation gaps. See the [verification record](../records/zetro/2026-09-10-stability-0.1.27.md) and [stability prompt](../tasks/zetro-stability-verification.md).

### [v 0.1.26] 2026-09-10 2:55 pm - Zetro confirmed workspace scope and documentation permissions

- No database changes. Chat API 0.15.0, Agent Chat web 0.13.0, and Codex Connection 0.9.0 add confirmed scope and explicit documentation roots. See the [release log](../records/zetro/2026-09-10-scope-binding.md).

### [v 0.1.25] 2026-09-10 2:37 pm - Zetro chat activity details contract repair

- No database changes. Agent Chat web 0.12.1 accepts bounded optional failure details. See the [repair record](../records/zetro/2026-09-10-chat-activity-details.md) for tests and packaging evidence.

### [v 0.1.24] 2026-09-10 2:09 pm - Zetro automation evidence and Identity browser repairs

- Database Changes: None. Automation web 0.4.1, Supervisor API 0.2.1, and Identity web 1.1.2 are included. See the [release record](../records/zetro/2026-09-10-desktop-0.1.24.md) for verification and remaining acceptance gates.

### [v 0.1.23] 2026-09-10 12:30 pm - Identity API 1.2.0 atomic registration and session revocation

- Database Changes: Identity schema 1.2.0 adds immutable migration 0004 for authentication generations; existing checksums are unchanged. Desktop 0.1.23 was later built, upgraded, and verified. See the [upgrade record](../records/zetro/2026-09-10-desktop-0.1.23.md).
- Follow-up source: Identity API 1.3.0 adds the public access-check client ([client record](../records/platform/2026-09-10-identity-public-client.md)). Identity web 1.1.2 fixes browser auth bindings ([browser record](../records/platform/2026-09-10-identity-browser-acceptance.md)). Zetro Automation 0.4.1 and Supervisor 0.2.1 separate run labels, observed timeline, response, and summary ([evidence record](../records/zetro/2026-09-10-automation-evidence-clarity.md)). No new migration or installed release. P001 remains open.
- App Codebase Changes: Atomic registration, first-device serialization, permanent session revocation, and safe login denials. Verification: Identity service and disposable MariaDB regressions passed. Full adoption and Docker gates remain open. See the [record](../records/platform/2026-09-10-identity-concurrency.md).

### [v 0.1.22] 2026-09-10 12:05 pm - Zetro live execution visuals and shared UI status

- Database Changes: None. Root version `0.1.22`. App Codebase Changes: Automation web `0.4.0` uses the package-owned Execution Status block and UIUX specimen. Verification: root check, UI tests, browser states, MSI upgrade, and packaged lifecycle passed. Unsigned; business and Docker acceptance remain gated. See the [release record](../records/zetro/2026-09-10-live-execution-visuals.md).

### [v 0.1.21] 2026-09-10 11:42 am - Zetro live automation progress and desktop release

- Database Changes: None. Workspace and desktop version `0.1.21`. App Codebase Changes: Added bounded public response/tool snapshots and Automation detail binding. Verification: Zetro tests, targeted checks, MSI build/upgrade, installed provider smoke, and shutdown/relaunch passed. Unsigned; native visual and full release gates remain unverified. See the [release record](../records/zetro/2026-09-10-desktop-0.1.21.md).

### [v 0.1.20] 2026-09-10 10:45 am - Zetro release verification and framework task continuation

- Database Changes: None. Aligned workspace, Tauri, and Rust versions to `0.1.20`. Follow-up: Replaced installed Zetro `0.1.19` with `0.1.20`, preserving its database. Repaired Platform cookie/bearer actor binding and current-user portal validation; see the [P001 record](../records/platform/2026-09-10-identity-session-binding.md). Full Platform and application adoption remain gated.
- UI follow-up: Automation web `0.3.0` adds separate live, history, and report pages with real connection status. System Tasks web `1.1.0` guards stale selection. See the [observation record](../records/zetro/2026-09-10-automation-observation.md) for tests and streaming limits. Installer unchanged.
- App Codebase Changes: Made Developer Tools Git fixtures independent of user line-ending settings. Framework now retains failed cleanup ownership, permits cleanup retry, and blocks unsafe lifecycle operations.
- Verification: Full checks, 19 kernel tests, Zetro follow-up review, MariaDB, Platform lifecycle smoke, and installed desktop shutdown passed. F001 technical work is complete; stable approval remains separate. See the [verification log](../records/zetro/2026-09-10-desktop-0.1.20-verification.md).

### [v 0.1.19] 2026-09-10 10:15 am - Staged release workflow and Zetro execution repairs

- Database Changes: None. Candidate `0.1.19` adds staged release checks and the F001 task card. App Codebase Changes: Developer Tools `1.0.1` runs npm through Node on Windows. Codex Connection `0.7.2` interrupts timed-out turns. Framework guards concurrent lifecycle calls, freezes registered manifests, and isolates observable reporter errors.
- Verification: Seventeen kernel tests, real script execution, timeout regression, and packaged script-task E2E passed. Zetro review returned findings but failed one inspection command; stable approval remains open. See the [workflow record](../records/zetro/2026-09-10-stable-release-workflow.md).

### [v 0.1.18] 2026-09-10 9:17 am - Zetro desktop supervisor bridge

- Database Changes: None. Existing Chat and System Tasks tables own supervisor history. Added Supervisor `0.1.0`, public Chat `0.13.0`, System Tasks `1.1.0`, Codex connection `0.7.1`, CLI desktop pairing, confirmed project connection, graceful shutdown, and Windows worktree fixes. Preserved parallel UIUX, shared UI, application, and deployment changes. Root checks, MariaDB foundation, packaged API lifecycle, and desktop checks passed. Platform-only smoke was blocked by occupied port 6010. See [desktop supervisor record](../records/zetro/2026-09-10-desktop-supervisor.md) for live evidence and release limits.

### [v 0.1.17] 2026-09-10 8:09 am - Shared UI audit and Zetro automation

- Database Changes: None. Aligned versions to `0.1.17`. Added shared UI audit, CLI and Automation bindings, and review-only agent diagnosis. Pre-build, audit, tests, lint, type checks, module gates, Rust checks, and WiX passed. Installation and signing did not run. See `assist/records/zetro/2026-09-10-desktop-0.1.17-build.md` and `assist/records/zetro/2026-09-10-shared-ui-automation-audit.md`.

### [v 0.1.16] 2026-09-10 7:50 am - Centralized UI ownership and application reuse

- Database Changes: None. Aligned metadata to `0.1.16`, centralized UI in `packages/ui`, replaced app-native controls, and added application audits and Zetro entry points. Ownership, format, documentation, boundary, lint, and type checks passed. Browser and installer checks did not run. See `assist/records/ui/2026-09-10-ui-gallery-application-ownership.md` and `assist/records/zetro/2026-09-10-shared-ui-automation-audit.md`.

### [v 0.1.15] 2026-09-09 10:39 pm - Independent UI application

- Database Changes: None. Added the independent gallery, Documentation Workspace, runtime bindings, app map, and Zetro Agent Workspace while keeping reusable UI in `packages/ui`. Focused checks and the Zetro MSI build passed; installation and signing did not run. See `assist/records/ui/2026-09-09-independent-ui-application.md`, `assist/records/zetro/2026-09-09-agent-workspace-rails.md`, and `assist/records/ui/2026-09-10-ui-gallery-application-ownership.md`.

### [v 0.1.14] 2026-09-09 9:23 pm - Automation, agent operations, and platform foundations

- Database Changes: Added Identity device, session, role, verification, and security-event persistence. App Codebase Changes: Added Agent Crew runtimes, Orship repository operations, Docs architecture views, shared Agent Workspace and UI design-system controls, Zetro model and attachment input, task planning, the Automation CLI/workspace, desktop `0.1.14` metadata, real Login/Register page variants, Forgot Password, Notifications Page, validated page defaults, and the independent UI showcase application on port `6130`. Shared components, blocks, pages, layouts, templates, gallery specimens, example data, and design-system contracts remain package-owned. Verification: The complete repository check, runtime validation, and MariaDB foundation test passed before the UI extraction; focused UI checks are recorded in `assist/records/ui/2026-09-09-independent-ui-application.md`. The Zetro desktop executable reports `0.1.14`. The platform-only smoke did not run because an active `platform-web` service owns port `6021`; installation and live application checks did not run. See `assist/records/platform/2026-09-09-ui-page-templates.md` and the linked application development records.

### [v 0.1.13] 2026-09-09 8:12 pm - Identity security and Zetro Windows desktop build

- Database Changes: Added module-owned identifiers, devices, session binding, security events, and a seed. App Codebase Changes: Added three-identifier login, cross-client sessions, device approval, monitoring, administrator controls, provider ports, origin checks, and timing protection. Built the Zetro `0.1.13` executable and WiX MSI with the shared chat input pipeline. Added the shared Agent Workspace layout and a deterministic Automation CLI/workspace with durable run monitoring and reviewed agent diagnosis. Verification: Focused Identity, Zetro, UI, and Platform checks passed. CLI and script allowlist tests passed. The MSI and executable report `0.1.13`. Installation, live multimodal, and live automation checks did not run. See `assist/records/platform/2026-09-09-identity-cross-client-security.md`, `assist/records/platform/2026-09-09-agent-workspace-layout.md`, `assist/records/zetro/2026-09-09-desktop-0.1.13-build.md`, and `assist/records/zetro/2026-09-09-deterministic-automation-cli.md`.

### [v 0.1.12] 2026-09-09 5:07 pm - Zetro desktop, model selection, and chat input capture

- Database update: No (auto-check). Bumped to 0.1.12. Added desktop port `16050`, Codex model selection, multimodal chat input, compact repository indicators, and the UI Design System registry. Zetro API, web, desktop, model selector, UI, and browser checks passed. Live model, multimodal, and packaged desktop checks did not run. See `assist/records/platform/2026-09-09-ui-design-system-registry.md`, `assist/records/zetro/2026-09-09-codex-model-selection.md`, and `assist/records/zetro/2026-09-09-chat-input-capture.md`.

### [v 0.1.9] 2026-09-09 2:47 pm - Identity portal foundation

- Database and App Changes: Added module-owned Identity tables, the default super-administrator seed, three isolated portals, Argon2 credentials, hashed sessions, registration control, and shared auth blocks. Bumped to 0.1.9. Identity tests, Platform builds and E2E, MariaDB tests, module checks, portal smoke, browser checks, and `git diff --check` passed. The full check was blocked by concurrent Zetro persistence tests. See `assist/records/platform/2026-09-09-identity-portals.md`.

### [v 0.1.8] 2026-09-09 1:46 pm - Identity foundation readiness

- Database update: Yes. Added the database-scoped `codexsun@localhost` account. Bumped to 0.1.8 and aligned npm, Tauri, and Cargo versions. Fixed runtime-holder shutdown, Windows process cleanup, and Button gallery errors. MariaDB and Platform lifecycle checks passed. See `assist/records/platform/2026-09-09-identity-foundation-readiness.md`.

### [v 0.1.8] 2026-09-09 - Shared Button system

- Database update: No. Added matching `Default Version` cards for Button and Button Group with 40px controls in three borderless, scrollbar-free rows. See `assist/records/platform/2026-09-08-ui-layout-documentation.md`.

### [v 0.1.7] 2026-09-09 1:38 pm - Add Zetro Git delivery flow

- Database update: No (manual).
- Bumped the workspace and installer to 0.1.7. Added the module-owned Git Delivery system task, repository release preview, changelog and version controls, merge or rebase pull, reviewed commit and push, flow history, and global or project settings. See `assist/records/zetro/2026-09-09-git-delivery-flow.md`.

### [v 0.1.6] 2026-09-09 - Zetro desktop Markdown history

- Bumped the workspace and installer to 0.1.6. Added safe Markdown chat history, developer tools, and the status-bar build version. Added Module Runtime schema version 1.1.0, MariaDB preflight smoke, automatic queue reporting, and module-owned schema drift checks. See `assist/records/zetro/2026-09-09-build-version-status.md` and `assist/records/platform/2026-09-09-migration-preflight-schema-integrity.md`.

### [v 0.1.5] 2026-09-09 - MariaDB and environment foundation

- Added and verified the shared environment loader, MariaDB setup, temporary integration database, standard `DB_*` contract, readiness checks, and lifecycle commands. See `assist/records/platform/2026-09-09-mariadb-environment-foundation.md`.

### [v 0.1.5] 2026-09-09 - UI component display page

- Database update: No. Added `UiComponentDisplayPage`, numbered variant cards, Accordion motion, persistent defaults, copy actions, and code dialogs. See `assist/records/platform/2026-09-08-ui-layout-documentation.md`.

### [v 0.1.5] 2026-09-09 - Alert callout specimen

- Database update: No. Added success, information, warning, and error Alert specimens with semantic icons, tones, titles, and copyable code. Verification is recorded in `assist/records/platform/2026-09-08-ui-layout-documentation.md`.

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
- The live interruption was not exercised. The repository format check remains blocked by unrelated concurrent Orship and Platform Core changes.
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

- Passed the shared UI type check, Platform production build, lint, application and module documentation checks, authored-file line check, and `git diff --check`.
- Verified the MDI Main page, one-item Layout menu, live MDI composition, usage code, and MDI Main to Table navigation in the browser. The browser console stayed clean.
- Verified the embedded top menu, sidebar, plain canvas, status bar, and notification dropdown in Chrome after replacing the section sampler.
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
- The live provider timer was not exercised. The full repository check remains blocked by unrelated Orship formatting and type errors.
- See `assist/records/zetro/2026-09-09-dated-chat-timeline.md`.

### [v 0.1.3] 2026-09-09 - Persistent UI sidebar position

#### Database Changes

- No database or durable storage change. Sidebar state uses browser-tab session storage.

#### App Codebase Changes

- Preserved expanded UI navigation groups across page selection and refreshes.
- Restored the UI sidebar to its previous scroll position after navigation.
- Kept a new Overview session collapsed until the user opens a navigation group.

#### Verification

- Passed the shared UI type check, Platform production build, lint, application documentation check, authored-file line check, and `git diff --check`.
- Verified navigation from Aspect Ratio to Input Group and a browser refresh. The Components group and sidebar scroll position remained unchanged.
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

### [v 0.1.2] 2026-09-09 - Component variant cleanup

- No database change. Removed the generic preview card and Compact variant; pages now show only implemented variants and use a green Default badge for one composition.
- Passed shared UI and Platform checks and verified Accordion in the browser. See `assist/records/platform/2026-09-08-ui-layout-documentation.md`.

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

- No database change. Replaced Overview → Index with one repository-index destination and document-selection reset.
- Passed the Docs web type check and build. See `assist/records/docs/2026-09-08-repository-documentation-index.md`.

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

### [v 0.1.1] 2026-09-08 - Dedicated UI component variants

#### Database Changes

- No database or storage change.

#### App Codebase Changes

- Replaced repeated category galleries with a dedicated live specimen for every UI component route.
- Added Default and Compact component variants with a stable default resolver and URL selection.
- Kept Table and Form block pages bound to their composed defaults without component variant controls.
- Updated the UI template-page guide with the dedicated-page and default-binding rules.

#### Verification

- Passed the shared UI type check, Platform production build, lint, documentation checks, authored-file line check, format check, and `git diff --check`.
- Verified dedicated navigation, form, and overlay component pages in the live browser.
- Verified the Table block remains bound to its default composition.
- See `assist/records/platform/2026-09-08-ui-layout-documentation.md`.

### [v 0.1.1] 2026-09-08 - Application browser titles

- No database change. Aligned each web title with its MDI application name and documented the exact-title rule.
- Verified Platform, Docs, DevKit, Zetro, and Orship titles. See `assist/records/platform/2026-09-08-ui-layout-documentation.md`.

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

### [v 0.1.0] 2026-09-08 - Shared Form block and complete UI documentation catalog

#### Database Changes

- No database or storage change.

#### App Codebase Changes

- Added the reusable Form block with animated tabs, searchable lookup fields, active state, and icon actions.
- Moved the Form title and actions into one compact top toolbar. Removed the lower action footer to save vertical space.
- Split the Form toolbar and body into separate bordered surfaces with a small gap.
- Split UI navigation into Layouts, Blocks, and Components. Added related header icons and smoother rail transitions.
- Set the browser title to `CODEXSUN UI` and increased the space below the documentation tool strip.
- Restyled UI navigation with compact section headers, indented child rails, and collapsed initial sections.
- Registered Table and Form as blocks. Generated documentation routes from the complete shared component catalog.

#### Verification

- Passed the shared UI type check, Platform production build, lint, documentation checks, authored-file line check, and `git diff --check`.
- Verified the live Form route, lookup options, Blocks navigation, and Accordion component route.
- See `assist/records/platform/2026-09-08-ui-layout-documentation.md`.

### [v 0.1.0] 2026-09-08 - DevKit Project Registry 0.7.1 shared profile tables

- Database Changes: No schema or JSON storage change.
- App Codebase Changes: Replaced DevKit profile tables with `@codexsun/ui/blocks/table`, including compact profile details and specifications.
- Verification: Shared UI and DevKit web type checks, the production build, and the raw-table source scan passed.
- Selectable multi-application deployment runtime: added the runtime catalog, profiles, selected workspace builds, immutable plans, and Compose templates.
- Registered Platform, Docs, DevKit, and Zetro in the complete development profile.
- Passed the runtime test suite and the complete root gate. Docker engine testing remains pending.
- Durable modular runtime and event foundation: added module lifecycle state, immutable migration checksums, request context, and versioned in-process events.
- Passed framework, Platform Core, API, and production lifecycle checks. Live MariaDB recovery remains pending.
- Platform and framework foundation: added the first module, application, development-record, and runtime standards.
- Added Platform System API and web modules with health, readiness, and lifecycle verification.
- Connected Docs workspace and release workflow: added the connected MDX Docs API and web workspace with Obsidian-compatible source links.
- Added repository version and interactive GitHub release tooling. **CODEXSUN foundation:** Established the CODEXSUN application platform, documentation workspace, and module ownership baseline.
- Zetro agent workspace: added Zetro API and web workspaces, JSON persistence, Codex connection flow, task management, and release workflow.
- Passed Zetro focused checks and browser reviews recorded in the Zetro development records.
- Zetro project workspaces: added project identity and tagline settings, repository browsing, project workspaces, chat and task lists, archived-task restore, provider context, and Codex worktrees.
- **DevKit hierarchical module planning:** Added project-to-module drill-down, guarded node upserts, profile entry upserts, and profile tabs.
- **DevKit terminal module profiles:** Made modules terminal and opened profiles directly from module names. Migrated legacy planning records without changing their IDs.
- **DevKit access-control registry:** Moved User endpoint data into User and added Role, Permission, User role, and Role permission profiles.
- **Zetro response actions:** Simplified message actions and removed workflow and worktree details from user-facing chat messages.
- **Zetro archived chats:** Added archive, restore, and archived-chat navigation behavior.
- **Zetro Codex launch recovery:** Added recovery states for failed Codex launch and worktree setup.
- **Zetro agent chat foundation:** Added the agent-chat module, typed fallback behavior, and shared workspace integration.
- **UI layout documentation workspace:** Added UI layout documentation, live previews, and copyable usage examples.
- **UI workspace reset:** Reset the workspace composition and removed obsolete local layout behavior.
- **Dynamic MDI sidebar and isolated ITO desks:** Added application-owned MDI navigation and isolated interface topology desks.
- **ITO desk selector:** Added a selector for shared and application interface topology desks.
- **Shared design system and workspace blocks:** Added shared theme behavior, workspace blocks, action cards, and metric surfaces.
- **Reusable data-table block and DevKit registry table:** Added the TanStack and shadcn table block with filters, columns, totals, actions, and pagination.
- **Zetro Task System:** Added task creation, lifecycle controls, task details, and persisted task workflows.
- **Zetro empty Desk reset:** Added an explicit empty Desk state and reset path.
- **MDI top-menu controls:** Added shared global search, notifications, app switching, and profile controls.
- **DevKit project registry:** Added the DevKit API, web workspace, JSON registry, preflight startup, and planning confirmation flow.
- **Cross-app interface topology:** Added shared contracts and browser-visible inspections.
- **Durable module runtime preparation:** Prepared runtime ownership, repository contracts, and migration boundaries.
- **Docs library experience:** Added connected navigation, rendering, loading, retry, and empty states.
- **Safe runtime manifest boundary:** Added manifest validation and composition safeguards.
- **Extensible application and add-on foundation:** Added extension points, compatibility checks, and add-on composition rules.
- **Docs Ideas development plan:** Added planning flow charts and linked development phases.
- **Smooth global Docs loader:** Added the shared loader and reduced refresh flicker.
- **Shared UI gallery and interface topology:** Added gallery documentation and topology controls.
- **Docs global loading transition:** Added loading transitions for route and document refreshes.
- **Framework capability roadmap:** Added the capability roadmap and implementation guidance.
- **Docs navigation refinement:** Refined navigation, grouping, and reader width.
- **Centralized UI and MDI application layout:** Centralized shared MDI ownership in `@codexsun/ui`.
