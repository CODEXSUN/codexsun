# Core: Common / Others / Months

This page records the `common/others/months` module in the Core owner. The application business context is: persisted organisation, contact, product and common reference masters.

## Workflow role

Core is the shared business master owner. Billing, CRM and Ecommerce reference its public contracts rather than copying or privately importing its entities.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/core/api/src/modules/common/others/months/index.ts`
- `apps/core/api/src/modules/common/others/months/months.migration.ts`
- `apps/core/api/src/modules/common/others/months/months.module.ts`
- `apps/core/api/src/modules/common/others/months/months.repository.ts`
- `apps/core/api/src/modules/common/others/months/months.routes.ts`
- `apps/core/api/src/modules/common/others/months/months.seed.ts`
- `apps/core/api/src/modules/common/others/months/months.service.ts`
- `apps/core/api/src/modules/common/others/months/months.types.ts`
- `apps/core/web/src/modules/common/others/months/index.ts`
- `apps/core/web/src/modules/common/others/months/months.form.tsx`
- `apps/core/web/src/modules/common/others/months/months.hooks.ts`
- `apps/core/web/src/modules/common/others/months/months.list.tsx`
- `apps/core/web/src/modules/common/others/months/months.schema.ts`
- `apps/core/web/src/modules/common/others/months/months.services.ts`
- `apps/core/web/src/modules/common/others/months/months.types.ts`
- `apps/core/web/src/modules/common/others/months/months.workspace.tsx`

## Explicit route declarations

- `${MONTHS_COLLECTION_PATH}/:id`
- `${MONTHS_COLLECTION_PATH}/:id/activate`
- `${MONTHS_COLLECTION_PATH}/:id/deactivate`
- `${MONTHS_COLLECTION_PATH}/:id/force`

## Tables created by this leaf

- `core_months`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
