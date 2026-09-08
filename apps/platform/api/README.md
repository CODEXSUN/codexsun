# Platform API

## Purpose

This workspace starts the Platform Fastify runtime. It configures centralized storage, MariaDB access, HTTP safeguards, and process lifecycle behavior.

## Ownership

The source root owns startup and composition only. New Platform capabilities must live in `src/modules/<module>/` and follow the module standard.

## Runtime contracts

- Environment: root `.env`.
- API address: `http://127.0.0.1:6010` by default.
- Web origin: `http://127.0.0.1:6021` by default.
- Database: MariaDB through Kysely and MySQL2.
- Storage: `storage/app/private` and `storage/app/public`.
- Logging: Pino JSON in production and Pino Pretty in development.
- HTTP plugins: CORS, Helmet, rate limit, sensible errors, static files, and pressure protection.
- Liveness endpoints: `GET /health` and `GET /health/live`.
- Readiness endpoint: `GET /health/ready`, including separate MariaDB and storage probes.
- Shutdown: `SIGINT`, `SIGTERM`, and supervisor IPC deactivate modules and close registered resources in reverse order.
- Module composition: an immutable framework plan determines lifecycle and Fastify plugin order.
- Runtime metadata: `GET /api/system/runtime` returns composed module IDs, versions, and capabilities.

## Verification

Run `npm.cmd run typecheck`, `npm.cmd run build`, `npm.cmd run test:e2e:server`, and `npm.cmd run dev:api`.

## Development records

- [2026-09-08 Platform and framework foundation](../../../assist/records/platform/2026-09-08-platform-framework-foundation.md)
