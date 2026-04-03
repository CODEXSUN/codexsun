# Planning

## Current Batch

### Reference

`#21`

### Goal

Align the core common-module workspace with the billing-style master UX so shared masters open as grouped sidebar lists with popup upsert flows instead of one generic preview screen.

### Scope

- `ASSIST/Execution`
- `ASSIST/Documentation/CHANGELOG.md`
- `apps/api/src/internal`
- `apps/core/src`
- `apps/core/shared`
- `apps/core/web`
- `apps/cxapp/web`
- `apps/ui/src/features/dashboard`
- `ASSIST/Documentation/CHANGELOG.md`
- `tests/core`
- `tests/api/internal`

### Canonical Decisions

- shared masters in `apps/core` should use one generic CRUD path and dynamic UI rendering instead of hardcoding one page per module
- common-module list pages should reuse the shared `CommonList` interaction tone already established in billing
- common-module upsert should stay popup-based for list-first masters rather than introducing standalone routes for every shared registry
- the core sidebar should expose the requested `Common` subgroup layout without moving the actual master ownership out of `apps/core`
- reference-module fields should resolve by lookup in the popup form so dependent masters such as states, cities, pincodes, and warehouses remain editable from one consistent pattern

### Execution Plan

1. add generic common-module create, update, and delete service operations over the physical core master tables
2. expose the new core common-module CRUD routes through the internal API boundary
3. replace the current generic core common-module preview UI with module-specific list pages that render metadata-driven columns and popup forms
4. fetch and resolve reference-module lookups so dependent core masters show labels instead of raw ids and can be edited from the same dialog pattern
5. reorganize the core desk menu into a grouped `Common` branch with requested subgroup lanes such as Location, Product, Contacts, Order, and Others
6. hide the generic workspace hero on list-first common-module pages so the page layout matches the requested billing-style references
7. add shared status dropdown filtering to common and master list screens that already expose active or deleted state
8. run focused typecheck and targeted route/service tests for the new core common-module flow
9. update ASSIST execution tracking and changelog entries for the shipped batch

### Validation Plan

- Run `npx.cmd tsc --noEmit --pretty false`
- Run `npx.cmd tsx --test tests/core/common-module-service.test.ts tests/api/internal/routes.test.ts`
- Verify the core workspace renders common-module list pages and popup upsert flows against the local SQLite-backed runtime
- Run targeted UI validation for nested common-menu navigation and dependent lookup fields

### Validation Status

- [x] `npx.cmd tsc --noEmit --pretty false`
- [x] `npx.cmd tsx --test tests/core/common-module-service.test.ts tests/api/internal/routes.test.ts`
- [ ] runtime verification for nested core common navigation, common-module lists, and popup upsert flows
- [ ] browser-level coverage is still manual for this batch unless targeted selectors are added
- [ ] full `npm run lint`
- [ ] full `npm run test`
- [ ] full `npm run build`

### Risks And Follow-Up

- metadata-driven common-module forms must stay aligned with the physical table definitions, so new columns later need both backend and UI metadata to remain in sync
- dependent reference lookups can become dense for modules like pincodes and warehouses, so follow-up may be needed if operators need cascading filters beyond simple searchable pickers
- full browser automation does not yet cover the new nested sidebar and popup CRUD flow, so regression confidence stays strongest at the targeted service and route level
