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

## Alternatives

The applications do not use in-memory rate-limit state. It would reset on a
process restart and would not provide a durable audit trail.

The APIs do not return reset tokens. A production delivery adapter must send
the token through an approved out-of-band channel.

## Consequences

Identity migration `identity.003` adds three application-local tables. An
application must run the identity migration before production startup.

The audit table does not store passwords, bearer tokens, reset tokens, browser
session IDs, or private storage paths.

## Verification

Platform Core tests verify rate limiting, reset-token hashing, token single
use, session revocation, and audit event creation. API checks verify every
installed identity host compiles the shared route contracts.
