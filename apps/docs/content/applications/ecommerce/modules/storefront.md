# Ecommerce: Storefront

This page records the `storefront` module in the Ecommerce owner. The application business context is: product enrichment, merchandising and storefront configuration.

## Workflow role

Ecommerce owns merchandising. Verify current source files for paid checkout/order capabilities; do not infer them from a store page.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/ecommerce/api/src/modules/storefront/index.ts`
- `apps/ecommerce/api/src/modules/storefront/storefront-performance.migration.ts`
- `apps/ecommerce/api/src/modules/storefront/storefront-schema.migration.ts`
- `apps/ecommerce/api/src/modules/storefront/storefront.cache.ts`
- `apps/ecommerce/api/src/modules/storefront/storefront.repository.ts`
- `apps/ecommerce/api/src/modules/storefront/storefront.routes.ts`
- `apps/ecommerce/api/src/modules/storefront/storefront.service.ts`
- `apps/ecommerce/api/src/modules/storefront/storefront.types.ts`

## Explicit route declarations

- `/storefront/bootstrap`
- `/storefront/branding`
- `/storefront/catalog`
- `/storefront/categories`
- `/storefront/discovery`
- `/storefront/featured-cards`
- `/storefront/products/:slug`
- `/storefront/promotions`
- `/storefront/site-navigation`
- `/storefront/sliders`
- `/storefront/telemetry`

## Tables created by this leaf

No CREATE TABLE literal was found in this leaf. It may be read-only, composition-only, share a parent table, or register its migration through an owner lifecycle.

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
