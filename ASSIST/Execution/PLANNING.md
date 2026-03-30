# Planning

## Current Batch

### Reference

`#15`

### Goal

Add an app-owned auth baseline that uses `core` for auth and mailbox data ownership, `api` for route exposure, `cxapp` for the routed auth frontend, and `framework` only for reusable runtime primitives such as config, hashing, JWT, SMTP, and request parsing.

### Scope

- `ASSIST/Execution`
- `ASSIST/Documentation/CHANGELOG.md`
- `ASSIST/Documentation/ARCHITECTURE.md`
- `ASSIST/Documentation/SETUP_AND_RUN.md`
- `apps/framework/src/runtime/config`
- `apps/framework/src/runtime/errors`
- `apps/framework/src/runtime/http`
- `apps/framework/src/runtime/notifications`
- `apps/framework/src/runtime/security`
- `apps/framework/src/server`
- `apps/core/shared`
- `apps/core/database`
- `apps/core/src`
- `apps/api/src`
- `apps/cxapp/web/src`
- `apps/ecommerce/web/src`
- `tests/core`
- `tests/framework/runtime`
- `ASSIST/AI_RULES.md`

### Canonical Decisions

- auth users, sessions, OTP records, mailbox templates, and message logs belong to `apps/core`, not `apps/framework`
- framework may provide reusable auth/runtime primitives, but it must not own auth business rules or auth persistence
- `apps/api` should stay route-only, with external auth flows and internal admin flows separated into their existing route partitions
- `apps/cxapp` should call the live auth API and own browser session persistence instead of simulating auth locally
- the first auth baseline should be database-backed, session-backed, and test-covered, but still documented honestly as a baseline rather than a production-hardened identity platform

### Execution Plan

1. extend framework config and HTTP runtime so JSON auth routes, runtime config access, hashing, JWT, and SMTP are available through one reusable path
2. add app-owned `core` schemas, migrations, and seeders for auth, sessions, OTP verification, and mailbox storage
3. implement `core` repositories and services for auth/session/mailbox logic
4. expose external auth routes and protected internal mailbox/auth routes through `apps/api`
5. replace `cxapp` placeholder auth flow with live API-backed session restore, login, registration OTP, password reset, and account recovery
6. protect internal `core` and `ecommerce` workspace fetches with the new bearer session flow
7. add auth lifecycle tests and confirm the framework config test now behaves consistently across machines
8. update ASSIST docs and validate typecheck, lint, test, and build

### Validation Plan

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run test`
- Run `npm run build`

### Validation Status

- [x] `npm run typecheck`
- [x] `npm run lint` (same existing imported table warnings only)
- [x] `npm run test`
- [x] `npm run build`

### Risks And Follow-Up

- the current auth baseline uses access tokens backed by DB sessions, but it does not yet include refresh tokens, rate limiting, MFA, or deep audit workflows
- mailbox admin behavior is exposed through API routes and storage, but the richer operator-facing management UI is still future work
- some domain modules remain read-oriented; this batch focused on auth/session/mailbox foundation and live frontend adoption, not every downstream write workflow
