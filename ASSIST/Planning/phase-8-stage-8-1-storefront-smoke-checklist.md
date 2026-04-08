# Phase 8 Stage 8.1 Storefront Smoke Checklist

## Gate Command

- `npm.cmd run test:e2e:storefront-smoke`

## Checklist Scope

- homepage loads and storefront shell is usable
- catalog discovery loads with search and filter controls visible
- product detail page supports add-to-cart and buy-now entry
- cart leads into checkout correctly
- guest checkout can place a paid mock order
- authenticated checkout can place a paid order
- order confirmation exposes order reference and order-page entry
- public or customer order tracking shows the created paid order
- core storefront accessibility labels stay present on the smoke path
- mobile viewport smoke path does not overflow on homepage, catalog, PDP, cart, checkout, or tracking

## Boundaries

- this gate proves ecommerce-owned storefront runtime from landing through paid order and tracking
- this gate does not replace admin operations, billing, or ERP bridge validation; those remain later release gates
- live gateway behavior beyond the existing mocked or local checkout coverage remains outside this smoke command
