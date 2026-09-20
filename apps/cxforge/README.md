# CXForge

CXForge is the isolated coding worker server for Zuno. It owns task execution, review evidence, source branch publication, and optional GitHub pull request creation. The client retains human approval and the final merge decision.

## Task flow

1. A client creates a task contract.
2. CXForge assigns a preview port.
3. CXForge opens the container's shared workspace and executes one task at a time.
4. CXForge clones the requested Git repository only if the checkout does not exist.
5. A bounded agent loop requests structured file changes from the configured model.
6. CXForge rejects changes outside the owned paths.
7. CXForge runs the configured verification command.
8. When verification fails, the next agent turn receives the failure output and can revise the change.
9. CXForge saves the file list, test output, Git diff, token use, estimated cost, and task events.
10. CXForge starts a supervised application preview when the repository provides a preview command.
11. A human approves or rejects the task.
12. CXForge commits the approved changes to a task branch.
13. CXForge pushes the task branch when the repository has a network remote.
14. CXForge can create a GitHub pull request or accept a pull request URL recorded by Zuno.
15. The pull request is recorded as merged only after user confirmation.

CXForge stores task state in `/workspace/.cxforge-state.json`. All tasks use `/workspace/repo`. Multiple tasks and follow-up commands share the files, branch, dependencies, and preview. Use another container for parallel work or another repository.

Send follow-ups to `POST /api/v1/cxforge/control/tasks/<id>/messages` with `messageId`, `prompt`, and `expectedTaskRevision`. Repeated message IDs are idempotent. Commands received during execution wait until that run ends. Each applied follow-up requires a new review. Approve and prepare the pull request from the latest task that changed the workspace.

There is no required workspace volume or mirror. Restart retains the checkout, but container removal destroys it. The update script backs up and restores `/workspace` and prints the retained backup path. Keep that backup secure because it includes service state. Old per-task checkouts are not automatically migrated into the shared checkout.

## Local Docker

Run the setup script from the repository root:

```sh
sh apps/cxforge/.container/cxforge-setup.sh
```

The script creates `codexsun-network` when required. It then builds and starts the local container.

## Manual maintenance

Install CXForge or start the current version:

```sh
sh apps/cxforge/.container/cxforge-setup.sh
```

Set `CXFORGE_NO_CACHE=true` when the setup must ignore the shared Docker build cache.

Update the development container without deleting task data:

```sh
sh apps/cxforge/.container/cxforge-update.sh
```

The update tag contains the value from `VERSION`, the current Git SHA, and `-dirty` when CXForge has uncommitted changes.

Stop CXForge and permanently delete its project volumes and local images:

```sh
sh apps/cxforge/.container/cxforge-drop.sh
```

The drop script asks for `DROP CXFORGE`. For unattended use, set `CXFORGE_CONFIRM_DROP=yes`.

Docker does not provide a safe project-only build cache purge. Set `CXFORGE_PURGE_GLOBAL_BUILD_CACHE=true` only when deleting cache for every Docker project is acceptable.

- API: `http://127.0.0.1:6400`
- Preview ports: `http://127.0.0.1:7300` through `http://127.0.0.1:7303`
- Health: `http://127.0.0.1:6400/api/v1/cxforge/health`

The local Compose profile uses demo execution. Demo execution tests the complete lifecycle without model credentials.

The runtime uses a bounded worker pool. Queued and interrupted tasks are recovered from persisted state after restart.

The local image includes these development tools:

- Go and `gofmt`
- Git
- Node.js and npm
- Python 3
- Make

Go uses `/workspace/.cache/go-build` and `/workspace/.cache/go-mod`. These paths remain writable when the container root filesystem is read-only.

CXForge stores one direct checkout under `/workspace/repo` for all commands in this container.

## OpenAI model provider

CXForge uses the OpenAI Responses API when model mode has no model command.

Set these values:

```text
CXFORGE_EXECUTION_MODE=model
OPENAI_API_KEY_FILE=/run/secrets/openai_api_key
CXFORGE_OPENAI_MODEL=gpt-5.6-terra
CXFORGE_REASONING_EFFORT=high
```

CXForge sends a bounded repository snapshot with the task prompt. It excludes dependency folders, binary files, environment files, and key files.

The provider requests strict JSON output. CXForge still validates every returned path before it writes a file.

Set `CXFORGE_MAX_AGENT_TURNS` to limit model and verification iterations. Set `CXFORGE_MAX_WORKERS` to limit concurrent tasks.

Set the token prices used for cost estimates:

```text
CXFORGE_INPUT_PRICE_PER_MILLION=2
CXFORGE_OUTPUT_PRICE_PER_MILLION=12
```

Use `OPENAI_API_KEY` only for local debugging. Use `OPENAI_API_KEY_FILE` with a Docker secret on a server.

## Model command contract

Set `CXFORGE_EXECUTION_MODE=model`. Set `CXFORGE_MODEL_COMMAND` to an installed model adapter command.

The model command takes precedence over the OpenAI provider. Leave `CXFORGE_MODEL_COMMAND` empty to use OpenAI.

CXForge sends this JSON object to standard input:

```json
{
  "prompt": "Change the requested behavior.",
  "repository": "/workspace/repo",
  "ownedPaths": ["src/"]
}
```

The command must write one JSON object to standard output:

```json
{
  "files": [
    {"path": "src/example.txt", "content": "new content\n"}
  ],
  "summary": "Updated the example file."
}
```

Do not write logs to standard output. Write logs to standard error.

## Repository sources

Use a Git URL in the task contract for a remote repository. For a local repository, use a path relative to `CXFORGE_SOURCE_ROOT`.

The container mounts `/repositories` as read-only. CXForge clones the source into the writable task workspace.

## Git connections

Zuno can create and manage Git connections through the CXForge control API. CXForge encrypts each token before it saves the token.

Set `CXFORGE_CREDENTIAL_ENCRYPTION_KEY_FILE` to a secret file with at least 32 characters. Do not rotate this key without migrating saved connections.

Create a connection:

```text
POST /api/v1/cxforge/control/git-connections
```

```json
{
  "name": "Product GitHub",
  "provider": "github",
  "username": "",
  "token": "token-supplied-once",
  "repositoryPatterns": ["https://github.com/codexsun/*"],
  "permissions": {
    "clone": true,
    "pull": true,
    "push": false
  }
}
```

CXForge never returns the token. List responses only show `secretConfigured`.

Use these endpoints:

```text
GET    /api/v1/cxforge/control/git-connections
PUT    /api/v1/cxforge/control/git-connections/<connection-id>
DELETE /api/v1/cxforge/control/git-connections/<connection-id>
POST   /api/v1/cxforge/control/git-connections/<connection-id>/verify
```

The verify endpoint accepts `repository` and `operation`. Clone and pull checks call `git ls-remote`. A push check confirms policy only because a remote write test would change the repository.

Managed Git connections use HTTPS token authentication. Each repository URL must match an exact pattern or a trailing wildcard pattern.

Set `gitConnectionId` in each network task. CXForge checks clone permission before it accepts the task. It checks push again before branch publication.

Use this task action to pull a clean existing task workspace:

```text
POST /api/v1/cxforge/control/tasks/<task-id>/pull
```

CXForge rejects the pull if the workspace has uncommitted changes. This protects worker output from an implicit merge.

`CXFORGE_GIT_TOKEN` remains a legacy server-wide fallback. New deployments should use scoped Git connections.

## Repository registration

Register a repository after its Git connection exists:

```text
GET  /api/v1/cxforge/control/repositories
POST /api/v1/cxforge/control/repositories
```

```json
{
  "name": "Product",
  "repository": "https://github.com/example/product.git",
  "gitConnectionId": "git-connection-uuid",
  "defaultBranch": "main"
}
```

Registration clones directly into `/workspace/repo` and records the initial commit SHA. A second repository requires another container.

Use the task pull action to update the checkout. Pull is fast-forward only and refuses dirty files. Successful pull invalidates previous review approvals. Pull requests target the remote Git provider.

## Verification

Set `CXFORGE_TEST_COMMAND` to the command that validates the repository. CXForge runs the command in the cloned repository.

Set `CXFORGE_COMMAND_TIMEOUT` to the maximum task duration in seconds. The default is 300 seconds.

Repositories can provide a `.cxforge.json` file:

```json
{
  "testCommand": "npm test",
  "previewCommand": "npm run dev -- --host 0.0.0.0 --port {port}"
}
```

Repository commands are disabled by default. Set `CXFORGE_ALLOW_REPO_COMMANDS=true` only for repositories that the operator trusts. The task prompt cannot replace these commands.

## Live task events and metrics

Read task history or keep an SSE connection open at:

```text
GET /api/v1/cxforge/control/tasks/<task-id>/events
```

Prometheus metrics are available at:

```text
GET /api/v1/cxforge/control/metrics
```

Both endpoints require the CXForge client key. Metrics include created, completed, and blocked tasks plus model request and token totals.

## Preview supervision

Set `CXFORGE_PREVIEW_COMMAND` for one deployment-wide preview command, or use the trusted repository policy. CXForge replaces `{port}` with an assigned internal port, waits for HTTP readiness, captures output in the task workspace, proxies the assigned public preview port, and restarts eligible previews after a CXForge restart.

## GitHub pull requests

After approval and branch publication, call:

```text
POST /api/v1/cxforge/control/tasks/<task-id>/create-pull-request
```

CXForge derives the GitHub repository from the Git remote and creates the pull request with the configured Git token. `CXFORGE_GITHUB_API_URL` can point to GitHub Enterprise.

## Alerts

Set `CXFORGE_ALERT_WEBHOOK_URL` to receive blocked-task and cost-threshold events. Set `CXFORGE_COST_ALERT_THRESHOLD_USD` to a positive value to enable cost alerts.

## Security boundary

The container runs as a non-root user. Compose removes Linux capabilities and blocks privilege escalation.

The container filesystem is writable for the non-root runtime user. Workspace data lives in the container, without a required volume.

The container has CPU, memory, process, and command time limits. It does not mount the Docker socket.

The client key protects control endpoints. Store a different key in the VPS secret configuration.

## VPS profile

Copy `.container/vps.env.example` to `.container/vps.env`. Set each required value.

Create `.container/secrets/openai_api_key`. Put only the OpenAI API key in this file.

Create `.container/secrets/credential_encryption_key`. Use a random value with at least 32 characters.

Start the VPS profile:

```sh
docker compose -f apps/cxforge/.container/docker-compose.vps.yml up -d
```

Place TLS and authentication at the reverse proxy. Do not publish CXForge control ports directly to the Internet.

Build a versioned image locally:

```sh
sh apps/cxforge/.container/publish.sh
```

Set `CXFORGE_PUSH=true` to push both the version from `apps/cxforge/VERSION` and the `latest` tag. The VPS Compose file defaults to the immutable versioned tag.

After deployment, run the authenticated smoke checks:

```sh
CXFORGE_ZUNO_CLIENT_KEY=<secret> sh apps/cxforge/.container/production-check.sh
```
