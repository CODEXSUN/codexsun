# CODEXSUN Container Deployment

This directory provides one persistent infrastructure layer and the composed CODEXSUN Platform runtime.

The Billing stack owns `app.codexsun.com`, `cotton.codexsun.com`, `sukraa.codexsun.com`, and
`ganapathi.codexsun.com`. Its module-owned default seeder provisions four tenant registries and
four isolated databases with Billing and Mail enabled. Public portfolio domains are owned by the
separate CMS repository and are not routed by this stack.

| Product  | Source composition                                | Runtime services          |
| -------- | ------------------------------------------------- | ------------------------- |
| CODEXSUN | Framework + UI + Platform + Core + Billing + Mail | Platform API/Platform Web |

MariaDB, Redis, and Media are installed once. Product deployment commands never delete their named volumes. Normal source updates rebuild and replace only application containers, so databases, credentials, uploads, and application storage remain stable.

## First installation

Docker Desktop or Docker Engine with Compose v2 is required. From the repository root:

```bash
bash .container/setup.sh billing
```

From Windows PowerShell with Git for Windows installed:

```powershell
& 'C:\Program Files\Git\bin\bash.exe' .container/setup.sh billing
```

After infrastructure installation and before starting the application images, refresh and verify the exact Node/npm toolchain declared by the development workspace:

```bash
bash .container/update-runtime.sh
```

`setup.sh` runs this command automatically. It updates `NODE_RUNTIME_VERSION` and `NPM_RUNTIME_VERSION` from `package.json`, pulls the matching Node base image, and verifies npm before the application build starts.

On first use, `prepare-env.sh` creates the ignored `.container/deploy.env`. Database, super-admin, software-admin, and tenant-admin values are imported from the repository `.env`; missing infrastructure secrets are generated. The initial deployment enables the default `codexsun` tenant and provisions Billing and Mail. Once created, deployment credentials are retained across subsequent setup and update runs. Review the file before production use, especially public origins, administrator values, and `CODEXSUN_VERIFIED_BACKUP_ID`.

Mail is available to the tenant by default. Configure `MAIL_ENABLED` and the `MAIL_SMTP_*`/`MAIL_FROM_*` values in `deploy.env` only when a verified SMTP provider is ready; tenant company Mail settings continue to take priority over this deployment fallback.

`PLATFORM_API_PORT` and `PLATFORM_WEB_PORT` are the stable ports inside the composed runtime. `PLATFORM_API_HOST_PORT` and `PLATFORM_WEB_HOST_PORT` select the published host ports and normally have the same values. They can be changed independently when a native development runtime is already using `7010`/`7020`. `PLATFORM_API_URL` is the internal/server endpoint for the composed API. Browser builds use the same-origin `/api/platform` path; local Vite and the runtime nginx container proxy that path to Platform API. Core, Billing, Mail, and Platform all use that same composed API.

`PLATFORM_WEB_ORIGIN` is the canonical public Web origin and the only configured CORS source. Development automatically accepts `localhost` and `127.0.0.1` on `PLATFORM_WEB_PORT`. For live cloud deployment, set the canonical origin to its exact HTTPS value. Normal Platform Web traffic remains same-origin through `/api/platform` and does not depend on CORS. Never use wildcard CORS with credentialed requests.

`PLATFORM_WEB_HEALTH_URL` is an internal API-to-Web readiness target. Native development may leave
it blank and use the public origin. Docker sets it to the private `platform-web` service;
it must never be used as a browser URL.

Platform Web sends `Permissions-Policy: unload=*` in development and from the runtime nginx container. This temporarily permits legacy `unload` listeners, including browser-extension injected frames, during Chromium's staged deprecation. No other browser permission is widened.

MariaDB listens inside Docker on `3306` and is exposed to the host at `127.0.0.1:3307` by default. Applications use the private `codexsun-mariadb:3306` address.
Fresh deployments use the dedicated `codexsun_app` database account. MariaDB root access remains
local to the database container and is not used by the application runtime.

## Simple VPS installation

The VPS needs only Git, Docker Engine, and Docker Compose v2. No GitHub account, package token, or
container-registry login is required. Clone the Platform repository into a new workspace:

```bash
sudo mkdir -p /opt/codexsun
sudo chown "$USER":"$USER" /opt/codexsun
cd /opt/codexsun
git clone https://github.com/CODEXSUN/codexsun.git
cd codexsun
bash install.sh
```

The first run automatically clones `framework`, `ui`, `core`, `billing`, and `mail` beside
`codexsun`, then creates the ignored `.container/vps.env`. Edit that single file with the real
domains, HTTPS origin, administrator values, secrets, and verified-backup marker. For an empty first
installation, use a recorded marker such as `initial-empty-database-YYYYMMDD`. Then rerun:

```bash
bash install.sh
```

This builds MariaDB, Redis, Media, Platform API, Platform Web, and migrations directly from the
cloned source, starts Traefik, and runs the full smoke test.

For later updates:

```bash
cd /opt/codexsun/codexsun
bash install.sh update
```

`update` refuses to continue if any repository has uncommitted server changes. It fast-forwards all
six repositories from their public `main` branches, rebuilds application images, runs safe forward
migrations, recreates only application containers, and smoke-tests the result. MariaDB, Redis,
Media, uploads, credentials, and named volumes remain untouched.

## Local verification

The same source build can be tested before pushing repository changes:

```bash
bash .container/release-local.sh verify
```

Git commits and pushes remain explicit repository operations through `npm run github:now`. Container
scripts never commit or push source.

## Traefik and nginx

Use both layers. Traefik is the Docker-aware VPS ingress and certificate manager. Nginx is embedded
in the Web image because it is the efficient static SPA server and same-origin API proxy. Traefik
connects only to containers explicitly labeled for exposure; Platform API and databases remain
private.

Before `vps.sh install`, point public DNS to the VPS and allow inbound TCP 80/443. Traefik uses the
HTTP ACME challenge and stores certificates in the persistent `codexsun-traefik-acme` volume. The
Docker socket is mounted read-only; a socket proxy is the recommended hardening follow-up when the
host runs unrelated workloads.

Available actions are:

```bash
bash .container/deploy.sh PRODUCT up
bash .container/deploy.sh PRODUCT --reinstall
bash .container/deploy.sh PRODUCT build
bash .container/deploy.sh PRODUCT migrate
bash .container/deploy.sh PRODUCT ps
bash .container/deploy.sh PRODUCT logs
bash .container/deploy.sh PRODUCT down
```

`--reinstall` performs a no-cache rebuild of the selected application stack while preserving all named volumes. `down` also preserves volumes. There is intentionally no implicit destructive reset command.

## Persistent resources

The stable Docker volumes include MariaDB data/backups, Redis data, Media files/metadata/configuration, and per-product application storage. MariaDB owns the Platform master database and tenant databases.

Before a production database migration, set `CODEXSUN_VERIFIED_BACKUP_ID` to the verified backup run ID. For a confirmed empty first install, record a unique marker such as `initial-empty-database-YYYYMMDD`.

Media administration can be reconciled independently:

```bash
bash .container/setup-media.sh
```

Only the explicit `--reinstall --wipe-media` combination removes media data; the helper validates mounts and targets before doing so.

## Default host ports

All published ports bind to `127.0.0.1` unless `CODEXSUN_BIND_ADDRESS` is changed.

| Service                 |                Host port |
| ----------------------- | -----------------------: |
| MariaDB / Redis / Media | `3307` / `6379` / `7090` |
| Platform API/Web        |          `7010` / `7020` |

To run the containers beside the native development runtime, set
`PLATFORM_API_HOST_PORT=17010`, `PLATFORM_WEB_HOST_PORT=17020`, and include
`http://127.0.0.1:17020` in `PLATFORM_WEB_ORIGINS` in the ignored `deploy.env`.
The container ports remain `7010`/`7020`.

## Verification

With CODEXSUN running:

```bash
bash .container/smoke-test.sh
```

The smoke test checks Platform API/Web, Media, authenticated Redis access, MariaDB, the Platform master database, and—when enabled—the default tenant database with Billing and Mail active.
