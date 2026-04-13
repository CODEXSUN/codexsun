# Container Install Notes

Run commands from the repo root.

## Recommended production model

Treat the live server as a Docker host, not as a build machine.

- Build the app image before deployment
- Tag it with the installed version, for example `v-1.0.175`
- Keep runtime `.env` at `/opt/codexsun/runtime/.env`
- Keep media on a persistent volume or host mount
- Keep MariaDB outside the app container
- Update by pulling the new image and restarting the container

This is the safer common update process. It avoids live `git pull`, live `npm ci`, and live `npm run build` inside Ubuntu production containers.

## Recommended update sequence

1. Update the runtime `.env` only if configuration changed
2. Pull the new tagged image
3. Restart the app container with the existing env file and persistent volumes
4. Check `http://127.0.0.1:4000/health`
5. Keep the previous image tag available for rollback until the new container is verified

## Rollback sequence

1. Stop the failed new container
2. Restart the previous known-good image with the same env file and volumes
3. Confirm health before removing the failed image

## What to avoid

- runtime repository clone as the primary production source
- git sync as the normal cloud update strategy
- building frontend and server assets during a live production update
- relying on mutable `node_modules` state inside the live container

## Clean reinstall for Codexsun

```bash
docker compose -f .container/clients/codexsun/docker-compose.yml down --remove-orphans -v
docker rm -f codexsun-app 2>/dev/null || true
docker image rm codexsun-app:v1 2>/dev/null || true
```

If you also want a fresh database:

```bash
docker exec mariadb mariadb -uroot -pDbPass1@@ -e "DROP DATABASE IF EXISTS \`codexsun_local_db\`;"
docker exec mariadb mariadb -uroot -pDbPass1@@ -e "DROP DATABASE IF EXISTS \`codexsun_com_db\`;"
```

## Clean reinstall through setup

Local:

```bash
CLEAN_INSTALL=true CONFIRM_CLEAN_INSTALL=YES REMOVE_IMAGE=true DROP_DATABASES=true CONFIRM_DROP_DATABASES=YES ./.container/clients/codexsun/setup.sh
```

Cloud:

```bash
export JWT_SECRET='replace-with-a-real-secret-of-at-least-16-characters'
export SECRET_OWNER_EMAIL='security@codexsun.com'
export OPERATIONS_OWNER_EMAIL='ops@codexsun.com'

CLEAN_INSTALL=true REMOVE_IMAGE=true TARGET_ENV=cloud CODEXSUN_DOMAIN=codexsun.com ./.container/clients/codexsun/setup.sh
```

## Notes

- The app image is built by compose from `.container/Dockerfile`
- The active runtime env lives at `/opt/codexsun/runtime/.env`
- Media and uploads should live on a persistent volume outside the image
- Cloud installs expect nginx in front of the app container
- Codexsun cloud nginx config lives in `.container/clients/codexsun/nginx`
- destructive cleanup now requires explicit confirmation flags so databases and volumes are not removed accidentally
