# Ecommerce: Featured Card

This page records the `featured-card` module in the Ecommerce owner. The application business context is: product enrichment, merchandising and storefront configuration.

## Workflow role

Ecommerce owns merchandising. Verify current source files for paid checkout/order capabilities; do not infer them from a store page.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/ecommerce/api/src/modules/featured-card/featured-card.migration.ts`
- `apps/ecommerce/api/src/modules/featured-card/featured-card.module.ts`
- `apps/ecommerce/api/src/modules/featured-card/featured-card.repository.ts`
- `apps/ecommerce/api/src/modules/featured-card/featured-card.routes.ts`
- `apps/ecommerce/api/src/modules/featured-card/featured-card.seed.ts`
- `apps/ecommerce/api/src/modules/featured-card/featured-card.service.ts`
- `apps/ecommerce/api/src/modules/featured-card/featured-card.types.ts`
- `apps/ecommerce/api/src/modules/featured-card/index.ts`
- `apps/ecommerce/web/src/modules/featured-card/featured-card.form.tsx`
- `apps/ecommerce/web/src/modules/featured-card/featured-card.hooks.ts`
- `apps/ecommerce/web/src/modules/featured-card/featured-card.image-upload.tsx`
- `apps/ecommerce/web/src/modules/featured-card/featured-card.list.tsx`
- `apps/ecommerce/web/src/modules/featured-card/featured-card.schema.ts`
- `apps/ecommerce/web/src/modules/featured-card/featured-card.services.ts`
- `apps/ecommerce/web/src/modules/featured-card/featured-card.types.ts`
- `apps/ecommerce/web/src/modules/featured-card/featured-card.workspace.tsx`
- `apps/ecommerce/web/src/modules/featured-card/index.ts`

## Explicit route declarations

- `${base}/:id`
- `${base}/:id/${action}`

## Tables created by this leaf

- `ecommerce_storefront_featured_cards`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
