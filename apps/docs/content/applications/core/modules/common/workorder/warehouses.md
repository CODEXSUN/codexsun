# Core: Common / Workorder / Warehouses

This page records the `common/workorder/warehouses` module in the Core owner. The application business context is: persisted organisation, contact, product and common reference masters.

## Workflow role

Core is the shared business master owner. Billing, CRM and Ecommerce reference its public contracts rather than copying or privately importing its entities.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/core/api/src/modules/common/workorder/warehouses/index.ts`
- `apps/core/api/src/modules/common/workorder/warehouses/warehouses.migration.ts`
- `apps/core/api/src/modules/common/workorder/warehouses/warehouses.module.ts`
- `apps/core/api/src/modules/common/workorder/warehouses/warehouses.repository.ts`
- `apps/core/api/src/modules/common/workorder/warehouses/warehouses.routes.ts`
- `apps/core/api/src/modules/common/workorder/warehouses/warehouses.seed.ts`
- `apps/core/api/src/modules/common/workorder/warehouses/warehouses.service.ts`
- `apps/core/api/src/modules/common/workorder/warehouses/warehouses.types.ts`
- `apps/core/web/src/modules/common/workorder/warehouses/index.ts`
- `apps/core/web/src/modules/common/workorder/warehouses/warehouses.form.tsx`
- `apps/core/web/src/modules/common/workorder/warehouses/warehouses.hooks.ts`
- `apps/core/web/src/modules/common/workorder/warehouses/warehouses.list.tsx`
- `apps/core/web/src/modules/common/workorder/warehouses/warehouses.schema.ts`
- `apps/core/web/src/modules/common/workorder/warehouses/warehouses.services.ts`
- `apps/core/web/src/modules/common/workorder/warehouses/warehouses.types.ts`
- `apps/core/web/src/modules/common/workorder/warehouses/warehouses.workspace.tsx`

## Explicit route declarations

- `${WAREHOUSES_COLLECTION_PATH}/:id`
- `${WAREHOUSES_COLLECTION_PATH}/:id/activate`
- `${WAREHOUSES_COLLECTION_PATH}/:id/deactivate`
- `${WAREHOUSES_COLLECTION_PATH}/:id/force`

## Tables created by this leaf

- `core_warehouses`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
