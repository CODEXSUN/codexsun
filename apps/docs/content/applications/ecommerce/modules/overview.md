# Ecommerce: Overview

This page records the `overview` module in the Ecommerce owner. The application business context is: product enrichment, merchandising and storefront configuration.

## Workflow role

Ecommerce owns merchandising. Verify current source files for paid checkout/order capabilities; do not infer them from a store page.

This is an overview/composition surface; it does not by itself implement all domain workflows.

## Source contracts

- `apps/ecommerce/api/src/modules/overview/index.ts`
- `apps/ecommerce/api/src/modules/overview/overview.module.ts`
- `apps/ecommerce/api/src/modules/overview/overview.routes.ts`
- `apps/ecommerce/api/src/modules/overview/overview.seed.ts`
- `apps/ecommerce/api/src/modules/overview/overview.service.ts`
- `apps/ecommerce/api/src/modules/overview/overview.types.ts`
- `apps/ecommerce/web/src/modules/overview/index.ts`
- `apps/ecommerce/web/src/modules/overview/overview.hooks.ts`
- `apps/ecommerce/web/src/modules/overview/overview.services.ts`
- `apps/ecommerce/web/src/modules/overview/overview.types.ts`
- `apps/ecommerce/web/src/modules/overview/overview.workspace.tsx`

## Explicit route declarations

- `/ecommerce/overview`

## Tables created by this leaf

No CREATE TABLE literal was found in this leaf. It may be read-only, composition-only, share a parent table, or register its migration through an owner lifecycle.

## Permission declarations

- `ecommerce.overview.view`

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
