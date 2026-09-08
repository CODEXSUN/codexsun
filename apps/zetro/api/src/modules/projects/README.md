# Zetro Projects API

## Contract

- Module ID: `zetro.projects.api`
- Version: `0.2.0`
- Owner: Zetro API
- Routes: list, read, create, and update under `/api/v1/projects`

A project binds a display name to one existing local Git repository root. The
API creates a stable CODEXSUN default project for the current checkout. New
projects require an absolute path that resolves to a Git repository root.

## Persistence

Projects are stored in `storage/app/private/zetro/projects.json`. Writes replace
the file atomically. The update route renames or archives a project. The service
keeps at least one active project because conversations, tasks, and worktrees
need an active workspace.

## Consumers

Chat uses the selected project repository when it creates an isolated worktree.
Conversation and task records store the project ID. Existing unscoped records
are assigned to the stable default project during repository initialization.

## Verification

Run the Zetro projects test, API type check, and production build. Register a
second local Git root and confirm its chat and tasks are isolated.

## Development records

- [2026-09-08 Project workspace binding](../../../../../../assist/records/zetro/2026-09-08-project-workspace-binding.md)
