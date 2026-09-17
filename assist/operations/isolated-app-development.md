# Isolated Application Development

## Purpose

Develop one application or shared package without changing another active application worktree.

## Scope names

| Scope | Hosts or packages | Turbo cache |
| --- | --- | --- |
| `platform` | Platform API, web, desktop, mobile | `dist/.turbo/platform/` |
| `docs` | Docs API and web | `dist/.turbo/docs/` |
| `orship` | Orship API and web | `dist/.turbo/orship/` |
| `zetro` | Zetro API and web | `dist/.turbo/zetro/` |
| `uiux` | UIUX web | `dist/.turbo/uiux/` |
| `packages` | Shared packages | `dist/.turbo/packages/` |
| `workspace` | Full workspace commands | `dist/.turbo/workspace/` |

## Required workflow

1. Confirm one task, owner path, scope name, and acceptance checks.
2. Create `codex/<scope>-<task>` and a separate Git worktree.
3. Copy `.env.example` and the owner host `.app.env.example` files into ignored local environment files.
4. Install dependencies only at the worktree root.
5. Use `npm.cmd run build:<scope>` and `npm.cmd run check:<scope>` during the task.
6. Run focused tests and Playwright for changed user-visible web behavior.
7. Review the branch diff and record verification evidence.
8. Request manual confirmation before merging into `main`.

## Shared package gate

An app task must not refactor `packages/*` by default.

Before a shared-package change, report the package owner, public contract, affected applications, compatibility risk, and test plan. Create a separate reviewed package task and worktree after confirmation.

Applications consume only published public package exports. They must not copy shared UI, contracts, or infrastructure into app folders.

## Parallel work rules

- Use distinct app scopes and worktrees for independent application work.
- Do not run concurrent package-scope work with an app task that depends on the same package change.
- Do not share `.env`, `.app.env`, `node_modules`, `dist`, or Turbo cache folders between worktrees.
- Use the root `dist/` and `dist/.turbo/<scope>/` only within the active worktree.
- Run scoped work through `npm.cmd run build:<scope>` or `npm.cmd run check:<scope>`. Do not call Turbo directly.
- Stop before merge if the task needs a shared-package, schema, deployment, or cross-app change that lacks approval.
