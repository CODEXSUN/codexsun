# Planning

## Current Batch

### Reference

`#44`

### Goal

Complete Stage `2.1.2` by adding actionable admin order detail operations for cancel, fulfilment progression, tracking assignment, delivery completion, and order-confirmation resend.

### Scope

- `ASSIST/Execution/TASK.md`
- `ASSIST/Execution/PLANNING.md`
- `apps/ecommerce/shared/schemas/order.ts`
- `apps/ecommerce/src/services/order-service.ts`
- `apps/ecommerce/src/services/storefront-order-storage.ts`
- `apps/api/src/internal/ecommerce-routes.ts`
- `apps/ecommerce/web/src/api/storefront-api.ts`
- `apps/ecommerce/web/src/features/storefront-admin/storefront-orders-section.tsx`
- `apps/demo/src/data/demo-seed.ts`
- `tests/ecommerce/services.test.ts`
- `tests/api/internal/routes.test.ts`

### Canonical Decisions

- admin actions should reuse the existing order state machine rather than bypassing it with direct status writes
- shipment metadata must be stored on the order record itself so tracking and delivery state survive queue refresh, portal reads, and later reporting work
- the admin UI should operate inside the existing orders queue via a detail dialog instead of splitting actions across a second unrelated page

### Execution Plan

1. extend the shared order contract with shipment details and typed admin action payloads
2. add backward-compatible shipment normalization for existing stored orders
3. expose internal admin order detail and action handlers through ecommerce routes and frontend API methods
4. upgrade the orders admin queue with a detail dialog and action controls for cancel, fulfilment, shipment, delivery, and resend
5. add targeted service and route coverage for the new admin order operations
6. mark `2.1.2` complete in `TASK.md`

### Validation Plan

- run `npm run typecheck`
- run `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`
- confirm the internal route registry includes the admin order detail and order action endpoints
- confirm service coverage exercises fulfilment, shipment, delivery, and admin order detail reads
- confirm `2.1.2` is marked complete in `TASK.md`

### Validation Status

- [x] `npm run typecheck`
- [x] `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`
- [x] internal route registry includes `GET /internal/v1/ecommerce/order` and `POST /internal/v1/ecommerce/order/action`
- [x] service coverage exercises fulfilment, shipment, delivery, and admin order detail reads
- [x] `2.1.2` marked complete in `TASK.md`

### Risks And Follow-Up

- admin actions are in place, but payment-exception triage still lives primarily in the payments screen; `2.1.3` should bind that queue more tightly to the order-operations workflow
- if order volume grows, the current queue and detail loading should evolve into server-side filtering and pagination rather than full client-side filtering
