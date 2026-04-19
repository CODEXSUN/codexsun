# Lifeshoppy Setup

Run from the repo root:

```bash
./.container/clients/lifeshoppy_com/setup.sh
```

Cloud example:

```bash
export JWT_SECRET='replace-with-a-real-secret-of-at-least-16-characters'
export SUPER_ADMIN_EMAILS='admin@lifeshoppy.com'
TARGET_ENV=cloud LIFESHOPPY_COM_DOMAIN=lifeshoppy.com ./.container/clients/lifeshoppy_com/setup.sh
```

## Clean install

```bash
TARGET_ENV=cloud \
LIFESHOPPY_COM_DOMAIN=lifeshoppy.com \
JWT_SECRET='replace-with-a-real-secret-of-at-least-16-characters' \
SUPER_ADMIN_EMAILS='admin@lifeshoppy.com' \
CLEAN_INSTALL=true \
CONFIRM_CLEAN_INSTALL=YES \
DROP_DATABASES=true \
CONFIRM_DROP_DATABASES=YES \
BUILD_IMAGE=true \
CREATE_DATABASES=true \
./.container/clients/lifeshoppy_com/setup.sh
```

Defaults:

- Local URL: `http://127.0.0.1:4010`
- Cloud URL: `https://lifeshoppy.com`
- Local database: `lifeshoppy_com_db`
- Cloud database: `lifeshoppy_com_db`
- Shared image: `codexsun-app:v1`
- Shared network: `codexion-network`

Useful commands:

```bash
docker logs --tail 200 lifeshoppy-com-app
docker exec lifeshoppy-com-app sh -lc 'cat /opt/codexsun/runtime/.env'
```
