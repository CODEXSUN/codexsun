# API Skill

Use this guide for work in `apps/platform/api` and future product API apps.

Read [the application standard](../architecture/application-standard.md) and [the runtime foundation](../architecture/runtime-foundation.md) before creating or changing a server.

## Responsibilities

- Keep Fastify routes, API input validation, domain behavior, persistence, and queue registration in the owning API application.
- Keep reusable API contracts in `packages/platform-core/api` or `packages/platform-core/shared/contracts`.
- Define a request and response contract before building a route consumer.
- Validate request payloads, parameters, and configuration with Zod at the boundary.

## Persistence and jobs

- MariaDB is the primary database. Kysely is the query builder and MySQL2 is the driver.
- The root `.env` file provides database and storage configuration. Do not commit it.
- Add a typed database module and migrations together when persistence is approved.
- BullMQ requires a documented Redis configuration, named queues, retry rules, idempotency behavior, and worker ownership before it is used.
- Never log secrets, raw credentials, or sensitive request data.
- Use `npm.cmd run dev:api` so port preflight runs before the API watcher starts.
- Keep liveness independent from MariaDB. Use readiness to report database availability.
- Handle `SIGINT` and `SIGTERM` through Fastify close hooks. Keep forced termination as a bounded fallback.

## Verify

Run `npm.cmd run typecheck`, the application API build, its production-artifact lifecycle E2E test, and `npm.cmd run check:app-docs`. For routes, start the service through preflight and exercise the affected endpoint.

## Development record

After each API feature, update its module README and the application development record. Record route contracts, environment keys, runtime services, shutdown bindings, tests, and unavailable dependency checks.

Update this guide when a tested server pattern replaces an earlier API workflow.
