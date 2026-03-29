# Testing Policy

## Baseline

1. All changes should pass the relevant validation for the affected area.
2. `typecheck` and build should stay green unless a documented blocker exists.
3. High-risk business logic should be introduced in testable units.

## Test Priorities

1. framework service contracts
2. shared `Core` masters and permissions
3. accounting and balancing rules
4. stock and inventory transitions
5. ecommerce checkout and order-state behavior
6. API contract validation

## Minimum Expectations

1. Documentation-only change:
   - consistency review
2. UI-only change:
   - typecheck and build where relevant
3. API or schema change:
   - typecheck, build, and focused validation where available
4. Billing/accounting/inventory logic change:
   - typecheck, build, and focused tests unless blocked and documented

## Test Gap Discipline

If tests are missing, document:

1. what was validated
2. what automated coverage is missing
3. why the gap exists
4. what follow-up is required
