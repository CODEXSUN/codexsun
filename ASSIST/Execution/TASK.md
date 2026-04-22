# Task

## Active

- [ ] `#221` Fix storefront smoke product-path failure
  - [ ] Phase 1: runtime failure confirmation
    - [x] 1.1 run the storefront smoke suite and confirm the failing product-path flow
    - [x] 1.2 confirm the seeded storefront product route `/products/aster-linen-shirt` is not resolving correctly in smoke
  - [ ] Phase 2: root-cause isolation
    - [ ] 2.1 trace why the expected seeded product is missing or mismatched at runtime
    - [ ] 2.2 trace why smoke checkout auth return is falling back to `/login` instead of the expected flow
  - [ ] Phase 3: fix and validation
    - [ ] 3.1 implement the smallest boundary-correct fix for the product-path smoke break
    - [ ] 3.2 rerun the relevant storefront smoke tests
    - [ ] 3.3 record any remaining launch-critical storefront gaps
