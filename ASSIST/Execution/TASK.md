# Task

## Active Batch

### Reference

`#15`

### Title

`App-owned auth, sessions, mailbox, and cxapp auth flows`

### Scope Checklist

- [x] add app-owned `core` auth and mailbox schemas, migrations, and seeders for users, roles, permissions, sessions, OTP verifications, mailbox templates, and message logs
- [x] add reusable framework auth support for JWT signing, password hashing, SMTP delivery, request body parsing, and auth-related config keys without moving business ownership into framework
- [x] add app-owned `core` repositories and services for login, registration OTP, password reset, account recovery, sessions, and mailbox template/message handling
- [x] expose external auth routes and protected internal core mailbox/auth routes through `apps/api`
- [x] connect `cxapp` auth pages and browser session state to the live auth API so login, request-access, forgot-password, and logout flows are end-to-end
- [x] protect internal `core` and `ecommerce` workspace data routes behind bearer-authenticated sessions
- [x] normalize framework env resolution and runtime error handling so auth and config tests are stable across machines
- [x] add auth lifecycle tests that cover seeded login, OTP registration, password reset, recovery, and session revocation
- [x] update ASSIST task, planning, architecture, setup, and changelog entries for this batch

### Validation Note

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm run build`
- [x] `npm run test`

## Next Batch

### Reference

`#16`

### Title

`Domain write flows and auth hardening`

### Scope Checklist

- [ ] add write flows for create and update operations where the current desk is still read-only
- [ ] normalize the current module payload tables into richer relational structures where the baseline schema is still coarse
- [ ] add refresh-token rotation, rate limiting, stronger audit trails, and admin-facing auth management surfaces beyond the current baseline
