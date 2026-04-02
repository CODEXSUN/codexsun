# Task

## Active Batch

### Reference

`#20`

### Title

`Billing account master alignment and support docs`

### Scope Checklist

- [x] replace billing ledger groups with reusable billing categories and map ledgers to categories
- [x] add billing voucher-group and voucher-type masters with a strict `category -> ledger -> voucher type` chain and `voucher group -> voucher type` classification
- [x] convert billing category, ledger, voucher-group, voucher-type, and voucher-register screens to popup upsert flows in the shared `CommonList` tone
- [x] align billing side navigation, grouped menus, route titles, and support docs with the UI workspace navigation model
- [x] add lookup-style autocomplete behavior where billing master and voucher forms need record selection
- [x] add a real sales invoice workflow with item-table posting and voucher-type-ledger alignment instead of only the generic voucher dialog
- [x] move sales, purchase, payment, and receipt into route-based master-list and standalone upsert pages instead of popup voucher CRUD
- [x] cover the new billing services and internal routes with targeted tests and verify the updated billing workspace renders without the previous invalid-payload failure

### Validation Note

- [x] `npx.cmd tsc --noEmit --pretty false`
- [x] `npx.cmd tsx --test tests/billing/category-service.test.ts tests/billing/ledger-service.test.ts tests/billing/voucher-master-service.test.ts tests/billing/voucher-service.test.ts tests/billing/reporting-service.test.ts tests/api/internal/routes.test.ts`
- [x] `npx.cmd tsx --test tests/billing/voucher-service.test.ts`
- [x] targeted runtime verification against the local desktop billing database for categories, ledgers, voucher groups, voucher types, vouchers, and reports
- [ ] full `npm run lint`
- [ ] full `npm run test`
- [ ] full `npm run build`

## Next Batch

### Reference

`#21`

### Title

`Billing voucher operational forms and compliance reports`

### Scope Checklist

- [ ] connect voucher-type masters directly into the voucher entry workflow so operational posting uses the finalized billing master chain
- [ ] extend the new route-based voucher pages so purchase gets the same invoice-style item-table experience now used by sales
- [ ] expand statutory and operational billing reports beyond the current baseline support screens
- [ ] add broader UI and Playwright coverage for popup master CRUD and voucher entry flows
