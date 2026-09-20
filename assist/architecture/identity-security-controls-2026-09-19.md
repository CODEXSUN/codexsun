# Identity Security Controls Decision

## Context

The shared identity system needed login rate limits, password recovery, and
durable audit records. Q Cafe, CRM, and the other installed applications use
separate SQLite databases.

## Decision

Platform Core owns the common identity controls. Each application stores its
own login-limit records, reset-token hashes, audit events, and server sessions
in its own SQLite database.

The login API accepts a username or email. It blocks an identifier and browser
after the configured failed-attempt limit. It returns a generic password-reset
request response so it does not reveal account existence.

The browser uses three portal paths. The server accepts a portal login only
when the verified actor has the matching role. Each portal renders its own
desk and menu.

The reset service stores only a keyed token hash. A successful reset consumes
the token and revokes active server sessions for that user.

Development auto-login is controlled by `AUTO_LOGIN`. `AUTO_LOGIN_DESK` selects
exactly one seeded desk: `user`, `admin`, or `super-admin`. Production disables
auto-login regardless of these variables.

## Alternatives

The applications do not use in-memory rate-limit state. It would reset on a
process restart and would not provide a durable audit trail.

The APIs do not return reset tokens. A production delivery adapter must send
the token through an approved out-of-band channel.

## Consequences

Application identity migrations are recorded in serial order with a SHA-256
checksum for each definition. Development applies missing migrations and
repeat-safe seeds in order. Production startup is read-only: it verifies the
complete recorder history and rejects missing, reordered, or changed records.
An application must run the explicit identity migration command before
production startup after an upgrade.

The audit table does not store passwords, bearer tokens, reset tokens, browser
session IDs, or private storage paths.

## Verification

Platform Core tests verify rate limiting, reset-token hashing, token single
use, session revocation, and audit event creation. API checks verify every
installed identity host compiles the shared route contracts.
