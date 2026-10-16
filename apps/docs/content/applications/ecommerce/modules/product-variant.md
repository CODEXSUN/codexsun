# Ecommerce: Product Variant

This page records the `product-variant` module in the Ecommerce owner. The application business context is: product enrichment, merchandising and storefront configuration.

## Workflow role

Ecommerce owns merchandising. Verify current source files for paid checkout/order capabilities; do not infer them from a store page.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/ecommerce/api/src/modules/product-variant/index.ts`
- `apps/ecommerce/api/src/modules/product-variant/product-variant.migration.ts`
- `apps/ecommerce/api/src/modules/product-variant/product-variant.module.ts`
- `apps/ecommerce/api/src/modules/product-variant/product-variant.repository.ts`
- `apps/ecommerce/api/src/modules/product-variant/product-variant.routes.ts`
- `apps/ecommerce/api/src/modules/product-variant/product-variant.seed.ts`
- `apps/ecommerce/api/src/modules/product-variant/product-variant.service.ts`
- `apps/ecommerce/api/src/modules/product-variant/product-variant.types.ts`
- `apps/ecommerce/web/src/modules/product-variant/index.ts`
- `apps/ecommerce/web/src/modules/product-variant/product-variant.form.tsx`
- `apps/ecommerce/web/src/modules/product-variant/product-variant.hooks.ts`
- `apps/ecommerce/web/src/modules/product-variant/product-variant.list.tsx`
- `apps/ecommerce/web/src/modules/product-variant/product-variant.schema.ts`
- `apps/ecommerce/web/src/modules/product-variant/product-variant.services.ts`
- `apps/ecommerce/web/src/modules/product-variant/product-variant.types.ts`
- `apps/ecommerce/web/src/modules/product-variant/product-variant.workspace.tsx`

## Explicit route declarations

- `${base}/:id`
- `${base}/:id/${action}`
- `${base}/products`

## Tables created by this leaf

- `ecommerce_product_variants`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
