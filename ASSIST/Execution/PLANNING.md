# Planning

## Current Batch

### Reference

`#19`

### Goal

Replace the legacy JSON-store common-module persistence with physical shared master tables copied from the temp source so the real project owns explicit common-table migrations, seeders, and service reads.

### Scope

- `ASSIST/Execution`
- `ASSIST/Documentation/CHANGELOG.md`
- `apps/framework/src/runtime/database`
- `apps/core/src`
- `apps/core/database`
- `tests/framework/runtime`

### Canonical Decisions

- the temp copy is the source for the 25 physical common tables and their metadata shape
- the real project should add a new migration and seeder pair instead of mutating already-applied process IDs in place
- common-module metadata should come from source-controlled definitions, while record rows should come from the new physical tables
- legacy JSON-store common-module tables can remain in place for compatibility, but active reads should switch to the physical tables

### Execution Plan

1. add the temp-derived common table name registry and shared common-module definitions
2. add a new `core` migration to create one physical table per common module
3. add a new `core` seeder to populate those tables with the shared sample records
4. switch the common-module service to source-controlled metadata plus physical-table reads
5. update runtime tests to cover the new migration and seeded table presence
6. run typecheck, lint, test, and database prepare, then record unrelated existing lint failures
7. update ASSIST docs and changelog

### Validation Plan

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run test`
- Run `npm run db:prepare`

### Validation Status

- [x] `npm run typecheck`
- [ ] `npm run lint` (fails on existing `apps/ui` registry/doc files already carrying unrelated issues)
- [x] `npm run test`
- [x] `npm run db:prepare`

### Risks And Follow-Up

- existing databases that already applied the old JSON-store common-module migration will retain those legacy tables until a later cleanup batch removes them
- the current contacts and companies still reference common master IDs semantically rather than through database-enforced foreign keys
