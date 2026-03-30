# Task

## Active Batch

### Reference

`#17`

### Title

`Local database bootstrap and auth hardening`

### Scope Checklist

- [x] switch the checked-in local runtime bootstrap from unavailable MariaDB to local SQLite so backend startup and frontend auth work deterministically
- [x] seed the requested first auth user as `Sundar <sundar@sundar.com>` with password `Kalarani1@@` and super-admin access
- [x] harden auth super-admin resolution and database client connection timeouts for clearer local failures
- [x] add regression coverage for seeded super-admin bootstrap and normalized super-admin env parsing
- [x] update ASSIST task, planning, setup, and changelog entries for this batch

### Validation Note

- [x] `npm run typecheck`
- [x] `npm run lint` (same existing React Compiler warnings in imported table variants only)
- [x] `npm run test`
- [x] `npm run db:prepare`
- [x] verify seeded login through `/api/v1/auth/login`

## Next Batch

### Reference

`#18`

### Title

`Remaining domain write flows`

### Scope Checklist

- [ ] add write flows for create and update operations where the current desk is still read-only
- [ ] normalize the current module payload tables into richer relational structures where the baseline schema is still coarse
- [ ] add refresh-token rotation, rate limiting, stronger audit trails, and admin-facing auth management surfaces beyond the current baseline
