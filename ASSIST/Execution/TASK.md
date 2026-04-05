# Task

## Active Batch

### Reference

`#29`

### Title

`Customer portal isolation, storefront persistence, and commerce UX refinement`

### Scope Checklist

- [x] move the customer portal onto canonical `/customer/*` routes and isolate it from admin and desk navigation
- [x] rebuild the customer profile surface into customer-safe contact-style tabs with shared lookup-backed communication, addressing, and finance sections
- [x] create a customer-only sidebar shell and themed overview surfaces without leaking admin modules or app switching controls
- [x] persist storefront wishlist actions into the ecommerce customer-portal store and auto-sync guest wishlist intent after login
- [x] refine storefront and customer portal visuals, wishlist density, and themed overview cards for a cleaner customer-facing experience
- [x] harden legacy customer and storefront hydration so widened customer/contact and product summary schemas do not break existing records
- [x] update ASSIST task tracking, planning, work log, and changelog for the customer-portal and storefront-persistence batch

### Validation Note

- [x] `npm.cmd run typecheck`
- [x] manual verification of customer route and storefront wishlist flow wiring
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
