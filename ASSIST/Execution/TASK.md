# Task

## Active Batch

### Reference

`#19`

### Title

`Physical common module tables`

### Scope Checklist

- [x] copy the temp common-module table inventory into the real `core` app database contract
- [x] add an app-owned migration that creates physical common tables without bypassing the framework database runtime
- [x] add an app-owned seeder that populates the physical common tables with the shared sample records
- [x] switch the core common-module service from the legacy JSON-store tables to the physical common tables
- [x] run validation for typecheck, test, and database prepare
- [x] record the existing unrelated lint failures in `apps/ui`

### Validation Note

- [x] `npm run typecheck`
- [ ] `npm run lint` (fails on existing `apps/ui` registry and docs issues unrelated to this batch)
- [x] `npm run test`
- [x] `npm run db:prepare`

## Next Batch

### Reference

`#20`

### Title

`Remaining domain write flows`

### Scope Checklist

- [ ] add write flows for create and update operations where the current desk is still read-only
- [ ] normalize the current module payload tables into richer relational structures where the baseline schema is still coarse
- [ ] add refresh-token rotation, rate limiting, stronger audit trails, and admin-facing auth management surfaces beyond the current baseline
