# Planning

## Current Batch

### Reference

`#21`

### Goal

Align the core master workspace with the billing-style master UX, then extend the primary company profile into the shared shell and public branding surfaces.

### Scope

- `ASSIST/Execution`
- `ASSIST/Documentation/CHANGELOG.md`
- `apps/api/src/internal`
- `apps/core/src`
- `apps/core/shared`
- `apps/core/web`
- `apps/cxapp/web`
- `apps/ecommerce/web`
- `apps/framework/src/runtime/http`
- `apps/ui/src/components/ux`
- `apps/ui/src/features/branding`
- `apps/ui/src/features/dashboard`
- `apps/ui/src/registry`
- `ASSIST/Documentation/CHANGELOG.md`
- `tests/core`
- `tests/api/internal`

### Canonical Decisions

- shared masters in `apps/core` should use one generic CRUD path and dynamic UI rendering instead of hardcoding one page per module
- common-module list pages should reuse the shared `CommonList` interaction tone already established in billing
- common-module upsert should stay popup-based for list-first masters rather than introducing standalone routes for every shared registry
- the core sidebar should expose the requested `Common` subgroup layout without moving the actual master ownership out of `apps/core`
- reference-module fields should resolve by lookup in the popup form so dependent masters such as states, cities, pincodes, and warehouses remain editable from one consistent pattern
- one primary company record should act as the runtime brand source for shared shell and public-facing chrome
- company brand content should stay company-owned in `apps/core` and only be projected into shell or public UI through narrow shared consumers

### Execution Plan

1. add generic common-module create, update, and delete service operations over the physical core master tables
2. expose the new core common-module CRUD routes through the internal API boundary
3. replace the current generic core common-module preview UI with module-specific list pages that render metadata-driven columns and popup forms
4. fetch and resolve reference-module lookups so dependent core masters show labels instead of raw ids and can be edited from the same dialog pattern
5. reorganize the core desk menu into a grouped `Common` branch with requested subgroup lanes such as Location, Product, Contacts, Order, and Others
6. align contact and company list, show, and upsert flows to the same shared master tone, including row action menus and show-page actions
7. register the missing shared lookup, row-action menu, and master-list examples in the UI docs and registry
8. add primary-company brand fields and project the selected company into dashboard and public shell surfaces
9. run focused typecheck and targeted route or service tests for the changed core flows
10. update ASSIST execution tracking and changelog entries for the shipped batch

### Validation Plan

- Run `npx.cmd tsc --noEmit --pretty false`
- Run `npx.cmd tsx --test tests/core/common-module-service.test.ts tests/api/internal/routes.test.ts`
- Run `npx.cmd tsx --test tests/core/contact-service.test.ts tests/api/internal/routes.test.ts`
- Verify the core workspace renders common-module list pages and popup upsert flows against the local SQLite-backed runtime
- Run targeted UI validation for nested common-menu navigation, dependent lookup fields, and primary-company branding propagation

### Validation Status

- [x] `npx.cmd tsc --noEmit --pretty false`
- [x] `npx.cmd tsx --test tests/core/common-module-service.test.ts tests/api/internal/routes.test.ts`
- [x] `npx.cmd tsx --test tests/core/contact-service.test.ts tests/api/internal/routes.test.ts`
- [ ] runtime verification for nested core common navigation, common-module lists, and popup upsert flows
- [ ] browser-level coverage is still manual for this batch unless targeted selectors are added
- [ ] full `npm run lint`
- [ ] full `npm run test`
- [ ] full `npm run build`

### Risks And Follow-Up

- metadata-driven common-module forms must stay aligned with the physical table definitions, so new columns later need both backend and UI metadata to remain in sync
- dependent reference lookups can become dense for modules like pincodes and warehouses, so follow-up may be needed if operators need cascading filters beyond simple searchable pickers
- full browser automation does not yet cover the new nested sidebar, popup CRUD flow, and company-brand propagation path, so regression confidence stays strongest at the targeted service and route level
