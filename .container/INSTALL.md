# Codexsun Install

Run every command from the repo root:

```bash
cd /home/codexsun
```

## Clean old install

Use this when an old container, runtime volume, or stale runtime source is causing restart loops.

```bash
docker compose -f .container/clients/codexsun/docker-compose.yml down
docker rm -f codexsun-app 2>/dev/null || true
docker volume rm codexsun_codexsun_runtime 2>/dev/null || true
docker image rm codexsun-app:v1 2>/dev/null || true
```

If MariaDB is installed separately and contains live data, do not remove its data volume.

## Create network

```bash
docker network create codexion-network
```

## Optional: run MariaDB locally

```bash
docker compose -f .container/mariadb.yml up -d
```

## Build shared app image

```bash
docker build -t codexsun-app:v1 -f .container/Dockerfile .
```

## Start Codexsun

```bash
docker compose -f .container/clients/codexsun/docker-compose.yml up -d
```

Other client stacks:

- tmnext.in:
  ```bash
  docker compose -f .container/clients/tmnext_in/docker-compose.yml up -d
  ```
- tirupurdirect.in:
  ```bash
  docker compose -f .container/clients/tirupur_direct/docker-compose.yml up -d
  ```

## View logs

```bash
docker logs -f codexsun-app
```

## Open shell

```bash
docker exec -it codexsun-app bash
```

## URLs

```text
http://YOUR_SERVER_IP:4000
http://YOUR_SERVER_IP:5000
```

Client port mappings:

- codexsun: `4000` and `5000` -> `4000` in container
- tmnext.in: `4007` and `5007` -> `4000` in container
- tirupurdirect.in: `4005` and `5005` -> `4000` in container

## Notes

- The container creates `/opt/codexsun/runtime/.env` on first start.
- The active compose file is `.container/clients/codexsun/docker-compose.yml`.
- The shared image tag is `codexsun-app:v1`.
- If the app restarts, check `docker logs --tail 200 codexsun-app`.

## Migrate From A Legacy Runtime

If your server still has the older runtime namespace, do this instead of deleting data blindly:

```bash
docker compose -f .container/clients/codexsun/docker-compose.yml down
docker volume ls
```

Then:

1. back up the old runtime `.env` and any server-side backup files
2. start the renamed stack once so `/opt/codexsun/runtime` is created
3. copy only the required values from the old env into `/opt/codexsun/runtime/.env`
4. copy old backup files into `/opt/codexsun/runtime/storage/backups/database` if you need them
5. restart the renamed stack and verify `http://YOUR_SERVER_IP:4000/health`

## Clean Rebootstrap

Use this when you want a fresh application runtime and do not need to preserve the old app volume:

```bash
docker compose -f .container/clients/codexsun/docker-compose.yml down
docker rm -f codexsun-app 2>/dev/null || true
docker volume rm codexsun_codexsun_runtime 2>/dev/null || true
docker image rm codexsun-app:v1 2>/dev/null || true
docker build -t codexsun-app:v1 -f .container/Dockerfile .
docker compose -f .container/clients/codexsun/docker-compose.yml up -d
```

After that:

1. update `/opt/codexsun/runtime/.env` with the real server values
2. verify `http://YOUR_SERVER_IP:4000/health`
3. verify login and one real business flow before reopening access


docker volume ls
