# ASSIST Guide

## Purpose

`ASSIST/` is the development operating manual for this repository.

When the user says `Read ASSIST/README.md`, treat that as an instruction to load the current ASSIST guidance first, retain it for the rest of the task, and only then begin implementation work.

## Start Rule

Before writing code, changing files, or proposing implementation:

1. read `ASSIST/README.md`
2. read `ASSIST/AI_RULES.md`
3. go through all current files inside `ASSIST/`
4. internalize the active rules, ownership boundaries, workflow constraints, and documentation discipline
5. start development only after that reading pass is complete

Do not begin development from partial ASSIST context.

## What To Read

Read all current files in `ASSIST/`, with this order first:

1. `ASSIST/README.md`
2. `ASSIST/AI_RULES.md`
3. `ASSIST/APP_OWNED_MODULES.md`
4. every file under `ASSIST/Documentation`
5. every file under `ASSIST/Discipline`
6. `ASSIST/Execution/TASK.md` and `ASSIST/Execution/PLANNING.md` when the batch is being tracked as active execution work

If a file exists in `ASSIST/`, it is part of the active local guidance unless it is clearly historical changelog content.

## Development Expectation

After reading `ASSIST/`, continue the task with these assumptions already loaded:

- architecture and ownership rules remain active
- app boundaries must be preserved
- UI work must follow the shared design-system defaults and reusable block sources
- documentation and execution tracking rules must be followed when they apply
- stale habits from deleted ASSIST files must not be reintroduced

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
3. use the repository git helper workflow to prepare the commit
4. commit all intended changes
5. push all intended changes

Git helper location and command:

- source file: `apps/cli/src/github-helper.ts`
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

## What Does Not Belong Here

- scratch notes
- abandoned plans
- completed-task archives
- duplicate docs that restate architecture without adding a new rule
- speculative documentation for features that do not exist yet

## Current File Groups

- `AI_RULES.md`: top-level operating rules for agents
- `APP_OWNED_MODULES.md`: quick ownership map by app
- `Documentation/`: architecture, setup, support boundary, testing, changelog, and contribution workflow
- `Discipline/`: coding, testing, review, branching, and release rules
- `Execution/`: active task and planning docs for the current tracked batch

## UI Source Of Truth

When shared UI work is involved, use:

1. `apps/ui/src/design-system/data/project-defaults.ts`
2. `apps/ui/src/registry`
3. `apps/ui/src/registry/blocks`
4. `apps/ui/src/components/blocks`

Do not invent parallel component naming or default variants outside those sources.
