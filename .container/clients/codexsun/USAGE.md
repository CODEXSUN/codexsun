# Codexsun Setup

Run every command from the repo root:

```bash
cd /home/codexsun
```

## Quick commands

Local:

```bash
./.container/clients/codexsun/setup.sh
```

Cloud:

```bash
export JWT_SECRET='replace-with-a-real-secret-of-at-least-16-characters'
export SECRET_OWNER_EMAIL='security@sundar.com'
export OPERATIONS_OWNER_EMAIL='devops@sundar.com'
export SUPER_ADMIN_EMAILS='sundar@sundar.com'
TARGET_ENV=cloud CODEXSUN_DOMAIN=codexsun.com ./.container/clients/codexsun/setup.sh
```

## Clean install

Remove the old container, runtime volume, and target database, then build and install fresh:

```bash
TARGET_ENV=cloud \
CODEXSUN_DOMAIN=codexsun.com \
JWT_SECRET='replace-with-a-real-secret-of-at-least-16-characters' \
SECRET_OWNER_EMAIL='security@codexsun.com' \
OPERATIONS_OWNER_EMAIL='ops@codexsun.com' \
SUPER_ADMIN_EMAILS='admin@codexsun.com' \
CLEAN_INSTALL=true \
CONFIRM_CLEAN_INSTALL=YES \
DROP_DATABASES=true \
CONFIRM_DROP_DATABASES=YES \
BUILD_IMAGE=true \
CREATE_DATABASES=true \
./.container/clients/codexsun/setup.sh
```

CONFIRM_CLEAN_INSTALL=YES \
DROP_DATABASES=true \
CONFIRM_DROP_DATABASES=YES \
CONFIRM_DESTRUCTIVE_CLEAN=YES \
./.container/bash-sh/clean.sh


## What the setup script does

- Builds the image with `docker compose build`
- Starts only the Codexsun client compose stack
- Creates the target database when `CREATE_DATABASES=true`
- Updates `/opt/codexsun/runtime/.env`
- Restarts the container and waits for health before exiting

Production recommendation:

- local mode may still build from your current workspace for development convenience
- cloud mode should use a prebuilt image and should not depend on runtime git sync, live `npm ci`, or live rebuilds inside the container
- runtime `.env`, media storage, and database state should stay persistent across image replacements

## Common cloud update process

Use this as the normal Ubuntu server update path:

1. build and tag the image outside the live server, for example `codexsun-app:v-1.0.175`
2. push or transfer that image to the server
3. keep `/opt/codexsun/runtime/.env` as the runtime config source
4. keep uploaded media on a persistent Docker volume or host mount
5. keep MariaDB outside the app container
6. pull the new image on the server
7. restart the container with the same env file and same persistent storage
8. confirm `/health` is green
9. keep the previous image tag available for rollback

This is the common deployment model used by most Dockerized production apps because only the image changes during an update.

Avoid this in production:

- `git pull` inside the live container
- runtime repo clone or reset during normal updates
- `npm ci` during normal updates
- `npm run build` during normal updates

## Development-only git sync

```bash
GIT_SYNC_ENABLED=true ./.container/clients/codexsun/setup.sh
```

Use that only for local development experiments. That local mode keeps:

- `GIT_SYNC_ENABLED=true`
- `APP_ENV=development`
- `http://127.0.0.1:4000` as the local URL

```bash
GIT_SYNC_ENABLED=true GIT_FORCE_UPDATE_ON_START=true TARGET_ENV=cloud CODEXSUN_DOMAIN=codexsun.com ./.container/clients/codexsun/setup.sh
```

Use `GIT_FORCE_UPDATE_ON_START=true` only for a one-time development resync. It is not the recommended production update path.

## Requirements

- Docker and Docker Compose plugin installed
- Shared Docker network exists: `codexion-network`
- MariaDB available and reachable from the app container
- DNS for `codexsun.com` points to the server before live HTTPS cutover
- Ports `80` and `443` open on the server for nginx
- A real `JWT_SECRET` exported before `TARGET_ENV=cloud`

Create the Docker network once:

```bash
docker network create codexion-network
```

Start MariaDB if you host it in Docker on the same server:

```bash
docker compose -f .container/mariadb.yml up -d
```

Safety gates:

- `CLEAN_INSTALL=true` requires `CONFIRM_CLEAN_INSTALL=YES`
- `DROP_DATABASES=true` requires `CONFIRM_DROP_DATABASES=YES`
- the shared cleanup script requires `CONFIRM_DESTRUCTIVE_CLEAN=YES`

## Local mode

Codexsun local mode uses:

- Browser URL: `http://127.0.0.1:4000`
- Database: `codexsun_local_db`
- App port binding: `0.0.0.0:4000` and `0.0.0.0:5000`

Run:

```bash
./.container/clients/codexsun/setup.sh
```

## Cloud mode

Codexsun cloud mode uses:

- Public URL: `https://codexsun.com`
- Public runtime port: `443`
- App upstream port: `127.0.0.1:4000`
- App secondary port: `127.0.0.1:5000`
- Database: `codexsun_com_db`

Fresh cloud install:

```bash
export JWT_SECRET='replace-with-a-real-secret-of-at-least-16-characters'
export SECRET_OWNER_EMAIL='security@codexsun.com'
export OPERATIONS_OWNER_EMAIL='ops@codexsun.com'
export SUPER_ADMIN_EMAILS='admin@codexsun.com'

TARGET_ENV=cloud \
CODEXSUN_DOMAIN=codexsun.com \
CREATE_DATABASES=true \
./.container/clients/codexsun/setup.sh
```

The script will stop immediately if:

- `TARGET_ENV=cloud` uses `localhost`, `127.0.0.1`, or another local-only domain
- `JWT_SECRET` is missing or still a default placeholder
- `RUNTIME_PUBLIC_SCHEME` is not `https`

Useful cloud overrides:

```bash
TARGET_ENV=cloud CODEXSUN_DOMAIN=codexsun.com CODEXSUN_DB_NAME=codexsun_prod_db ./.container/clients/codexsun/setup.sh
TARGET_ENV=cloud CODEXSUN_DOMAIN=codexsun.com CODEXSUN_DB_HOST=10.0.0.15 CODEXSUN_DB_USER=codexsun CODEXSUN_DB_PASSWORD='strong-db-password' ./.container/clients/codexsun/setup.sh
```

## Nginx

Use the committed nginx files in [.container/clients/codexsun/nginx/codexsun.com.http.conf](/E:/Workspace/codexsun/.container/clients/codexsun/nginx/codexsun.com.http.conf) and [.container/clients/codexsun/nginx/codexsun.com.https.conf](/E:/Workspace/codexsun/.container/clients/codexsun/nginx/codexsun.com.https.conf).

1. Install the HTTP-only config first.

```bash
sudo cp .container/clients/codexsun/nginx/codexsun.com.http.conf /etc/nginx/sites-available/codexsun.com
sudo ln -s /etc/nginx/sites-available/codexsun.com /etc/nginx/sites-enabled/codexsun.com
sudo nginx -t
sudo systemctl reload nginx
```

2. Issue the certificate.

```bash
sudo certbot --nginx -d codexsun.com -d www.codexsun.com
```

3. Replace the site file with the HTTPS config and reload nginx.

```bash
sudo cp .container/clients/codexsun/nginx/codexsun.com.https.conf /etc/nginx/sites-available/codexsun.com
sudo nginx -t
sudo systemctl reload nginx
```

The HTTPS nginx config proxies to `http://127.0.0.1:4000` and forwards `X-Forwarded-Proto https`, which the app needs in production mode.

## Local cloud dry run

This is the same production-style app mode, but tested locally behind HTTPS on a domain-style hostname:

```bash
export JWT_SECRET='replace-with-a-real-secret-of-at-least-16-characters'
export SECRET_OWNER_EMAIL='security@codexsun.localtest.me'
export OPERATIONS_OWNER_EMAIL='ops@codexsun.localtest.me'

TARGET_ENV=cloud \
CODEXSUN_DOMAIN=codexsun.localtest.me \
CODEXSUN_PUBLIC_PORT=8443 \
./.container/clients/codexsun/setup.sh
```

That keeps the app itself on `127.0.0.1:4000` and lets nginx terminate HTTPS on `https://codexsun.localtest.me:8443`.

Use the Playwright config for the HTTPS smoke test:

```bash
npx playwright test -c playwright.cloud-docker.config.ts tests/e2e/local-docker-setup.spec.ts
```

## Useful commands

Logs:

```bash
docker logs --tail 200 codexsun-app
```

Open a shell:

```bash
docker exec -it codexsun-app bash
```

Inspect the active runtime env:

```bash
docker exec codexsun-app sh -lc 'cat /opt/codexsun/runtime/.env'
```

Check health:

```bash
curl -I http://127.0.0.1:4000/health
curl -k -I https://codexsun.com/health
```
