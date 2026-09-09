# Orship Application

Reference: [Application standard](../../assist/architecture/application-standard.md)

## Purpose

Orship is the local operations application for CODEXSUN. It groups each application's services and shows real health, process metrics, shared runtime logs, and guarded controls.

The dashboard and browser favicon use the navy Orship ship mark. The mark shows the operations ship, watchful eyes, and a deployment package.

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

Root `.env` owns `ORSHIP_API_HOST`, `ORSHIP_API_PORT`, `ORSHIP_WEB_HOST`, `ORSHIP_WEB_PORT`, `ORSHIP_CONTROL_ENABLED`, `ORSHIP_DOCKER_CONTROL_ENABLED`, `ORSHIP_DOCKER_MANAGED_LABEL`, `ORSHIP_DOCKER_SOCKET_PATH`, `ORSHIP_CLOUD_SSH_KEY_PATH`, and `VITE_ORSHIP_API_URL`.

Controls require `ORSHIP_CONTROL_ENABLED=true` and a loopback HTTP request. Orship verifies that a listener belongs to this repository before it stops the process. Orship API and web components are protected from self-stop actions.

The shared runtime writes concise component logs below `storage/app/private/runtime/logs`. Orship reads each `<component>.log` through its API. Complete JSONL diagnostics remain beside the readable file, and warnings or errors are copied to `storage/app/private/runtime/failures`. The web application never reads local files directly.

Orship API also uses the shared Platform Core observability adapter. In production, all API log streams use the same JSON identity and request fields before the runtime holder writes them to the central log directory. Operators can run `npm.cmd run logs:failures` for a cross-application failure summary.

The application report includes a read-only Failures tab. It groups normalized warning, error, fatal, spawn, request, and unexpected-exit records by application. Orship does not accept browser log uploads.

## Local deployment evidence

The Platform Deployment console is a local evidence desk, not a deployment executor. It inspects the current Git branch, commit, working-tree state, repository location, and relevant source or generated files. It previews the reviewed `platform-only` commands for verification, pull, preparation, and Local Docker deployment, but the operator runs them outside Orship.

After manual execution, the operator pastes terminal output and records `awaiting-verification`, `verified`, or `failed`. The API redacts common secret and connection-string patterns before appending the record to private JSONL storage. Copying a command is not a deployment result. VPS configuration can be retained as an inactive target; remote SSH and browser-triggered Docker execution are intentionally out of scope.

## Standalone Docker operations

`.container/orship` is the independent Orship Compose unit. Its API owns a local Docker socket boundary and exposes only explicitly labelled containers through its loopback API. The web browser never receives Docker socket access or arbitrary command execution.

The named `orship-storage` volume contains SQLite operation memory and JSONL action records. The initial boundary permits only list, start, stop, and restart for containers labelled `codexsun.orship.manage=true`. It does not inspect container filesystems, execute commands in containers, or connect to a remote Docker daemon. See [.container/orship](../../.container/orship/README.md) for setup and verification.

## Operator usage

### Start the local desk

Run this command during development:

```powershell
npm.cmd run dev:orship
```

Open `http://127.0.0.1:6091`. Select an application card to open its combined report.

### Read application health

Use **Overview** to read API and web health, PID, latency, memory, CPU time, uptime, and health URLs. Use the API or Web log tab to read that component's runtime log. Use the refresh and copy actions in the log header when needed.

Use Start or Stop only for a local repository process that Orship owns. Orship blocks control of itself and processes it cannot verify.

### Record a Platform deployment

1. Open the Platform report.
2. Select **Deployment console**.
3. Select Verify, Pull, Prepare, or Deploy.
4. Copy the displayed command.
5. Run the command in a trusted terminal.
6. Paste the terminal output into **Manual verification**.
7. Select Awaiting, Verified, or Failed.
8. Save the evidence record.

The console does not run Git, Docker Compose, or SSH. It only records the operator result after redacting common secret values.

### Run Orship as a standalone Compose unit

On Ubuntu, run this command:

```sh
bash ./.container/orship/setup.sh
```

If Docker is missing, the script installs it. Sign out and sign in after the installer updates the `docker` group. Then run these commands from Git Bash, WSL, or Ubuntu:

```sh
bash ./.container/orship/build.sh
bash ./.container/orship/setup.sh
bash ./.container/orship/verify.sh
```

Docker builds the `orship-only` profile inside its image builder. `build.sh` checks Compose syntax and builds both images. `setup.sh` builds, starts, and lists the stack. The verification script checks API readiness and the Docker workload endpoint.

The image builder installs and verifies npm `12.0.2` before dependency installation. The runtime image installs production dependencies from the pinned lockfile.

### Update the standalone unit

First update and review the repository source yourself. Then run:

```sh
bash ./update.sh --check
bash ./update.sh
```

The update command does not pull source. It refuses a dirty worktree unless `--allow-dirty` is supplied, rebuilds only the Orship Compose services, preserves the named `orship-storage` volume, waits for the replacement containers, and verifies the local APIs. If the replacement fails, it restores the images used by the previous containers. Use `--yes` to skip the confirmation prompt or `--no-cache` to force an uncached rebuild.

### Manage a local Docker workload

Add the managed label when you create a container:

```sh
docker run -d --label codexsun.orship.manage=true --name demo-nginx nginx:alpine
```

Open Platform, then **Deployment console**. The **Managed Docker workloads** section lists the labelled container. Use Start, Stop, or Restart to send a backend action through the local Docker socket boundary.

The API stores action memory in SQLite and appends JSONL action history. The browser cannot access the Docker socket. Orship cannot run shell commands in a container or inspect its filesystem.

### Check the API directly

Use these loopback endpoints for local tools:

```text
GET  /health/ready
GET  /api/orship/v1/services
GET  /api/orship/v1/docker/containers
POST /api/orship/v1/docker/containers/:containerId/actions
```

The Docker action body is one of `start`, `stop`, or `restart`. The endpoint rejects non-loopback requests. Use Identity before adding remote access or user-level permissions.

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
