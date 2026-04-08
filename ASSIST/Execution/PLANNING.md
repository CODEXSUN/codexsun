# Planning

## Current Batch

### Reference

`#97`

### Goal

Complete Stage `7.1.1` through `7.1.4` by adding advanced-commerce recommendation, segmentation, lifecycle-marketing, and merchandising-experiment readiness inside the ecommerce boundary.

### Scope

- `ASSIST/Execution/TASK.md`
- `ASSIST/Execution/PLANNING.md`
- `ASSIST/Documentation/ARCHITECTURE.md`
- `ASSIST/Documentation/CHANGELOG.md`
- `ASSIST/Documentation/WORKLOG.md`
- `ASSIST/Planning/plan-9.md`
- `apps/api/src/internal/ecommerce-routes.ts`
- `apps/demo/src/data/demo-seed.ts`
- `apps/ecommerce/shared/schemas/catalog.ts`
- `apps/ecommerce/shared/schemas/customer.ts`
- `apps/ecommerce/shared/schemas/order.ts`
- `apps/ecommerce/src/services/catalog-service.ts`
- `apps/ecommerce/src/services/customer-service.ts`
- `apps/ecommerce/src/services/order-service.ts`
- `apps/ecommerce/src/services/storefront-order-storage.ts`
- `tests/ecommerce/services.test.ts`
- `tests/api/internal/routes.test.ts`

### Canonical Decisions

- advanced-commerce logic stays ecommerce-owned and deterministic from persisted local state; storefront runtime still must not depend on live ERP or live external marketing systems
- recommendation and search-ranking improvements may use projected catalog data, order history, and merchandising flags, but should remain explainable and bounded rather than opaque scoring
- segmented pricing must remain explicit on the order as a local applied-promotion snapshot so checkout totals stay auditable beside existing coupon handling
- lifecycle marketing and merchandising experimentation support can start as operator-facing derived reports and deterministic automation cues before a full campaign-execution platform exists

### Execution Plan

1. extend shared ecommerce schemas with recommendation, commercial-profile, lifecycle-marketing, merchandising-report, and applied-promotion contracts
2. improve storefront catalog ranking and product recommendations, then add internal recommendation and merchandising report routes
3. derive customer commercial profiles and lifecycle-marketing state from local portal and order data, and apply segment pricing during authenticated checkout
4. validate the new advanced-commerce behavior with ecommerce service coverage plus internal route-registration coverage, then sync architecture and planning docs

### Validation Plan

- run `npm.cmd run typecheck`
- run `npx.cmd tsx --test tests/ecommerce/services.test.ts`
- run `npx.cmd tsx --test --test-name-pattern "internal route registry includes" tests/api/internal/routes.test.ts`
- note the existing unrelated broad billing-route failure if the full internal-route suite is run again

### Validation Status

- [x] typecheck completed
- [x] ecommerce advanced-commerce service validation completed
- [x] internal route registration validation completed
- [x] unrelated broad billing-route failure remains isolated outside this batch
- [x] architecture and planning sync completed

### Risks And Follow-Up

- segment pricing is intentionally deterministic and local-rule based today; it is not yet ERP price-list selection or a full entitlement engine
- lifecycle marketing support currently derives next-campaign and automation cues from local portal state, but it does not yet execute outbound journeys automatically beyond the already-existing welcome and subscription emails
- merchandising experimentation support is operator-facing readiness and hypothesis reporting only; full experiment allocation and statistical outcome tracking remain a later stage
- the next scheduled task is `7.2.1`
