# AgentCrew Local Assistant

Run a personal coding advisor with Ollama, Qwen 3, Qdrant, a protected API, and a web dashboard.

## Scope and current behavior

The local Docker deployment is available at `http://127.0.0.1:6411`.
See [live verification and limitations](verification.md#local-docker-deployment-on-2026-09-24) before relying on model tasks.
The deployed Qwen model generates text, but the full task smoke test timed out. Reliable task completion still needs tuning.

AgentCrew owns this application under `devkits/agentcrew/`. It is separate from ZCode, Zetro2, and Codeitz.
The initial implementation generates advice and proposed code. It cannot edit a repository, execute commands, deploy services, or send messages.

- Connect the dashboard with a local bearer token. The token stays in browser memory and is cleared on disconnect or refresh.
- Check Ollama, Qdrant, the reasoning model, and the embedding model from the connection panel.
- Send a coding or personal-assistant prompt. Each task keeps separate run records and results.
- Retry a task without replacing its earlier result. Duplicate requests for an active or queued task do not enqueue another run.
- Save repeating prompts paused. Explicitly enable a schedule after reviewing it.
- Pause a schedule and cancel its active upstream request.
- Index approved notes and retrieve relevant context from Qdrant.
- Read operational events without prompt text or credentials in the event log.

This is a single-user local application, not a multi-tenant agent platform.
The access token controls the complete local workspace. Do not share it between users with different access requirements.

## Folder structure

```text
devkits/agentcrew/
  api/
    src/config.ts
    src/app.ts
    src/server.ts
    src/modules/assistant/
      provider.ts
      contracts.ts
      repository.ts
      retrieval.ts
      service.ts
      upstreams.ts
      routes.ts
      test/
  web/
    src/app.tsx
    src/api.ts
    src/style.css
    test/
  ollama/.container/
    Dockerfile
    Dockerfile.dockerignore
    compose.yml
    compose.gpu.yml
    nginx.conf
    .env.example
```

API modules use the public Framework and Platform Core contracts.
The web host composes the public shared UI layout and controls. There are no copied central UI templates.
Docker builds resolve public navigation ports from application registry metadata and the root example configuration.
CXForge uses its existing port 6401 as a compatibility fallback because its registry has no web host.
Dependencies install at the repository root. Builds write to `dist/devkits/agentcrew/`.

## Architecture

```text
Browser :6411 -> Nginx -> authenticated API :6410
                              |-- task queue -> Ollama /api/chat -> Qwen 3
                              |-- notes -> Ollama /api/embed -> Qdrant
                              |-- tasks, runs, events -> SQLite
```

Only the web port binds to the host, on `127.0.0.1`.
Ollama, Qdrant, and the API have no published ports in the Docker stack.
The stack does not mount the host Docker socket or a writable repository.
Do not expose the web port publicly without a separately reviewed HTTPS and identity gateway.

## Prerequisites

- Docker Engine with Compose v2 or later.
- Free disk space for images, model downloads, and vector storage.
- For host development, Node.js 24 or later and root npm dependencies.
- Optional NVIDIA GPU access requires a working container GPU runtime.

The default model is `qwen3:4b`. Model speed depends on RAM, GPU memory, quantization, prompt size, and other workloads.
The CPU stack limits Ollama to 8 GB. Increase that limit before selecting a model that requires more memory.
No latency or coding-quality target has been established by a live model benchmark.
The browser test uses the app-owned Playwright development dependency and requires its Chromium installation.

## Docker setup

Use the [manual lifecycle scripts](ollama/README.md#operations) for setup, update, and removal.
Setup and update create `codexsun-network` when missing. Only the web gateway joins this shared network.
For the direct Compose commands below, create that external network first if `docker network inspect codexsun-network` fails.

Run all commands from the repository root.

1. Copy `devkits/agentcrew/ollama/.container/.env.example` to `.env` in the same directory.
2. Generate a local access token with the following command.
3. Put the generated value in the ignored environment file as `AGENTCREW_TOKEN`.
4. Do not commit or paste the token into chat or issue reports.

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Start the model and vector services first:

```powershell
docker compose --env-file devkits/agentcrew/ollama/.container/.env -f devkits/agentcrew/ollama/.container/compose.yml up -d ollama qdrant
```

Download models explicitly. These commands can transfer several gigabytes:

```powershell
docker compose --env-file devkits/agentcrew/ollama/.container/.env -f devkits/agentcrew/ollama/.container/compose.yml exec ollama ollama pull qwen3:4b
docker compose --env-file devkits/agentcrew/ollama/.container/.env -f devkits/agentcrew/ollama/.container/compose.yml exec ollama ollama pull nomic-embed-text
```

Build and start the dashboard and API:

```powershell
docker compose --env-file devkits/agentcrew/ollama/.container/.env -f devkits/agentcrew/ollama/.container/compose.yml up -d --build --wait
```

Open `http://127.0.0.1:6411`. Enter the token and select **Connect**.
The button checks existing services. It does not install models or start Docker.
Check model availability before submitting a task. Enable retrieval only after the embedding model is installed.

For NVIDIA GPU use, add `-f devkits/agentcrew/ollama/.container/compose.gpu.yml` to each Compose command.
GPU support and model inference require separate verification on the target machine.

## Configuration

| Variable                | Default                          | Purpose                                                           |
| ----------------------- | -------------------------------- | ----------------------------------------------------------------- |
| `AGENTCREW_TOKEN`       | Required, minimum 32 characters  | Single-user API authorization.                                    |
| `AGENTCREW_WEB_PORT`    | `6411`                           | Loopback web port in Compose.                                     |
| `AGENTCREW_MODEL`       | `qwen3:4b`                       | Ollama chat model. Download a replacement before selecting it.    |
| `AGENTCREW_EMBED_MODEL` | `nomic-embed-text`               | Ollama embedding model.                                           |
| `OLLAMA_IMAGE`          | `ollama/ollama:latest`           | Override with a tested tag or digest for repeatable deployments.  |
| `QDRANT_IMAGE`          | `qdrant/qdrant:latest`           | Override with a tested tag or digest for repeatable deployments.  |
| `AGENTCREW_HOST`        | `127.0.0.1` on host              | API listen address; Docker overrides it to `0.0.0.0`.             |
| `AGENTCREW_PORT`        | `6410`                           | API port; Compose and Nginx use this fixed internal port.         |
| `OLLAMA_URL`            | `http://127.0.0.1:11434` on host | Server-configured upstream; Docker uses `http://ollama:11434`.    |
| `QDRANT_URL`            | `http://127.0.0.1:6333` on host  | Server-configured vector store; Docker uses `http://qdrant:6333`. |

The browser cannot choose an upstream URL, model download, filesystem path, or shell command.
Default image tags can change. Record tested image digests before a production deployment.

## Host development

Copy `api/.app.env.example` to `api/.app.env` and configure a token and reachable upstream services.
The server loads root `.env` and the application environment file. Already defined process variables take precedence.
Do not run a second API against the same database. One API process owns the scheduler.

From the repository root, run the following commands in separate terminals:

```powershell
npm.cmd run dev --workspace @codexsun/agentcrew-api
npm.cmd run dev --workspace @codexsun/agentcrew-web
```

The Vite server proxies `/api` to port 6410. Docker-only upstreams are not reachable from a host API without deliberate port configuration.

## Tasks, recurring prompts, and recovery

A task is the instruction. A run is one attempt and its result.
The dashboard exposes coding and personal-assistant skill templates. Skills guide responses but grant no execution permissions.

One-off prompts run after submission. Repeating prompts save paused, with a 30-minute interval and a four-run budget in the dashboard.
The API supports intervals from 5 minutes to 7 days and budgets from 1 to 20 scheduled runs.
Explicit manual retries can exceed the scheduled run budget because each click is a new user instruction.

The runner uses one active task and at most 20 queued task IDs.
It retries transient transport, timeout, HTTP 429, and HTTP 5xx failures at most twice with exponential delay and jitter.
Permanent upstream HTTP 4xx errors are not retried automatically.
After three consecutive failed runs, the schedule stops. Create a new reviewed task to approve another scheduled budget.

Each scheduled slot is recorded before inference. An interrupted run stays interrupted after restart, rather than silently replaying its output.
Pending manual queue entries are in memory and require explicit retry after restart.
Enabled schedules persist and resume within their remaining budget. Missed intervals do not create a catch-up burst.
The host and API must remain running for schedules to execute.

Self-healing means bounded request retries and container process restart after failure.
It does not mean modifying prompts, repairing source code, escalating permissions, or rebuilding infrastructure automatically.
Docker restart policies do not restart a process solely because its health check fails.

## Retrieval and response efficiency

- Notes split into 1,200-character chunks with 200-character overlap.
- Embeddings use Ollama separately from the reasoning model.
- Content-based point IDs make identical note submissions repeat-safe.
- Each embedding model name selects a separate versioned Qdrant collection.
- Search uses cosine similarity, a 0.35 score threshold, and up to four hits.
- Retrieved context is limited to 5,000 characters and labeled as untrusted reference material.
- An in-memory cache retains at most 128 embedding results; answers are never shared through a response cache.
- Fast mode disables model thinking by default. Deep reasoning is an explicit toggle.
- Model requests use an 8,192-token context, at most 2,048 generated tokens, and a ten-minute keep-alive.

Answers arrive after generation completes; token streaming is not implemented yet.
The browser polls task activity every three seconds without overlapping polls.
Connection checks are explicit snapshots, not a continuous dependency monitor.

Updated note text produces new points. Note replacement, deletion, reranking, repository indexing, and collection compaction are future work.
Do not upload secrets. Notes, prompts, and answers are stored locally without application-level encryption.
If an embedding model tag changes vector dimensions, use a new model tag or an explicitly migrated collection.

## API contract

All `/api/v1/agentcrew` routes require `Authorization: Bearer <local-token>`.
The unprotected `/health` endpoint reports API liveness, not Ollama readiness.

| Method | Route suffix        | Behavior                                                                                  |
| ------ | ------------------- | ----------------------------------------------------------------------------------------- |
| GET    | `/status`           | Upstream reachability, installed models, active task, and queue.                          |
| GET    | `/skills`           | Available skill IDs.                                                                      |
| GET    | `/tasks`            | Task definitions and recent run results.                                                  |
| POST   | `/tasks`            | Create a paused task from title, prompt, skill, think, rag, intervalMinutes, and maxRuns. |
| POST   | `/tasks/:id/run`    | Queue a manual attempt; return 202.                                                       |
| POST   | `/tasks/:id/enable` | Approve a repeating schedule within its remaining budget.                                 |
| POST   | `/tasks/:id/pause`  | Disable recurrence, remove queued work, and abort the active request.                     |
| GET    | `/logs`             | Recent operational events.                                                                |
| POST   | `/knowledge`        | Embed and index a title and text.                                                         |

Input validation rejects unknown task fields and limits prompt and note size.
Raw upstream errors are not returned to the browser. Operational events record IDs and states, not prompts or credentials.

## Storage and cleanup

| Store            | Location                                                           | Contents                               |
| ---------------- | ------------------------------------------------------------------ | -------------------------------------- |
| SQLite on host   | `storage/apps/private/agentcrew/assistant/assistant.sqlite`        | Tasks, runs, logs, migration checksum. |
| SQLite in Docker | `assistant-data` volume at the same scoped path under `/workspace` | Persistent assistant state.            |
| Ollama           | `ollama-models` volume                                             | Downloaded models.                     |
| Qdrant           | `qdrant-data` volume                                               | Embeddings and note text.              |

The Docker project is `cx-agentcrew`. Volumes use explicit names: `cx-agentcrew-assistant-data`, `cx-agentcrew-ollama-models`, and `cx-agentcrew-qdrant-data`.
Existing `agentcrew-local` volumes are not migrated automatically. See the [stack naming and migration notes](ollama/README.md#shared-network).
The first startup applies checksum-protected migration `assistant.001` transactionally. There are no seed credentials.
The store keeps at most 100 tasks and the latest 200 runs and 200 operational events.
These bounded events are not a compliance-grade append-only audit log.

Stop without deleting state:

```powershell
docker compose --env-file devkits/agentcrew/ollama/.container/.env -f devkits/agentcrew/ollama/.container/compose.yml down
```

Back up SQLite with a consistent database backup and snapshot Qdrant before destructive cleanup.
Removing Compose volumes deletes models, notes, task history, and results. No automatic deletion or server-wide cache prune is included.

## Troubleshooting

| Symptom                      | Check                                                                                   |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| Connection rejected          | Check the configured token. Refresh clears the browser token.                           |
| Ollama online, model missing | Run the explicit model pull command inside the Ollama service.                          |
| Qdrant offline               | Inspect `docker compose ... logs qdrant`; do not enable retrieval until it responds.    |
| Slow first response          | Model loading and CPU inference can be slow. Start with fast mode and a smaller prompt. |
| Repeated failures            | Check memory limits, model installation, and upstream logs before selecting retry.      |
| Schedule stopped             | Check its run budget, failure count, and whether the host restarted.                    |
| Port conflict                | Change `AGENTCREW_WEB_PORT` in the ignored Compose environment file.                    |

## Verification and limits

Run from the repository root:

```powershell
npm.cmd run check --workspace @codexsun/agentcrew-api
npm.cmd run check --workspace @codexsun/agentcrew-web
npm.cmd run lint --workspace @codexsun/agentcrew-api
npm.cmd run lint --workspace @codexsun/agentcrew-web
npm.cmd run test --workspace @codexsun/agentcrew-api
npm.cmd run build --workspace @codexsun/agentcrew-api
npm.cmd run build --workspace @codexsun/agentcrew-web
npm.cmd run test --workspace @codexsun/agentcrew-web
```

See [verification notes](verification.md) for actual results and remaining deployment checks.
Automated tests use fake model responses. They do not prove Qwen reasoning quality or live GPU throughput.
Run the web build before its browser test. Install the Playwright Chromium runtime if it is not already available.
The dashboard consumes public launcher-port defaults from root `.env.example`; runtime secrets are not copied into the image or browser build.
No Logicx deployment, public ingress, repository modification tools, email integration, or unrestricted autonomous coding is included.

## Upstream references

- [Ollama API](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [Ollama thinking](https://github.com/ollama/ollama/blob/main/docs/capabilities/thinking.mdx)
- [Qdrant local setup](https://qdrant.tech/documentation/quickstart/)
- [Qdrant query API](https://api.qdrant.tech/api-reference/search/query-points)
