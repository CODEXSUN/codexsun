# Core: Common / Workorder / Work Order Types

This page records the `common/workorder/work-order-types` module in the Core owner. The application business context is: persisted organisation, contact, product and common reference masters.

## Workflow role

Core is the shared business master owner. Billing, CRM and Ecommerce reference its public contracts rather than copying or privately importing its entities.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/core/api/src/modules/common/workorder/work-order-types/index.ts`
- `apps/core/api/src/modules/common/workorder/work-order-types/work-order-types.migration.ts`
- `apps/core/api/src/modules/common/workorder/work-order-types/work-order-types.module.ts`
- `apps/core/api/src/modules/common/workorder/work-order-types/work-order-types.repository.ts`
- `apps/core/api/src/modules/common/workorder/work-order-types/work-order-types.routes.ts`
- `apps/core/api/src/modules/common/workorder/work-order-types/work-order-types.seed.ts`
- `apps/core/api/src/modules/common/workorder/work-order-types/work-order-types.service.ts`
- `apps/core/api/src/modules/common/workorder/work-order-types/work-order-types.types.ts`
- `apps/core/web/src/modules/common/workorder/work-order-types/index.ts`
- `apps/core/web/src/modules/common/workorder/work-order-types/work-order-types.form.tsx`
- `apps/core/web/src/modules/common/workorder/work-order-types/work-order-types.hooks.ts`
- `apps/core/web/src/modules/common/workorder/work-order-types/work-order-types.list.tsx`
- `apps/core/web/src/modules/common/workorder/work-order-types/work-order-types.schema.ts`
- `apps/core/web/src/modules/common/workorder/work-order-types/work-order-types.services.ts`
- `apps/core/web/src/modules/common/workorder/work-order-types/work-order-types.types.ts`
- `apps/core/web/src/modules/common/workorder/work-order-types/work-order-types.workspace.tsx`

## Explicit route declarations

- `${WORK_ORDER_TYPES_COLLECTION_PATH}/:id`
- `${WORK_ORDER_TYPES_COLLECTION_PATH}/:id/activate`
- `${WORK_ORDER_TYPES_COLLECTION_PATH}/:id/deactivate`
- `${WORK_ORDER_TYPES_COLLECTION_PATH}/:id/force`

## Tables created by this leaf

- `core_work_order_types`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
