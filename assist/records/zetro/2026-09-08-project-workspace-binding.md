# Zetro Project Workspace Binding

Date: 2026-09-08

## Outcome

Zetro now has a project switcher modeled on the existing sidebar-07 team
switcher. The selected project scopes Agent Chat, task management, and isolated
Codex worktrees without adding another public route.

## Ownership and contracts

- `zetro.projects.api` owns registered repository records and validation.
- `zetro.projects.web` owns active project state and the project switcher.
- `zetro.chat.api` stores `projectId` and resolves the project repository before a turn.
- `zetro.tasks.api` stores `projectId` and filters task access by project.
- `zetro.project-tasks.web` owns the task list, create form, and status control.
- `zetro.desk.web` composes project navigation inside the existing MDI shell.

Existing conversations and tasks are assigned to the stable default CODEXSUN
project during initialization. This is a JSON record migration, not a database
migration. The original records remain present.

## Interface

The Zetro sidebar contains the project switcher followed by Chat and Tasks. Chat
keeps the existing history and archive controls. Tasks shows open and completed
counts and opens an 80-percent-width task workspace. Project registration uses
an existing local Git repository root.

## Verification

- Passed Zetro API and web type checks.
- Passed chat history, projects, tasks, and worktree tests.
- Passed Zetro API and web production builds without warnings.
- Verified the switcher dropdown, Chat navigation, migrated task list, and task
  workspace in Chrome at `/zetro`.
- Confirmed the live project, conversation, and task endpoints returned HTTP 200.

No commit or push was created.
