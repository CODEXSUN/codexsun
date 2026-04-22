# Planning

## Active

- `#221` Fix storefront smoke product-path failure
  - Goal:
    - restore the expected storefront smoke path around the seeded product route so the PDP, add-to-cart, and checkout smoke chain can run again
  - Why this slice now:
    - the current storefront smoke suite is failing primarily because `/products/aster-linen-shirt` does not resolve to the expected product flow
    - homepage performance work is secondary until the smoke path is functionally stable
  - Confirmed findings:
    - `npm run test:e2e:storefront-smoke` currently fails with missing PDP content, missing add-to-cart controls, and checkout auth return mismatches
    - `tests/e2e/storefront-order-flow.spec.ts`, `tests/e2e/storefront-accessibility.spec.ts`, and `tests/e2e/storefront-mobile-matrix.spec.ts` all expect `aster-linen-shirt`
    - the performance suite also shows the product route entering a `Projected storefront product could not be found.` state
  - Scope in this batch:
    - inspect the seeded product, storefront product lookup, and slug resolution path
    - identify whether the failure is seed drift, slug drift, route lookup drift, or catalog projection drift
    - implement the smallest fix that restores the smoke path
  - Constraints:
    - keep focus on launch-critical storefront behavior
    - do not broaden into unrelated repository lint cleanup or architecture refactor
  - Planned validation:
    - rerun the failing storefront smoke specs that cover PDP and checkout flow
