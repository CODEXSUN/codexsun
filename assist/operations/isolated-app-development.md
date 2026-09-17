# Isolated Application Development

## Purpose

Develop one application or shared package without changing another active application worktree.

## Scope names

| Scope       | Hosts or packages                  | Turbo cache              |
| ----------- | ---------------------------------- | ------------------------ |
| `platform`  | Platform API, web, desktop, mobile | `dist/.turbo/platform/`  |
| `docs`      | Docs API and web                   | `dist/.turbo/docs/`      |
| `orship`    | Orship API and web                 | `dist/.turbo/orship/`    |
| `zetro`     | Zetro API and web                  | `dist/.turbo/zetro/`     |
| `uiux`      | UIUX web                           | `dist/.turbo/uiux/`      |
| `packages`  | Shared packages                    | `dist/.turbo/packages/`  |
| `workspace` | Full workspace commands            | `dist/.turbo/workspace/` |

## Required workflow

1. Confirm one task, owner path, scope name, and acceptance checks.
2. Create `codex/<scope>-<task>` and a separate Git worktree.
3. Copy `.env.example` and the owner host `.app.env.example` files into ignored local environment files.
4. Install dependencies only at the worktree root.
5. Use `npm.cmd run build:<scope>` and `npm.cmd run turbo:scope -- <scope> check` during the task.
6. Run focused tests and Playwright for changed user-visible web behavior.
7. Review the branch diff and record verification evidence.
8. Request manual confirmation before merging into `main`.

## CODEXSUN CLI

Use the root CLI to enforce the lifecycle:

```text
npm.cmd run codexsun -- app create <scope> <task>
npm.cmd run codexsun -- app guide <scope> <task>
npm.cmd run codexsun -- app verify <scope> <task>
npm.cmd run codexsun -- app develop <scope> <task>
npm.cmd run codexsun -- app review <scope> <task>
npm.cmd run codexsun -- app approve <scope> <task> --approved-by <name>
npm.cmd run codexsun -- app merge <scope> <task>
```

`create` runs only from a clean `main` checkout. It creates `codex/<scope>-<task>` beside the repository under `.codexsun-worktrees/`.

`verify` must pass before `develop`. It checks the expected worktree path, branch, untouched baseline, root-only artifact layout, LF endings, and the scoped check.

`develop` runs the scope check in the isolated worktree. `review` requires a clean worktree, blocks changes under `packages/`, runs the scoped check, and records review time.

Only a human may run `approve`. `merge` runs only from a clean main checkout after approval. It uses fast-forward only and never pushes.

The local lifecycle record is under `storage/runtime/worktrees/`. It is runtime state and must not be committed.

## Agent Session Skill

The agent must read `assist/skills/isolated-app-session/SKILL.md` after the CLI creates the worktree. The agent works only in that returned path for the selected task.

## Shared package gate

An app task must not refactor `packages/*` by default.

Before a shared-package change, report the package owner, public contract, affected applications, compatibility risk, and test plan. Create a separate reviewed package task and worktree after confirmation.

Applications consume only published public package exports. They must not copy shared UI, contracts, or infrastructure into app folders.

## Parallel work rules

- Use distinct app scopes and worktrees for independent application work.
- Do not run concurrent package-scope work with an app task that depends on the same package change.
- Do not share `.env`, `.app.env`, `node_modules`, `dist`, or Turbo cache folders between worktrees.
- Use the root `dist/` and `dist/.turbo/<scope>/` only within the active worktree.
- Run scoped work through `npm.cmd run build:<scope>` or `npm.cmd run turbo:scope -- <scope> check`.
- Stop before merge if the task needs a shared-package, schema, deployment, or cross-app change that lacks approval.
