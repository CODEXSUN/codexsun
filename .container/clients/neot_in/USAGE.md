# NEOT Setup

Run every command from the repo root.

## Quick commands

Local:

```bash
./.container/clients/neot_in/setup.sh
```

Cloud:

```bash
export JWT_SECRET='replace-with-a-real-secret-of-at-least-16-characters'
export SECRET_OWNER_EMAIL='security@neot.in'
export OPERATIONS_OWNER_EMAIL='ops@neot.in'
export SUPER_ADMIN_EMAILS='admin@neot.in'
TARGET_ENV=cloud NEOT_IN_DOMAIN=neot.in ./.container/clients/neot_in/setup.sh
```

## Clean install

```bash
TARGET_ENV=cloud \
NEOT_IN_DOMAIN=neot.in \
JWT_SECRET='replace-with-a-real-secret-of-at-least-16-characters' \
SECRET_OWNER_EMAIL='security@neot.in' \
OPERATIONS_OWNER_EMAIL='ops@neot.in' \
SUPER_ADMIN_EMAILS='admin@neot.in' \
CLEAN_INSTALL=true \
CONFIRM_CLEAN_INSTALL=YES \
DROP_DATABASES=true \
CONFIRM_DROP_DATABASES=YES \
BUILD_IMAGE=true \
CREATE_DATABASES=true \
./.container/clients/neot_in/setup.sh
```

## Defaults

- Local URL: `http://127.0.0.1:4002`
- Local DB: `neot_in_db`
- Cloud URL: `https://neot.in`
- Cloud app upstream: `127.0.0.1:4002`
- Cloud secondary port: `127.0.0.1:5002`

## Requirements

- Docker and Docker Compose plugin
- Shared network: `codexion-network`
- MariaDB reachable from the app container
- Real `JWT_SECRET` before `TARGET_ENV=cloud`
- DNS for `neot.in`
- nginx on the server for ports `80` and `443`

## Local install

```bash
./.container/clients/neot_in/setup.sh
```

## Cloud install

```bash
export JWT_SECRET='replace-with-a-real-secret-of-at-least-16-characters'
export SECRET_OWNER_EMAIL='security@neot.in'
export OPERATIONS_OWNER_EMAIL='ops@neot.in'
export SUPER_ADMIN_EMAILS='admin@neot.in'

TARGET_ENV=cloud \
NEOT_IN_DOMAIN=neot.in \
CREATE_DATABASES=true \
./.container/clients/neot_in/setup.sh
```

## Nginx

Use:

- [.container/clients/neot_in/nginx/neot.in.http.conf](/E:/Workspace/codexsun/.container/clients/neot_in/nginx/neot.in.http.conf)
- [.container/clients/neot_in/nginx/neot.in.https.conf](/E:/Workspace/codexsun/.container/clients/neot_in/nginx/neot.in.https.conf)

Install:

```bash
sudo cp .container/clients/neot_in/nginx/neot.in.http.conf /etc/nginx/sites-available/neot.in
sudo ln -s /etc/nginx/sites-available/neot.in /etc/nginx/sites-enabled/neot.in
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d neot.in -d www.neot.in
sudo cp .container/clients/neot_in/nginx/neot.in.https.conf /etc/nginx/sites-available/neot.in
sudo nginx -t
sudo systemctl reload nginx
```
