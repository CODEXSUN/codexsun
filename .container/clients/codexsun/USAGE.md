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
export SECRET_OWNER_EMAIL='security@codexsun.com'
export OPERATIONS_OWNER_EMAIL='ops@codexsun.com'
export SUPER_ADMIN_EMAILS='admin@codexsun.com'
TARGET_ENV=cloud CODEXSUN_DOMAIN=codexsun.com ./.container/clients/codexsun/setup.sh
```

## What the setup script does

- Builds the image with `docker compose build`
- Starts only the Codexsun client compose stack
- Creates the target database when `CREATE_DATABASES=true`
- Updates `/opt/codexsun/runtime/.env`
- Restarts the container and waits for health before exiting

Runtime Git sync is disabled by default in local mode and enabled by default in cloud mode. Local installs without git sync run the image built from your current workspace. If you enable git sync in local mode, the runtime repository remains authoritative and local installs keep `APP_ENV=development` without reapplying stale baked image code over the synced checkout. Cloud installs boot from the runtime repository so the live update flow can fetch, rebuild, and restart from Git.

Local git-sync example:

```bash
GIT_SYNC_ENABLED=true ./.container/clients/codexsun/setup.sh
```

That local mode keeps:

- `GIT_SYNC_ENABLED=true`
- `APP_ENV=development`
- `http://127.0.0.1:4000` as the local URL

```bash
GIT_SYNC_ENABLED=true GIT_FORCE_UPDATE_ON_START=true TARGET_ENV=cloud CODEXSUN_DOMAIN=codexsun.com ./.container/clients/codexsun/setup.sh
```

Use `GIT_FORCE_UPDATE_ON_START=true` only for a one-time forced resync. Normal cloud installs do not need it.

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
