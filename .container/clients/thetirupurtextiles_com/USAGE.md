# The Tirupur Textiles Setup

Run from the repo root:

```bash
./.container/clients/thetirupurtextiles_com/setup.sh
```

Cloud example:

```bash
export JWT_SECRET='replace-with-a-real-secret-of-at-least-16-characters'
export SUPER_ADMIN_EMAILS='admin@thetirupurtextiles.com'
TARGET_ENV=cloud THETIRUPURTEXTILES_COM_DOMAIN=thetirupurtextiles.com ./.container/clients/thetirupurtextiles_com/setup.sh
```

## Clean install

```bash
TARGET_ENV=cloud \
THETIRUPURTEXTILES_COM_DOMAIN=thetirupurtextiles.com \
JWT_SECRET='replace-with-a-real-secret-of-at-least-16-characters' \
SUPER_ADMIN_EMAILS='admin@thetirupurtextiles.com' \
CLEAN_INSTALL=true \
CONFIRM_CLEAN_INSTALL=YES \
DROP_DATABASES=true \
CONFIRM_DROP_DATABASES=YES \
BUILD_IMAGE=true \
CREATE_DATABASES=true \
./.container/clients/thetirupurtextiles_com/setup.sh
```

Defaults:

- Local URL: `http://127.0.0.1:4014`
- Cloud URL: `https://thetirupurtextiles.com`
- Local database: `thetirupurtextiles_com_db`
- Cloud database: `thetirupurtextiles_com_db`
- Shared image: `codexsun-app:v1`
- Shared network: `codexion-network`

Useful commands:

```bash
docker logs --tail 200 thetirupurtextiles-com-app
docker exec thetirupurtextiles-com-app sh -lc 'cat /opt/codexsun/runtime/.env'
```
