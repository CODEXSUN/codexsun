# Orship Application

Reference: [Application standard](../../assist/architecture/application-standard.md)

## Purpose

Orship is the local operations application for CODEXSUN. It groups each application's services and shows real health, process metrics, shared runtime logs, and guarded controls.

## Ownership

- `contracts` owns the public service, metric, log, action, deployment-evidence, and manual-record schemas.
- `api` owns deployment-catalog discovery, health probes, process inspection, log access, local start or stop actions, read-only Git and file inspection, and private append-only evidence records.
- `web` owns the live operations workspace, service inspector, command previews, and manual verification capture.
- `packages/runtime` still owns deployment planning and complete-profile startup.
- Orship does not own another application's behavior, data, or health policy.

## Workspaces and commands

| Workspace                    | Purpose              | Development command          | Default address         |
| ---------------------------- | -------------------- | ---------------------------- | ----------------------- |
| `@codexsun/orship-api`       | Operations API       | `npm.cmd run dev:orship-api` | `http://127.0.0.1:6090` |
| `@codexsun/orship-web`       | Operations web app   | `npm.cmd run dev:orship`     | `http://127.0.0.1:6091` |
| `@codexsun/orship-contracts` | Shared API contracts | Root build and type check    | N/A                     |

`npm.cmd run dev:orship` starts the API and web through preflight. `npm.cmd run test:orship` runs the focused module tests.

The root `npm.cmd run dev` command does not start Orship. Use `npm.cmd run dev:all` only when one terminal must own the complete application set.

## Runtime configuration

Root `.env` owns `ORSHIP_API_HOST`, `ORSHIP_API_PORT`, `ORSHIP_WEB_HOST`, `ORSHIP_WEB_PORT`, `ORSHIP_CONTROL_ENABLED`, `ORSHIP_CLOUD_SSH_KEY_PATH`, and `VITE_ORSHIP_API_URL`.

Controls require `ORSHIP_CONTROL_ENABLED=true` and a loopback HTTP request. Orship verifies that a listener belongs to this repository before it stops the process. Orship API and web components are protected from self-stop actions.

The shared runtime writes concise component logs below `storage/app/private/runtime/logs`. Orship reads each `<component>.log` through its API. Complete JSONL diagnostics remain beside the readable file, and warnings or errors are copied to `storage/app/private/runtime/failures`. The web application never reads local files directly.

Orship API also uses the shared Platform Core observability adapter. In production, all API log streams use the same JSON identity and request fields before the runtime holder writes them to the central log directory. Operators can run `npm.cmd run logs:failures` for a cross-application failure summary.

The application report includes a read-only Failures tab. It groups normalized warning, error, fatal, spawn, request, and unexpected-exit records by application. Orship does not accept browser log uploads.

## Local deployment evidence

The Platform Deployment console is a local evidence desk, not a deployment executor. It inspects the current Git branch, commit, working-tree state, repository location, and relevant source or generated files. It previews the reviewed `platform-only` commands for verification, pull, preparation, and Local Docker deployment, but the operator runs them outside Orship.

After manual execution, the operator pastes terminal output and records `awaiting-verification`, `verified`, or `failed`. The API redacts common secret and connection-string patterns before appending the record to private JSONL storage. Copying a command is not a deployment result. VPS configuration can be retained as an inactive target; remote SSH and browser-triggered Docker execution are intentionally out of scope.

## Health and shutdown

- Liveness: `GET http://127.0.0.1:6090/health` and `/health/live`.
- Readiness: `GET http://127.0.0.1:6090/health/ready`.

The API handles `SIGINT`, `SIGTERM`, and supervisor IPC. Orship start actions use the root preflight command. Stop actions first request a normal process-tree stop and use a bounded forced fallback.

## Deployment assembly

The shared runtime holder registers `orship-api` and `orship-web`. Orship requires Platform and joins the complete `development` profile. The default `main-development` profile omits it. A customer profile must select Orship explicitly.

Production controls remain disabled unless the deployment supplies an approved local control boundary. A remote browser must not receive process-control access without a future Identity permission and trusted control-plane design.

## Verification

Run focused tests, type checks, builds, API route checks, browser checks, restart checks, and port-release checks. Run `npm.cmd run runtime:validate` and the complete root gate before handoff.

## Module catalog

The [Orship module catalog](../../assist/modules/orship.md) links the authoritative API and web module documents.
