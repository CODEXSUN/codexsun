# Server Runtime Skill

## Use this when

Use this guide when adding or changing a local API or web server. Match ports,
preflight, listener ownership, health, readiness, logs, telemetry, restart, or shutdown.

Also read [API](api.md) when the server is a Fastify application.

## Startup

- Add the service to `tools/preflight.mjs` and the appropriate stack in `tools/dev-stack.mjs`.
- List local package dependencies in the service's `prepareWorkspaces`. Preflight builds these packages before it changes the active listener.
- Give API and web services stable 6000-series ports and a health address.
- Startup must verify the listener owner belongs to this workspace before it stops it.
- For a verified workspace listener, stop the process tree, wait for port release, reserve the same port, then start a fresh process.
- Never stop an unrelated process. Fail with the port and ownership error instead.

## Shutdown

- API entry points handle `SIGINT`, `SIGTERM`, and supervisor IPC.
- API shutdown closes OpenTelemetry exporters after request handling stops.
- Stop new requests, close Fastify, and close database pools before process exit.
- Give graceful shutdown a bounded wait. Force termination is only a fallback.
- Web development servers stop through their verified workspace process tree.

## Verification

- Start the stack twice and confirm the second invocation performs a controlled restart on the same ports.
- Change a local package export and confirm preflight rebuilds that dependency before the application starts.
- Call each health endpoint after startup.
- Confirm the console uses compact `<application>/<component>` lines without repeated logger identity fields.
- Confirm readable, structured, and failure-only files exist in the central runtime directories.
- Trigger one controlled test failure and confirm `npm.cmd run logs:failures` reports it.
- Stop the stack and verify both ports are released.
- Run `npm.cmd run runtime:smoke -- <profile>` only after selected profile ports are free.
- Run `npm.cmd run mariadb:setup` before the first local database start.
- Run `npm.cmd run test:mariadb:foundation` with the database-scoped application account.
- Run the focused type check and build for changed applications.

## Development record

- Record ports, health routes, readiness probes, signal handlers, cleanup tasks, and lifecycle tests after each server change.
- Record logger identity, redaction, telemetry variables, rotation, failure capture, and exporter verification.
- Link the runtime foundation and owning application README.
- Update this guide when a tested startup or shutdown pattern changes.
