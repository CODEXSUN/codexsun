# Dealodeal Setup

Run from the repo root:

```bash
./.container/clients/dealodeal_com/setup.sh
```

Cloud example:

```bash
export JWT_SECRET='replace-with-a-real-secret-of-at-least-16-characters'
export SUPER_ADMIN_EMAILS='admin@dealodeal.com'
TARGET_ENV=cloud DEALODEAL_COM_DOMAIN=dealodeal.com ./.container/clients/dealodeal_com/setup.sh
```

## Clean install

```bash
TARGET_ENV=cloud \
DEALODEAL_COM_DOMAIN=dealodeal.com \
JWT_SECRET='replace-with-a-real-secret-of-at-least-16-characters' \
SUPER_ADMIN_EMAILS='admin@dealodeal.com' \
CLEAN_INSTALL=true \
CONFIRM_CLEAN_INSTALL=YES \
DROP_DATABASES=true \
CONFIRM_DROP_DATABASES=YES \
BUILD_IMAGE=true \
CREATE_DATABASES=true \
./.container/clients/dealodeal_com/setup.sh
```

Defaults:

- Local URL: `http://127.0.0.1:4009`
- Cloud URL: `https://dealodeal.com`
- Local database: `dealodeal_com_db`
- Cloud database: `dealodeal_com_db`
- Shared image: `codexsun-app:v1`
- Shared network: `codexion-network`

Useful commands:

```bash
docker logs --tail 200 dealodeal-com-app
docker exec dealodeal-com-app sh -lc 'cat /opt/codexsun/runtime/.env'
```
