# Planning

## Current Batch

### Reference

`#70`

### Goal

Complete Stage `3.3.4` by verifying invoice and tax reporting compatibility between storefront orders and the current billing workflow.

### Scope

- `ASSIST/Execution/TASK.md`
- `ASSIST/Execution/PLANNING.md`
- `ASSIST/Documentation/ARCHITECTURE.md`
- `ASSIST/Documentation/CHANGELOG.md`
- `ASSIST/Documentation/WORKLOG.md`
- `ASSIST/Planning/plan-9.md`
- `apps/api/src/internal/ecommerce-routes.ts`
- `apps/ecommerce/shared/schemas/order.ts`
- `apps/ecommerce/src/services/order-service.ts`
- `apps/ecommerce/web/src/api/storefront-api.ts`
- `apps/ecommerce/web/src/features/storefront-admin/storefront-payments-section.tsx`
- `tests/ecommerce/services.test.ts`
- `tests/api/internal/routes.test.ts`

### Canonical Decisions

- storefront GST review remains an order-time snapshot, but `3.3.4` must verify whether that snapshot can be consumed by the current billing workflow without silent tax distortion
- current billing sales invoice posting supports one GST rate per voucher plus one taxable amount, so storefront mixed-rate orders are not directly auto-compatible and must be flagged for manual review
- refunded storefront orders remain accounting-sensitive and require billing-side credit-note treatment instead of treating the storefront refund record as the final accounting document
- shipping and handling charge tax treatment is still not explicitly modeled in the storefront-to-billing bridge, so orders carrying those charges must surface as manual-review items
- verification should be operator-visible in the existing ecommerce payments workspace, not hidden only in architecture notes

### Execution Plan

1. add a typed ecommerce accounting-compatibility report contract for invoice and GST review status
2. derive per-order compatibility state from lifecycle, GST snapshot presence, mixed-rate detection, refund state, and unmapped shipping or handling tax treatment
3. expose the report through an internal ecommerce route and the existing admin payments workspace
4. record the billing-compatibility boundary in architecture and planning docs

### Validation Plan

- run typecheck across the shared contract, order reporting service, internal route, and admin payments screen
- run ecommerce and internal route tests covering accounting-compatibility report generation and route registration
- confirm paid orders with shipping or handling charges are surfaced as manual-review accounting cases under the current billing model

### Validation Status

- [x] typecheck completed
- [x] ecommerce and internal route tests completed
- [x] accounting-compatibility report and admin payments surface validated

### Risks And Follow-Up

- the current billing workflow still requires manual operator action; this batch verifies compatibility but does not create billing vouchers from ecommerce automatically
- mixed-rate storefront orders remain a known limitation until billing supports multi-rate invoice posting or a split-document bridge is introduced
- explicit shipping and handling tax allocation is still deferred beyond this verification baseline
