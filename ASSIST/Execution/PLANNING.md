# Planning

## Current Batch

### Reference

`#17`

### Goal

Restore a working local frontend and backend bootstrap by using deterministic SQLite startup, seed the requested first super-admin user, and add auth/database hardening so database failures are clearer and the seeded login path stays covered.

### Scope

- `ASSIST/Execution`
- `ASSIST/Documentation/CHANGELOG.md`
- `ASSIST/Documentation/SETUP_AND_RUN.md`
- `.env`
- `.env.sample`
- `apps/framework/src/runtime/database`
- `apps/core/src`
- `apps/core/database`
- `apps/frappe/src`
- `tests/core`
- `tests/framework/runtime`
- `ASSIST/AI_RULES.md`

### Canonical Decisions

- MariaDB remains the primary live transactional database direction, but the checked-in local development bootstrap should use SQLite when the local machine does not provide MariaDB
- the first seeded auth user should be the requested `Sundar` super-admin account and should remain login-tested through the app-owned auth service
- super-admin resolution should respect both seeded database flags and the configured `SUPER_ADMIN_EMAILS` list
- database clients should fail faster on unreachable network databases instead of hanging during local startup

### Execution Plan

1. switch the checked-in local env bootstrap to SQLite and add super-admin env configuration
2. replace the default seeded admin account with the requested `Sundar` super-admin credentials
3. harden auth super-admin resolution and network database client connection timeouts
4. update regression tests for seeded login, seeded super-admin rows, and normalized super-admin env parsing
5. run database prepare, test, typecheck, and lint validation
6. verify the login API with the seeded credentials
7. update ASSIST docs and changelog

### Validation Plan

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run test`
- Run `npm run db:prepare`
- Verify `/api/v1/auth/login` with the seeded credentials

### Validation Status

- [x] `npm run typecheck`
- [x] `npm run lint` (same existing React Compiler warnings in imported table variants only)
- [x] `npm run test`
- [x] `npm run db:prepare`
- [x] verify `/api/v1/auth/login`

### Risks And Follow-Up

- live MariaDB deployments still need explicit MariaDB configuration; this batch only makes the checked-in local path deterministic and failure behavior clearer
- super-admin escalation through `SUPER_ADMIN_EMAILS` is deployment-controlled, so that list should stay tightly scoped to trusted operators
