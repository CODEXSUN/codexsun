# Core: Common / Products / Product Groups

This page records the `common/products/product-groups` module in the Core owner. The application business context is: persisted organisation, contact, product and common reference masters.

## Workflow role

Core is the shared business master owner. Billing, CRM and Ecommerce reference its public contracts rather than copying or privately importing its entities.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/core/api/src/modules/common/products/product-groups/index.ts`
- `apps/core/api/src/modules/common/products/product-groups/product-groups.migration.ts`
- `apps/core/api/src/modules/common/products/product-groups/product-groups.module.ts`
- `apps/core/api/src/modules/common/products/product-groups/product-groups.repository.ts`
- `apps/core/api/src/modules/common/products/product-groups/product-groups.routes.ts`
- `apps/core/api/src/modules/common/products/product-groups/product-groups.seed.ts`
- `apps/core/api/src/modules/common/products/product-groups/product-groups.service.ts`
- `apps/core/api/src/modules/common/products/product-groups/product-groups.types.ts`
- `apps/core/web/src/modules/common/products/product-groups/index.ts`
- `apps/core/web/src/modules/common/products/product-groups/product-groups.form.tsx`
- `apps/core/web/src/modules/common/products/product-groups/product-groups.hooks.ts`
- `apps/core/web/src/modules/common/products/product-groups/product-groups.list.tsx`
- `apps/core/web/src/modules/common/products/product-groups/product-groups.schema.ts`
- `apps/core/web/src/modules/common/products/product-groups/product-groups.services.ts`
- `apps/core/web/src/modules/common/products/product-groups/product-groups.types.ts`
- `apps/core/web/src/modules/common/products/product-groups/product-groups.workspace.tsx`

## Explicit route declarations

- `${PRODUCT_GROUPS_COLLECTION_PATH}/:id`
- `${PRODUCT_GROUPS_COLLECTION_PATH}/:id/activate`
- `${PRODUCT_GROUPS_COLLECTION_PATH}/:id/deactivate`
- `${PRODUCT_GROUPS_COLLECTION_PATH}/:id/force`

## Tables created by this leaf

- `core_product_groups`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
