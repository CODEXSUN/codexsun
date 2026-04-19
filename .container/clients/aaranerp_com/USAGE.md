# AaranERP Setup

Run from the repo root:

```bash
./.container/clients/aaranerp_com/setup.sh
```

Cloud example:

```bash
export JWT_SECRET='replace-with-a-real-secret-of-at-least-16-characters'
export SUPER_ADMIN_EMAILS='admin@aaranerp.com'
TARGET_ENV=cloud AARANERP_COM_DOMAIN=aaranerp.com ./.container/clients/aaranerp_com/setup.sh
```

## Clean install

```bash
TARGET_ENV=cloud \
AARANERP_COM_DOMAIN=aaranerp.com \
JWT_SECRET='replace-with-a-real-secret-of-at-least-16-characters' \
SUPER_ADMIN_EMAILS='admin@aaranerp.com' \
CLEAN_INSTALL=true \
CONFIRM_CLEAN_INSTALL=YES \
DROP_DATABASES=true \
CONFIRM_DROP_DATABASES=YES \
BUILD_IMAGE=true \
CREATE_DATABASES=true \
./.container/clients/aaranerp_com/setup.sh
```

Defaults:

- Local URL: `http://127.0.0.1:4012`
- Cloud URL: `https://aaranerp.com`
- Local database: `aaranerp_com_db`
- Cloud database: `aaranerp_com_db`
- Shared image: `codexsun-app:v1`
- Shared network: `codexion-network`

Useful commands:

```bash
docker logs --tail 200 aaranerp-com-app
docker exec aaranerp-com-app sh -lc 'cat /opt/codexsun/runtime/.env'
```
