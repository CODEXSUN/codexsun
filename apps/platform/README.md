# Platform Application

Reference: [Application standard](../../assist/architecture/application-standard.md)

## Purpose

Platform is the composition host for the shared framework and Platform Core packages. It contains technical startup and shell behavior only.

## Ownership

- `api` owns Fastify startup, application composition, health, central storage binding, and MariaDB runtime configuration.
- `web` owns the React browser startup and Platform shell.
- Business behavior belongs in versioned leaf modules, not in the application root.

## Workspaces and commands

| Workspace                | Purpose       | Development command   | Default address         |
| ------------------------ | ------------- | --------------------- | ----------------------- |
| `@codexsun/platform-api` | Fastify API   | `npm.cmd run dev:api` | `http://127.0.0.1:6010` |
| `@codexsun/platform-web` | React web app | `npm.cmd run dev:web` | `http://127.0.0.1:6021` |

Run both with `npm.cmd run dev`. Build the production API with `npm.cmd run build:api`.

## Runtime configuration

Root `.env` owns `PLATFORM_API_HOST`, `PLATFORM_API_PORT`, `PLATFORM_WEB_HOST`, `PLATFORM_WEB_PORT`, `PLATFORM_WEB_ORIGIN`, `VITE_PLATFORM_API_URL`, logging, shutdown, MariaDB, and storage settings. Safe examples are in [root `.env.example`](../../.env.example).

Preflight verifies port ownership before restart. Fastify uses Pino, redacts credentials, returns request and correlation IDs, and writes files only below central storage.

## Health and shutdown

- Liveness: `GET http://127.0.0.1:6010/health` and `/health/live`.
- Readiness: `GET http://127.0.0.1:6010/health/ready`.

Readiness checks MariaDB and central storage. The server handles `SIGINT`, `SIGTERM`, and supervisor IPC, closes Fastify and the database pool, and applies the configured shutdown deadline.

## Verification

Run `npm.cmd run test:e2e:server`. It builds the production artifact, verifies HTTP behavior, performs signal and supervisor shutdown, and confirms port release. Run the full `npm.cmd run check` before handoff.

## Module catalog

The Platform module catalog is [assist/modules/platform.md](../../assist/modules/platform.md). Each catalog entry links its authoritative module README.

## Development records

- [2026-09-08 Platform and framework foundation](../../assist/records/platform/2026-09-08-platform-framework-foundation.md)
- [2026-09-08 Durable module runtime preparation](../../assist/records/platform/2026-09-08-module-runtime-preparation.md)
