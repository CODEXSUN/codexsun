# CODEXSUN Container Deployment Rules

Every human or automated agent must read this file, `.container/README.md`,
`.container/setup.md`, and `.container/deploy-log.md` before running a Docker, migration, install,
update, or VPS command for this repository.

## Ownership boundary

- CODEXSUN owns the one shared infrastructure layer: `codexsun-mariadb`, `codexsun-redis`,
  `codexsun-media`, their named volumes, and `codexsun-network`.
- The Billing application stack owns only `codexsun-billing-api`, `codexsun-billing-web`, its
  migration job, application images, and `codexsun-billing-stack-data`.
- Sites and Tech Media remain separate runtime deployments. The Billing build includes the Sites
  source package only to satisfy Platform's public application-catalogue dependency; it must not
  start, expose, remove, or otherwise administer Sites or Tech Media services.
- Application migrations may create or upgrade their owned schemas. They never drop unrelated
  databases or administer infrastructure lifecycle.

## Mandatory preflight

Before an application build or VPS update, verify:

1. All seven source repositories (`codexsun`, `framework`, `ui`, `sites`, `core`, `billing`, and
   `mail`) are
   clean and on `main`.
2. Fetch `origin/main` for every repository before changing any checkout, compare every local and
   remote revision, and stop the whole update if any repository is ahead or diverged. Only after all
   seven pass may they be fast-forwarded to the fetched revisions.
3. Docker Engine and Compose v2 are available.
4. `codexsun-network` already exists.
5. `codexsun-mariadb`, `codexsun-redis`, and `codexsun-media` are running and healthy.
6. `.container/deploy.env` or `.container/vps.env` exists, is protected, and contains production
   values rather than examples.
7. `CODEXSUN_DB_FRESH_ON_START=0`, `CODEXSUN_ALLOW_PRODUCTION_DB_RESET=0`, and a verified backup
   marker is recorded before production migrations.
8. Public DNS, TCP 80/443, Traefik, and the ACME email are ready for a VPS deployment.

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
CODEXSUN_DEPLOY_ENV=.container/vps.env bash .container/smoke-test.sh
docker compose --env-file .container/vps.env \
  -f .container/billing/docker-compose.yml ps
```

Confirm the three shared infrastructure container IDs and named volumes were not replaced by the
application deployment.

## Mandatory deployment log

Every fresh installation, update, reinstall, migration-only run, rollback attempt, and blocked or
failed deployment must add a new newest-first entry to `.container/deploy-log.md`. A deployment task
is not complete until the entry records:

- deployed CODEXSUN version and timestamp;
- environment and action without secrets;
- repository revisions before and after;
- exact secret-free commands used;
- preflight and verified-backup status;
- migration, container, route, health, and smoke-test results;
- shared infrastructure identity preservation;
- every bug, warning, blocker, workaround, and required next improvement;
- final result: successful, failed, rolled back, or blocked.

`bash install.sh update` requires every tracked repository to remain clean. Capture preflight facts
without editing tracked files, run the clean fast-forward/update, and append the log entry immediately
after the command finishes. If preflight blocks before the update command, append the blocked entry
after completing the checks. Never make the deployment log itself the reason an update cannot start.
The command must inspect all seven repositories, fetch all seven remotes, compare all seven revisions, and
approve all seven before it fast-forwards any checkout. It then builds, migrates, replaces only Billing,
and smoke-tests in that order.

Historical deployment entries are immutable. Never delete an error or rewrite an older result to
make a deployment appear successful. Never record passwords, tokens, private keys, environment-file
contents, or other secrets.

After the rollout, an authorized agent must review and publish the sanitized log change using the
repository-standard subject format. Preview first:

```bash
npm run github:now -- --dry-run --message "#00 - Record VPS deployment"
npm run github:now -- --yes --message "#00 - Record VPS deployment"
```

Replace `#00` with the deployed release patch reference. If the VPS intentionally has no Git push
credentials, do not add credentials merely for deployment. Preserve the completed log change,
report publishing as a blocker, and hand it to an authorized development operator.
