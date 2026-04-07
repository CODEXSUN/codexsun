# Planning

## Current Batch

### Reference

`#45`

### Goal

Standardize the live storefront desktop layout rails to `max-w-[96rem]` and tune the homepage hero so wider desktop space is filled by intentional design instead of empty gutters.

### Scope

- `ASSIST/Execution/TASK.md`
- `ASSIST/Execution/PLANNING.md`
- `ASSIST/Documentation/CHANGELOG.md`
- `apps/ecommerce/web/src/components/customer-portal-layout.tsx`
- `apps/ecommerce/web/src/components/storefront-category-menu.tsx`
- `apps/ecommerce/web/src/components/storefront-hero-slider.tsx`
- `apps/ecommerce/web/src/pages/storefront-cart-page.tsx`
- `apps/ecommerce/web/src/pages/storefront-catalog-page.tsx`
- `apps/ecommerce/web/src/pages/storefront-checkout-page.tsx`
- `apps/ecommerce/web/src/pages/storefront-home-page.tsx`
- `apps/ecommerce/web/src/pages/storefront-product-page.tsx`
- `apps/ui/src/components/ux/featured-card-row-surface.tsx`
- `apps/ui/src/registry/blocks/commerce/featured-card-1.tsx`
- `apps/ui/src/registry/blocks/commerce/featured-card-3.tsx`
- `apps/ui/src/registry/blocks/commerce/featured-card-4.tsx`
- `apps/ui/src/registry/blocks/commerce/featured-card-5.tsx`
- `apps/ui/src/registry/blocks/commerce/featured-card-6.tsx`
- `apps/ui/src/registry/blocks/data/storefront-search-01.tsx`

### Canonical Decisions

- main storefront desktop rails should stop at `max-w-[96rem]` so large screens gain usable width without drifting into overly loose layouts
- mobile and tablet layouts should remain full width with existing responsive padding and stacking behavior unchanged
- the homepage hero should use decorative fill and larger media framing so added desktop width reads as design, not empty whitespace
- design-system storefront preview blocks may use preview-only width rules without changing live storefront commerce layouts

### Execution Plan

1. update shared storefront preview blocks so design-system previews respect the requested width behavior
2. widen the live storefront homepage, hero, and category rail to `max-w-[96rem]`
3. standardize remaining main storefront commerce pages and the customer portal layout to the same desktop rail
4. record the batch in task tracking, planning, and changelog
5. validate the storefront width batch with `npm run typecheck` and `npm run build`

### Validation Plan

- run `npm run typecheck`
- run `npm run build`
- confirm main storefront rails use `max-w-[96rem]`
- confirm the homepage hero no longer leaves broad desktop side gutters

### Validation Status

- [x] `npm run typecheck`
- [x] `npm run build`
- [x] main storefront rails updated to `max-w-[96rem]`
- [x] homepage hero widened and visually filled for large desktop screens

### Risks And Follow-Up

- legal and tracking pages still use narrower layout widths by design; widen them only if the content strategy changes
- if the storefront adopts a central container utility later, these page-level width classes should be consolidated into that shared layout primitive
