# Planning

## Current Batch

### Reference

`#96`

### Goal

Complete Stage `6.2.1` through `6.2.4` by syncing fulfilment, invoice, and return/refund ERP transaction state back into ecommerce and adding a replay-ready reconciliation queue.

### Scope

- `ASSIST/Execution/TASK.md`
- `ASSIST/Execution/PLANNING.md`
- `ASSIST/Documentation/ARCHITECTURE.md`
- `ASSIST/Documentation/CHANGELOG.md`
- `ASSIST/Documentation/WORKLOG.md`
- `ASSIST/Planning/plan-9.md`
- `apps/api/src/external/ecommerce-routes.ts`
- `apps/api/src/internal/ecommerce-routes.ts`
- `apps/api/src/external/ecommerce-routes.ts`
- `apps/api/src/internal/ecommerce-routes.ts`
- `apps/api/src/internal/frappe-routes.ts`
- `apps/demo/src/data/demo-seed.ts`
- `apps/ecommerce/shared/schemas/order.ts`
- `apps/ecommerce/src/services/order-service.ts`
- `apps/ecommerce/src/services/storefront-order-storage.ts`
- `apps/frappe/database/table-names.ts`
- `apps/frappe/shared/schemas/frappe.ts`
- `apps/frappe/src/services/transaction-sync-service.ts`
- `tests/frappe/services.test.ts`
- `tests/api/internal/routes.test.ts`

### Canonical Decisions

- delivery-note, invoice, and return/refund sync-back must remain connector-owned inside `apps/frappe`, but ecommerce orders should persist local snapshots of those ERP references and resulting lifecycle state
- replay tools should never invent live ERP reads; they must reapply the latest connector-owned sync record or rerun the existing Sales Order push path where that already exists
- legacy ecommerce orders must continue restoring safely with `null` ERP link fields until backfill or new connector syncs populate them

### Execution Plan

1. extend the storefront order model with delivery-note, invoice, and return/refund ERP link snapshots, then add matching ecommerce helper functions to apply sync-back updates safely
2. add connector-owned inbound sync records for delivery notes, invoices, and returns inside `apps/frappe`, plus routes that update ecommerce orders from those records
3. derive a reconciliation queue across sales-order, delivery-note, invoice, and return/refund states and add replay tools that reapply the latest connector record or rerun Sales Order push where appropriate
4. validate the sync-back and replay path with focused Frappe service tests, then sync the planning and architecture records

### Validation Plan

- run `npm.cmd run typecheck`
- run `npx.cmd tsx --test tests/frappe/services.test.ts tests/api/internal/routes.test.ts`
- note unrelated failure in the broad internal routes suite caused by existing billing year-end controls, not the Frappe transaction-sync work

### Validation Status

- [x] typecheck completed
- [x] transaction sync-back validation completed
- [x] reconciliation queue and replay validation completed
- [x] internal route registration validation completed
- [x] unrelated billing-route failure noted in broad internal route suite
- [x] architecture and planning sync completed

### Risks And Follow-Up

- ecommerce now stores ERP transaction link snapshots for sales orders, delivery notes, invoices, and returns, but there is still no operator-facing workspace UI for the reconciliation queue
- the broad `tests/api/internal/routes.test.ts` suite currently contains an unrelated billing year-end failure (`No billing financial year is available for year-end controls.`), which is outside this ERP mapping batch
- the next scheduled task is `7.1.1`
