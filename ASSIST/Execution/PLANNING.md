# Planning

## Current Batch

### Reference

`#60`

### Goal

Complete Stage `3.1.2` by defining low-stock and oversell prevention rules that match the current `core` stock model and the current `ecommerce` checkout path.

### Scope

- `Assist/Execution/TASK.md`
- `Assist/Execution/PLANNING.md`
- `Assist/Documentation/ARCHITECTURE.md`
- `Assist/Documentation/CHANGELOG.md`
- `Assist/Documentation/WORKLOG.md`
- `Assist/Planning/plan-9.md`

### Canonical Decisions

- storefront sellable quantity remains `sum(active stock quantity - reservedQuantity)` from `apps/core`
- low-stock state begins when sellable quantity is `1` to `5`; `0` is out of stock and blocks checkout, while quantities above `5` are treated as normal availability
- cart quantity and PDP quantity are advisory only; the final oversell guard lives at checkout order creation where requested quantity must be less than or equal to the latest sellable quantity
- until Stage `3.1.3` adds reservation behavior, `payment_pending` orders do not create a new stock hold, so low-stock items remain first-paid or first-verified rather than guaranteed by cart or pending payment presence
- no backorders, silent partial fulfilment, or automatic oversell override should be introduced in storefront runtime without a later explicit batch

### Execution Plan

1. mark Stage `3.1.2` complete in task tracking with a new batch reference
2. record the low-stock thresholds and oversell-prevention rules in architecture and go-live planning
3. update changelog and worklog so the inventory policy baseline is discoverable from delivery history
4. leave reservation implementation and warehouse visibility behavior to Stages `3.1.3` and `3.1.4`

### Validation Plan

- review the current ecommerce catalog and checkout code paths that compute `availableQuantity`
- confirm checkout already rejects requests above current sellable quantity
- ensure the documented rules do not imply reservation behavior that is not yet implemented

### Validation Status

- [x] current availability path reviewed in catalog and checkout services
- [x] checkout conflict behavior confirmed against sellable quantity validation
- [x] policy documentation aligned with the current no-reservation runtime boundary

### Risks And Follow-Up

- concurrent payment attempts on the last units still have a residual race until `3.1.3` introduces reservation or hold behavior
- storefront low-stock messaging can be added later, but it must reflect the same `1` to `5` threshold documented here
- warehouse-level visibility, split stock exposure, and pickup-specific stock policy remain deferred to `3.1.4`
