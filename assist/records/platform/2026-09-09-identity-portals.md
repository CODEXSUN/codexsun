# Identity Portals

Date: 2026-09-09

Repository version: `0.1.9`

Identity module version: `1.0.0`

## Outcome

Platform now provides separate regular, administrator, and super-administrator authentication boundaries. The API owns portal sessions and authorization. The web module owns the three route sets. The shared UI package owns presentation blocks only.

## Route binding

| Portal              | Desk     | Login          | API prefix            | Cookie                           |
| ------------------- | -------- | -------------- | --------------------- | -------------------------------- |
| Regular             | `/`      | `/login`       | `/api/identity`       | `codexsun_regular_session`       |
| Administrator       | `/admin` | `/admin/login` | `/api/identity/admin` | `codexsun_administrator_session` |
| Super administrator | `/sa`    | `/sa/login`    | `/api/identity/sa`    | `codexsun_super_admin_session`   |

`/admin/login` is the only administrator sign-in route.

## Module boundary

Identity is a versioned leaf module. Its presentation layer calls its application service. The application layer depends on domain ports. Infrastructure implements those ports with Kysely, MariaDB, and Argon2.

The Platform composition root registers only the module factory, actor resolver, and authorizer. Other modules do not import Identity infrastructure or write its tables.

## Database changes

Migration `0001-identity-schema` creates seven Identity-owned tables for users, credentials, sessions, roles, permissions, and their assignments. Seed `0001-default-super-admin` creates one configured super administrator with the wildcard permission.

The migration and seed declarations have immutable checksums. Startup applies queued declarations before activation and verifies the Identity schema fingerprint. Future changes require a new ordered declaration.

Passwords use Argon2. Session tokens are random and only SHA-256 token hashes are stored. Cookies are HTTP-only, same-site, secure in production, and restricted to their API portal path. Session reads renew a near-expiry session inside the configured renewal window.

## Environment decisions

New code uses the canonical `IDENTITY_*` group. The environment loader keeps explicit compatibility aliases for copied `SUPER_ADMIN_*`, `AUTH_SESSION_*`, and `DEV_AUTO_TENANT_LOGIN` values. Process values still override the root file.

Development login requires both `APP_ENV=development` and `IDENTITY_DEV_LOGIN_ENABLED=true`. Production rejects the default super-admin password and passwords shorter than 12 characters. Regular registration can be disabled without exposing a dead registration link.

Copied CXApp settings that this repository does not own remain labeled as legacy source variables. They are not parsed into Platform runtime configuration.

## UI composition

The UI package provides separate client, administrator, and super-administrator login and recovery entry components. It also provides regular registration and three isolated portal placeholders. These blocks contain no API or authorization behavior.

The Platform web Identity module owns React Query mutations, session queries, route registration, and redirect behavior. The API remains the access authority.

## Deferred behavior

The password-forgot endpoint returns the same accepted response for every email. Reset-token persistence, mail delivery, and password replacement are deferred until Identity receives an owned mail adapter and a new migration. The current endpoint does not claim to send a message.

## Verification

- `npm.cmd run test:identity` passed registration, duplicate detection, portal isolation, and expired-session tests.
- Platform API and web workspace typechecks passed during implementation.
- Live MariaDB startup reported no queued declarations after the first Identity migration and seed were applied.
- Live super-admin development login and session resolution passed.
- The same super-admin cookie returned `401` from the regular session endpoint.
- Browser checks showed isolated client, administrator, and super-administrator sign-in pages. Development sign-in opened the Super Admin desk.
- `npm.cmd run test:mariadb:foundation`, Platform API build, Platform web build, and `git diff --check` passed.
- Platform lifecycle E2E passed after its composition assertions were updated for Identity.
- The repository-wide check remains blocked outside Identity because concurrent Zetro persistence tests still call pre-refactor repository constructors.
