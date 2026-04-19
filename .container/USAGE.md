# Container Usage

Run commands from the repo root.

## Root setup

Deploy all discovered clients in cloud mode:

```bash
export JWT_SECRET='replace-with-a-real-secret-of-at-least-16-characters'
./.container/bash-sh/setup.sh
```

Deploy only Codexsun in local mode:

```bash
TARGET_ENV=local CLIENTS=codexsun ./.container/bash-sh/setup.sh
```

Deploy selected clients in cloud mode:

```bash
export JWT_SECRET='replace-with-a-real-secret-of-at-least-16-characters'
CLIENTS=codexsun,tmnext_in TARGET_ENV=cloud ./.container/bash-sh/setup.sh
```

## Important defaults

- `TARGET_ENV=cloud` at the root script
- Build path uses `docker compose build`
- Production updates should use a prebuilt image, not runtime git sync
- Local clients bind their app ports publicly
- Cloud clients bind their app ports to `127.0.0.1` for nginx reverse proxying

## Common production update process

Use this flow for Ubuntu Docker servers:

1. Build and tag the image outside the live container, for example `codexsun-app:v-1.0.175`
2. Push or copy that image to the server
3. Keep runtime `.env` outside the image
4. Keep media and uploaded files on a persistent Docker volume or host mount
5. Keep MariaDB outside the app container
6. Pull the new image on the server
7. Restart the container with the same env file, same media volume, and same database connection
8. Wait for `/health` to go green before removing the previous container

Why this is the common pattern:

- the image carries the built Node app and frontend assets
- the env file carries secrets and runtime configuration
- the media volume carries uploads
- the database carries transactional state
- updating the app should replace only the image layer

Avoid this in production:

- `git pull` inside the running container
- `npm ci` on the live server during update
- `npm run build` on the live server during update
- mutable runtime repositories as the normal cloud deployment path

## Required cloud variables

- `JWT_SECRET`
- real client domain like `codexsun.com`

Recommended:

- `SECRET_OWNER_EMAIL`
- `OPERATIONS_OWNER_EMAIL`
- `SUPER_ADMIN_EMAILS`

## Common flags

```bash
START_MARIADB=true CLIENTS=codexsun TARGET_ENV=local ./.container/bash-sh/setup.sh
CLEAN_INSTALL=true CONFIRM_CLEAN_INSTALL=YES REMOVE_IMAGE=true CLIENTS=codexsun TARGET_ENV=local ./.container/bash-sh/setup.sh
DROP_DATABASES=true CONFIRM_DROP_DATABASES=YES CLIENTS=codexsun TARGET_ENV=local ./.container/bash-sh/setup.sh
```

Safety notes:

- `CLEAN_INSTALL=true` now requires `CONFIRM_CLEAN_INSTALL=YES`
- `DROP_DATABASES=true` now requires `CONFIRM_DROP_DATABASES=YES`
- `./.container/bash-sh/clean.sh` now requires `CONFIRM_DESTRUCTIVE_CLEAN=YES`

## Client wrappers

Each client has its own wrapper:

```bash
./.container/clients/codexsun/setup.sh
TARGET_ENV=cloud ./.container/clients/codexsun/setup.sh
```

Client-specific cloud instructions and nginx files:

- [.container/clients/codexsun/USAGE.md](/E:/Workspace/codexsun/.container/clients/codexsun/USAGE.md)
- [.container/clients/codexsun/nginx/codexsun.com.http.conf](/E:/Workspace/codexsun/.container/clients/codexsun/nginx/codexsun.com.http.conf)
- [.container/clients/codexsun/nginx/codexsun.com.https.conf](/E:/Workspace/codexsun/.container/clients/codexsun/nginx/codexsun.com.https.conf)


