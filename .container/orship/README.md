# Orship Docker Setup

This independent Compose unit runs the Orship API and web application. It keeps its SQLite operation memory and JSONL action log in the named `orship-storage` volume.

## Ubuntu install

The installer needs Docker Engine and Docker Compose v2. It does not need a host Node.js installation because Docker builds Orship inside the image builder.

The builder installs and checks npm `12.0.2` before dependency installation. The final runtime image installs only production dependencies with the pinned lockfile.

Docker BuildKit caches npm downloads between local rebuilds. The first build still installs the full workspace dependency set.

On Ubuntu, run this command:

```sh
bash ./.container/orship/setup-orship.sh
```

If Docker is missing, the script installs the Ubuntu Docker packages and adds your user to the `docker` group. Sign out and sign in, then run the same command again.

## Build and start

Run from Git Bash, WSL, or another POSIX shell with Docker available:

```sh
bash ./.container/orship/build.sh
bash ./.container/orship/setup-orship.sh
bash ./.container/orship/verify.sh
```

Open `http://127.0.0.1:6091`.

`setup-orship.sh` runs the same image build before it starts the stack. Run `build.sh` when you want to build and inspect the images without starting containers.

On Docker Desktop for Windows, cancel an older build that is stalled at `chown -R node:node /app`. The current Dockerfile changes ownership only for `storage`, which avoids a slow recursive file walk through application dependencies.

## Update

After you have manually pulled and reviewed source changes, update the running Compose unit from the repository root:

```sh
bash ./.container/orship/update-orship.sh --check
bash ./.container/orship/update-orship.sh
```

`update-orship.sh` validates Docker, Compose ownership, the current Git worktree, and the existing Orship containers before it makes a change. It can update the unit whether its existing containers are running or stopped. It rebuilds only the Orship API and web images, preserves the `orship-storage` volume, waits for the services, and checks the readiness and Docker workload APIs. If the new containers fail, it retags and restarts the previous images.

The command never runs `git pull`. It rejects a dirty worktree by default, so updates remain reproducible. Use `--allow-dirty` only when you intentionally need to build local, uncommitted changes. It builds the API and web images one at a time to avoid competing for Docker's npm cache. Use `--no-cache` for a fully uncached Docker build.

## Managed Docker workloads

The API alone mounts the local Docker socket. The browser does not receive socket access and cannot run arbitrary commands. Orship lists and controls only containers with this label:

```text
codexsun.orship.manage=true
```

Example:

```sh
docker run -d --label codexsun.orship.manage=true --name demo-nginx nginx:alpine
```

Orship can list, start, stop, and restart these explicitly labelled local containers. It does not execute `docker exec`, crawl filesystems, expose arbitrary Docker APIs, connect to remote sockets, or provide shell access. Add Identity and a reviewed remote-agent boundary before enabling any remote control.

## Persistence

- SQLite: `storage/app/private/orship/docker/memory.sqlite`
- JSONL action history: `storage/app/private/orship/docker/actions.jsonl`
- Existing deployment evidence: `storage/app/private/orship/deployments/platform/records.jsonl`

The named volume persists those files across container recreation. It is removed only by `docker compose down --volumes`.
