# CODEXSUN Host Setup

Last updated: 2026-07-21

This document records the target deployment on `69.62.81.166`. Secrets and
passwords are intentionally omitted. Runtime credentials are stored in the
ignored `.env` and `.container/deploy.env` files, both with mode `0600`.

## Repository and runtime

- Workspace path: `/home/codexsun`
- Platform repository: `/home/codexsun/codexsun`
- Sibling repositories: `framework`, `ui`, `core`, `billing`, and `mail`
- Branch: `main`
- Docker network: `codexsun-network`
- Runtime versions: Node.js `26.5.0` and npm `12.0.1` inside the application images
- First deployment command: `bash install.sh`
- Update command: `bash install.sh update`

The complete stack is deployed with persistent Docker volumes. MariaDB, Redis,
FileBrowser, Platform API, and Platform Web use restart policies and health
checks. Platform API and Web compose Core, Billing, and Mail into the shared
runtime.

## Containers and host ports

| Service      | Container              | Host binding     |
| ------------ | ---------------------- | ---------------- |
| MariaDB      | `codexsun-mariadb`     | `127.0.0.1:3307` |
| Redis        | `codexsun-redis`       | `127.0.0.1:6379` |
| Platform API | `codexsun-billing-api` | `127.0.0.1:7010` |
| Platform Web | `codexsun-billing-web` | `127.0.0.1:7020` |
| FileBrowser  | `codexsun-media`       | `127.0.0.1:7090` |

Traefik is managed by `.container/traefik/docker-compose.yml`, listens on public
ports 80 and 443, redirects HTTP to HTTPS, and obtains certificates with the
`letsencrypt` resolver.

## Public HTTPS routes

- `https://codexsun.com` - canonical Platform Web address
- `https://www.codexsun.com` - permanent redirect to `https://codexsun.com`
- `https://files.codexsun.com` - FileBrowser
- `https://sukraa.codexsun.com` - Sukraa tenant application
- `https://cotton.codexsun.com` - Cotton Knit tenant application
- `https://ganapathi.codexsun.com` - Ganapathi tenant application

The tenant hostnames route through Traefik to the same Platform Web container.
They are present in the Vite development host allowlist and the Platform API
CORS allowlist. The former `sslip.io` routes and runtime values were removed.

## Databases and tenants

The MariaDB application user is `codexsun_app`; its password is stored only in the
protected environment files. The master database is `cxsun_master_db`.

| Tenant code  | Primary domain           | Database        | Status |
| ------------ | ------------------------ | --------------- | ------ |
| `CODEXSUN`   | `codexsun.com`           | `codexsun_db`   | Active |
| `SUKRAA`     | `sukraa.codexsun.com`    | `sukraa_db`     | Active |
| `COTTONKNIT` | `cotton.codexsun.com`    | `cottonknit_db` | Active |
| `GANAPATHI`  | `ganapathi.codexsun.com` | `ganapathi_db`  | Active |

Each tenant database was provisioned with the repository-supported tenant
workflow and seeded idempotently with Platform Application, Core/Billing, Mail,
roles, permissions, module settings, migrations, and isolated storage paths.
The all-tenant seed command used was:

```bash
docker compose --env-file .container/deploy.env \
  -f .container/billing/docker-compose.yml --profile tools \
  run --rm platform-migrate npm run db:seed
```

## Bootstrap accounts

- Platform super administrator: `sundar@sundar.com`
- Default CODEXSUN tenant administrator: `admin@tenant.com`
- FileBrowser administrator: `admin`

Passwords are not recorded here. Change all bootstrap passwords after initial
sign-in and keep the environment files private.

## Firewall and remote MariaDB

UFW is enabled with default incoming traffic denied. The explicit incoming
rules are:

- TCP 22 for OpenSSH

MariaDB binds to loopback by default and is not exposed through Traefik. If
remote database administration is required, use an SSH tunnel instead of a
public database port.

## Verification

The deployment was verified with:

```bash
bash .container/smoke-test.sh
docker ps
ufw status verbose
```

Checks confirmed healthy containers, authenticated Redis, MariaDB connectivity,
master and tenant databases, seeded Billing and Mail modules, hostname-to-tenant
resolution, HTTPS certificates, redirects, and per-origin CORS responses.
