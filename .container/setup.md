# CODEXSUN Host Setup

Document version: 1.0.47

Last updated: 2026-07-23

This document records the target deployment on `69.62.81.166`. Secrets and
passwords are intentionally omitted. Runtime credentials are stored in the
ignored `.env` and `.container/deploy.env` files, both with mode `0600`.

## Repository and runtime

- Workspace path: `/home/codexsun`
- Platform repository: `/home/codexsun/codexsun`
- Sibling repositories: `framework`, `ui`, `sites`, `core`, `billing`, and `mail`
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

- `https://app.codexsun.com` - canonical Billing/Platform Web address
- `https://media.codexsun.com` - FileBrowser
- `https://sukraa.codexsun.com` - Sukraa tenant application
- `https://cotton.codexsun.com` - Cotton Knit tenant application
- `https://ganapathi.codexsun.com` - Ganapathi tenant application

`codexsun.com`, `logicx.in`, and `tenkasisports.com` are served by the separate Sites stack and are
not Billing routes.

The tenant hostnames route through Traefik to the same Platform Web container.
They are present in the Vite development host allowlist and the Platform API
CORS allowlist. The former `sslip.io` routes and runtime values were removed.

## Databases and tenants

The MariaDB application user is `codexsun_app`; its password is stored only in the
protected environment files. The master database is `cxsun_master_db`.

| Tenant code  | Primary domain           | Database        | Status |
| ------------ | ------------------------ | --------------- | ------ |
| `CODEXSUN`   | `app.codexsun.com`       | `codexsun_db`   | Active |
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
CODEXSUN_DEPLOY_ENV=.container/vps.env bash .container/smoke-test.sh
docker ps
ufw status verbose
```

Checks confirmed healthy containers, authenticated Redis, MariaDB connectivity,
master and tenant databases, seeded Billing and Mail modules, hostname-to-tenant
resolution, HTTPS certificates, redirects, and per-origin CORS responses.

## Reusable VPS agent instructions

This section is the starting instruction for an automated VPS agent. It contains no credentials.
Production secrets belong only in the ignored `.container/vps.env` or `.container/deploy.env` file
with mode `0600`.

CODEXSUN deploys the Billing application stack. Sites and TechMedia remain independent runtime
deployments. The Platform catalogue dependency requires the Sites source package during a Billing
image build, but this workflow must never start, expose, stop, or remove their services.

Before planning or running commands, read these files completely from the current checkout:

1. `.container/AGENTS.md`
2. `.container/README.md`
3. `.container/deploy-log.md`
4. `assist/AGENT-GUIDE.md`
5. `assist/governance/rules.md`
6. `assist/architecture/deployment-model.md`

Inspect the current scripts, environment-example keys, Git state, Docker state, firewall, DNS,
available disk, and memory. The checked-out scripts and rules are authoritative if this document
becomes stale. Present a concise plan before mutation.

Always preserve these boundaries:

- Build from the seven public sibling repositories: `codexsun`, `framework`, `ui`, `sites`, `core`,
  `billing`, and `mail`. A registry or GitHub login is not required for installation.
- Maintain exactly one shared MariaDB, Redis, and Media layer on `codexsun-network`.
- Replace only Billing API/Web containers, migrations, images, and application storage during an
  application update.
- Never prune or delete shared containers, Traefik, networks, named volumes, databases, or uploads.
- Never run a database drop, fresh/reset command, destructive migration, or production reset.
- Keep `CODEXSUN_DB_FRESH_ON_START=0` and `CODEXSUN_ALLOW_PRODUCTION_DB_RESET=0`.
- Use the dedicated application database account, never MariaDB root, for application runtime.
- Bind MariaDB, Redis, Media, API, and Web host ports to loopback. Use an SSH tunnel for remote
  database administration.
- Permit only the approved SSH policy and public TCP 80/443. Do not expose Traefik port 8080.
- Never print, commit, or copy secrets into documentation or deployment logs.
- Stop on dirty/diverged repositories, unhealthy or partial infrastructure, missing backup evidence,
  unsafe migrations, or ambiguous ownership.
- Create and finish the required `.container/deploy-log.md` entry even when work fails or blocks.

### Prompt for a fresh VPS installation

```text
Perform a fresh CODEXSUN Billing installation from public source repositories.

If no checkout exists, create /opt/codexsun, clone
https://github.com/CODEXSUN/codexsun.git into /opt/codexsun/codexsun, and then read
.container/setup.md, .container/AGENTS.md, .container/README.md, .container/deploy-log.md, and every
mandatory document they name. If an installation already exists, locate and use it instead of
creating a second workspace.

Inspect the host and present a short plan. Install only missing prerequisites: Git, ca-certificates,
curl, Docker Engine, Docker Compose v2, Python 3, ripgrep, and rsync. Enable Docker at boot. Configure
the firewall for the approved SSH policy plus TCP 80/443 only; never expose database, Redis, Media,
application host ports, or a Traefik dashboard.

From the codexsun repository run `bash install.sh`. The first run clones framework, ui, sites, core,
billing, and mail as siblings and creates `.container/vps.env`. Stop after creation and require the
operator to enter real domains, administrator identities, strong unique secrets, optional verified
SMTP values, and a backup marker. A confirmed empty installation may use a recorded marker such as
initial-empty-database-YYYYMMDD. Never display the entered values.

After operator confirmation, verify mode 0600 and ensure no example placeholders remain. Confirm
every configured application and Media hostname resolves to the VPS. Run `bash install.sh` again.
Shared infrastructure may be created only when MariaDB, Redis, and Media are all absent. Stop if it
is partial or unhealthy. Permit only safe forward owner migrations and idempotent default seeds.

Run `CODEXSUN_DEPLOY_ENV=.container/vps.env bash .container/smoke-test.sh` and the exact Billing
Compose `ps` command from AGENTS.md. Verify HTTPS, redirects, API/Web health, shared-service health,
tenant hostname resolution, and that no
protected port is public. Complete a new deploy-log.md entry with revisions, secret-free commands,
migrations, image tags, health, shared container identities, bugs, blockers, and the final result.
Publish the sanitized log through the approved Git workflow when authorized; otherwise hand it to
an authorized operator and report the publishing blocker.
```

### Prompt to update code and containers

```text
Safely update the existing CODEXSUN Billing codebase and container deployment.

Locate the current codexsun repository; do not move it or create a second installation. Read
.container/setup.md, .container/AGENTS.md, .container/README.md, .container/deploy-log.md, and all
referenced rules before running commands. Inspect current scripts instead of using remembered ones.

Capture, without modifying tracked files, the facts for a new deploy-log.md entry: current branch and
commit of all seven repositories; Git status; container IDs, image IDs, health, and named volumes for
shared infrastructure, Traefik, and Billing; disk space; protected environment-file permissions;
and verified-backup status. Never record secret values. `install.sh update` requires a clean
checkout, so write the tracked log entry only after the update command finishes, or after preflight
has blocked the attempt.

Require clean `main` branches, healthy shared services, the existing shared network, and a valid
backup marker. Before changing any checkout, fetch `origin/main` for all seven repositories and report
each local revision, remote revision, ahead count, and behind count. Stop the whole update if any
repository is dirty, on another branch, ahead, diverged, missing its remote branch, or cannot fetch.
Do not partially update earlier repositories while later repositories remain unchecked. On any
failure stop without stash, reset, force-pull, cleanup, or infrastructure recreation, then complete
the log entry as blocked.

When preflight passes run `bash install.sh update` from the existing codexsun repository. Its strict
order is: fetch and compare every repository; fast-forward every repository to the fetched revision;
build Billing images from the synchronized source; apply safe forward migrations; replace only
Billing application containers; and smoke-test. It must preserve environment files, MariaDB, Redis,
Media, Traefik, uploads, databases, volumes, and the network.

Do not run broad Docker cleanup. Use `bash .container/deploy.sh billing --reinstall` only when the
operator explicitly authorizes a no-cache Billing rebuild. Verify shared container IDs and volumes
remain unchanged.

Afterwards run `CODEXSUN_DEPLOY_ENV=.container/vps.env bash .container/smoke-test.sh` and the exact
Billing Compose `ps` command from AGENTS.md. Verify routes, redirects, API/Web health, tenant resolution, Redis authentication,
MariaDB, Media, and logs. Finish deploy-log.md with before/after revisions, exact secret-free
commands, migration and health results, shared-resource identity comparison, every warning/bug/
blocker, required next improvements, and the final result. Publish the sanitized log through the
approved `#00 - message` Git workflow when authorized; otherwise report and hand off the blocker.
```

### Short instruction for a returning VPS agent

```text
Read the current `.container/setup.md` completely and follow its "Prompt to update code and
containers". Use the existing installation, update all seven sibling repositories through
`bash install.sh update`, rebuild only Billing application containers, preserve shared
infrastructure and data, complete `.container/deploy-log.md` with commands, results, bugs and
blockers, run every required smoke check, and publish the sanitized log with the standard commit
format when authorized.
```
