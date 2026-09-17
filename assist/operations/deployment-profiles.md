# Deployment Profiles

## Purpose

A deployment profile defines one client deployment. It selects applications and add-ons without changing their source ownership.

Store profile definitions in `deployment/`. Use configuration templates without live secrets.

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

## Production gate

1. Review the selected applications and add-ons.
2. Validate configuration without printing secrets.
3. Run migrations and backups according to the profile.
4. Run container and health checks.
5. Run user-visible checks for affected client targets.
6. Record production evidence and rollback readiness.
