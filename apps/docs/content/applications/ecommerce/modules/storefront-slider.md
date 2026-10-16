# Ecommerce: Storefront Slider

This page records the `storefront-slider` module in the Ecommerce owner. The application business context is: product enrichment, merchandising and storefront configuration.

## Workflow role

Ecommerce owns merchandising. Verify current source files for paid checkout/order capabilities; do not infer them from a store page.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/ecommerce/api/src/modules/storefront-slider/index.ts`
- `apps/ecommerce/api/src/modules/storefront-slider/storefront-slider.image-routes.ts`
- `apps/ecommerce/api/src/modules/storefront-slider/storefront-slider.migration.ts`
- `apps/ecommerce/api/src/modules/storefront-slider/storefront-slider.module.ts`
- `apps/ecommerce/api/src/modules/storefront-slider/storefront-slider.repository.ts`
- `apps/ecommerce/api/src/modules/storefront-slider/storefront-slider.routes.ts`
- `apps/ecommerce/api/src/modules/storefront-slider/storefront-slider.seed.ts`
- `apps/ecommerce/api/src/modules/storefront-slider/storefront-slider.service.ts`
- `apps/ecommerce/api/src/modules/storefront-slider/storefront-slider.storage.ts`
- `apps/ecommerce/api/src/modules/storefront-slider/storefront-slider.types.ts`
- `apps/ecommerce/web/src/modules/storefront-slider/index.ts`
- `apps/ecommerce/web/src/modules/storefront-slider/storefront-slider.form.tsx`
- `apps/ecommerce/web/src/modules/storefront-slider/storefront-slider.hooks.ts`
- `apps/ecommerce/web/src/modules/storefront-slider/storefront-slider.image-field.tsx`
- `apps/ecommerce/web/src/modules/storefront-slider/storefront-slider.list.tsx`
- `apps/ecommerce/web/src/modules/storefront-slider/storefront-slider.schema.ts`
- `apps/ecommerce/web/src/modules/storefront-slider/storefront-slider.services.ts`
- `apps/ecommerce/web/src/modules/storefront-slider/storefront-slider.types.ts`
- `apps/ecommerce/web/src/modules/storefront-slider/storefront-slider.workspace.tsx`

## Explicit route declarations

- `${base}/:id`
- `${base}/:id/${action}`
- `${base}/images`
- `${base}/storage`

## Tables created by this leaf

- `ecommerce_storefront_sliders`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
