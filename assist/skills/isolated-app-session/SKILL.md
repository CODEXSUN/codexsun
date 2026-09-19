# Isolated App Session

## Purpose

Use this skill for one approved application task in one Git worktree.

## Start

1. Read `assist/operations/isolated-app-development.md`.
2. Create the worktree from the main checkout.
3. Open the returned worktree path as the only agent workspace.
4. Read the selected app README, host `.app.env.example`, module records, and task acceptance checks.
5. Run the app-scoped check before editing.

## Commands

```text
npm.cmd run codexsun -- app create <scope> <task>
npm.cmd run codexsun -- app guide <scope> <task>
npm.cmd run codexsun -- app verify <scope> <task>
npm.cmd run codexsun -- app develop <scope> <task>
npm.cmd run codexsun -- app review <scope> <task>
```

The scope is `platform`, `docs`, `zetro`, or `uiux`. Do not edit code until `verify` passes.

Run `npm.cmd install` once at the new worktree root before `verify`. Do not create nested dependency folders.

## Development Rules

- Change only the selected application and its module-owned code.
- Use public package exports. Do not copy shared UI, contracts, or infrastructure into an app.
- Stop when the task needs `packages/*`, schema, deployment, or another app.
- Keep text files with LF endings. Run `npm.cmd run fix:line-endings` before review.
- Run focused tests and browser checks for visible behavior.
- Record meaningful progress in the current changelog version.

## Review And Merge

1. Finish the task in the worktree.
2. Run `npm.cmd run codexsun -- app review <scope> <task>` from the main checkout.
3. Show the diff and review evidence to a human.
4. After explicit approval, run `npm.cmd run codexsun -- app approve <scope> <task> --approved-by <name>`.
5. Run `npm.cmd run codexsun -- app merge <scope> <task>` from a clean main checkout.

The merge command uses fast-forward only. It does not commit, tag, or push.
