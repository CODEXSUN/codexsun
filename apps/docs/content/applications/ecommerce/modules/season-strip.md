# Ecommerce: Season Strip

This page records the `season-strip` module in the Ecommerce owner. The application business context is: product enrichment, merchandising and storefront configuration.

## Workflow role

Ecommerce owns merchandising. Verify current source files for paid checkout/order capabilities; do not infer them from a store page.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/ecommerce/api/src/modules/season-strip/index.ts`
- `apps/ecommerce/api/src/modules/season-strip/season-strip.migration.ts`
- `apps/ecommerce/api/src/modules/season-strip/season-strip.module.ts`
- `apps/ecommerce/api/src/modules/season-strip/season-strip.repository.ts`
- `apps/ecommerce/api/src/modules/season-strip/season-strip.routes.ts`
- `apps/ecommerce/api/src/modules/season-strip/season-strip.service.ts`
- `apps/ecommerce/api/src/modules/season-strip/season-strip.types.ts`
- `apps/ecommerce/web/src/modules/season-strip/index.ts`
- `apps/ecommerce/web/src/modules/season-strip/season-strip.form.tsx`
- `apps/ecommerce/web/src/modules/season-strip/season-strip.hooks.ts`
- `apps/ecommerce/web/src/modules/season-strip/season-strip.image-upload.tsx`
- `apps/ecommerce/web/src/modules/season-strip/season-strip.list.tsx`
- `apps/ecommerce/web/src/modules/season-strip/season-strip.schema.ts`
- `apps/ecommerce/web/src/modules/season-strip/season-strip.services.ts`
- `apps/ecommerce/web/src/modules/season-strip/season-strip.types.ts`
- `apps/ecommerce/web/src/modules/season-strip/season-strip.workspace.tsx`

## Explicit route declarations

- `${base}/:id`
- `${base}/:id/${action}`

## Tables created by this leaf

- `ecommerce_storefront_season_strips`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
