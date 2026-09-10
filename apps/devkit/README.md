# DevKit Application

Reference: [Application standard](../../assist/architecture/application-standard.md)

## Purpose

DevKit is the CODEXSUN planning application. Its first module is the Project
Registry, a JSON-backed hierarchy for programme-to-task drill-down and explicit
development confirmation.

## Ownership

- `api` owns the project registry HTTP contract and JSON storage lifecycle.
- `web` owns the planning reader, recursive drill-down, and confirmation controls.
- `contracts` owns the shared request and response schema.
- `packages/ui` owns every reusable component, form frame, field control, block,
  layout, template, and visual variant. DevKit uses public `@codexsun/ui` exports.
- DevKit must not create reusable UI copies. It owns business data, validation,
  callbacks, routes, workflows, and screen composition.

## Workspaces and commands

| Workspace              | Command                      | Address                 |
| ---------------------- | ---------------------------- | ----------------------- |
| `@codexsun/devkit-api` | `npm.cmd run dev:devkit-api` | `http://127.0.0.1:6070` |
| `@codexsun/devkit-web` | `npm.cmd run dev:devkit`     | `http://127.0.0.1:6080` |

`npm.cmd run dev:devkit` starts both services through the workspace preflight.

## Deployment assembly

The shared runtime holder registers `devkit-api` and `devkit-web`. DevKit requires Platform and is selected in the complete `development` profile. A customer profile may omit DevKit without copying its API, web, contracts, or registry artifact into the generated deployment.

Deployment selection does not change DevKit module or persistence ownership. Its API and web remain separate component and container boundaries.

## Runtime configuration

The root `.env` owns `DEVKIT_API_HOST`, `DEVKIT_API_PORT`, `DEVKIT_WEB_PORT`,
`VITE_DEVKIT_API_URL`, and `DEVKIT_REGISTRY_PATH`. The first registry read
creates an empty `storage/app/private/devkit/project-registry.json`.

The API uses the shared Platform Core observability adapter for Pino logs, request correlation, HTTP telemetry, and safe shutdown. Production JSON output is captured by the runtime holder for Orship.

## Health and shutdown

The API exposes `/health`, `/health/live`, and `/health/ready`. The preflight
supervisor owns controlled start, restart, and shutdown.

## Module catalog

See [DevKit module catalog](../../assist/modules/devkit.md).

## Verification

Run the focused DevKit type checks and builds, start `npm.cmd run dev:devkit`,
then verify health, recursive drill-down, and a confirmation write.
