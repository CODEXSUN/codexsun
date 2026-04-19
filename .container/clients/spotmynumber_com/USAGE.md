# Spotmynumber Setup

Run from the repo root:

```bash
./.container/clients/spotmynumber_com/setup.sh
```

Cloud example:

```bash
export JWT_SECRET='replace-with-a-real-secret-of-at-least-16-characters'
export SUPER_ADMIN_EMAILS='admin@spotmynumber.com'
TARGET_ENV=cloud SPOTMYNUMBER_COM_DOMAIN=spotmynumber.com ./.container/clients/spotmynumber_com/setup.sh
```

## Clean install

```bash
TARGET_ENV=cloud \
SPOTMYNUMBER_COM_DOMAIN=spotmynumber.com \
JWT_SECRET='replace-with-a-real-secret-of-at-least-16-characters' \
SUPER_ADMIN_EMAILS='admin@spotmynumber.com' \
CLEAN_INSTALL=true \
CONFIRM_CLEAN_INSTALL=YES \
DROP_DATABASES=true \
CONFIRM_DROP_DATABASES=YES \
BUILD_IMAGE=true \
CREATE_DATABASES=true \
./.container/clients/spotmynumber_com/setup.sh
```

Defaults:

- Local URL: `http://127.0.0.1:4013`
- Cloud URL: `https://spotmynumber.com`
- Local database: `spotmynumber_com_db`
- Cloud database: `spotmynumber_com_db`
- Shared image: `codexsun-app:v1`
- Shared network: `codexion-network`

Useful commands:

```bash
docker logs --tail 200 spotmynumber-com-app
docker exec spotmynumber-com-app sh -lc 'cat /opt/codexsun/runtime/.env'
```
