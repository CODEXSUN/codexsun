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

## Deployment assembly

The shared runtime holder registers `platform-api` and `platform-web`. Platform is selected by both the complete `development` profile and the minimal `platform-only` profile. Other applications may declare Platform as a required application, but they may not import its private source.

Use `npm.cmd run runtime:plan -- platform-only` to inspect the resolved framework and Platform Core bindings. Use `npm.cmd run runtime:build -- platform-only` to stage only these two components for a container build.

## Runtime configuration

Root `.env` owns `PLATFORM_API_HOST`, `PLATFORM_API_PORT`, `PLATFORM_WEB_HOST`, `PLATFORM_WEB_PORT`, `PLATFORM_WEB_ORIGIN`, `VITE_PLATFORM_API_URL`, logging, shutdown, MariaDB, module runtime, and storage settings. Safe examples are in [root `.env.example`](../../.env.example).

Preflight verifies port ownership before restart. Fastify uses Pino, redacts credentials, returns request and correlation IDs, and writes files only below central storage.

## Health and shutdown

- Liveness: `GET http://127.0.0.1:6010/health` and `/health/live`.
- Readiness: `GET http://127.0.0.1:6010/health/ready`.

Readiness checks MariaDB, central storage, and durable module preparation. Liveness remains available while MariaDB or a module migration is unavailable. The server handles `SIGINT`, `SIGTERM`, and supervisor IPC, waits for runtime preparation, deactivates modules in reverse dependency order, closes the database pool, and applies the configured shutdown deadline.

The `module-runtime` core module owns the installed-module, migration, and seed ledgers. Each persistent module keeps its ordered migrations and seeds in its own folder. Startup validates immutable checksums, takes a MariaDB advisory lock, runs each declaration transactionally in dependency order, and activates only after preparation succeeds. `MODULE_RUNTIME_ENABLED=false` is for isolated lifecycle tests and diagnostics; normal development and production default to `true`.

## Verification

Run `npm.cmd run test:e2e:server`. It builds the production artifact, verifies HTTP behavior, performs signal and supervisor shutdown, and confirms port release. Run the full `npm.cmd run check` before handoff.

## Module catalog

The Platform module catalog is [assist/modules/platform.md](../../assist/modules/platform.md). Each catalog entry links its authoritative module README.

## Development records

- [2026-09-08 Platform and framework foundation](../../assist/records/platform/2026-09-08-platform-framework-foundation.md)
- [2026-09-08 Durable module runtime preparation](../../assist/records/platform/2026-09-08-module-runtime-preparation.md)
- [2026-09-08 Durable module runtime](../../assist/records/platform/2026-09-08-durable-module-runtime.md)
- [2026-09-08 Deployment assembly runtime](../../assist/records/platform/2026-09-08-deployment-assembly-runtime.md)
