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

Run the main local application set with `npm.cmd run dev`. This command includes Platform but keeps Orship separate. Build the production API with `npm.cmd run build:api`.

## Deployment assembly

The shared runtime holder registers `platform-api` and `platform-web`. Platform is selected by both the complete `development` profile and the minimal `platform-only` profile. Other applications may declare Platform as a required application, but they may not import its private source.

Use `npm.cmd run runtime:plan -- platform-only` to inspect the resolved framework and Platform Core bindings. Use `npm.cmd run runtime:build -- platform-only` to stage only these two components for a container build.

## Runtime configuration

Root `.env` owns `PLATFORM_API_HOST`, `PLATFORM_API_PORT`, `PLATFORM_WEB_HOST`, `PLATFORM_WEB_PORT`, `PLATFORM_WEB_ORIGIN`, `VITE_PLATFORM_API_URL`, logging, shutdown, MariaDB, module runtime, and storage settings. Safe examples are in [root `.env.example`](../../.env.example).

`PlatformEnvironmentLoader` reads the root file once and publishes its values to the process environment. Process values take precedence. Explicit aliases provide compatibility, and safe defaults fill missing values. Platform then validates its application-owned Zod schema.

Use `npm.cmd run mariadb:setup` to provision `DB_MASTER_NAME` and its dedicated `DB_USER`. Application runtimes and database tools use the same `DB_*` variables. Optional `MARIADB_ADMIN_*` values let the setup tool use separate administrator credentials; the Platform runtime never parses them.

Set a unique `DB_PASSWORD` before a shared or production deployment. Production configuration rejects an empty application password. Do not disable the module runtime to hide a database configuration error.

Preflight verifies port ownership before restart. Fastify uses Pino, redacts credentials, returns request and correlation IDs, and writes files only below central storage.

The API uses the shared Platform Core observability adapter. Development logs are readable console output. Production logs are JSON records with application, component, version, environment, request, correlation, trace, and span fields. Enable OTLP export only through the root telemetry environment settings.

Request context also carries a neutral actor. Authorization denies by default until Identity supplies an application adapter. Platform Core does not define roles, permissions, sessions, or tenant rules. Modules can contribute named readiness probes with explicit ownership and timeouts.

## Health and shutdown

- Liveness: `GET http://127.0.0.1:6010/health` and `/health/live`.
- Readiness: `GET http://127.0.0.1:6010/health/ready`.

Readiness checks MariaDB, central storage, and durable module preparation. Liveness remains available while MariaDB or a module migration is unavailable. The server handles `SIGINT`, `SIGTERM`, and supervisor IPC, waits for runtime preparation, deactivates modules in reverse dependency order, closes the database pool, and applies the configured shutdown deadline.

The `module-runtime` core module owns the installed-module, migration, and seed ledgers. Each persistent module keeps its migrations, seeds, and schema guard in its own folder. Startup applies queued declarations under a MariaDB advisory lock. It then compares each live schema fingerprint before module activation. `MODULE_RUNTIME_ENABLED=false` is for isolated lifecycle tests and diagnostics. Development and production default to `true`.

## Verification

Run `npm.cmd run test:e2e:server`. It builds the production artifact, verifies HTTP behavior, performs signal and supervisor shutdown, and confirms port release. Run the full `npm.cmd run check` before handoff.

Run `npm.cmd run test:mariadb:foundation` with the database-scoped MariaDB application account. Stop selected profile services before `npm.cmd run runtime:smoke -- platform-only`.

Run `npm.cmd run mariadb:smoke` for a direct connection check. `dev:api` runs the same check during preflight.

## Module catalog

The Platform module catalog is [assist/modules/platform.md](../../assist/modules/platform.md). Each catalog entry links its authoritative module README.

## Development records

- [2026-09-09 Assist discovery and skill routing](../../assist/records/platform/2026-09-09-assist-discovery.md)
- [2026-09-08 Platform and framework foundation](../../assist/records/platform/2026-09-08-platform-framework-foundation.md)
- [2026-09-08 Durable module runtime preparation](../../assist/records/platform/2026-09-08-module-runtime-preparation.md)
- [2026-09-08 Durable module runtime](../../assist/records/platform/2026-09-08-durable-module-runtime.md)
- [2026-09-08 Deployment assembly runtime](../../assist/records/platform/2026-09-08-deployment-assembly-runtime.md)
- [2026-09-09 Build and observability foundation](../../assist/records/platform/2026-09-09-build-observability-foundation.md)
- [2026-09-09 Pre-Identity hardening](../../assist/records/platform/2026-09-09-pre-identity-hardening.md)
- [2026-09-09 Migration preflight and schema integrity](../../assist/records/platform/2026-09-09-migration-preflight-schema-integrity.md)
