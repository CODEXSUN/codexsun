# CODEXSUN Deployment Log

## Version State

Current documented release: 1.0.46

Release tag: v-1.0.46

Changelog label: v 1.0.46

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
