# TMNext Setup

Run every command from the repo root.

## Quick commands

Local:

```bash
./.container/clients/tmnext_in/setup.sh
```

Cloud:

```bash
export JWT_SECRET='replace-with-a-real-secret-of-at-least-16-characters'
export SECRET_OWNER_EMAIL='security@tmnext.in'
export OPERATIONS_OWNER_EMAIL='ops@tmnext.in'
export SUPER_ADMIN_EMAILS='admin@tmnext.in'
TARGET_ENV=cloud TMNEXT_IN_DOMAIN=tmnext.in ./.container/clients/tmnext_in/setup.sh
```

## Defaults

- Local URL: `http://127.0.0.1:4007`
- Local DB: `tmnext_in_db`
- Cloud URL: `https://tmnext.in`
- Cloud app upstream: `127.0.0.1:4007`
- Cloud secondary port: `127.0.0.1:5007`

## Requirements

- Docker and Docker Compose plugin
- Shared network: `codexion-network`
- MariaDB reachable from the app container
- Real `JWT_SECRET` before `TARGET_ENV=cloud`
- DNS for `tmnext.in`
- nginx on the server for ports `80` and `443`

Create the Docker network once:

```bash
docker network create codexion-network
```

Start MariaDB if needed:

```bash
docker compose -f .container/mariadb.yml up -d
```

## Local install

```bash
./.container/clients/tmnext_in/setup.sh
```

## Cloud install

```bash
export JWT_SECRET='replace-with-a-real-secret-of-at-least-16-characters'
export SECRET_OWNER_EMAIL='security@tmnext.in'
export OPERATIONS_OWNER_EMAIL='ops@tmnext.in'
export SUPER_ADMIN_EMAILS='admin@tmnext.in'

TARGET_ENV=cloud \
TMNEXT_IN_DOMAIN=tmnext.in \
CREATE_DATABASES=true \
./.container/clients/tmnext_in/setup.sh
```

## Nginx

Use:

- [.container/clients/tmnext_in/nginx/tmnext.in.http.conf](/E:/Workspace/codexsun/.container/clients/tmnext_in/nginx/tmnext.in.http.conf)
- [.container/clients/tmnext_in/nginx/tmnext.in.https.conf](/E:/Workspace/codexsun/.container/clients/tmnext_in/nginx/tmnext.in.https.conf)

Install:

```bash
sudo cp .container/clients/tmnext_in/nginx/tmnext.in.http.conf /etc/nginx/sites-available/tmnext.in
sudo ln -s /etc/nginx/sites-available/tmnext.in /etc/nginx/sites-enabled/tmnext.in
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d tmnext.in -d www.tmnext.in
sudo cp .container/clients/tmnext_in/nginx/tmnext.in.https.conf /etc/nginx/sites-available/tmnext.in
sudo nginx -t
sudo systemctl reload nginx
```
