# Orship Task Guide

This file is the active communication guide for Orship work in this session.

## Session Context

The application is `orship`.

The working folder is `apps/orship`.

The agent skill file is `apps/orship/agent/skills.md`.

The task file is `apps/orship/agent/exec/orship-task.md`.

Read this file before each Orship implementation step.

## Product Definition

Orship is the CODEXSUN orchestration application.

It manages deployment, monitoring, and maintenance workflows for CODEXSUN applications, services, hosts, containers, and runtime resources.

Operators use Orship to see what runs, where it runs, which version is active, and whether each service is healthy.

Orship must make operational work traceable. Each deployment, restart, check, and maintenance action needs a clear status and owner.

## Product Functions

- Register deployment targets and service endpoints.
- Show active hosts, ports, runtime processes, and health checks.
- Start, stop, restart, and verify managed services.
- Track deployment versions, deployment status, and rollout history.
- Monitor logs, failed checks, and maintenance events.
- Show configuration shape without exposing secret values.
- Coordinate API, web, worker, database, and storage maintenance tasks.
- Record operator actions for review and audit.
- Surface required action when a service becomes unhealthy.

## Application Boundary

Keep Orship product code inside `apps/orship`.

Use public exports from shared packages for framework, platform, storage, identity, and UI behavior.

Do not copy shared package code into Orship.

Do not import private files from another application.

Do not change `packages/*` from an Orship task without a reviewed shared-package decision.

## Runtime Boundary

Install dependencies only from the repository root.

Do not create `node_modules` inside `apps/orship`.

Do not create local `dist` or `.turbo` folders inside `apps/orship`.

Write build output only to the repository root `dist` tree.

Use root scripts for Orship development and verification.

## Current Hosts

The API host is `apps/orship/api`.

The web host is `apps/orship/web`.

The API provider is `orship.foundation`.

The API health route is `/api/v1/orship/health`.

The web host composes the shared workspace from `@codexsun/ui`.

## Starting Task

Build Orship from its current foundation into an operations workspace.

The first task is to document and preserve the Orship boundary, then add features in small owner-scoped steps.

Do not start with broad platform changes.

Do not start with shared package changes.

Start with Orship-owned records, routes, views, and checks.

## Work Plan

1. Read `apps/orship/agent/skills.md`.
2. Read `apps/orship/README.md`.
3. Inspect `apps/orship/api` and `apps/orship/web`.
4. Confirm the task owner is Orship.
5. Define the smallest user-visible Orship feature.
6. Keep API behavior in an Orship module.
7. Keep web behavior in the Orship web host.
8. Use shared package exports only through public imports.
9. Add focused tests for changed behavior.
10. Run Orship checks from the repository root.
11. Run the root layout check before handoff.
12. Report passed checks, failed checks, and untested paths.

## Initial Feature Order

1. Define the Orship operations data model.
2. Add an API route for registered managed services.
3. Add service health status records.
4. Add a web view for services and status.
5. Add operator actions for check, start, stop, and restart.
6. Add deployment records and version history.
7. Add maintenance event records.
8. Add log and check result views.
9. Add permission and audit integration through public platform contracts.
10. Add deployment profile integration after the local model is stable.

## Acceptance Criteria

- Orship documentation states the product purpose and boundary.
- Orship work stays inside `apps/orship` unless a reviewed contract change exists.
- No app-local `node_modules`, `dist`, or `.turbo` folder exists.
- API changes use Orship-owned modules and tests.
- Web changes use shared UI exports through public package imports.
- Runtime configuration comes from root `.env` and Orship `.app.env` files.
- Focused Orship checks pass before handoff.

## Verification Commands

Run commands from the repository root.

```text
npm.cmd run test:orship
node tools/check-root-layout.mjs
git diff --check
```

Use these host commands when live verification is required.

```text
npm.cmd run dev:orship-api
npm.cmd run dev:orship-web
```

## Current Implementation Notes

- Infrastructure records are managed as Orship-owned data.
- Each infrastructure card represents one container record.
- The create page keeps form draft data separate from the API create payload.
- The create page derives the host port from the port mapping before it sends data to the API.
- The create page includes a YAML editor so an operator can review or edit the compose scaffold before storing the record.
- A shared `@codexsun/ui` input style update is allowed for this task because the user requested a standard input reset.
