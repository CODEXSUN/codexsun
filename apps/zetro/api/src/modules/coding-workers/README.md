# Zetro Coding Workers API Module

- Module ID: `zetro.coding-workers.api`
- Version: `1.0.0`
- Owner: Zetro API

## Purpose

This module prepares an isolated coding worker from an explicit task handoff. It creates a new `codex/zetro-task-*` branch and sibling Git worktree. It stores task scope, criteria, checks, base revision, and tool profile.

The worktree is a generic isolated codebase, regardless of language or toolchain. The module starts local authenticated Codex only inside the approved module folder. It stores live execution events and retains partial work after a stop or failure. It never commits, pushes, opens pull requests, merges, deploys, or removes a worktree.

## Contracts

- `GET /api/zetro/v1/coding-workers` lists prepared worker attempts and persisted execution events.
- `POST /api/zetro/v1/coding-workers/prepare` validates review confirmation and prepares one worktree.
- `POST /api/zetro/v1/coding-workers/:attemptId/start` starts authenticated local Codex in the approved module folder.
- `POST /api/zetro/v1/coding-workers/:attemptId/stop` stops the exact active Codex process and keeps partial work.
- `POST /api/zetro/v1/coding-workers/:attemptId/verify` runs the recorded checks and stores evidence.
- `POST /api/zetro/v1/coding-workers/:attemptId/approve` or `/reject` records an explicit human decision.
- `@codexsun/zetro-contracts` owns the request and response schemas.

The module reads task existence through the public Agent Tasks service. It does not read Agent Tasks tables directly.

## Safety

- A handoff needs repository path, existing module path, criteria, checks, and review confirmation.
- The module resolves the selected Git root and rejects scopes outside it.
- It creates worktrees only below a sibling `.<repository>-zetro-worktrees` directory.
- A preparation failure removes only the new worktree and branch that this request created.
- Git write, pull request, merge, push, and deployment actions remain outside this module.
- A worker must complete before Zetro runs verification checks.
- Only `git diff --check` and exact `npm run <script>` commands are accepted as verification checks.

## Persistence

The module owns `coding_worker_attempts` and `zetro_coding_worker_migrations` in the Zetro SQLite database. SQLite WAL mode and immutable migration checksums apply.

## Verification

The focused test creates a temporary Git repository, prepares a separate worktree and branch, stores the record, verifies `git diff --check`, approves the verified attempt, and removes the test-only branch and worktree.

## Development records

- [Daily coding worker preparation](../../../../../../../assist/records/zetro/2026-09-11-daily-coding-worker-preparation.md)
