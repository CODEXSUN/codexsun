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
- Runtime Git sync is disabled by default in local mode and enabled by default in cloud mode
- Local clients bind their app ports publicly
- Cloud clients bind their app ports to `127.0.0.1` for nginx reverse proxying

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
CLEAN_INSTALL=true REMOVE_IMAGE=true CLIENTS=codexsun TARGET_ENV=local ./.container/bash-sh/setup.sh
DROP_DATABASES=true CONFIRM_DROP_DATABASES=YES CLIENTS=codexsun TARGET_ENV=local ./.container/bash-sh/setup.sh
```

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


# clean up
```
./.container/bash-sh/clean.sh
```
```
chmod +x ./.container/bash-sh/clean.sh
```
# setup
```
./.container/bash-sh/setup.sh
```
```
chmod +x ./.container/bash-sh/setup.sh
```


git reset --hard HEAD
git pull origin main

rm -f ~/.bash_history
history -c


cd /home/codexsun
docker rm -f tirupur-direct-app
docker volume rm tirupur-direct_tirupur_direct_runtime
CLIENTS=tirupur_direct ./.container/bash-sh/setup.sh