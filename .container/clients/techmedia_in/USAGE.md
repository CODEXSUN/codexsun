# Techmedia Setup

Run every command from the repo root.

## Quick commands

Local:

```bash
./.container/clients/techmedia_in/setup.sh
```

Cloud:

```bash
export JWT_SECRET='replace-with-a-real-secret-of-at-least-16-characters'
export SECRET_OWNER_EMAIL='security@techmedia.in'
export OPERATIONS_OWNER_EMAIL='ops@techmedia.in'
export SUPER_ADMIN_EMAILS='admin@techmedia.in'
TARGET_ENV=cloud TECHMEDIA_IN_DOMAIN=techmedia.in ./.container/clients/techmedia_in/setup.sh
```

## Defaults

- Local URL: `http://127.0.0.1:4008`
- Local DB: `techmedia_in_db`
- Cloud URL: `https://techmedia.in`
- Cloud app upstream: `127.0.0.1:4008`
- Cloud secondary port: `127.0.0.1:5008`

## Requirements

- Docker and Docker Compose plugin
- Shared network: `codexion-network`
- MariaDB reachable from the app container
- Real `JWT_SECRET` before `TARGET_ENV=cloud`
- DNS for `techmedia.in`
- nginx on the server for ports `80` and `443`

## Local install

```bash
./.container/clients/techmedia_in/setup.sh
```

## Cloud install

```bash
export JWT_SECRET='replace-with-a-real-secret-of-at-least-16-characters'
export SECRET_OWNER_EMAIL='security@techmedia.in'
export OPERATIONS_OWNER_EMAIL='ops@techmedia.in'
export SUPER_ADMIN_EMAILS='admin@techmedia.in'

TARGET_ENV=cloud \
TECHMEDIA_IN_DOMAIN=techmedia.in \
CREATE_DATABASES=true \
./.container/clients/techmedia_in/setup.sh
```

## Nginx

Use:

- [.container/clients/techmedia_in/nginx/techmedia.in.http.conf](/E:/Workspace/codexsun/.container/clients/techmedia_in/nginx/techmedia.in.http.conf)
- [.container/clients/techmedia_in/nginx/techmedia.in.https.conf](/E:/Workspace/codexsun/.container/clients/techmedia_in/nginx/techmedia.in.https.conf)

Install:

```bash
sudo cp .container/clients/techmedia_in/nginx/techmedia.in.http.conf /etc/nginx/sites-available/techmedia.in
sudo ln -s /etc/nginx/sites-available/techmedia.in /etc/nginx/sites-enabled/techmedia.in
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d techmedia.in -d www.techmedia.in
sudo cp .container/clients/techmedia_in/nginx/techmedia.in.https.conf /etc/nginx/sites-available/techmedia.in
sudo nginx -t
sudo systemctl reload nginx
```
