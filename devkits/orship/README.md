# Orship

Orship is the CODEXSUN orchestration application.

It owns deployment, monitoring, and maintenance workflows for applications, services, hosts, containers, and runtime resources. It gives operators one place to inspect system state, start and stop managed services, review health, follow deployment progress, and respond to runtime issues.

## Purpose

Orship helps a team run CODEXSUN applications after they leave local development.

It tracks what runs, where it runs, which version is active, and whether each service is healthy. It also records operational tasks so maintenance work has a clear owner, status, and audit trail.

## Functions

- Manage application deployment targets.
- Track service health and runtime status.
- Show active hosts, ports, processes, and service endpoints.
- Start, stop, restart, and verify managed services.
- Monitor logs, health checks, and maintenance events.
- Record deployment history and maintenance actions.
- Surface failed checks and required operator actions.
- Keep runtime configuration visible without exposing secrets.
- Coordinate API, web, worker, database, and storage maintenance tasks.

## Deployment Control Plane

Orship owns the deployment record, application registry, target ownership,
approval and RBAC decisions, environment policy, audit trail, deployment
history, and operator UI. Dokploy is an optional provider adapter. The browser
only calls Orship; it never receives a Docker socket or a raw Dokploy response.

The adapter currently supports Docker applications, Compose applications, Git
sources, provider targets, health checks, start/stop/restart/redeploy/rollback,
status and logs, environment updates, service discovery, and provider health.
Provider requests use `ORSHIP_DOKPLOY_BASE_URL` and resolve the access token
from `ORSHIP_DOKPLOY_ACCESS_TOKEN_REF` through the configured secret provider.
Remote provider URLs must use TLS. Localhost HTTP is allowed only for local
development.

Deployment state is stored in MariaDB through the existing migration runner.
Secret values are never stored in deployment tables, logs, or browser
responses. Production mutation policy is separate from development targets;
deployment permissions are required for every mutating operation. Rollbacks
are explicit operations and are recorded with their provider reference.

The provider boundary is implemented from the documented Dokploy API contract
in `apps/temp/dokploy/openapi.json`. No Dokploy proprietary internals are
copied into Orship. The existing local Dokploy wrapper remains under
`apps/temp/dokploy/.container` and is not part of the Orship runtime image.

## Application Boundary

Orship owns orchestration product behavior inside ``.

It must use shared framework, platform, and UI package exports for common capabilities. It must not copy shared contracts, internal platform code, or UI templates into the application.

Orship stores application files only through approved storage providers. It must not use unscoped filesystem paths for runtime data.

## Hosts

Orship has two browser/API hosts and one internal service.

- `api` owns API routes, providers, configuration, health checks, and operational services.
- `web` owns the browser workspace and operator interface.
- `docker` owns the Go Docker manager used by the local container stack.

The Docker manager reads container state and performs start, stop, and restart operations through the Docker Engine socket. The authenticated API exposes these operations at `/api/v1/orship/docker/containers`; the manager itself is available only on the private compose network.

The manager also owns the local MariaDB sample lifecycle. Its sample definition is derived from `../../apps/temp/cxapp/.container/database/mariadb` and uses the shared external `codexsun-network`. Through the authenticated API, operators can install, drop, and reinstall the sample at `/api/v1/orship/docker/samples/mariadb/{install,drop,reinstall}`. The sample binds host port `3308` so it can coexist with the CXApp database on port `3307`.

The application registry defines the Orship API and web hosts. Root scripts start the hosts through repository tooling.

## Runtime Configuration

Orship reads shared values from the root `../../.env` file.

Orship reads application values from `api/.app.env` and `..`.

Example files document safe variable names. They must not contain live secrets.

## Development Rules

Install dependencies only from the repository root.

Do not create `node_modules`, `dist`, or `.turbo` folders inside Orship.

Keep Orship changes inside `` unless a public package contract needs a reviewed change.

Run focused API and web checks before handoff.

## Development Version

The repository `../../package.json` owns the global CODEXSUN release version.

`VERSION` owns the Orship development version. The web status bar
shows this value at its right edge. Local development and Docker builds use the
same source file.

Use `.container/orship-update.sh` to apply a local Docker update.
Keep Docker live-update work in that script. Do not make VPS or production
changes without explicit approval.
