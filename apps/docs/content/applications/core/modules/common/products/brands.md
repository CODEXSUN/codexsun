# Core: Common / Products / Brands

This page records the `common/products/brands` module in the Core owner. The application business context is: persisted organisation, contact, product and common reference masters.

## Workflow role

Core is the shared business master owner. Billing, CRM and Ecommerce reference its public contracts rather than copying or privately importing its entities.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/core/api/src/modules/common/products/brands/brands.migration.ts`
- `apps/core/api/src/modules/common/products/brands/brands.module.ts`
- `apps/core/api/src/modules/common/products/brands/brands.repository.ts`
- `apps/core/api/src/modules/common/products/brands/brands.routes.ts`
- `apps/core/api/src/modules/common/products/brands/brands.seed.ts`
- `apps/core/api/src/modules/common/products/brands/brands.service.ts`
- `apps/core/api/src/modules/common/products/brands/brands.types.ts`
- `apps/core/api/src/modules/common/products/brands/index.ts`
- `apps/core/web/src/modules/common/products/brands/brands.form.tsx`
- `apps/core/web/src/modules/common/products/brands/brands.hooks.ts`
- `apps/core/web/src/modules/common/products/brands/brands.list.tsx`
- `apps/core/web/src/modules/common/products/brands/brands.schema.ts`
- `apps/core/web/src/modules/common/products/brands/brands.services.ts`
- `apps/core/web/src/modules/common/products/brands/brands.types.ts`
- `apps/core/web/src/modules/common/products/brands/brands.workspace.tsx`
- `apps/core/web/src/modules/common/products/brands/index.ts`

## Explicit route declarations

- `${BRANDS_COLLECTION_PATH}/:id`
- `${BRANDS_COLLECTION_PATH}/:id/activate`
- `${BRANDS_COLLECTION_PATH}/:id/deactivate`
- `${BRANDS_COLLECTION_PATH}/:id/force`

## Tables created by this leaf

- `core_brands`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
