# Container Runtime

This folder owns Docker build, local container runtime, and container verification files.

Store Dockerfiles, Compose definitions, container scripts, runtime catalogs, and local verification scripts here. Keep business code in its owner application or package.

Use container configuration to mount the root `storage/` namespace where an application requires file storage. Do not store secrets in committed container files.

Read [the runtime layout guide](../assist/operations/runtime-layout.md) before adding container files.

## Platform local composition

`compose.yml` starts MariaDB, Platform API, and Platform web. It reads required secrets from the ignored root `.env` file. It mounts the central `storage/apps/` path into the API container.

Run Docker checks only after Docker is available and the root environment contains the required MariaDB and Platform values:

```text
docker compose --env-file .env -f .container/compose.yml up --build -d
node .container/verify.mjs
docker compose --env-file .env -f .container/compose.yml down
```

The current composition does not start Redis. Database-backed outbox delivery is the selected queue path.
