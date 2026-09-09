# Runtime Foundation

## Purpose

This contract defines the proven Platform runtime behavior that must exist before Identity modules start. It is also the baseline for future application servers. Read [the application standard](application-standard.md) when creating an application.

## Development addresses

- Platform API uses `127.0.0.1:6010` by default.
- Platform web uses `127.0.0.1:6021` by default.
- Both ports must remain in the 6000 series.
- The root `.env` file owns host and port values.
- `PlatformEnvironmentLoader` publishes the root file before an application parses its own schema. Process values override file values. Explicit aliases precede defaults.
- A preflight check must reserve the selected port before a local service starts.
- Preflight builds declared local package dependencies before it changes an active listener. This prevents stale root-dist package exports and preserves the running service when a dependency build fails.
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

Each module can declare readiness probes through its public API module definition. Each probe must name its module owner and use a bounded timeout. The application owns database and storage probes.

Request context carries a neutral actor. The default authorizer denies access. Identity can later bind actor resolution and authorization policy through the application composition root. The shared contract does not define roles, permissions, sessions, or tenant rules.

## Logging

Fastify uses Pino for request and application logs. Local preflight requests structured child output and renders one compact, component-prefixed console line. Production uses structured JSON without console transformation.

Every API uses `PlatformApiObservability` from Platform Core. Logs include application, component, service, version, and environment. Request logs include request, correlation, trace, and span identifiers.

Logs redact authorization, cookie, password, token, and API-key values. Error fields use the same Pino serializer. Request-start and successful health-probe events remain at debug level. Successful application requests use info, server failures use warning, and request exceptions use error.

Root preflight owns these central files for every component:

- `storage/app/private/runtime/logs/<component>.log` contains concise readable lines for Orship.
- `storage/app/private/runtime/logs/<component>.jsonl` retains every structured or normalized output record for diagnosis.
- `storage/app/private/runtime/failures/<component>.jsonl` contains warning and error records, detected failure output, spawn failures, and unexpected process exits.

Files rotate to `.previous` before startup when they reach `RUNTIME_LOG_MAX_BYTES`. The default is 5 MiB. Applications must not create another runtime log directory. Use `npm.cmd run logs:failures` to read the latest failures across components.

OpenTelemetry export is opt-in. Set `OTEL_SDK_DISABLED=false` and an OTLP endpoint to export HTTP traces and metrics. Keep exporters outside business modules. Close the SDK during application shutdown.

## Health contract

- `GET /health` reports process liveness.
- `GET /health/live` is an explicit liveness alias.
- `GET /health/ready` checks MariaDB and central storage readiness as separate components.

A failed dependency must not make the liveness route fail. A failed dependency must make the readiness route return HTTP 503.

## MariaDB setup

Use a database-scoped application account for runtime access. Use administrator credentials only through `npm.cmd run mariadb:setup` and the isolated integration harness.

The application runtime and setup tool read the same `DB_*` database contract. The setup tool creates `DB_MASTER_NAME`, creates or updates `DB_USER`, and grants access only to that database. Optional `MARIADB_ADMIN_*` values let setup use a separate administrator account without changing the application contract.

The integration test creates a PID-scoped database. It grants the application account temporary access, runs lifecycle checks, and removes the database. Production rejects an empty application password.

Platform API preflight runs `mariadb:smoke` before it reserves the API port. Application startup applies queued module migrations under one advisory lock. It checks each module-owned schema fingerprint after migration and before activation. A checksum mismatch keeps readiness unavailable.

## Shutdown contract

The API handles `SIGINT`, `SIGTERM`, and supervisor IPC. Shutdown aborts module work, deactivates modules, closes registered tasks, drains Fastify, and closes MariaDB.

The shutdown grace period is bounded. Forced termination is a fallback after the grace period expires.

The local runtime holder closes its supervisor IPC channel after every child stops. On Windows, preflight stops the complete owned process tree so watchers and Vite processes cannot remain on reserved ports.

## Verification

`npm.cmd run test:e2e:server` builds the production API artifact. The test starts that artifact, calls health, sends `SIGTERM`, waits for exit, and confirms port release.

Every future API must provide an equivalent production-artifact lifecycle test. A development-only health check does not replace signal, cleanup, and port-release proof.

Use `npm.cmd run runtime:smoke -- <profile>` for the complete profile lifecycle. The command refuses to replace active listeners. It must prove startup, health, supervisor shutdown, and port release. Use `npm.cmd run test:mariadb:foundation` for the isolated MariaDB lifecycle test.
