# Ecommerce: Product Image

This page records the `product-image` module in the Ecommerce owner. The application business context is: product enrichment, merchandising and storefront configuration.

## Workflow role

Ecommerce owns merchandising. Verify current source files for paid checkout/order capabilities; do not infer them from a store page.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/ecommerce/api/src/modules/product-image/index.ts`
- `apps/ecommerce/api/src/modules/product-image/product-image.migration.ts`
- `apps/ecommerce/api/src/modules/product-image/product-image.module.ts`
- `apps/ecommerce/api/src/modules/product-image/product-image.repository.ts`
- `apps/ecommerce/api/src/modules/product-image/product-image.routes.ts`
- `apps/ecommerce/api/src/modules/product-image/product-image.seed.ts`
- `apps/ecommerce/api/src/modules/product-image/product-image.service.ts`
- `apps/ecommerce/api/src/modules/product-image/product-image.storage.ts`
- `apps/ecommerce/api/src/modules/product-image/product-image.types.ts`
- `apps/ecommerce/web/src/modules/product-image/index.ts`
- `apps/ecommerce/web/src/modules/product-image/product-image.form.tsx`
- `apps/ecommerce/web/src/modules/product-image/product-image.hooks.ts`
- `apps/ecommerce/web/src/modules/product-image/product-image.list.tsx`
- `apps/ecommerce/web/src/modules/product-image/product-image.schema.ts`
- `apps/ecommerce/web/src/modules/product-image/product-image.services.ts`
- `apps/ecommerce/web/src/modules/product-image/product-image.types.ts`
- `apps/ecommerce/web/src/modules/product-image/product-image.upload.tsx`
- `apps/ecommerce/web/src/modules/product-image/product-image.workspace.tsx`

## Explicit route declarations

- `${base}/:id`
- `${base}/:id/${action}`
- `${base}/products`
- `${base}/variants`
- `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=82`

## Tables created by this leaf

- `ecommerce_product_images`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
