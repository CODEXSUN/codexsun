# Aaran Single-Tenant Deployment Profile

## Identity

Client: Aaran.

Environment: selected local composition. Docker and production deployment are deferred.

The deployment uses one tenant. It does not use tenant IDs, tenant tables, or
tenant claims in JWT tokens.

## Composition

- Applications: Platform API, Platform web, Platform desktop, and Platform mobile.
- Providers: `platform.core`, `platform.identity`, `platform.operations`, `platform.settings`, and `platform.system`.
- Add-ons: none selected.
- Targets: web, desktop, and mobile.

## Infrastructure

- MariaDB is the selected deployed data store for module data and database-backed outbox records.
- `storage/apps/` stores private and public module-scoped files.
- Redis is optional and is not selected for this profile.
- `.container/compose.yml` is available but this profile does not authorize an image build or Docker run.
- Desktop output uses `dist/platform/desktop/`.
- Mobile web output uses `dist/platform/mobile/web/`.

## Configuration

The selected host configuration uses these root `.env` and app `.app.env` variable names:

- `PLATFORM_DEPLOYMENT_MODE`, `PLATFORM_DEPLOYMENT_NAME`, and `PLATFORM_BOOTSTRAP_ADMIN_EMAIL`
- `PLATFORM_JWT_SECRET`, `PLATFORM_JWT_ISSUER`, and `PLATFORM_JWT_AUDIENCE`
- `PLATFORM_API_PORT`, `PLATFORM_WEB_PORT`, and `PLATFORM_DESKTOP_PORT`
- `PLATFORM_DESKTOP_API_URL`, `PLATFORM_MOBILE_API_URL`, and `VITE_PLATFORM_MOBILE_API_URL`
- `DATABASE_URL`, `STORAGE_ROOT`, and `REDIS_URL` when a future profile selects Redis
- `MARIADB_DATABASE`, `MARIADB_USER`, `MARIADB_PASSWORD`, and `MARIADB_ROOT_PASSWORD` only for a future Docker run

Set `STORAGE_ROOT` only when the host needs an explicit storage mount. The Platform API composition resolves its local root storage path.

Do not store the bootstrap administrator password in this profile, source, or
seed data. A future credential-issuance task must read it from the ignored root
environment and create a password hash.

## Deferred Verification And Rollback

No tenant schema, migration, or seed runs in this phase. The existing Identity
schema stays tenant-free.

This profile does not run migrations, seeders, Docker builds, Docker containers, or production deployment.

Before a later deployment, run the Operations migration, take a backup, and record restore evidence. Run Docker health checks, native desktop checks, mobile device checks, and user-flow checks separately. Keep rollback ownership and incident contact data in the deployment record for that release.
