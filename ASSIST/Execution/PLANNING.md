# Planning

## Current Batch

### Reference

`#43`

### Goal

Complete Stage `2.1.1` by replacing the ecommerce admin orders placeholder with a real order queue backed by a typed internal report and a filterable operations surface.

### Scope

- `ASSIST/Execution/TASK.md`
- `ASSIST/Execution/PLANNING.md`
- `apps/ecommerce/shared/schemas/order.ts`
- `apps/ecommerce/src/services/order-service.ts`
- `apps/api/src/internal/ecommerce-routes.ts`
- `apps/ecommerce/web/src/api/storefront-api.ts`
- `apps/ecommerce/web/src/features/storefront-admin/storefront-orders-section.tsx`
- `apps/ecommerce/web/src/workspace-sections.tsx`
- `tests/ecommerce/services.test.ts`
- `tests/api/internal/routes.test.ts`

### Canonical Decisions

- the first admin order queue should expose normalized operational records from ecommerce-owned order data without introducing a separate persistence layer
- queue bucketing should be derived from existing order status, payment status, and fulfilment method so later actions can reuse the same queue model
- the admin surface should follow the same card-and-contained-tabs pattern already used by payments and communications rather than introducing a new workspace layout

### Execution Plan

1. extend the shared ecommerce order contract with admin queue report types
2. derive queue buckets and summary counts from live storefront orders in the order service
3. expose the report through a protected internal ecommerce route and frontend API method
4. replace the placeholder orders workspace page with a searchable, tabbed admin queue
5. add targeted service and route coverage for the new report
6. mark `2.1.1` complete in `TASK.md`

### Validation Plan

- run `npm run typecheck`
- run `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`
- confirm the internal route registry includes the orders report endpoint
- confirm the service report buckets orders correctly before and after payment verification
- confirm `2.1.1` is marked complete in `TASK.md`

### Validation Status

- [x] `npm run typecheck`
- [x] `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`
- [x] internal route registry includes `GET /internal/v1/ecommerce/orders/report`
- [x] service report buckets orders correctly across payment-pending and paid states
- [x] `2.1.1` marked complete in `TASK.md`

### Risks And Follow-Up

- the queue is intentionally read-focused in this batch; record-level actions such as cancel, fulfil, tracking assignment, and resend stay for `2.1.2`
- if order volume grows, the current report should evolve into server-side filtering and pagination rather than loading every order into the admin client
