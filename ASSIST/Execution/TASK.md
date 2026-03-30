# Task

## Active Batch

### Reference

`#13`

### Title

`Core backend wiring and ecommerce go-live seed baseline`

### Scope Checklist

- [x] Audit `temp/core` and `temp/ecommerce` against the current `apps/core` and `apps/ecommerce` boundaries
- [x] Move the first shared-contract slice from `temp/core` into `apps/core/shared`
- [x] Add native route context support so API handlers can read request data and runtime resources
- [x] Adapt imported core workspace sections to the current `/dashboard/apps/core/*` routing structure
- [x] Wire core app-owned sections into the `cxapp` desk with backend-fed section views
- [x] Move the ecommerce shared-contract slice into `apps/ecommerce/shared`
- [x] Wire ecommerce backend services and routes through the current framework and api boundaries
- [x] Adapt ecommerce workspace sections to the current `/dashboard/apps/ecommerce/*` routing structure
- [x] Surface live catalog, storefront, order, customer, and pricing sections inside the shared desk
- [x] Update ASSIST task, planning, and changelog entries for this batch

### Validation Note

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm run build`
- [ ] `npm run test` (`tests/framework/runtime/config.test.ts` still fails because local `.env` values override the expected test host)

## Next Batch

### Reference

`#14`

### Title

`Database-backed core and ecommerce migration follow-up`

### Scope Checklist

- [ ] replace seed-backed core repositories with app-owned database-backed repositories and migrations
- [ ] replace seed-backed ecommerce repositories with app-owned database-backed repositories and migrations
- [ ] add write flows for create and update operations where the current desk is read-only
- [ ] isolate framework config tests from local `.env` overrides so validation is stable across machines
