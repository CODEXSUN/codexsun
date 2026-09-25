# AgentCrew Ollama Stack

Compose Ollama, Qdrant, the assistant API, and the web gateway in one local Docker project.

## Configuration

All container definitions live in `.container/`. Only the web gateway publishes a loopback port.
Use `compose.gpu.yml` only when the host supports NVIDIA GPU containers.
Model downloads are explicit. A connection check never downloads models.

## Operations

Run these Bash scripts manually from the repository root. Linux, WSL, and Git Bash are supported command environments.
Install Docker and Compose v2 first. The scripts do not install Docker or change host permissions.

```bash
bash devkits/agentcrew/ollama/ollama-setup.sh --pull-models
bash devkits/agentcrew/ollama/ollama-update.sh
bash devkits/agentcrew/ollama/ollama-drop.sh
```

On first setup, the script creates `.container/.env` from the example and stops.
Set a random token of at least 32 characters, then run setup again. Existing configuration is never overwritten.
Setup and update pull service images, rebuild the API and web images, and wait up to 180 seconds for startup.
They use your current checkout. Update does not run Git, change source files, or refresh models without `--pull-models`.
The scripts never print the access token or execute the environment file as shell code.

Add `--gpu` to each command when you use the GPU override. Add `--pull-models` to setup or update to download configured models.
Downloads can use several gigabytes. Without this flag, existing models remain unchanged.
If a build or startup fails, inspect Compose logs and rerun the command after fixing the cause. No automatic rollback occurs.

### Shared network

Setup and update create `codexsun-network` if it does not exist. Existing networks are reused.
Only the web gateway joins this external network, with the alias `cx-agentcrew-web` on port 8080.
Ollama, Qdrant, and the API stay on the Compose project network. Other containers on the shared network can reach the gateway.
API requests through that gateway still require the access token. Host access remains loopback-only.
The scripts fix the Compose project name to `cx-agentcrew` so lifecycle commands target the same stack.
Container names are `cx-agentcrew-ollama`, `cx-agentcrew-qdrant`, `cx-agentcrew-api`, and `cx-agentcrew-web`.
Built images are `cx-agentcrew-api:local` and `cx-agentcrew-web:local`. Upstream Ollama and Qdrant image names remain unchanged.
Volumes are `cx-agentcrew-ollama-models`, `cx-agentcrew-qdrant-data`, and `cx-agentcrew-assistant-data`.
These fixed names support one stack per Docker host.

Existing `agentcrew-local` resources are not renamed, migrated, or deleted automatically.
Back up and migrate old volumes before switching an existing installation. New names otherwise create empty volumes.
Stop the old stack before starting the new stack on the same host port.

### Removal and data protection

Drop stops and removes stack containers and the project network. It preserves model, vector, and task volumes by default.
To delete those volumes after making a backup, use both explicit flags:

```bash
bash devkits/agentcrew/ollama/ollama-drop.sh --purge-data --confirm-cx-agentcrew
```

Purge deletes downloaded models, indexed notes, tasks, runs, and logs. Recovery requires a backup or another model download.
Neither mode removes `codexsun-network`, other applications, image caches, build caches, or `.container/.env`.
Keep the environment file available for Compose validation, including during removal.

### Script verification

```bash
node --test devkits/agentcrew/ollama/test/lifecycle.test.mjs
```

Set `BASH_EXECUTABLE` if Bash is not on your PATH. These tests use a fake Docker command and do not deploy or delete containers.

Follow the [application setup guide](../README.md) for token generation, model installation, startup, backups, and verification.
Do not mount the Docker socket or expose unauthenticated Ollama and Qdrant ports to a public network.
