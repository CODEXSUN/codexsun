# Aaran Single-Tenant Deployment Profile

## Identity

Client: Aaran.

Environment: local development first.

The deployment uses one tenant. It does not use tenant IDs, tenant tables, or
tenant claims in JWT tokens.

## Composition

- Application: Platform API and Platform web.
- Providers: `platform.core`, `platform.identity`, and `platform.system`.
- Targets: web only in this phase.

## Configuration

Set these root `.env` variables before API startup:

- `PLATFORM_DEPLOYMENT_MODE=single`
- `PLATFORM_DEPLOYMENT_NAME=aaran`
- `PLATFORM_BOOTSTRAP_ADMIN_EMAIL=admin@admin.com`
- `PLATFORM_JWT_SECRET`, `PLATFORM_JWT_ISSUER`, and `PLATFORM_JWT_AUDIENCE`

Do not store the bootstrap administrator password in this profile, source, or
seed data. A future credential-issuance task must read it from the ignored root
environment and create a password hash.

## Data And Verification

No tenant schema, migration, or seed runs in this phase. The existing Identity
schema stays tenant-free.

Check API configuration validation, single-deployment policy tests, and the
Platform API and web builds before deployment.
