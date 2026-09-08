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

- Current version: 0.1.1
- Release tag: v-0.1.1
- Changelog label: v 0.1.1

## v-0.1.1

### [v 0.1.1] 2026-09-08 10:44 pm - Orship operations application

#### Database Changes

- Database update: Yes (auto-check).

#### App Codebase Changes

- Bumped workspace version to 0.1.1.

## v-0.1.0

### [v 0.1.0] 2026-09-08 - Orship operations application 0.1.0

#### Database Changes

- No database schema change. Local runtime markers and logs remain below the central private storage root.

#### App Codebase Changes

- Added Orship contracts, Fastify API, and shared-MDI web workspaces for live service health, process metrics, logs, and guarded local start or stop actions.
- Registered Orship in preflight, the development deployment profile, Runtime Holder, and the shared application switcher.
- Added root-owned process markers so Orship controls only verified repository listeners and protects its own control-plane components.

#### Verification

- Passed focused Orship type checks, builds, tests, deployment catalog validation, and an owned Docs API stop/start/log cycle.
- See `assist/records/orship/2026-09-08-operations-foundation.md`.

### [v 0.1.0] 2026-09-08 - Shared Form block and complete UI documentation catalog

#### Database Changes

- No database or storage change.

#### App Codebase Changes

- Added the reusable Form block with animated tabs, searchable lookup fields, active state,
  and icon actions.
- Split the UI workspace navigation into Layouts, Blocks, and Components.
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
- Added project workspaces, project properties, chat and task lists, archived-task restore, provider context, and Codex worktrees.
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
