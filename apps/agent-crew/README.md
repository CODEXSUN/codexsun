# Agent Crew Application

Reference: [Application standard](../../assist/architecture/application-standard.md)

## Purpose

Agent Crew is a Docker-isolated workspace execution application. It supports
only Codex CLI, OpenCode CLI, and local Ollama. Gemini and the older ZXA source
are not dependencies of this application.

## Ownership

- `api/src/modules/crew-control` owns the browser-safe control API.
- `worker/src/modules/crew-runner` owns provider commands, workspace resolution,
  run limits, and in-memory metrics.
- `web/src/modules/crew-dashboard` owns status, settings guidance, run controls,
  metrics, and dashboard display preferences.
- `docker` owns the hardened Node/Python worker image guidance.

## Workspaces and commands

| Workspace                     | Purpose                 | Address                            |
| ----------------------------- | ----------------------- | ---------------------------------- |
| `@codexsun/agent-crew-api`    | Fastify control API     | `http://127.0.0.1:6100`            |
| `@codexsun/agent-crew-web`    | React dashboard         | `http://127.0.0.1:6110/agent-crew` |
| `@codexsun/agent-crew-worker` | Private provider runner | `http://127.0.0.1:6120`            |

Run `npm.cmd run dev:agent-crew` for the local API and dashboard. The worker is
normally started by the generated Compose deployment.

## Runtime configuration

`AGENT_CREW_RUNNER_TOKEN` is required between the API and worker. Set a distinct
production value in deployment `environment.env`. `AGENT_CREW_OLLAMA_URL` must
reach a local Ollama server from the worker container. `AGENT_CREW_WORKSPACE_ROOT`
is `/workspaces` in the image and may contain only named mounted workspaces.

The dashboard never accepts provider secrets. Codex and OpenCode authentication
stays in the worker credential volume. The API provides liveness at `/health`
and `/health/live`; readiness returns 503 until its worker is reachable.

## Health and shutdown

The API has `/health`, `/health/live`, and `/health/ready`. The worker has the
private `/internal/health` route. API and worker handle `SIGINT` and `SIGTERM`
and close their Fastify listeners. Local API and web start through root preflight;
the worker is intended to start through the selected Docker Compose deployment.

## Deployment assembly

Agent Crew requires Platform. Its API, web, and worker are distinct components.
The worker uses a dedicated Dockerfile that contains Node, Python, Codex, and
OpenCode. It has no Docker socket and no host checkout mount.

## Verification

Run focused type checks, builds, lint, module documentation checks, runtime
validation, and `git diff --check`. A real provider run requires a mounted
workspace and a separately authenticated provider account.

## Module catalog

See [Agent Crew module catalog](../../assist/modules/agent-crew.md).
