# App Worktree Workflow

## Purpose

Use one isolated Git worktree for one approved app task. This keeps app work independent from main and other app work.

## Scope

Use one app scope for each task:

| Scope | Applications |
| --- | --- |
| `platform` | Platform API, web, desktop, and mobile |
| `docs` | Docs API and web |
| `orship` | Orship API and web |
| `zetro` | Zetro API and web |
| `uiux` | UIUX web |

Do not use this workflow for `packages/*`. A shared package needs its own approved package task.

## Lifecycle

```text
main checkout
  -> create worktree
  -> verify worktree
  -> develop in one agent session
  -> review and verification
  -> human confirmation
  -> approved fast-forward merge to main
```

## Start A Task

Start from a clean `main` checkout:

```text
npm.cmd run codexsun -- app create <scope> <task>
npm.cmd run codexsun -- app guide <scope> <task>
npm.cmd run codexsun -- app verify <scope> <task>
```

The CLI creates:

- Branch: `codex/<scope>-<task>`.
- Worktree: beside the repository in `.codexsun-worktrees/<scope>-<task>`.
- Local lifecycle record: `storage/runtime/worktrees/<scope>-<task>.json`.

Use the short task ID from `assist/execution/apps/<app>/task.md`, such as `z-1203`. The CLI creates `codex/zetro-z-1203` and `.codexsun-worktrees/zetro-z-1203`.

The lifecycle record is local runtime state. Do not commit it.

`verify` runs before development. It confirms the expected path, branch, unchanged main baseline, clean worktree, root-only artifact layout, LF text endings, and scoped application check. It records the verified state.

Install dependencies at the new worktree root before verification. This creates one root-level `node_modules/` folder for that worktree only.

## Agent Session

Open the returned worktree path as the only agent workspace.

Read `assist/skills/isolated-app-session/SKILL.md`, the selected app documentation, the owner module records, and the task acceptance checks.

After verification, during development:

```text
npm.cmd run codexsun -- app develop <scope> <task>
npm.cmd run fix:line-endings
npm.cmd run check:<scope>
```

The agent must work only on the selected application. It must use public package exports and module-owned code.

Stop and request a new approved task when work needs a shared package, another app, a schema change, a deployment change, or a new provider contract.

## Review Loop

Before review, the agent must:

1. Run focused module tests.
2. Run required Playwright checks for changed web behavior.
3. Run `npm.cmd run fix:line-endings`.
4. Review the branch diff and record the evidence in the changelog.

Run the review from the main checkout:

```text
npm.cmd run codexsun -- app review <scope> <task>
```

The CLI requires a clean worktree, rejects shared package changes, checks the diff, and runs `check:<scope>`.

If review finds an issue, return to the same worktree and repeat development and review.

## Approval And Merge

Show the diff and verification evidence to a human. Only after explicit manual confirmation, record the approval:

```text
npm.cmd run codexsun -- app approve <scope> <task> --approved-by "Reviewer Name"
```

Merge from a clean `main` checkout:

```text
npm.cmd run codexsun -- app merge <scope> <task>
```

The merge uses `git merge --ff-only`. It cannot create a merge commit and does not push.

After merge, use the approved repository Git workflow when a commit or push is required.

## Prohibited Actions

- Do not develop app work directly on `main`.
- Do not share a worktree between unrelated tasks.
- Do not edit `packages/*` from an app worktree.
- Do not merge before recorded human approval.
- Do not push from the merge command.
