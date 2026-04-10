# Tirupur Direct Setup

Run every command from the repo root.

## Quick commands

Local:

```bash
./.container/clients/tirupur_direct/setup.sh
```

Cloud:

```bash
export JWT_SECRET='replace-with-a-real-secret-of-at-least-16-characters'
export SECRET_OWNER_EMAIL='security@tirupurdirect.in'
export OPERATIONS_OWNER_EMAIL='ops@tirupurdirect.in'
export SUPER_ADMIN_EMAILS='admin@tirupurdirect.in'
TARGET_ENV=cloud TIRUPUR_DIRECT_DOMAIN=tirupurdirect.in ./.container/clients/tirupur_direct/setup.sh
```

## Defaults

- Local URL: `http://127.0.0.1:4005`
- Local DB: `tirupur_direct_db`
- Cloud URL: `https://tirupurdirect.in`
- Cloud app upstream: `127.0.0.1:4005`
- Cloud secondary port: `127.0.0.1:5005`

## Requirements

- Docker and Docker Compose plugin
- Shared network: `codexion-network`
- MariaDB reachable from the app container
- Real `JWT_SECRET` before `TARGET_ENV=cloud`
- DNS for `tirupurdirect.in`
- nginx on the server for ports `80` and `443`

## Local install

```bash
./.container/clients/tirupur_direct/setup.sh
```

## Cloud install

```bash
export JWT_SECRET='replace-with-a-real-secret-of-at-least-16-characters'
export SECRET_OWNER_EMAIL='security@tirupurdirect.in'
export OPERATIONS_OWNER_EMAIL='ops@tirupurdirect.in'
export SUPER_ADMIN_EMAILS='admin@tirupurdirect.in'

TARGET_ENV=cloud \
TIRUPUR_DIRECT_DOMAIN=tirupurdirect.in \
CREATE_DATABASES=true \
./.container/clients/tirupur_direct/setup.sh
```

## Nginx

Use:

- [.container/clients/tirupur_direct/nginx/tirupurdirect.in.http.conf](/E:/Workspace/codexsun/.container/clients/tirupur_direct/nginx/tirupurdirect.in.http.conf)
- [.container/clients/tirupur_direct/nginx/tirupurdirect.in.https.conf](/E:/Workspace/codexsun/.container/clients/tirupur_direct/nginx/tirupurdirect.in.https.conf)

Install:

```bash
sudo cp .container/clients/tirupur_direct/nginx/tirupurdirect.in.http.conf /etc/nginx/sites-available/tirupurdirect.in
sudo ln -s /etc/nginx/sites-available/tirupurdirect.in /etc/nginx/sites-enabled/tirupurdirect.in
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d tirupurdirect.in -d www.tirupurdirect.in
sudo cp .container/clients/tirupur_direct/nginx/tirupurdirect.in.https.conf /etc/nginx/sites-available/tirupurdirect.in
sudo nginx -t
sudo systemctl reload nginx
```
