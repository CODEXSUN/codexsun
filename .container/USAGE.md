# Codexsun Deploy

If an old container or runtime volume is causing restart loops, use the clean reinstall guide first:

```bash
cat .container/INSTALL.md
```

### One-shot setup (all sites)

Use the root `setup.sh` to build and deploy all three sites in one run.

```bash
./setup.sh
```

Before running, edit the domain and database values at the top of `setup.sh`.
If a client compose file is missing on the server, either add it or skip with:

```bash
DEPLOY_TMNEXT=false ./setup.sh
```

### One-shot Orekso assistant setup

Use the root `aisetup.sh` to deploy Qdrant, Ollama, and Orekso, then enable the assistant in the selected Codexsun site containers.

```bash
./aisetup.sh
```

Useful flags:

```bash
CLEAN_INSTALL=true REMOVE_VOLUMES=true ./aisetup.sh
DISABLE_OREKSO=true ./aisetup.sh
ENABLE_TMNEXT_SITE=false ENABLE_TIRUPUR_SITE=false ./aisetup.sh
```

### 1. Check network is installed

```bash
docker network create codexion-network
```

## 2. install MariaDB:

```bash
docker compose -f .container/mariadb.yml up -d
```

## 3. optional: install Postgres

```bash
docker compose -f .container/postgres.yml up -d
```

Defaults:

- Container: `postgres`
- Port: `5432`
- Database: `codexsun_db`
- User: `codexsun`
- Password: `DbPass1@@`
- Volume: `postgres_data`

## 4. optional: install Redis

```bash
docker compose -f .container/redis.yml up -d
```

Defaults:

- Container: `redis`
- Port: `6379`
- Persistence: AOF enabled with `redis_data`

## 4b. optional: install Orekso assistant stack

```bash
docker compose -f .container/orekso.yml up -d --build
```

This starts:

- `qdrant`
- `ollama`
- `orekso`

Codexsun runtime env must include:

```dotenv
OREKSO_ENABLED=true
OREKSO_URL=http://orekso:3011
```

The Orekso stack expects Codexsun to be reachable on the shared Docker network as `http://codexsun-app:4000`.

### 5. Check mariadb is installed

```
docker exec -it mariadb mariadb -u root -p
```

### 6. remote access for root user

```
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;
```


# 7. Build shared app image:

```bash
docker build -t codexsun-app:v1 -f .container/Dockerfile .
```

# 8. App deploy:

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

# 9. console app:

```bash
docker exec -it codexsun-app bash
```

Open:

```text
http://YOUR_SERVER_IP:4000
http://YOUR_SERVER_IP:5000
```

Client port mappings:

- codexsun: `4000` and `5000` -> `4000` in container
- tmnext.in: `4007` and `5007` -> `4000` in container
- tirupurdirect.in: `4005` and `5005` -> `4000` in container

Admin update screen:

```text
http://YOUR_SERVER_IP:4000/admin/dashboard/settings
```

Defaults:

- GitHub: `https://github.com/CODEXSUN/codexsun.git`
- Branch: `main`
- Network: `codexion-network`
- Shared app image: `codexsun-app:v1`
- DB host: `mariadb`
- DB user: `root`
- DB password: `DbPass1@@`
- DB name: `codexsun_db`
- Postgres compose file: `.container/postgres.yml`
- Redis compose file: `.container/redis.yml`
- Orekso compose file: `.container/orekso.yml`
- Super admin: `sundar@sundar.com`

Config file:

- container creates `.env` from `.env.example` on first start
- only `.env` is used
- if `.env` is invalid, startup fails with error
- update settings and manual update are available from the admin Settings page
- compose file path: `.container/clients/codexsun/docker-compose.yml`
- Postgres and Redis are optional helper services; the current app stack still defaults to MariaDB unless you change the runtime env

Migration notes:

- existing browser sessions, carts, color mode, branding cache, and billing workspace state use the renamed `codexsun` storage keys and will not auto-read older client-side keys
- desktop preload consumers must read `window.codexsunDesktop` or `window.codexsunBillingDesktop`
- if you want a fresh runtime instead of an in-place migration, remove `codexsun_codexsun_runtime`, rebuild the image, and start the stack again


chmod +x setup.sh
