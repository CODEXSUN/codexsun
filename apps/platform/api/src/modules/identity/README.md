# Identity API Module

## Purpose

Identity owns authentication, portal-scoped sessions, users, credentials, roles, permissions, and authorization for Platform.

## Identity and version

- Module ID: `identity`
- Kind: `feature`
- Version: `1.3.0`
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

- Public client: [Platform Identity Client](../../../../contracts/README.md), protocol `identity.access-check` 1.0.0.
- `POST /api/identity[/admin|/sa]/authorize` validates one strict `{resource, action}` request against the current portal session.
- The response contains `{allowed, userId, portal}`. The caller cannot select an actor. Invalid sessions return 401; dependency failures never allow access.
- Clients enforce the decision on their own API. Browser decisions alone do not protect product routes. No cross-origin cookie exchange is implemented.
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
- Migration `0004-identity-auth-version` adds an account authentication generation.
- Registration writes every identifier and credential in one transaction. New identifiers remain unverified until a provider confirms them.
- First-device activation and session creation lock the owning user row. Status changes advance the authentication generation; disabling an account permanently revokes existing sessions.
- Seed `0001-default-super-admin` creates the configured super administrator, its role, and wildcard permission.
- Applied checksums are immutable. Add a new ordered migration or seed for every later change.
- Session renewal updates MariaDB and the browser cookie.

## Access rules

- A regular user can use the regular portal and manage only that user's devices.
- An administrator can manage regular users, reset requests, roles, and product permissions.
- An administrator cannot read credentials or manage super administrators.
- Only a super administrator can list all users and read security events.
- Product modules must declare permission names. Identity owns their assignment.
- Product handlers call the public Platform authorization helper before protected work. Platform HTTP maps policy denial to `403 FORBIDDEN`; dependency failures remain safe server errors.

## Security statement

No system can promise that a breach will never occur. This module reduces risk through Argon2 hashes, hashed tokens, device activation, portal isolation, strict input validation, request limits, origin checks, activity records, and secret redaction. Security controls need tests, monitoring, updates, and incident response throughout the product lifecycle.

## Verification

Run `npm.cmd run test:identity`, `npm.cmd run test:identity:mariadb`, `npm.cmd run test:mariadb:foundation`, and `npm.cmd run test:e2e:server`. The Identity database test provisions and removes a PID-scoped disposable database; it never migrates the configured application database. A live smoke must prove successful super-admin development login, session resolution, and a `401` when that cookie is presented to the regular portal.

## Development records

- [2026-09-10 P001 fixture experiment](../../../../../../assist/records/platform/2026-09-10-p001-fixture-experiment.md)

- [2026-09-10 Public client](../../../../../../assist/records/platform/2026-09-10-identity-public-client.md)
- [2026-09-10 Permission HTTP verification](../../../../../../assist/records/platform/2026-09-10-identity-permission-http.md)
- [2026-09-10 Identity concurrency](../../../../../../assist/records/platform/2026-09-10-identity-concurrency.md)
- [2026-09-10 Session binding repair](../../../../../../assist/records/platform/2026-09-10-identity-session-binding.md)

- [2026-09-09 Identity cross-client security](../../../../../../assist/records/platform/2026-09-09-identity-cross-client-security.md)
- [2026-09-09 Identity portals](../../../../../../assist/records/platform/2026-09-09-identity-portals.md)

## Disposable browser fixture foundation

`test-support/p001-browser-fixture.ts` is test-only and is not a public runtime export or HTTP endpoint.
It accepts a caller-owned database, test environment, password, and matching random suffix.
The database name must use `codexsun_p001_identity_fixture_<pid>_<12 lowercase alphanumeric characters>`.
The caller must provision a fresh database with a database-scoped account and exclusive ownership.
The helper checks the actual selected database and rejects every nonempty schema before mutations.
It applies Identity migrations and creates three portal accounts through the Identity repository and Argon2 adapter.
It does not create devices, grant roles, or bypass activation rules.

This bootstrap does not write the production module-runtime migration ledger.
Do not run the normal module-runtime migration coordinator against this fixture afterward.
The future isolated browser harness must disable that coordinator and development login explicitly.
The harness must provision test permissions explicitly when a scenario needs them.
It must also reserve separate API/web ports and remove only its own disposable database after all connections close.
A failed bootstrap can leave partial test data. Never retry it against the same database.
Run `npm.cmd run test:identity` for the fixture safety tests. Live MariaDB/browser acceptance remains pending.
