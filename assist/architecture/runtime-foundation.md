# Runtime Foundation

## Purpose

This contract defines the proven Platform runtime behavior that must exist before Identity modules start. It is also the baseline for future application servers. Read [the application standard](application-standard.md) when creating an application.

## Development addresses

- Platform API uses `127.0.0.1:6010` by default.
- Platform web uses `127.0.0.1:6021` by default.
- Both ports must remain in the 6000 series.
- The root `.env` file owns host and port values.
- A preflight check must reserve the selected port before a local service starts.
- Preflight verifies listener ownership. It stops only a verified workspace process, waits for port release, then starts a fresh service on the same port. It fails for an unrelated process.

## API composition

The Fastify app builder owns HTTP composition. The server entry point owns process startup and shutdown.

The API registers these infrastructure plugins:

- Helmet security headers.
- Exact-origin CORS for the Platform web address.
- Global request rate limits.
- Sensible HTTP errors.
- Event-loop pressure protection.
- Public storage file serving.

Business modules must register through the application composition root. They must not add process signal handlers.

Each API module exposes one versioned framework manifest and one Fastify plugin. The composition root validates dependencies before it registers plugins.

## Logging

Fastify uses Pino for request and application logs. Development uses readable Pino Pretty output. Production uses structured JSON.

Logs must include the service name and environment. Logs must redact authorization and cookie headers. Routes must return request and correlation IDs.

## Health contract

- `GET /health` reports process liveness.
- `GET /health/live` is an explicit liveness alias.
- `GET /health/ready` checks MariaDB and central storage readiness as separate components.

A failed dependency must not make the liveness route fail. A failed dependency must make the readiness route return HTTP 503.

## Shutdown contract

The API handles `SIGINT`, `SIGTERM`, and supervisor IPC. Shutdown aborts module work, deactivates modules, closes registered tasks, drains Fastify, and closes MariaDB.

The shutdown grace period is bounded. Forced termination is a fallback after the grace period expires.

## Verification

`npm.cmd run test:e2e:server` builds the production API artifact. The test starts that artifact, calls health, sends `SIGTERM`, waits for exit, and confirms port release.

Every future API must provide an equivalent production-artifact lifecycle test. A development-only health check does not replace signal, cleanup, and port-release proof.
