# CODEXSUN Container Deployment Rules

Every human or automated agent must read this file and `.container/README.md` before running a
Docker, migration, install, update, or VPS command for this repository.

## Ownership boundary

- CODEXSUN owns the one shared infrastructure layer: `codexsun-mariadb`, `codexsun-redis`,
  `codexsun-media`, their named volumes, and `codexsun-network`.
- The Billing application stack owns only `codexsun-billing-api`, `codexsun-billing-web`, its
  migration job, application images, and `codexsun-billing-stack-data`.
- CMS and Tech Media are separate repositories and must not be built or removed by this stack.
- Application migrations may create or upgrade their owned schemas. They never drop unrelated
  databases or administer infrastructure lifecycle.

## Mandatory preflight

Before an application build or VPS update, verify:

1. The exact Git repositories are clean and on the intended `main` revisions.
2. Docker Engine and Compose v2 are available.
3. `codexsun-network` already exists.
4. `codexsun-mariadb`, `codexsun-redis`, and `codexsun-media` are running and healthy.
5. `.container/deploy.env` or `.container/vps.env` exists, is protected, and contains production
   values rather than examples.
6. `CODEXSUN_DB_FRESH_ON_START=0`, `CODEXSUN_ALLOW_PRODUCTION_DB_RESET=0`, and a verified backup
   marker is recorded before production migrations.
7. Public DNS, TCP 80/443, Traefik, and the ACME email are ready for a VPS deployment.

If shared infrastructure is missing, partial, or unhealthy during an update, stop and report it.
Do not repair an application deployment by deleting or recreating shared resources.

## Approved workflows

First VPS installation may bootstrap shared infrastructure only when all three shared containers
are absent:

```bash
bash install.sh
```

Normal development or VPS application updates rebuild only Billing and connect it to the existing
shared services:

```bash
bash .container/deploy.sh billing up
bash .container/deploy.sh billing --reinstall
bash install.sh update
```

`--reinstall` means Billing application containers/images only. It must never stop, remove, build,
or recreate MariaDB, Redis, Media, their volumes, or the shared network.

## Prohibited operations

Never run any of these as part of an application deployment:

- `docker compose down -v` or `docker compose rm` against database, Redis, Media, or Traefik.
- `docker rm`, `docker volume rm`, or `docker network rm` for shared CODEXSUN resources.
- `docker system prune`, `docker volume prune`, or a broad image/container prune on the VPS.
- `db:drop`, a fresh/reset command, or production reset flags.
- A broad Compose command without the exact application Compose file and project scope.
- Replacement of protected deployment environment files from examples.

Media wiping is outside normal deployment. It requires the explicit, separately approved
`setup-media.sh --reinstall --wipe-media` workflow and must never be inferred from “rebuild”,
“reinstall”, “clean”, or “update”.

## Required verification

After every Billing rollout, run:

```bash
bash .container/smoke-test.sh
docker compose --env-file .container/deploy.env \
  -f .container/billing/docker-compose.yml ps
```

Confirm the three shared infrastructure container IDs and named volumes were not replaced by the
application deployment.
