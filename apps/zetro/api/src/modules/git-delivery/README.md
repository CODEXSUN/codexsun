# Zetro Git Delivery API

## Contract

- Module ID: `zetro.git-delivery.api`
- Version: `0.1.0`
- Owner: Zetro API
- Dependencies: `zetro.developer-tools.api@^0.2.0` and `zetro.projects.api@^0.4.1`

The module owns the reviewed changelog, version, synchronization, commit, and push flow.
It runs only repository-owned npm scripts for release updates.

## Routes

- `GET` and `PATCH /api/v1/git-delivery/settings` manage global defaults.
- `GET` and `PATCH /api/v1/projects/:projectId/git-delivery/settings` manage project defaults.
- `GET /api/v1/projects/:projectId/git-delivery/preview` returns the reviewed repository state.
- `GET /api/v1/projects/:projectId/git-delivery/flows` returns recent system tasks.
- `POST /api/v1/projects/:projectId/git-delivery/flows` runs one reviewed system task.

## Safety and persistence

The request includes the reviewed HEAD and changed-file list. The service rejects a run
when the repository changes after preview. Git execution stays in Developer Tools.

The module stores settings and the latest 50 flow records in
`storage/app/private/zetro/git-delivery.json`. It does not store credentials.

## Verification

Run the Zetro API type check, lint, build, and focused Git delivery test.

## Development records

- [2026-09-09 Git delivery flow](../../../../../../assist/records/zetro/2026-09-09-git-delivery-flow.md)
