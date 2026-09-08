# Platform and Framework Foundation

## Outcome

The framework now validates complete manifests, creates immutable composition plans, and runs ordered module lifecycles with activation rollback.

Platform now uses injectable runtime dependencies, component readiness probes, ordered shutdown tasks, shared HTTP schemas, and System modules for API and web.

## Authoritative references

- Owner README: [Framework](../../../packages/framework/README.md).
- Application catalog: [Platform modules](../../modules/platform.md).
- Architecture contracts: [Module standard](../../architecture/module-standard.md) and [runtime foundation](../../architecture/runtime-foundation.md).
- Local skills: [Modular monolith](../../skills/modular-monolith.md), [API](../../skills/api.md), and [web UI](../../skills/web-ui.md).

## Ownership and boundaries

The framework owns generic manifest validation, dependency planning, and lifecycle execution. It does not own Fastify, MariaDB, storage, routes, or UI.

Platform Core API owns the Fastify module binding and shutdown-task contract. Platform Core web owns route and navigation contribution composition.

The Platform application owns concrete MariaDB, storage, Fastify, React, and TanStack integration. The System module owns runtime metadata routes and views.

## Binding properties

| Producer                 | Consumer     | Binding                                    | Version or key           |
| ------------------------ | ------------ | ------------------------------------------ | ------------------------ |
| Framework module         | Platform API | `FrameworkModule` manifest                 | Platform `^0.1.0`        |
| Platform API composition | API module   | `PlatformApiModuleContext`                 | TypeScript contract      |
| System API               | System web   | `GET /api/system/runtime`                  | `system.runtime` `1.0.0` |
| Platform API             | Operations   | `/health`, `/health/live`, `/health/ready` | HTTP contract            |
| Root environment         | Platform web | API origin                                 | `VITE_PLATFORM_API_URL`  |
| Platform web module      | Router       | Route and navigation contributions         | Module `1.0.0`           |

## Parallel work

A concurrent change introduced `@codexsun/ui/layouts/mdi-main` as the Platform shell. This change preserved that owner and bound routing through its `children` and `navigation` properties.

No framework or server file was assigned to another workstream during this change.

## Decisions

- Decision: Keep the framework independent from Fastify and persistence.
- Reason: Applications must own runtime and database behavior.
- Rejected alternative: A framework service locator with database and HTTP globals.
- Decision: Use explicit module contexts and contribution objects.
- Reason: These bindings are testable and versioned.
- Rejected alternative: Private cross-module imports and hard-coded routes in the shell.

## Verification

- `npm.cmd run test:framework` passed eight registry, validation, install, upgrade, activation, rollback, and shutdown tests.
- Platform API type checks, production builds, composition tests, SIGTERM tests, and supervisor IPC tests passed during implementation.
- Platform web type checks and its production build passed after TanStack integration.
- `npm.cmd run check` passed all workspace, documentation, formatting, lint, type, build, chunk, framework, web composition, and server gates.
- The Platform stack ran on isolated ports `6110` and `6120`. The browser showed the MDI System workspace and its composed navigation route.
- The browser showed Platform `0.1.0`, System `1.0.0`, and `system.runtime.read`. No browser warning or error was present.
- `Ctrl+C` stopped both isolated services and released both ports.
- Live MariaDB readiness was not verified in this record.

## Follow-up work

- Add durable installed-module state with module-owned MariaDB migrations.
- Add authenticated authorization only when the Identity module starts.
