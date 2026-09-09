# Identity API Module

## Purpose

Identity owns authentication, portal-scoped sessions, users, credentials, roles, permissions, and authorization for Platform.

## Identity and version

- Module ID: `identity`
- Kind: `feature`
- Version: `1.0.0`
- Scope: `platform`
- Status: `active`

## Boundaries

The module follows DDD dependency direction. Presentation routes call the application service. The application layer depends on domain-owned repository and password ports. MariaDB, Kysely, Argon2, migrations, seeds, and schema checks remain in infrastructure.

The module owns `identity_users`, `identity_credentials`, `identity_sessions`, `identity_roles`, `identity_permissions`, `identity_role_permissions`, and `identity_user_roles`. Other modules must use its public contracts and authorizer instead of reading these tables.

## Portal contracts

- Regular: `/api/identity/login`, `/session`, and `/logout`.
- Administrator: `/api/identity/admin/login`, `/session`, and `/logout`.
- Super administrator: `/api/identity/sa/login`, `/session`, and `/logout`.
- Public account routes: `/api/identity/register`, `/api/identity/password/forgot`, and `/api/identity/config`.

Each portal uses a separate HTTP-only, same-site cookie path. A credential cannot sign in through another portal. Development sign-in exists only at `/api/identity/sa/dev-login` when the application is in development and `IDENTITY_DEV_LOGIN_ENABLED=true`.

The forgot-password endpoint returns a privacy-safe accepted response. Token delivery and password replacement are intentionally deferred until a mail adapter and a reset-token migration are owned here.

## Persistence and lifecycle

- Migration `0001-identity-schema` creates the module tables.
- Seed `0001-default-super-admin` creates the configured super administrator, its role, and wildcard permission.
- Applied checksums are immutable. Add a new ordered migration or seed for every later change.
- Session expiry is sliding only inside `IDENTITY_SESSION_RENEWAL_HOURS`; renewed sessions receive the configured full TTL.

## Verification

Run `npm.cmd run test:identity`, `npm.cmd run test:mariadb:foundation`, and `npm.cmd run test:e2e:server`. A live smoke must prove successful super-admin development login, session resolution, and a `401` when that cookie is presented to the regular portal.

## Development records

- [2026-09-09 Identity portals](../../../../../../assist/records/platform/2026-09-09-identity-portals.md)
