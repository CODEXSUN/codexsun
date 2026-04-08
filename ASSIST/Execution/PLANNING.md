# Planning

## Current Batch

### Reference

`#81`

### Goal

Complete Stage `4.3.4` by turning storefront homepage performance guidance into reusable code-level standards for future rails and blocks.

### Scope

- `ASSIST/Execution/TASK.md`
- `ASSIST/Execution/PLANNING.md`
- `ASSIST/Documentation/ARCHITECTURE.md`
- `ASSIST/Documentation/CHANGELOG.md`
- `ASSIST/Documentation/WORKLOG.md`
- `ASSIST/Planning/plan-9.md`
- `apps/ecommerce/web/src/components/storefront-performance-standards.tsx`
- `apps/ecommerce/web/src/pages/storefront-home-page.tsx`

### Canonical Decisions

- homepage performance rules should live in reusable code, not only in planning docs
- future below-the-fold rails must declare deferral behavior, reserved layout footprint, and fallback treatment in one shared standards layer
- the production-like performance gate remains the verification backstop for those standards

### Execution Plan

1. add a shared storefront homepage performance-standards map
2. move homepage deferral configuration onto the shared standards layer
3. keep the production-like performance gate as the enforcement baseline after that refactor

### Validation Plan

- run `npm.cmd run typecheck`
- run `npm.cmd run test:e2e:performance`

### Validation Status

- [x] typecheck completed
- [x] shared storefront homepage performance standards completed
- [x] storefront homepage adopted shared standards
- [x] production-like storefront performance gate completed

### Risks And Follow-Up

- the current standards layer governs homepage rails specifically; future catalog or account surfaces can extend the same pattern if they become performance-sensitive
- large non-storefront admin bundles still exist outside this storefront-specific standardization work
- the next scheduled task is `5.1.1`
