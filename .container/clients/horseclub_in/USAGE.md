# Horseclub Setup

Run from the repo root:

```bash
./.container/clients/horseclub_in/setup.sh
```

Cloud example:

```bash
export JWT_SECRET='replace-with-a-real-secret-of-at-least-16-characters'
export SUPER_ADMIN_EMAILS='admin@horseclub.in'
TARGET_ENV=cloud HORSECLUB_IN_DOMAIN=horseclub.in ./.container/clients/horseclub_in/setup.sh
```

## Clean install

```bash
TARGET_ENV=cloud \
HORSECLUB_IN_DOMAIN=horseclub.in \
JWT_SECRET='replace-with-a-real-secret-of-at-least-16-characters' \
SUPER_ADMIN_EMAILS='admin@horseclub.in' \
CLEAN_INSTALL=true \
CONFIRM_CLEAN_INSTALL=YES \
DROP_DATABASES=true \
CONFIRM_DROP_DATABASES=YES \
BUILD_IMAGE=true \
CREATE_DATABASES=true \
./.container/clients/horseclub_in/setup.sh
```

Defaults:

- Local URL: `http://127.0.0.1:4011`
- Cloud URL: `https://horseclub.in`
- Local database: `horseclub_in_db`
- Cloud database: `horseclub_in_db`
- Shared image: `codexsun-app:v1`
- Shared network: `codexion-network`

Useful commands:

```bash
docker logs --tail 200 horseclub-in-app
docker exec horseclub-in-app sh -lc 'cat /opt/codexsun/runtime/.env'
```
