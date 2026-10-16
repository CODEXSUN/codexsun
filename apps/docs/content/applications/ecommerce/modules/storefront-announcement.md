# Ecommerce: Storefront Announcement

This page records the `storefront-announcement` module in the Ecommerce owner. The application business context is: product enrichment, merchandising and storefront configuration.

## Workflow role

Ecommerce owns merchandising. Verify current source files for paid checkout/order capabilities; do not infer them from a store page.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/ecommerce/api/src/modules/storefront-announcement/index.ts`
- `apps/ecommerce/api/src/modules/storefront-announcement/storefront-announcement.migration.ts`
- `apps/ecommerce/api/src/modules/storefront-announcement/storefront-announcement.module.ts`
- `apps/ecommerce/api/src/modules/storefront-announcement/storefront-announcement.repository.ts`
- `apps/ecommerce/api/src/modules/storefront-announcement/storefront-announcement.routes.ts`
- `apps/ecommerce/api/src/modules/storefront-announcement/storefront-announcement.seed.ts`
- `apps/ecommerce/api/src/modules/storefront-announcement/storefront-announcement.service.ts`
- `apps/ecommerce/api/src/modules/storefront-announcement/storefront-announcement.types.ts`

## Explicit route declarations

- `${base}/:id`
- `${base}/:id/${action}`
- `${base}/:id/force`
- `/storefront/announcement`

## Tables created by this leaf

- `ecommerce_storefront_announcements`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
