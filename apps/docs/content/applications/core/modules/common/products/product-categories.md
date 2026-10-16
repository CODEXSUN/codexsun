# Core: Common / Products / Product Categories

This page records the `common/products/product-categories` module in the Core owner. The application business context is: persisted organisation, contact, product and common reference masters.

## Workflow role

Core is the shared business master owner. Billing, CRM and Ecommerce reference its public contracts rather than copying or privately importing its entities.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/core/api/src/modules/common/products/product-categories/index.ts`
- `apps/core/api/src/modules/common/products/product-categories/product-categories.migration.ts`
- `apps/core/api/src/modules/common/products/product-categories/product-categories.module.ts`
- `apps/core/api/src/modules/common/products/product-categories/product-categories.repository.ts`
- `apps/core/api/src/modules/common/products/product-categories/product-categories.routes.ts`
- `apps/core/api/src/modules/common/products/product-categories/product-categories.seed.ts`
- `apps/core/api/src/modules/common/products/product-categories/product-categories.service.ts`
- `apps/core/api/src/modules/common/products/product-categories/product-categories.types.ts`
- `apps/core/web/src/modules/common/products/product-categories/index.ts`
- `apps/core/web/src/modules/common/products/product-categories/product-categories.form.tsx`
- `apps/core/web/src/modules/common/products/product-categories/product-categories.hooks.ts`
- `apps/core/web/src/modules/common/products/product-categories/product-categories.list.tsx`
- `apps/core/web/src/modules/common/products/product-categories/product-categories.schema.ts`
- `apps/core/web/src/modules/common/products/product-categories/product-categories.services.ts`
- `apps/core/web/src/modules/common/products/product-categories/product-categories.types.ts`
- `apps/core/web/src/modules/common/products/product-categories/product-categories.workspace.tsx`

## Explicit route declarations

- `${PRODUCT_CATEGORIES_COLLECTION_PATH}/:id`
- `${PRODUCT_CATEGORIES_COLLECTION_PATH}/:id/activate`
- `${PRODUCT_CATEGORIES_COLLECTION_PATH}/:id/deactivate`
- `${PRODUCT_CATEGORIES_COLLECTION_PATH}/:id/force`

## Tables created by this leaf

- `core_product_categories`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
