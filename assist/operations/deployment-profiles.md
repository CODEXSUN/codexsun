# Deployment Profiles

## Purpose

A deployment profile defines one client deployment. It selects applications and add-ons without changing their source ownership.

Store profile definitions in `deployment/`. Use configuration templates without live secrets.

## Provider selection

An application composition root creates a `DeployableProfile` with an ID and
an explicit `enabledProviderIds` list. It passes the profile and available
providers to `createPlatformRuntime()`.

`ModuleEnablementPolicy` rejects duplicate IDs, unavailable providers, and
missing provider dependencies before host startup. The profile selects runtime
composition only. It does not replace the client deployment record.

## Required profile content

- client identifier and environment;
- selected applications, add-ons, and module providers;
- web, desktop, and mobile targets;
- MariaDB, SQLite, Redis, storage, and external dependencies;
- root `.env` and app `.app.env` requirements;
- container images, mounts, ports, and health checks;
- migration, seed, backup, and rollback steps;
- local live, Docker, and production verification checks.

## Environments

Local development proves developer workflows. Docker proves container composition. Production proves the selected client deployment.

Do not claim production verification from local or Docker evidence. Report each environment separately.

## Aaran single-tenant profile

`deployment/aaran.md` selects the first single-tenant Platform deployment. It
does not define multi-tenant behavior. A future tenant add-on must add its own
data, contracts, migration plan, and deployment review.

## Production gate

1. Review the selected applications and add-ons.
2. Validate configuration without printing secrets.
3. Run migrations and backups according to the profile.
4. Run container and health checks.
5. Run user-visible checks for affected client targets.
6. Record production evidence and rollback readiness.
