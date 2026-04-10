# Container Install Notes

Run commands from the repo root.

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
CLEAN_INSTALL=true REMOVE_IMAGE=true DROP_DATABASES=true CONFIRM_DROP_DATABASES=YES ./.container/clients/codexsun/setup.sh
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
- Cloud installs expect nginx in front of the app container
- Codexsun cloud nginx config lives in `.container/clients/codexsun/nginx`
