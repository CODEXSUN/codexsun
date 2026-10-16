# Core: Common / Workorder / Transports

This page records the `common/workorder/transports` module in the Core owner. The application business context is: persisted organisation, contact, product and common reference masters.

## Workflow role

Core is the shared business master owner. Billing, CRM and Ecommerce reference its public contracts rather than copying or privately importing its entities.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/core/api/src/modules/common/workorder/transports/index.ts`
- `apps/core/api/src/modules/common/workorder/transports/transports.migration.ts`
- `apps/core/api/src/modules/common/workorder/transports/transports.module.ts`
- `apps/core/api/src/modules/common/workorder/transports/transports.repository.ts`
- `apps/core/api/src/modules/common/workorder/transports/transports.routes.ts`
- `apps/core/api/src/modules/common/workorder/transports/transports.seed.ts`
- `apps/core/api/src/modules/common/workorder/transports/transports.service.ts`
- `apps/core/api/src/modules/common/workorder/transports/transports.types.ts`
- `apps/core/web/src/modules/common/workorder/transports/index.ts`
- `apps/core/web/src/modules/common/workorder/transports/transports.form.tsx`
- `apps/core/web/src/modules/common/workorder/transports/transports.hooks.ts`
- `apps/core/web/src/modules/common/workorder/transports/transports.list.tsx`
- `apps/core/web/src/modules/common/workorder/transports/transports.schema.ts`
- `apps/core/web/src/modules/common/workorder/transports/transports.services.ts`
- `apps/core/web/src/modules/common/workorder/transports/transports.types.ts`
- `apps/core/web/src/modules/common/workorder/transports/transports.workspace.tsx`

## Explicit route declarations

- `${TRANSPORTS_COLLECTION_PATH}/:id`
- `${TRANSPORTS_COLLECTION_PATH}/:id/activate`
- `${TRANSPORTS_COLLECTION_PATH}/:id/deactivate`
- `${TRANSPORTS_COLLECTION_PATH}/:id/force`

## Tables created by this leaf

- `core_transports`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
