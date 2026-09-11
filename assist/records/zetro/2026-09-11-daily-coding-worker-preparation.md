# Daily coding worker preparation

Date: 2026-09-11

## Outcome

Zetro now has an editable Task Queue plan and a separate Worker Queue. A task plan stores a repository path, an existing scope inside that repository, acceptance criteria, and named checks. Only an explicitly confirmed saved plan can prepare a worker.

The API creates a unique `codex/zetro-task-*` branch and sibling worktree. It stores the selected scope, revision, criteria, checks, and tool profile. The worktree is a generic isolated codebase, independent of language or toolchain.

## Boundaries

`zetro.coding-workers.api` owns Git worktree preparation and attempt records. `zetro.coding-workers.web` owns the Worker Queue and handoff form. Agent Tasks remains the task source owner.

The daily tool profile declares inspection, editing, testing, and Git evidence. The verification job runs only the saved allowlist: `git diff --check` and exact `npm run <script>` commands. It stores each command, exit code, duration, output summary, and pass/fail state. A failed or missing check leaves the attempt awaiting verification. A passing attempt awaits an explicit human approval or rejection. The worker does not start a provider agent, commit, push, request a pull request, merge, deploy, or clean a worktree.

## Next governed stages

1. Start a provider worker inside the prepared worktree.
2. Request a pull request after a verified attempt is approved.
3. Require an explicit merge action after the human has reviewed the pull request.

## Verification

- The focused API test prepares and removes a temporary Git branch and worktree, runs an allowlisted check, stores its evidence, and approves the verified attempt.
- Zetro API tests, web type checks, and production build run before handoff.
