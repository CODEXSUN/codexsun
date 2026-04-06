# Task

## Active Batch

### Reference

`#32`

### Title

`Storefront UX polish, framework mail, and deployment wiring`

### Scope Checklist

- [x] tighten ecommerce storefront desktop and mobile UX including fixed navigation, announcement overflow handling, hero-slider mobile layout, CTA polish, and dock hover behavior
- [x] connect Razorpay storefront checkout metadata and remove the extra test-only payment screen from the shopper flow
- [x] add framework mail surfaces and supporting mailbox persistence wiring inside `cxapp`
- [x] add storefront shipping/admin support surfaces and supporting ecommerce order or service updates
- [x] add container and customer deployment wiring updates under `.container/`
- [x] update ASSIST task tracking, planning, work log, and changelog for the batch

### Validation Note

- [x] `npm.cmd run typecheck`
- [ ] `npm.cmd run build`
- [ ] manual verification of the updated storefront flows and framework mail surfaces
- [ ] full `npm run lint`
- [ ] full `npm run test`
- [ ] full Playwright suite

## Next Batch

### Reference

`#33`

### Title

`Billing voucher operational forms and compliance reports`

### Scope Checklist

- [ ] connect voucher-type masters directly into the voucher entry workflow so operational posting uses the finalized billing master chain
- [ ] extend the new route-based voucher pages so purchase gets the same invoice-style item-table experience now used by sales
- [ ] expand statutory and operational billing reports beyond the current baseline support screens
- [ ] add broader UI and Playwright coverage for popup master CRUD and voucher entry flows
