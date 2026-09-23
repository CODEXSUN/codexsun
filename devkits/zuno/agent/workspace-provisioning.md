# Zuno workspace provisioning

Zuno creates one CXForge container per workspace. CXForge runs the commands. No model is required or included. All command requests in one container use `/workspace` and run in sequence.

## Requirements

- Install the CXForge image with `devkits/cxforge/.container/cxforge-setup.sh`.
- Give the Zuno API host access to the Docker CLI and daemon. Do not mount the Docker socket into CXForge workers.
- Use authenticated Zuno sessions. This interface is for trusted operators: recipes and commands execute code.
- Keep the Zuno control encryption key stable. Zuno encrypts saved worker credentials.

The default image is `cxforge:1.0.0`. Override it on the Zuno host with `ZUNO_CXFORGE_IMAGE`. Browser requests cannot choose an image, mount, or Docker argument.

## API flow

1. `POST /api/v1/zuno/control/provisions`: send `requestId` (UUID), `name` (container prefix), and an optional `setup` recipe.
2. Poll `GET /api/v1/zuno/control/provisions/:id`. Creation returns immediately. States are `creating`, `preparing`, `ready`, or `failed`.
3. Use the returned `serverId` for the routes below. Each creation reserves five distinct host ports: API, first preview, and three additional previews.
4. `GET /api/v1/zuno/control/servers/:serverId/snapshot`: get worker health and task summaries.
5. `GET /api/v1/zuno/control/servers/:serverId/commands/:id`: get setup or command results.
6. `POST /api/v1/zuno/control/servers/:serverId/commands`: submit a new command ID, title, and steps to continue in the same workspace.

Reuse a request ID only with the same body. Zuno rejects changed duplicate requests. It does not replay an uncertain operation after a restart. Inspect the named container before retrying a failed creation.

An operation without a setup recipe means the worker is ready, not that a repository is prepared. With a recipe, `ready` requires the setup task to reach review after its preview check.

## Setup recipe

The create form exposes the recipe as JSON. Set the repository HTTPS URL and branch, environment values, working directory, install command, migration status command, migrate command, verification command, and foreground preview command. Use `{port}` in the preview command. Commands use an `argv` array and a timeout of 1–300 seconds.

SQLite is the default and stays inside the workspace. For shared MariaDB, select `mariadb`, set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_MASTER_NAME`, and supply app-specific migration commands. Use `none` for apps without a database.

For a private repository, the provision API accepts `gitConnection` with name, provider, username, token, repositoryPatterns, and clone/pull/push permissions. Zuno sends this directly to the new worker and inserts its connection ID into the setup recipe. The token is not returned or saved in the operation record. Alternatively, create an empty worker, use the existing Git connection API, then POST `workspace/setup`.

`PUT /api/v1/zuno/control/servers/:serverId/workspace/environment` updates environment values with an explicit overwrite flag. Do not put secrets in shell commands or output them in logs.

## Local verification

Run from the repository root in PowerShell:

```powershell
$env:ZUNO_LIVE_DOCKER = '1'
node --import tsx devkits/zuno/api/src/modules/cxforge/test/workspace-live.ts
```

The opt-in test starts a real HTTP server with Zuno's authenticated workspace routes. It creates two Docker workers, clones a small public Git fixture, installs npm, migrates SQLite, checks both previews, edits one workspace, and checks isolation. It leaves the named containers running for inspection. It does not test the full identity login UI or private Git credentials.

Verified on 2026-09-22: both workers reached ready; ten host ports were distinct; an edit changed only the first preview. This is an integration check, not a claim that arbitrary app recipes will succeed.

## Deployment limits

Published ports bind to loopback for local safety. A VPS needs an authenticated TLS preview gateway before remote users can open previews. `ZUNO_DOCKER_NETWORK_CLIENT=1` lets a Docker-hosted Zuno reach worker APIs by container name on `codexsun-network`. `ZUNO_PREVIEW_ORIGIN` controls advertised preview origin; it does not open a firewall or configure TLS.

Workspaces stay in container writable layers as requested. Container deletion loses unpushed code and the local database. Back up or push work before removal. Container quotas, per-user authorization, remote preview access control, and interrupted-creation recovery need further work before a multi-user public deployment.
