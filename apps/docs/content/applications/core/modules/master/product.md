# Core: Master / Product

This page records the `master/product` module in the Core owner. The application business context is: persisted organisation, contact, product and common reference masters.

## Workflow role

Core is the shared business master owner. Billing, CRM and Ecommerce reference its public contracts rather than copying or privately importing its entities.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/core/api/src/modules/master/product/index.ts`
- `apps/core/api/src/modules/master/product/product.migration.ts`
- `apps/core/api/src/modules/master/product/product.module.ts`
- `apps/core/api/src/modules/master/product/product.repository.ts`
- `apps/core/api/src/modules/master/product/product.routes.ts`
- `apps/core/api/src/modules/master/product/product.seed.ts`
- `apps/core/api/src/modules/master/product/product.service.ts`
- `apps/core/api/src/modules/master/product/product.types.ts`
- `apps/core/web/src/modules/master/product/index.ts`
- `apps/core/web/src/modules/master/product/product.form.tsx`
- `apps/core/web/src/modules/master/product/product.hooks.ts`
- `apps/core/web/src/modules/master/product/product.list.tsx`
- `apps/core/web/src/modules/master/product/product.schema.ts`
- `apps/core/web/src/modules/master/product/product.services.ts`
- `apps/core/web/src/modules/master/product/product.types.ts`
- `apps/core/web/src/modules/master/product/product.workspace.tsx`

## Explicit route declarations

- `${PRODUCT_COLLECTION_PATH}/:id`
- `${PRODUCT_COLLECTION_PATH}/:id/${action}`
- `${PRODUCT_COLLECTION_PATH}/:id/force`

## Tables created by this leaf

- `core_products`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
