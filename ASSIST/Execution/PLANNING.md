# Planning

## Current Batch

### Reference

`#69`

### Goal

Complete Stage `3.3.3` by adding a GST or tax-breakdown review snapshot for each storefront order.

### Scope

- `ASSIST/Execution/TASK.md`
- `ASSIST/Execution/PLANNING.md`
- `ASSIST/Documentation/ARCHITECTURE.md`
- `ASSIST/Documentation/CHANGELOG.md`
- `ASSIST/Documentation/WORKLOG.md`
- `ASSIST/Planning/plan-9.md`
- `apps/ecommerce/shared/schemas/order.ts`
- `apps/ecommerce/src/services/storefront-order-storage.ts`
- `apps/ecommerce/src/services/order-service.ts`
- `apps/demo/src/data/demo-seed.ts`
- `tests/ecommerce/services.test.ts`

### Canonical Decisions

- storefront order tax review is computed inside `apps/ecommerce` at order creation time and snapshotted onto the order so later master-data edits do not rewrite historical review output
- tax classification currently reads the product `taxId` contract from `apps/core` common-module tax master data, with a compatibility bridge for the existing seeded `tax:gst-standard` alias
- the current review treats storefront item totals as tax-inclusive values and derives taxable value plus GST components for operational review and receipt output
- GST regime is selected by comparing the configured seller state with the billing-address state, splitting into `cgst + sgst` for intra-state and `igst` for inter-state review
- shipping and handling charges remain outside explicit GST charge allocation in this batch until accounting workflow rules define authoritative tax treatment for those charges

### Execution Plan

1. extend the storefront order contract and storage normalization with a persisted tax-breakdown snapshot
2. derive GST review data from checkout items, product tax ids, and seller versus customer state comparison during order creation
3. expose the tax review in generated customer receipt output for operations and customer self-service review
4. record the GST snapshot boundary and remaining accounting-compatibility follow-up in planning docs

### Validation Plan

- run typecheck across the updated shared-schema, order-service, storage, demo seed, and receipt code paths
- run ecommerce and internal route tests covering checkout order creation, receipt generation, and legacy-order hydration compatibility
- confirm created orders and receipt output carry the expected GST regime and tax-component breakdown

### Validation Status

- [x] typecheck completed
- [x] ecommerce and internal route tests completed
- [x] GST breakdown snapshot and receipt output validated

### Risks And Follow-Up

- the current GST review is an operational snapshot and not yet a posted accounting or statutory invoice record
- seeded tax-master coverage is intentionally narrow and will need broader tax-code modeling if multiple slabs or non-GST treatments are introduced later
- explicit shipping-charge tax treatment remains deferred to Stage `3.3.4` accounting compatibility work
