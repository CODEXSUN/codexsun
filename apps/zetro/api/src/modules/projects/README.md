# Zetro Projects API

## Contract

- Module ID: `zetro.projects.api`
- Version: `0.4.1`
- Owner: Zetro API
- Routes: list, read, create, and update under `/api/v1/projects`

A project binds a display name to one existing local Git repository. The API
adds a stable CODEXSUN project only when the startup folder is a Git repository.
An installed desktop app starts with an empty project registry.

New projects require an absolute folder path inside a Git repository. The API
resolves that folder to the repository root before it stores the project. This
lets a user select the repository root, an application folder, or a module folder.

The project label does not rename the repository directory. Project identity
also stores an optional GitHub URL, logo text, logo color, and branding tagline.
The directory browser route lists server-visible folders without exposing files.

## Persistence

Projects are stored in `storage/app/private/zetro/projects.json`. Writes replace
the file atomically. The update route changes project settings or archives a
project. The service keeps at least one active project after the first project
exists. An upgrade removes only the unchanged generated desktop placeholder.

## Consumers

Chat uses the selected project repository when it creates an isolated worktree.
Conversation and task records store the project ID. Existing unscoped records
are assigned to the stable default project during repository initialization.

## Verification

Run the Zetro projects test, API type check, and production build. Register a
second local Git root and confirm its chat and tasks are isolated.

## Development records

- [2026-09-08 Project properties layer](../../../../../../assist/records/zetro/2026-09-08-project-properties-layer.md)
- [2026-09-08 Project workspace binding](../../../../../../assist/records/zetro/2026-09-08-project-workspace-binding.md)
- [2026-09-09 Desktop project onboarding](../../../../../../assist/records/zetro/2026-09-09-desktop-project-onboarding.md)
