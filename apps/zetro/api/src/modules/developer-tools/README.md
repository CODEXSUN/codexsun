# Zetro Developer Tools API

## Contract

- Module ID: `zetro.developer-tools.api`
- Version: `1.0.1`
- Owner: Zetro API
- Dependency: `zetro.projects.api@^0.4.1`

The module owns repository inspection, safe Git actions, external tool launchers,
and persisted developer tool settings.

## Routes

- `GET` and `PATCH /api/v1/developer-tools/settings` manage global defaults.
- `GET` and `PATCH /api/v1/projects/:projectId/developer-tools/settings` manage project settings.
- `GET /api/v1/projects/:projectId/developer-tools/status` reads Git metrics.
- `GET /api/v1/projects/:projectId/developer-tools/compare` compares the current HEAD with a base.
- `POST /api/v1/projects/:projectId/developer-tools/actions` runs fetch, pull, branch, commit, push, or revert.
- `POST /api/v1/projects/:projectId/developer-tools/launch` opens an editor, file browser, or terminal.
- `changes`, `diff`, and `stage` routes own changed-file navigation and file or hunk staging.
- `history`, `blame`, and `conflicts` routes own repository review and conflict resolution.
- `branches`, `stashes`, `scripts`, and `pull-requests` routes own recovery and delivery tools.

The script route exposes only repository-owned `build`, `check`, `clean`, `lint`,
`release`, `test`, and `typecheck` script families. Execution creates a durable
System Task. Cleanup and release callers must require explicit user confirmation.
The runner invokes npm's JavaScript entry point with Node, not a Windows batch file.
Node.js with npm must be installed on PATH for repository development tasks.
The bundled desktop Node runtime alone does not install repository development dependencies.

## Safety

All Git commands use argument arrays and the registered repository root. The API
does not use shell command strings. Revert creates a new commit and keeps history.

Push and pull-request creation require enabled effective settings. Protected
branches reject direct pushes. Force push is unavailable. A separate
setting can permit `--force-with-lease` for an explicit request.

The editor launcher uses a fixed application allowlist. File and terminal launchers
receive only the registered repository path.

The public service supplies HEAD, changed files, remote, and upstream data to Git
Delivery. Git Delivery does not execute Git commands directly.

## Persistence

The module stores settings in module-owned SQLite or MariaDB tables. It imports
legacy JSON settings once when the table is empty. Project settings can inherit
global defaults or store an isolated configuration.

## Verification

Run `npm.cmd run test:developer-tools --workspace @codexsun/zetro-api`. The test
uses temporary local Git repositories and a local bare remote.
Each fixture sets repository-local line-ending behavior. Tests do not change user Git configuration.

## Development records

- [Desktop 0.1.20 verification](../../../../../../assist/records/zetro/2026-09-10-desktop-0.1.20-verification.md)
- [Stable release workflow](../../../../../../assist/records/zetro/2026-09-10-stable-release-workflow.md)

- [2026-09-09 Developer tools](../../../../../../assist/records/zetro/2026-09-09-developer-tools.md)
