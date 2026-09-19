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

## Application Boundary

Orship owns orchestration product behavior inside `apps/orship`.

It must use shared framework, platform, and UI package exports for common capabilities. It must not copy shared contracts, internal platform code, or UI templates into the application.

Orship stores application files only through approved storage providers. It must not use unscoped filesystem paths for runtime data.

## Hosts

Orship has two current hosts.

- `apps/orship/api` owns API routes, providers, configuration, health checks, and operational services.
- `apps/orship/web` owns the browser workspace and operator interface.

The application registry defines the Orship API and web hosts. Root scripts start the hosts through repository tooling.

## Runtime Configuration

Orship reads shared values from the root `.env` file.

Orship reads application values from `apps/orship/api/.app.env` and `apps/orship/web/.app.env`.

Example files document safe variable names. They must not contain live secrets.

## Development Rules

Install dependencies only from the repository root.

Do not create `node_modules`, `dist`, or `.turbo` folders inside Orship.

Keep Orship changes inside `apps/orship` unless a public package contract needs a reviewed change.

Run focused API and web checks before handoff.
