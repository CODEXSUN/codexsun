# CODEXSUN Deployment Log

## Version State

Current documented release: 1.0.47

Release tag: v-1.0.47

Changelog label: v 1.0.47

This is the append-only operational history for CODEXSUN Billing deployments. It contains no
secrets. New entries are inserted above older entries and use the CODEXSUN version actually deployed.

## Strict logging policy

Every fresh install, update, reinstall, migration-only run, rollback attempt, failure, or blocked
attempt must create an entry. Historical entries are immutable. An entry must include:

- timestamp and target environment;
- action and final result;
- repository revisions before and after;
- exact commands used, with secret values omitted;
- preflight, backup, migration, image, container, route, and smoke-test results;
- proof that shared infrastructure containers and named volumes were preserved;
- all warnings, bugs, blockers, workarounds, and next improvements.

Never record passwords, access tokens, private keys, cookies, full environment files, or secret
values. A failed or blocked result remains in history and must not be rewritten as successful.

## v-1.0.47

### [v 1.0.47] 2026-07-22 19:47 UTC - Blocked Billing rollout: database migration not authorized

#### Deployment

- Environment: existing VPS Billing deployment at `/home/codexsun`.
- Action: fetched the requested CMS, Techmedia, Devkit, and required Sites/UI source dependencies,
  repaired the Billing build composition, and prepared the current Billing images.
- Result: blocked before migration or Billing container replacement because the requested scope says
  not to touch the database and the supported production rollout requires a schema migration.
- Operator or agent: Codex.

#### Source and image results

- Cloned current `main` checkouts: CMS `57e0e60`, Techmedia `85b3519`, Devkit `fa86297`, and
  Sites `5c2c944`. Existing Framework `9689834`, UI `d2e0d0a`, Core `41740df`, Billing `c6f598b`,
  Mail `46f98cd`, and Platform `b7d055f` remained current.
- Billing build composition now includes CMS and Sites source packages because Platform imports
  `@codexsun/cms`; Techmedia and Devkit remain separate applications and were not added as Billing
  runtime services.
- The composed Platform API and Web build completed. Prepared local images: API
  `codexsun/billing-stack-api:1.0.47` (`a92c95803ec7`), Web
  `codexsun/billing-stack-web:1.0.47` (`774150757623`), and migration
  `codexsun/billing-stack-migrations:1.0.47` (`fe5a7d90fa03`).
- Commands used (with secret values omitted):

```text
git clone --branch main https://github.com/CODEXSUN/{cms,techmedia,devkit,sites}.git
docker compose --env-file .container/vps.env -f .container/billing/docker-compose.yml build
docker image inspect codexsun/billing-stack-{api,web,migrations}:1.0.47
```

#### Migration and preservation results

- The migration command runs `db:migrations:run`, which performs a production preflight and then
  applies Platform and tenant schema migrations. It was deliberately not run.
- Billing API/Web were not replaced: API remains `codexsun/billing-stack-api:1.0.44`
  (`d3e5f15a93f5`) and Web remains `codexsun/billing-stack-web:1.0.44` (`471e41eee42a`), both
  healthy.
- Shared infrastructure was untouched and healthy: MariaDB `eaee0f844524`, Redis
  `d600592c73ed`, and Media `e8fd8814bede`. No shared container, volume, network, Traefik route,
  credential, or data operation occurred.

#### Next authorized action

- To finish the 1.0.47 rollout, explicitly authorize the required Billing schema migration (with
  the verified-backup marker already configured); then replace only the Billing API/Web containers
  and run the smoke test. No MariaDB, Redis, or Media service upgrade is required.

## v-1.0.47

### [v 1.0.47] 2026-07-22 19:10 UTC - Blocked Billing source update

#### Deployment

- Environment: existing VPS Billing deployment at `/home/codexsun`.
- Action: coordinated source update and Billing application rollout.
- Result: blocked before migrations or Billing container replacement.
- Operator or agent: Codex.
- Verified backup: confirmed non-empty marker present; reset flags remained disabled.

#### Repository revisions

| Repository | Before | After | Branch | Clean before log |
| ---------- | ------ | ----- | ------ | ---------------- |
| codexsun   | b7d055f | b7d055f | main | Yes |
| framework  | 9689834 | 9689834 | main | Yes |
| ui         | d2e0d0a | d2e0d0a | main | Yes |
| core       | 41740df | 41740df | main | Yes |
| billing    | c6f598b | c6f598b | main | Yes |
| mail       | 46f98cd | 46f98cd | main | Yes |

#### Commands executed

```text
git pull --ff-only origin main
bash install.sh update
CODEXSUN_DEPLOY_ENV=/home/codexsun/.container/vps.env bash .container/smoke-test.sh
docker compose --env-file .container/vps.env -f .container/billing/docker-compose.yml ps
```

#### Migration and rollout results

- Coordinated six-repository fetch/compare passed: every local `main` matched its fetched
  `origin/main`, with ahead=0 and behind=0.
- Build result: failed in `@codexsun/platform-api` before migrations, at
  `src/modules/app-orchestration/app-orchestration.repository.ts(3,32)`: TypeScript could not
  resolve `@codexsun/cms`.
- Migration result: not started.
- Billing API/Web containers: remained `codexsun/billing-stack-api:1.0.44` and
  `codexsun/billing-stack-web:1.0.44`, both healthy; no replacement occurred.
- Smoke test: passed for the existing Billing API/Web, Media, authenticated Redis, Platform master
  database, Super Admin session, and all seeded Billing/Mail tenant databases.
- Shared infrastructure preservation: MariaDB `eaee0f844524`, Redis `d600592c73ed`, and Media
  `e8fd8814bede` stayed running and healthy. Their `codexsun-mariadb-data`,
  `codexsun-redis-data`, and `codexsun-media-data` volumes retained their pre-update identities.

#### Bugs, blockers, and next improvements

- Blocker: the Platform source references `@codexsun/cms`, but CMS is not part of the documented
  six-repository Billing composition and no resolvable package is available to the build.
- Workaround: retained the healthy 1.0.44 Billing containers; no database, Redis, Media, upload,
  credential, volume, network, or Traefik change was attempted.
- Required next improvement: publish a compatible Platform source update that removes/replaces the
  unresolved CMS dependency or adds it to an approved Billing source composition, then rerun the
  coordinated update.

## v-1.0.47

### [v 1.0.47] 2026-07-23 - Enforce coordinated repository update preflight

#### Deployment

- Environment: Documentation and deployment-script release; no VPS deployment executed in this
  entry.
- Action: Strengthened the normal source and Billing container update workflow.
- Result: Prepared for the next authorized VPS update.

#### Update contract

- `bash install.sh update` now validates clean `main` branches and an `origin` remote for all six
  repositories before contacting any remote.
- It fetches every `origin/main`, reports local/remote revisions with ahead/behind counts, and stops
  the complete update when any repository is ahead or diverged.
- Only after every repository passes does it fast-forward all checkouts to the already inspected
  revisions, preventing a late repository failure from causing an avoidable partial source update.
- The remaining order is explicit: build Billing images, apply safe forward migrations, replace
  only Billing containers, and run the full smoke test.

#### Commands established

```bash
bash install.sh update
CODEXSUN_DEPLOY_ENV=.container/vps.env bash .container/smoke-test.sh
docker compose --env-file .container/vps.env \
  -f .container/billing/docker-compose.yml ps
```

#### Bugs, blockers, and next improvements

- Resolved the prior gap where repositories were pulled sequentially without first fetching and
  comparing the complete six-repository source set.
- No live VPS update, Docker build, migration, or smoke test was performed for this release. The
  next deployment agent must record the actual before/after revisions, images, containers, routes,
  shared-resource identity comparison, and verification results in a new entry.
- Git cannot provide a transactional multi-repository checkout. The coordinated fetch and comparison
  removes expected policy failures before mutation; an unexpected local filesystem failure during a
  later fast-forward must still be logged and repaired deliberately without reset or force-pull.

## v-1.0.46

### [v 1.0.46] 2026-07-22 - Establish mandatory versioned deployment history

#### Deployment

- Environment: Documentation release; no VPS deployment executed in this entry.
- Action: Consolidated the fresh-install and safe-update prompts into `.container/setup.md`.
- Result: Documentation prepared for the next authorized VPS installation or update.

#### Repository history

- CODEXSUN Platform moved from `apps/platform` to `src/platform` in release 1.0.45.
- The source-built Billing stack composes Framework, UI, Platform, Core, Billing, and Mail.
- CMS and TechMedia remain independent repositories and container deployments.
- The shared infrastructure contract is one MariaDB, one Redis, one Media service, Traefik, their
  persistent named volumes, and `codexsun-network`.

#### Established setup and update commands

```bash
# First installation; first run creates the protected VPS environment file.
bash install.sh

# Normal source and Billing container update.
bash install.sh update

# Application-only no-cache rebuild, only with explicit authorization.
bash .container/deploy.sh billing --reinstall

# Required VPS application and shared-service verification.
CODEXSUN_DEPLOY_ENV=.container/vps.env bash .container/smoke-test.sh
docker compose --env-file .container/vps.env \
  -f .container/billing/docker-compose.yml ps

# Local release verification before publishing source changes.
bash .container/release-local.sh verify
```

#### Known history

- The recorded host baseline uses persistent MariaDB, Redis, Media, Traefik, Platform API, and
  Platform Web containers with restart policies and health checks.
- Public Billing routes are `app.codexsun.com`, `cotton.codexsun.com`, `sukraa.codexsun.com`, and
  `ganapathi.codexsun.com`; the configured Media hostname routes to FileBrowser.
- MariaDB, Redis, Media, API, and Web host bindings remain loopback-only. Public ingress is Traefik
  on TCP 80/443; remote database administration uses an SSH tunnel.
- Tenant migrations and seeds are repository-owned, ordered, forward-only, and repeatable.

#### Bugs, blockers, and next improvements

- Resolved a documentation bug where manual VPS smoke-test examples did not explicitly select
  `.container/vps.env`; VPS verification commands must now set `CODEXSUN_DEPLOY_ENV` or pass the
  VPS environment file directly.
- Resolved a runbook-ordering bug where starting the tracked deployment entry before
  `install.sh update` would make the repository dirty and fail its safety preflight; agents now
  capture evidence first and write the tracked entry after the update or blocked preflight.
- No live VPS inspection or rollout was performed while creating this entry, so current remote
  commit IDs, container IDs, image IDs, backup marker, DNS, certificates, and health must be captured
  by the next deployment agent.
- Older setup history did not retain complete before/after revision and container identity evidence.
  The mandatory entry template below closes that audit gap for future work.

## Entry template

Copy this template above the latest version entry and replace every placeholder. Keep unsuccessful
attempts in the file.

````markdown
## v-X.Y.Z

### [v X.Y.Z] YYYY-MM-DD HH:MM TZ - Short deployment title

#### Deployment

- Environment: production/staging/local and non-secret host label.
- Action: install/update/reinstall/migrate/rollback attempt.
- Result: successful/failed/blocked/rolled back.
- Operator or agent: non-secret identifier.
- Verified backup: confirmed marker reference or not applicable for confirmed empty install.

#### Repository revisions

| Repository | Before | After | Branch | Clean |
| ---------- | ------ | ----- | ------ | ----- |
| codexsun   |        |       | main   | Yes   |
| framework  |        |       | main   | Yes   |
| ui         |        |       | main   | Yes   |
| core       |        |       | main   | Yes   |
| billing    |        |       | main   | Yes   |
| mail       |        |       | main   | Yes   |

#### Commands executed

```text
List exact commands in execution order. Remove secret values and environment-file contents.
```

#### Migration and rollout results

- Migration result:
- Billing API/Web image tags and IDs:
- Billing API/Web container IDs and health:
- Shared MariaDB/Redis/Media/Traefik IDs before and after:
- Named-volume identity check:
- HTTPS routes and redirects:
- Smoke-test result:

#### Bugs, blockers, and next improvements

- Bug or warning:
- Blocker or workaround:
- Required next improvement:
````
