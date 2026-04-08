# Planning

## Current Batch

### Reference

`#66`

### Goal

Complete Stage `3.2.4` by documenting ERPNext price-list compatibility if ERP becomes the source of truth for storefront pricing.

### Scope

- `Assist/Execution/TASK.md`
- `Assist/Execution/PLANNING.md`
- `Assist/Documentation/ARCHITECTURE.md`
- `Assist/Documentation/CHANGELOG.md`
- `Assist/Documentation/WORKLOG.md`
- `Assist/Planning/plan-9.md`

### Canonical Decisions

- if ERPNext becomes pricing source of truth, ERP item-price and price-list records must still flow through `apps/frappe` snapshots into explicit `apps/core` price projections before storefront runtime reads them
- `apps/core` remains the compatibility surface that exposes effective `sellingPrice` and `mrp` to `apps/ecommerce`, regardless of whether those values originated in local product maintenance or ERP price-list projection
- ERP price-list compatibility must preserve current storefront semantics:
  - `sellingPrice` is the effective transactional storefront price
  - `mrp` remains the compare-at price shown to customers
  - `basePrice` remains only a fallback when no active projected or local price row exists
- ERP-aware price-list selection rules such as customer group, territory, channel, or currency must be resolved before projection into `core`, not during live storefront requests
- if multiple ERP price lists exist, projection must choose one approved storefront-effective record per product or variant and mark the rest as non-storefront or inactive until segmented pricing maturity is implemented

### Execution Plan

1. mark Stage `3.2.4` complete in task tracking with a new batch reference
2. record ERP price-list compatibility rules in architecture and go-live planning
3. update changelog and worklog so the ERP pricing compatibility baseline is discoverable from delivery history
4. keep Stage `5.2.2` and later segmented-pricing work aligned to the same projection contract

### Validation Plan

- review the current storefront pricing authority rules and ERP integration notes
- confirm the documented compatibility model preserves current `core -> ecommerce` runtime pricing reads
- confirm the documented ERP behavior keeps selection and normalization out of request-time storefront runtime

### Validation Status

- [x] current pricing authority and ERP projection notes reviewed
- [x] compatibility model aligned with current `core` effective-price runtime contract
- [x] ERP selection and normalization kept on the staged-sync path instead of live storefront pricing calls

### Risks And Follow-Up

- current repository code does not yet implement the ERP price-list projection contract; this batch only documents the expected compatibility model
- multi-currency, B2B customer group pricing, and segmented price-list selection remain deferred until later ERP and promotion maturity work
- Stage `5.2.2` must formalize the concrete projected record shape and precedence rules before ERP-driven pricing can go live
