# Identity API Module

## Purpose

Identity owns authentication, portal-scoped sessions, users, credentials, roles, permissions, and authorization for Platform.

## Identity and version

- Module ID: `identity`
- Kind: `feature`
- Version: `1.1.0`
- Scope: `platform`
- Status: `active`

## Boundaries

The module follows DDD dependency direction. Presentation routes call the application service. The application layer depends on domain-owned repository and password ports. MariaDB, Kysely, Argon2, migrations, seeds, and schema checks remain in infrastructure.

The module owns users, identifiers, credentials, devices, sessions, roles, permissions, and security events. Other modules must use its public contracts instead of reading these tables.

## Internal capabilities

- `user` owns users and email, username, and mobile identifiers.
- `role` owns product roles, permissions, and user assignments.
- `device` owns web, desktop, and mobile device activation.
- `session` owns cookie and bearer session tokens.
- `security` owns safe authentication and request activity records.
- `verification` owns optional email and OTP provider ports.

The minimum password length is eight characters. The API never returns a password or password hash.

## Portal contracts

- Regular: `/api/identity/login`, `/session`, and `/logout`.
- Administrator: `/api/identity/admin/login`, `/session`, and `/logout`.
- Super administrator: `/api/identity/sa/login`, `/session`, and `/logout`.
- Public account routes: `/api/identity/register`, `/api/identity/password/forgot`, and `/api/identity/config`.

Each portal uses a separate HTTP-only, same-site cookie path. Desktop and mobile clients can use the returned bearer token. A credential cannot sign in through another portal.

Actor resolution, activity logging, and routes share the module-owned request token parser.
Explicit Authorization headers never fall back to cookies when invalid. Session validation
also checks the user's current portal. These bindings do not implement cross-app session exchange.

Login accepts one username, email address, or mobile number. Email and OTP delivery remain disabled until an owned provider replaces the disabled adapter.

The first verified device becomes active. A later device stays pending until the user approves it from an active device or a super administrator activates it. A device needs its server-issued token for later logins.

The forgot-password endpoint returns a privacy-safe accepted response. Token delivery and password replacement are intentionally deferred until a mail adapter and a reset-token migration are owned here.

## Persistence and lifecycle

- Migration `0001-identity-schema` creates the initial module tables.
- Migration `0002-identity-devices-and-security` adds identifiers, devices, session binding, and security events.
- Migration `0003-identity-access-indexes` adds lookup and monitoring indexes.
- Seed `0001-default-super-admin` creates the configured super administrator, its role, and wildcard permission.
- Applied checksums are immutable. Add a new ordered migration or seed for every later change.
- Session renewal updates MariaDB and the browser cookie.

## Access rules

- A regular user can use the regular portal and manage only that user's devices.
- An administrator can manage regular users, reset requests, roles, and product permissions.
- An administrator cannot read credentials or manage super administrators.
- Only a super administrator can list all users and read security events.
- Product modules must declare permission names. Identity owns their assignment.

## Security statement

No system can promise that a breach will never occur. This module reduces risk through Argon2 hashes, hashed tokens, device activation, portal isolation, strict input validation, request limits, origin checks, activity records, and secret redaction. Security controls need tests, monitoring, updates, and incident response throughout the product lifecycle.

## Verification

Run `npm.cmd run test:identity`, `npm.cmd run test:mariadb:foundation`, and `npm.cmd run test:e2e:server`. A live smoke must prove successful super-admin development login, session resolution, and a `401` when that cookie is presented to the regular portal.

## Development records

- [2026-09-10 Session binding repair](../../../../../../assist/records/platform/2026-09-10-identity-session-binding.md)

- [2026-09-09 Identity cross-client security](../../../../../../assist/records/platform/2026-09-09-identity-cross-client-security.md)
- [2026-09-09 Identity portals](../../../../../../assist/records/platform/2026-09-09-identity-portals.md)
