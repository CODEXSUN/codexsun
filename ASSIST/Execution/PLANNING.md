# Planning

## Current Batch

### Reference

`#36`

### Goal

Advance ecommerce checkout reliability through pickup support and complete Phase 1 Stage 1.2.3 with live payment-dismiss, failure, and retry coverage.

### Scope

- `ASSIST/Execution/TASK.md`
- `ASSIST/Execution/PLANNING.md`
- `ASSIST/Documentation/CHANGELOG.md`
- `ASSIST/Documentation/WORKLOG.md`
- `apps/ecommerce/shared/schemas/catalog.ts`
- `apps/ecommerce/shared/schemas/order.ts`
- `apps/ecommerce/shared/workspace-items.ts`
- `apps/ecommerce/src/data/storefront-seed.ts`
- `apps/ecommerce/src/services/customer-service.ts`
- `apps/ecommerce/src/services/order-service.ts`
- `apps/ecommerce/src/services/storefront-order-storage.ts`
- `apps/ecommerce/src/services/storefront-settings-service.ts`
- `apps/ecommerce/web/src/api/storefront-api.ts`
- `apps/ecommerce/web/src/components/storefront-order-detail-card.tsx`
- `apps/ecommerce/web/src/features/storefront-admin/storefront-pickup-section.tsx`
- `apps/ecommerce/web/src/pages/storefront-cart-page.tsx`
- `apps/ecommerce/web/src/pages/storefront-checkout-page.tsx`
- `apps/ecommerce/web/src/workspace-sections.tsx`
- `apps/api/src/external/ecommerce-routes.ts`
- `apps/api/src/internal/ecommerce-routes.ts`
- `apps/cxapp/web/src/desk/desk-registry.ts`
- `apps/demo/src/data/demo-seed.ts`
- `tests/e2e/storefront-cart-auth.spec.ts`
- `tests/e2e/storefront-checkout.spec.ts`

### Canonical Decisions

- checkout payment recovery should reuse one pending live payment session when the checkout inputs have not changed, instead of creating duplicate pending orders
- live Razorpay dismiss and verify-failure flows need explicit storefront recovery UI and deterministic e2e coverage
- store pickup stays storefront-owned in `ecommerce` with its own settings surface, order contract fields, and pickup-aware checkout or order-detail rendering

### Execution Plan

1. finish the shared guest and authenticated checkout lookup/address flow and pickup support already in progress
2. add a standalone storefront pickup designer with side-menu wiring
3. make live checkout preserve a retryable payment session across modal dismiss or verify failure
4. add e2e coverage for dismiss, retry, and verify-failure recovery using deterministic Razorpay stubs
5. mark the completed Stage 1.2 tasks in `TASK.md`
6. update planning, work log, and changelog for the batch

### Validation Plan

- run `npm run typecheck`
- run `npm run test:e2e -- tests/e2e/storefront-checkout.spec.ts`
- confirm `TASK.md` marks `1.2.2` and `1.2.3` complete

### Validation Status

- [x] `npm run typecheck`
- [x] `npm run test:e2e -- tests/e2e/storefront-checkout.spec.ts`
- [x] `1.2.2` and `1.2.3` marked complete in `TASK.md`

### Risks And Follow-Up

- order confirmation email still logs a missing mailbox template `storefront_order_confirmed`, which remains a Stage `1.3.1` blocker
- Stage `1.2.4` still needs broader order-confirmation and tracking coverage beyond the focused checkout spec
