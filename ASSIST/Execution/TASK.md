# Task

## Active Batch

### Reference

`#14`

### Title

`App-owned core and ecommerce database migrations and seeders`

### Scope Checklist

- [x] add a framework-owned migration and seeder execution runtime that consumes app-owned database modules
- [x] create individual `core` migration files and individual `core` seeder files in the native `apps/core/database/*` folders
- [x] create individual `ecommerce` migration files and individual `ecommerce` seeder files in the native `apps/ecommerce/database/*` folders
- [x] connect app-owned migration and seeder indexes to a central framework registry and CLI commands
- [x] switch `core` services and routes from in-memory seed files to seeded database reads
- [x] switch `ecommerce` services and routes from in-memory seed files to seeded database reads
- [x] prepare the registered database modules on framework server startup so runtime reads use migrated and seeded tables
- [x] add database process tests for registry order, migration execution, seeder execution, and service reads
- [x] Update ASSIST task, planning, and changelog entries for this batch

### Validation Note

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm run build`
- [ ] `npm run test` (`tests/framework/runtime/config.test.ts` still fails because local `.env` values override the expected test host)

## Next Batch

### Reference

`#15`

### Title

`Database write flows and config test isolation`

### Scope Checklist

- [ ] add write flows for create and update operations where the current desk is read-only
- [ ] normalize the database payload tables into richer relational structures where the current module snapshots are too coarse
- [ ] isolate framework config tests from local `.env` overrides so validation is stable across machines
