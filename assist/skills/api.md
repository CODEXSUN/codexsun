# API Skill

## Use this when

Use this guide for any `apps/<app>/api` change. Match routes, public contracts,
Zod validation, persistence, migrations, queues, request context, or API health.

Also read [Server Runtime](server-runtime.md) when the change affects startup,
ports, logging, health, preflight, or shutdown.

Read [the application standard](../architecture/application-standard.md) and [the runtime foundation](../architecture/runtime-foundation.md) before creating or changing a server.

## Responsibilities

- Keep Fastify routes, API input validation, domain behavior, persistence, and queue registration in the owning API application.
- Keep reusable API contracts in `packages/platform-core/api` or `packages/platform-core/shared/contracts`.
- Define a request and response contract before building a route consumer.
- Validate request payloads, parameters, and configuration with Zod at the boundary.

## Persistence and jobs

- MariaDB is the primary database. Kysely is the query builder and MySQL2 is the driver.
- The root `.env` file provides database and storage configuration. Do not commit it.
- Add typed database access and module-owned migrations together when persistence is approved. Never create a central business migration or seed directory.
- Run migrations in dependency order through the module runtime, one transaction at a time, with immutable ledger checksums and an application migration lock.
- Keep liveness available while MariaDB or module preparation is unavailable. Readiness must report the failed component.
- Use request context for request ID, correlation ID, locale, and cancellation instead of process globals.
- Carry a neutral actor in request context. Bind Identity through the application resolver and authorizer contracts.
- Register module readiness through the owning module definition. Set an owner, safe failure message, and timeout.
- Parse each application-owned environment schema through `PlatformConfiguration`. Expose only named public settings.
- Load the root file through `PlatformEnvironmentLoader` before schema parsing. Keep process values above file values, aliases, and defaults.
- Use the standard `DB_*` contract in application runtime schemas. Keep optional `MARIADB_ADMIN_*` setup credentials out of application runtimes.
- Add Fastify response schemas for every public status code.
- BullMQ requires a documented Redis configuration, named queues, retry rules, idempotency behavior, and worker ownership before it is used.
- Never log secrets, raw credentials, or sensitive request data.
- Use the public `@codexsun/platform-identity-client` for Identity HTTP consumers. Supply request-scoped credentials, enforce the returned decision, and fail closed on errors. Never import Platform API private source.
- Use `PlatformApiObservability` for logger creation, request correlation, HTTP traces, metrics, and telemetry shutdown.
- Keep OpenTelemetry exporters in application infrastructure. Never create an exporter inside a business module.
- Keep production logs as JSON. Use Pino Pretty only for local development.
- Use `npm.cmd run dev:api` so port preflight runs before the API watcher starts.
- Keep liveness independent from MariaDB. Use readiness to report database availability.
- Handle `SIGINT` and `SIGTERM` through Fastify close hooks. Keep forced termination as a bounded fallback.

## Verify

Run `npm.cmd run typecheck`, the application API build, its production-artifact lifecycle E2E test, and `npm.cmd run check:app-docs`. For routes, start the service through preflight and exercise the affected endpoint. For MariaDB changes, run `npm.cmd run mariadb:setup`, `npm.cmd run test:mariadb:foundation`, and the live readiness route.

## Development record

For Zetro task worktrees, prepare only confirmed empty source-owner and documentation directories through the Codex Connection worktree service.
Do not copy uncommitted source or silently reset a conversation to a newer revision.
Check both the source and documentation paths when diagnosing a missing-worktree-folder error.

After each API feature, update its module README and the application development record. Record route contracts, environment keys, runtime services, shutdown bindings, tests, and unavailable dependency checks.

Update this guide when a tested server pattern replaces an earlier API workflow.
