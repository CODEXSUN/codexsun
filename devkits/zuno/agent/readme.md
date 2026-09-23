# Zuno Local Docker Usage

Run all commands from the repository root.

## Requirements

- Docker Engine or Docker Desktop must be running.
- The Docker Compose plugin must be available through `docker compose`.
- Ports `6410` and `6411` must be available for the default installation.

The scripts read the application version from `../VERSION`. The human-readable version is also stored in the API and web image labels. Docker-safe image tags replace spaces with hyphens.

## Fresh Setup

Run the setup script to build and start the Zuno API and web containers:

```sh
sh devkits/zuno/.container/zuno-setup.sh
```

The script creates `codexsun-network` when it does not exist. If the network already exists, the script reuses it so Zuno can connect to CXForge and other local services.

The setup is complete only after both the API and web application respond to their health checks.

Open Zuno at `http://127.0.0.1:6411`. The API is available at `http://127.0.0.1:6410`.

## Development Update

Use the update script for regular development deployments:

```sh
sh devkits/zuno/.container/zuno-update.sh
```

The update script:

- Reads the current version from `../VERSION`.
- Rebuilds the API and web images from the current repository state.
- Recreates both containers.
- Preserves the `zunolocal_zuno-data` volume and its Zetro handoff and identity data.
- Waits for both applications to respond before reporting success.

## Remove and Reinstall

Use the drop script when a completely fresh installation is required:

```sh
sh devkits/zuno/.container/zuno-drop.sh
```

The drop operation removes the Zuno containers, project volumes, and locally built Zuno images. This deletes the persisted Zuno identity and Zetro handoff data. It does not remove the shared external `codexsun-network`.

Install a clean instance after the drop:

```sh
sh devkits/zuno/.container/zuno-setup.sh
```

## Isolated Installation

The scripts support environment overrides for parallel testing or alternate local ports:

| Variable | Default | Purpose |
| --- | --- | --- |
| `ZUNO_COMPOSE_PROJECT` | `zunolocal` | Compose project and volume prefix |
| `ZUNO_API_HOST_PORT` | `6410` | Published API port |
| `ZUNO_WEB_HOST_PORT` | `6411` | Published web port |
| `ZUNO_API_CONTAINER_NAME` | `zuno-api` | API container name |
| `ZUNO_WEB_CONTAINER_NAME` | `zuno-web` | Web container name |
| `ZUNO_DOCKER_NETWORK` | `codexsun-network` | Shared external Docker network |
| `ZUNO_API_IMAGE` | `codexsun/zuno-api` | API image repository |
| `ZUNO_WEB_IMAGE` | `codexsun/zuno-web` | Web image repository |

Example:

```sh
ZUNO_COMPOSE_PROJECT=zuno-test \
ZUNO_API_HOST_PORT=16410 \
ZUNO_WEB_HOST_PORT=16411 \
ZUNO_API_CONTAINER_NAME=zuno-test-api \
ZUNO_WEB_CONTAINER_NAME=zuno-test-web \
sh devkits/zuno/.container/zuno-setup.sh
```

Use the same environment values when running the update or drop script for an isolated installation.

## Verification

Check the running containers:

```sh
docker ps --filter name=zuno
```

Check API health:

```sh
curl http://127.0.0.1:6410/api/v1/zuno/health
```

Check the installed image version:

```sh
docker inspect zuno-api \
  --format '{{ index .Config.Labels "org.opencontainers.image.version" }}'
```

The expected API health response has a status of `ok`. Both `zuno-api` and `zuno-web` should report a healthy container state.
