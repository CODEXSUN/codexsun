# Core: Common / Others / Sales Types

This page records the `common/others/sales-types` module in the Core owner. The application business context is: persisted organisation, contact, product and common reference masters.

## Workflow role

Core is the shared business master owner. Billing, CRM and Ecommerce reference its public contracts rather than copying or privately importing its entities.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/core/api/src/modules/common/others/sales-types/index.ts`
- `apps/core/api/src/modules/common/others/sales-types/sales-types.migration.ts`
- `apps/core/api/src/modules/common/others/sales-types/sales-types.module.ts`
- `apps/core/api/src/modules/common/others/sales-types/sales-types.repository.ts`
- `apps/core/api/src/modules/common/others/sales-types/sales-types.routes.ts`
- `apps/core/api/src/modules/common/others/sales-types/sales-types.seed.ts`
- `apps/core/api/src/modules/common/others/sales-types/sales-types.service.ts`
- `apps/core/api/src/modules/common/others/sales-types/sales-types.types.ts`
- `apps/core/web/src/modules/common/others/sales-types/index.ts`
- `apps/core/web/src/modules/common/others/sales-types/sales-types.form.tsx`
- `apps/core/web/src/modules/common/others/sales-types/sales-types.hooks.ts`
- `apps/core/web/src/modules/common/others/sales-types/sales-types.list.tsx`
- `apps/core/web/src/modules/common/others/sales-types/sales-types.schema.ts`
- `apps/core/web/src/modules/common/others/sales-types/sales-types.services.ts`
- `apps/core/web/src/modules/common/others/sales-types/sales-types.types.ts`
- `apps/core/web/src/modules/common/others/sales-types/sales-types.workspace.tsx`

## Explicit route declarations

- `${SALES_TYPES_COLLECTION_PATH}/:id`
- `${SALES_TYPES_COLLECTION_PATH}/:id/activate`
- `${SALES_TYPES_COLLECTION_PATH}/:id/deactivate`
- `${SALES_TYPES_COLLECTION_PATH}/:id/force`

## Tables created by this leaf

- `core_sales_types`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
