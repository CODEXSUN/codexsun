# Task

## Active Batch

### Reference

`#33`

### Title

`Storefront content expansion, billing grid updates, and ecommerce go-live planning`

### Scope Checklist

- [x] add and refine the current ecommerce storefront content blocks, designers, footer and floating-contact controls, campaign and branding sections, and supporting shared UI surfaces
- [x] tighten storefront shell loading behavior and update ecommerce e2e coverage around checkout and order flow
- [x] convert billing voucher item entry toward the shared inline editable grid model and related operational table refinements
- [x] review the current ecommerce storefront, customer portal, admin surfaces, payment path, and connector boundaries against go-live readiness
- [x] define repo-specific production standards across storefront, backend commerce operations, user management, customer/admin portals, payments, security, and observability
- [x] map ERPNext or Frappe support responsibilities and phased integration ownership without breaking the existing app boundaries
- [x] create the new `ASSIST/Planning/plan-9.md` execution blueprint for the next ecommerce release wave
- [x] update ASSIST task tracking, planning, work log, and changelog for the batch

### Validation Note

- [x] `npm.cmd run typecheck`
- [ ] `npm.cmd run build`
- [ ] full storefront e2e stability verified
- [ ] full `npm run lint`
- [ ] full `npm run test`
- [ ] full Playwright suite

## Next Batch

### Reference

`#34`

### Title

`Billing voucher operational forms and compliance reports`

### Scope Checklist

- [ ] connect voucher-type masters directly into the voucher entry workflow so operational posting uses the finalized billing master chain
- [ ] extend the new route-based voucher pages so purchase gets the same invoice-style item-table experience now used by sales
- [ ] expand statutory and operational billing reports beyond the current baseline support screens
- [ ] add broader UI and Playwright coverage for popup master CRUD and voucher entry flows
