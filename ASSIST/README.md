# ASSIST Guide

## Purpose

`ASSIST/` is the development operating manual for this repository.

When the user says `Read ASSIST/README.md`, treat that as an instruction to load the current ASSIST guidance first, retain it for the rest of the task, and only then begin implementation work.

This file is the entry point. `ASSIST/AI_RULES.md` and `ASSIST/Documentation/ARCHITECTURE.md` remain the authoritative rule and structure sources when details here are summarized.

## Start Rule

Before writing code, changing files, or proposing implementation:

1. read `ASSIST/README.md`
2. read `ASSIST/AI_RULES.md`
3. read `ASSIST/Documentation/ARCHITECTURE.md`
4. read `ASSIST/Documentation/PROJECT_OVERVIEW.md`
5. read `ASSIST/Documentation/SETUP_AND_RUN.md`
6. read `ASSIST/Documentation/SUPPORT_ASSISTANT_BOUNDARY.md`
7. read current files under `ASSIST/Documentation` and `ASSIST/Discipline` as needed for the task
8. read `ASSIST/Execution/TASK.md` and `ASSIST/Execution/PLANNING.md` when the batch is being tracked as active execution work
9. read `apps/ui/src/design-system/data/project-defaults.ts` before shared UI changes and then inspect `apps/ui/src/registry`, `apps/ui/src/registry/blocks`, and `apps/ui/src/components/blocks` when reusable UI composition is involved
10. internalize the active rules, ownership boundaries, workflow constraints, and documentation discipline before implementation

Do not begin development from partial ASSIST context.

## What To Read

Read all current files in `ASSIST/`, with this order first:

1. `ASSIST/README.md`
2. `ASSIST/AI_RULES.md`
3. `ASSIST/APP_OWNED_MODULES.md`
4. `ASSIST/Documentation/ARCHITECTURE.md`
5. `ASSIST/Documentation/PROJECT_OVERVIEW.md`
6. `ASSIST/Documentation/SETUP_AND_RUN.md`
7. `ASSIST/Documentation/SUPPORT_ASSISTANT_BOUNDARY.md`
8. task-relevant files under `ASSIST/Documentation`
9. task-relevant files under `ASSIST/Discipline`
10. `ASSIST/Execution/TASK.md` and `ASSIST/Execution/PLANNING.md` when the batch is being tracked as active execution work

Treat current ASSIST files as active local guidance unless they are clearly historical changelog content or obviously stale compared with `ASSIST/Documentation/ARCHITECTURE.md`.

## Development Expectation

After reading `ASSIST/`, continue the task with these assumptions already loaded:

- architecture and ownership rules remain active
- app boundaries must be preserved
- the approved architectural direction is a safe staged move toward a modular monolith, not a rewrite
- DDD is introduced incrementally and only where the domain boundary is stable enough to support it
- event-driven behavior starts with typed in-process events and becomes durable only where operational need justifies the added complexity
- UI work must follow the shared design-system defaults and reusable block sources
- documentation and execution tracking rules must be followed when they apply
- stale habits from deleted ASSIST files must not be reintroduced

## Collaboration Rule

When the user is relying on the assistant as the only active senior developer for the repository:

1. the assistant must act as the primary technical owner for planning, implementation, review, and risk surfacing
2. the assistant must explicitly ask for all required manual confirmations, environment facts, credentials status, launch decisions, and user-run verification outcomes before proceeding past a blocked step
3. the assistant must not assume that important release or operational details are already confirmed if they have not been stated explicitly
4. the assistant should convert needed user-side checks into clear checkbox tasks in execution tracking where practical
5. when the next step depends on user confirmation, the assistant should state exactly what must be verified and what answer format is sufficient

## Task Execution Rule

Before doing each meaningful task:

1. create a proper implementation plan
2. write that plan in `ASSIST/Execution/PLANNING.md`
3. create or update the task entry in `ASSIST/Execution/TASK.md`
4. break the task into clear phases
5. use checkboxes so completion can be marked explicitly when the work is finished

When the user prompts for work, treat planning and task tracking as part of the task start, not as optional follow-up.

## Completion Rule

When work is completed:

1. mark the relevant phase and checkbox items as finished in `ASSIST/Execution/TASK.md`
2. update `ASSIST/Execution/PLANNING.md` with final scope, assumptions, validation, and residual risk when needed
3. ensure the finished work is reflected consistently in the changelog flow

## Git Helper Rule

When the user asks to call the git helper:

1. collect the completed task details from `ASSIST/Execution/TASK.md` and related planning notes
2. create the matching changelog entry in `ASSIST/Documentation/CHANGELOG.md`
3. sync package, lockfile, shared runtime, and changelog version state to the latest logged task version with `npm run version:sync` or let the git helper do it automatically
4. use the repository git helper workflow to prepare the commit
5. commit all intended changes
6. push all intended changes

Version format:

- task `#172` maps to installed version `1.0.172`
- changelog labels use `v 1.0.172`
- release tags use `v-1.0.172`

Git helper location and command:

- source file: `apps/cli/src/github-helper.ts`
- version sync command: `npm run version:sync`
- interactive command: `npm run github`
- non-interactive command: `npm run github:now`

The helper is implemented under `apps/cli`, even though the workflow rule here calls it the "git helper".

Do not call the git helper with incomplete task tracking or missing changelog context.

After the changelog entry is created for finished work:

1. clean up completed task items from `ASSIST/Execution/TASK.md`
2. clean up finished planning details from `ASSIST/Execution/PLANNING.md`
3. keep only active or still-relevant execution items in those files
4. do not leave finished execution notes behind as long-term clutter once they are preserved in the changelog

## What Belongs Here

- architecture and ownership rules that remain true across tasks
- concise contribution and review workflow
- active execution tracking for the current batch
- changelog history required for release and commit discipline
- safe migration posture for evolving the current codebase without collapsing working legacy paths

## What Does Not Belong Here

- scratch notes
- abandoned plans
- completed-task archives
- duplicate docs that restate architecture without adding a new rule
- speculative documentation for features that do not exist yet

## Current File Groups

- `AI_RULES.md`: top-level operating rules for agents
- `APP_OWNED_MODULES.md`: quick ownership map by app
- `FRAPPE.md`: code-backed app-detail guide for the live `apps/frappe` connector surface
- `Documentation/`: architecture, setup, support boundary, testing, changelog, and contribution workflow
- `Discipline/`: coding, testing, review, branching, and release rules
- `Execution/`: active task and planning docs for the current tracked batch

## Repository Structure

Current repository roots are not limited to `apps/`.

- `apps/` holds the framework-composed suite apps plus companion app packages
- `clients/` holds client-overlay or tenant-facing workspace roots; `clients/default` currently exists
- `build/` holds generated app and module outputs
- `cxmedia/` is a root-level standalone media storage and CDN service that lives in the same repository but runs outside the framework-composed suite
- active suite ownership lives under `apps/`; former top-level `cxapp/` and `framework/` content now lives under `apps/cxapp/` and `apps/framework/`

## Current App Structure

Active app roots currently present under `apps/`:

1. `framework`
2. `cxapp`
3. `core`
4. `api`
5. `site`
6. `ui`
7. `billing`
8. `ecommerce`
9. `demo`
10. `task`
11. `crm`
12. `frappe`
13. `tally`
14. `cli`
15. `mobile`
16. `stock`

Structure notes:

1. every framework-composed app except `apps/mobile` keeps the baseline `src`, `web`, `database/migration`, `database/seeder`, `helper`, and `shared` shape
2. `apps/mobile` remains the Expo-native exception and does not follow the suite `src/web/database/helper/shared` shape
3. `apps/stock` is now a live operational stock workspace and follows the standard app shape
4. `apps/demo` currently has `shared`, `src`, and `web`, but does not currently carry the full `database/helper` folders in the same way as the other standard app roots
5. `apps/zetro` is not part of the active suite model in this workspace and should not be treated as a live registered app unless architecture docs are updated to restore it

## Ownership Reminder

Use the current app model when documenting or implementing changes:

1. `framework` owns runtime and composition primitives only
2. `cxapp` owns the active suite shell, auth domain, and browser session system
3. `ui` owns the shared design system and neutral reusable blocks
4. `stock` owns the operational stock workspace boundary, while billing still retains the current stock document persistence called out in execution docs
5. `mobile` is a companion client package, not a framework-composed suite app
6. `clients/*` is separate from `apps/*` and should not be documented as app-suite ownership

## UI Source Of Truth

When shared UI work is involved, use:

1. `apps/ui/src/design-system/data/project-defaults.ts`
2. `apps/ui/src/registry`
3. `apps/ui/src/registry/blocks`
4. `apps/ui/src/components/blocks`

Do not invent parallel component naming or default variants outside those sources.
