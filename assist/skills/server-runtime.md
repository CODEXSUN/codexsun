# Server Runtime Skill

Use this guide when adding or changing any local application server.

## Startup

- Add the service to `tools/preflight.mjs` and the appropriate stack in `tools/dev-stack.mjs`.
- Give API and web services stable 6000-series ports and a health address.
- Startup must verify the listener owner belongs to this workspace before it stops it.
- For a verified workspace listener, stop the process tree, wait for port release, reserve the same port, then start a fresh process.
- Never stop an unrelated process. Fail with the port and ownership error instead.

## Shutdown

- API entry points handle `SIGINT`, `SIGTERM`, and supervisor IPC.
- Stop new requests, close Fastify, and close database pools before process exit.
- Give graceful shutdown a bounded wait. Force termination is only a fallback.
- Web development servers stop through their verified workspace process tree.

## Verification

- Start the stack twice and confirm the second invocation performs a controlled restart on the same ports.
- Call each health endpoint after startup.
- Stop the stack and verify both ports are released.
- Run the focused type check and build for changed applications.

## Development record

- Record ports, health routes, readiness probes, signal handlers, cleanup tasks, and lifecycle tests after each server change.
- Link the runtime foundation and owning application README.
- Update this guide when a tested startup or shutdown pattern changes.
