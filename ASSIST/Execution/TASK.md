# Task

## Active Batch

### Reference

`#28`

### Title

`Core product operations, media tabs, and storefront runtime stabilization`

### Scope Checklist

- [x] add product bulk-edit actions for merchandising fields without disturbing the existing single-product editor
- [x] add product duplicate support that creates editable copy records with safe `-copy` naming
- [x] extend product, contact, and product-category list filtering with operational filters for merchandising and data completeness
- [x] refactor the framework media browser into animated tabs with contained preview layouts and better small-screen behavior
- [x] fix legacy product summary hydration so new `attributeCount` and `totalStockQuantity` fields do not break older stored records
- [x] stabilize runtime storefront and branding reads by fixing startup crashes and storefront payload hydration gaps
- [x] update ASSIST task tracking, planning, work log, and changelog for the product-ops and runtime-stability batch

### Validation Note

- [x] `npm.cmd run typecheck`
- [x] backend `/health` check on `127.0.0.1:3001`
- [x] manual storefront payload verification after legacy hydration fixes
- [ ] full `npm run lint`
- [ ] full `npm run test`
- [ ] full `npm run build`
- [ ] full Playwright suite

## Next Batch

### Reference

`#29`

### Title

`Billing voucher operational forms and compliance reports`

### Scope Checklist

- [ ] connect voucher-type masters directly into the voucher entry workflow so operational posting uses the finalized billing master chain
- [ ] extend the new route-based voucher pages so purchase gets the same invoice-style item-table experience now used by sales
- [ ] expand statutory and operational billing reports beyond the current baseline support screens
- [ ] add broader UI and Playwright coverage for popup master CRUD and voucher entry flows
