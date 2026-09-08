# Orship Application

Reference: [Application standard](../../assist/architecture/application-standard.md)

## Purpose

Orship is the local operations application for CODEXSUN. It shows real service health, process metrics, shared runtime logs, and guarded controls for catalog components.

## Ownership

- `contracts` owns the public service, metric, log, and action schemas.
- `api` owns deployment-catalog discovery, health probes, process inspection, log access, and local start or stop actions.
- `web` owns the live operations workspace and service inspector.
- `packages/runtime` still owns deployment planning and complete-profile startup.
- Orship does not own another application's behavior, data, or health policy.

## Workspaces and commands

| Workspace                    | Purpose              | Development command          | Default address         |
| ---------------------------- | -------------------- | ---------------------------- | ----------------------- |
| `@codexsun/orship-api`       | Operations API       | `npm.cmd run dev:orship-api` | `http://127.0.0.1:6090` |
| `@codexsun/orship-web`       | Operations web app   | `npm.cmd run dev:orship`     | `http://127.0.0.1:6091` |
| `@codexsun/orship-contracts` | Shared API contracts | Root build and type check    | N/A                     |

`npm.cmd run dev:orship` starts the API and web through preflight. `npm.cmd run test:orship` runs the focused module tests.

## Runtime configuration

Root `.env` owns `ORSHIP_API_HOST`, `ORSHIP_API_PORT`, `ORSHIP_WEB_HOST`, `ORSHIP_WEB_PORT`, `ORSHIP_CONTROL_ENABLED`, and `VITE_ORSHIP_API_URL`.

Controls require `ORSHIP_CONTROL_ENABLED=true` and a loopback HTTP request. Orship verifies that a listener belongs to this repository before it stops the process. Orship API and web components are protected from self-stop actions.

The shared runtime writes component output below `storage/app/private/runtime/logs`. Orship reads this private path through its API. The web application never reads local files directly.

## Health and shutdown

- Liveness: `GET http://127.0.0.1:6090/health` and `/health/live`.
- Readiness: `GET http://127.0.0.1:6090/health/ready`.

The API handles `SIGINT`, `SIGTERM`, and supervisor IPC. Orship start actions use the root preflight command. Stop actions first request a normal process-tree stop and use a bounded forced fallback.

## Deployment assembly

The shared runtime holder registers `orship-api` and `orship-web`. Orship requires Platform and joins the complete `development` profile. A customer profile must select Orship explicitly.

Production controls remain disabled unless the deployment supplies an approved local control boundary. A remote browser must not receive process-control access without a future Identity permission and trusted control-plane design.

## Verification

Run focused tests, type checks, builds, API route checks, browser checks, restart checks, and port-release checks. Run `npm.cmd run runtime:validate` and the complete root gate before handoff.

## Module catalog

The [Orship module catalog](../../assist/modules/orship.md) links the authoritative API and web module documents.
