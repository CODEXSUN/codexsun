# Planning

## Current Batch

### Reference

`#14`

### Goal

Move `core` and `ecommerce` from seed-file reads to app-owned database migrations and seeders, while keeping migration ownership in the native app folders and the execution workflow inside the reusable framework runtime.

### Scope

- `ASSIST/Execution`
- `ASSIST/Documentation/CHANGELOG.md`
- `apps/framework/src/runtime/database`
- `apps/framework/src/server`
- `apps/cli/src`
- `apps/core/database`
- `apps/core/src`
- `apps/ecommerce/database`
- `apps/ecommerce/src`
- `apps/api/src`
- `tests/framework/runtime`
- `ASSIST/AI_RULES.md`
- `ASSIST/Documentation/ARCHITECTURE.md`
- `ASSIST/Documentation/SETUP_AND_RUN.md`

### Canonical Decisions

- migration and seeder files must stay in `apps/<app>/database/*`, not inside framework or api
- framework should execute app-owned migrations and seeders through one reusable runtime path
- app services should read the seeded database tables rather than bypassing them with in-memory data once the migration path exists
- `core` and `ecommerce` need individual module files so future apps can follow the same pattern without adding monolithic migration bundles
- the first database-backed step should keep table design simple and explicit so the workflow is proven before deeper relational normalization

### Execution Plan

1. add a framework database execution runtime and registry for app-owned migrations and seeders
2. create native `core` migration and seeder files for bootstrap, companies, contacts, and common modules
3. create native `ecommerce` migration and seeder files for pricing settings, products, storefront, orders, and customers
4. wire app database modules into framework startup and CLI commands
5. switch app services and API routes to read from seeded database tables
6. add runtime tests for registry order, execution, and DB-backed service reads
7. update ASSIST docs for the new database workflow
8. validate typecheck, lint, test, and build

### Validation Plan

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run test`
- Run `npm run build`

### Validation Status

- [x] `npm run typecheck`
- [x] `npm run lint` (same existing imported table warnings only)
- [x] `npm run build`
- [ ] `npm run test` (`tests/framework/runtime/config.test.ts` still fails against local `.env` host values)

### Risks And Follow-Up

- the current database layer stores validated module payloads in simple app-owned JSON tables, which is good for baseline adoption but not yet the final relational shape for every domain
- the framework config test is still environment-sensitive and remains the only failing automated test
- create and update flows remain out of scope for this batch because this work focused on read-side migration and seeder infrastructure first
