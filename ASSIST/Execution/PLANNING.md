# Planning

## Current Batch

### Reference

`#28`

### Goal

Add operational product list actions, richer master-data filters, a contained media-browser workflow, and runtime storefront hydration fixes without disturbing current app boundaries or existing editors.

### Scope

- `ASSIST/Documentation/CHANGELOG.md`
- `ASSIST/Documentation/WORKLOG.md`
- `ASSIST/Execution/TASK.md`
- `ASSIST/Execution/PLANNING.md`
- `apps/api/src/internal/core-routes.ts`
- `apps/core/shared/schemas/product.ts`
- `apps/core/src/data/product-seed.ts`
- `apps/core/src/services/product-service.ts`
- `apps/core/web/src/workspace-sections.tsx`
- `apps/cxapp/web/src/features/framework-media/media-browser.tsx`
- `apps/cxapp/web/src/query/runtime-queries.ts`
- `apps/ecommerce/src/services/catalog-service.ts`
- `apps/ui/src/components/blocks/master-list.tsx`
- `apps/ui/src/components/blocks/record-action-menu.tsx`

### Canonical Decisions

- the existing product upsert flow stays intact; bulk merchandising actions must land as separate list-level tooling
- legacy stored product rows must be hydrated forward instead of forcing a destructive data reset when summary schemas grow
- `core` remains the owner of shared product and contact data, so new filters and bulk actions belong in `core` list surfaces and `core` services
- the framework media browser should keep forms visible while large result sets scroll inside a constrained preview area
- runtime and storefront read paths should fail soft on missing optional brand data, but invalid storefront product payloads must be fixed at the service hydration layer

### Execution Plan

1. add shared product bulk-edit and duplicate APIs plus list-level UI entry points
2. extend product, contact, and product-category lists with operational filters and clear/reset affordances
3. refactor the framework media browser into contained animated tabs with preview layout modes
4. patch seed and service hydration so new product summary fields work with both seed data and older persisted rows
5. fix storefront-side core product hydration so public storefront routes stop failing on older product payloads
6. verify the backend host is healthy again after the schema and hydration fixes
7. record the batch in task tracking, planning, work log, and changelog

### Validation Plan

- Run `npm.cmd run typecheck`
- Verify backend `/health` responds after restarting the cxapp server host
- Verify `/public/v1/storefront/home` stops failing on legacy product rows
- Verify the media browser keeps the form visible while large result sets scroll
- Verify product bulk actions and duplicate wiring compile cleanly through the shared list components

### Validation Status

- [x] `npm.cmd run typecheck`
- [x] backend `/health` responded on `127.0.0.1:3001`
- [x] manual storefront payload verification after hydration fixes
- [ ] full `npm run lint`
- [ ] full `npm run test`
- [ ] full `npm run build`
- [ ] full Playwright suite

### Risks And Follow-Up

- bulk product actions now cover the current merchandising flags, but future merchandising fields will still need explicit inclusion in the bulk payload
- the frontend now tolerates missing brand data more safely, but a future pass should still tighten the company-brand backend route and route-level diagnostics
- the storefront still depends on shared `core` product record quality, so future summary schema changes must keep the same forward-hydration discipline
