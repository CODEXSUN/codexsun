# Deterministic Automation CLI

Date: 2026-09-09

## Decision

Zetro separates deterministic repository automation from user tasks and Agent Chat. The Node CLI and the Automation workspace call the same Zetro API contracts. Existing modules continue to own Git operations, repository scripts, Git delivery, diagnostics, worktrees, and durable execution history.

An agent is an optional supervisor after a run fails. The user can prepare a diagnostic prompt from the selected failure. The handoff asks the agent to identify the cause and propose a script repair. It forbids automatic reruns, cleanup, commits, pushes, publication, and repository changes before review.

## Safety

Commit, push, release, cleanup scripts, and worktree sweeps require explicit confirmation. The API script allowlist accepts only repository-owned build, check, clean, lint, release, test, and typecheck families. The CLI uses the rotating desktop session token from the process environment and does not persist it.

## Verification

CLI command mapping and confirmation tests pass. The Developer Tools allowlist test passes. The Automation supervisor prompt test, Zetro web and API builds, module checks, and formatting are required before handoff.
