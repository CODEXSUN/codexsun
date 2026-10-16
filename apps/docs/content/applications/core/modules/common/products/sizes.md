# Core: Common / Products / Sizes

This page records the `common/products/sizes` module in the Core owner. The application business context is: persisted organisation, contact, product and common reference masters.

## Workflow role

Core is the shared business master owner. Billing, CRM and Ecommerce reference its public contracts rather than copying or privately importing its entities.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/core/api/src/modules/common/products/sizes/index.ts`
- `apps/core/api/src/modules/common/products/sizes/sizes.migration.ts`
- `apps/core/api/src/modules/common/products/sizes/sizes.module.ts`
- `apps/core/api/src/modules/common/products/sizes/sizes.repository.ts`
- `apps/core/api/src/modules/common/products/sizes/sizes.routes.ts`
- `apps/core/api/src/modules/common/products/sizes/sizes.seed.ts`
- `apps/core/api/src/modules/common/products/sizes/sizes.service.ts`
- `apps/core/api/src/modules/common/products/sizes/sizes.types.ts`
- `apps/core/web/src/modules/common/products/sizes/index.ts`
- `apps/core/web/src/modules/common/products/sizes/sizes.form.tsx`
- `apps/core/web/src/modules/common/products/sizes/sizes.hooks.ts`
- `apps/core/web/src/modules/common/products/sizes/sizes.list.tsx`
- `apps/core/web/src/modules/common/products/sizes/sizes.schema.ts`
- `apps/core/web/src/modules/common/products/sizes/sizes.services.ts`
- `apps/core/web/src/modules/common/products/sizes/sizes.types.ts`
- `apps/core/web/src/modules/common/products/sizes/sizes.workspace.tsx`

## Explicit route declarations

- `${SIZES_COLLECTION_PATH}/:id`
- `${SIZES_COLLECTION_PATH}/:id/activate`
- `${SIZES_COLLECTION_PATH}/:id/deactivate`
- `${SIZES_COLLECTION_PATH}/:id/force`

## Tables created by this leaf

- `core_sizes`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
