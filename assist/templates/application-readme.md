# Application Name

Reference: [Application standard](../architecture/application-standard.md)

## Purpose

State the application outcome and why it is a separate composition boundary.

## Ownership

List the responsibilities owned by each API, web, desktop, mobile, or contract workspace. State what does not belong in the application root.

## Workspaces and commands

| Workspace        | Purpose       | Development command       | Default address         |
| ---------------- | ------------- | ------------------------- | ----------------------- |
| `@scope/app-api` | Fastify API   | `npm.cmd run dev:app-api` | `http://127.0.0.1:60xx` |
| `@scope/app-web` | React web app | `npm.cmd run dev:app`     | `http://127.0.0.1:60yy` |

List build, type-check, and focused test commands when they differ from root validation.

## Runtime configuration

List every application environment key, its safe default, and its purpose. Point to root `.env.example`. Never include a real secret.

Describe preflight ownership checks, strict port behavior, logging, request identifiers, API envelopes, and central storage paths.

## Health and shutdown

List liveness and readiness URLs. State which dependencies affect readiness. Describe `SIGINT`, `SIGTERM`, supervisor IPC, resource cleanup, and the shutdown deadline.

## Verification

List the focused build, type check, endpoint, restart, lifecycle E2E, and port-release checks. Record unavailable checks as not run.

## Module catalog

Link `assist/modules/<app>.md` and each authoritative module README. Keep behavior in module documentation, not here.
