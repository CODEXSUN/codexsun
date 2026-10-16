# Core: Common / Others / Priorities

This page records the `common/others/priorities` module in the Core owner. The application business context is: persisted organisation, contact, product and common reference masters.

## Workflow role

Core is the shared business master owner. Billing, CRM and Ecommerce reference its public contracts rather than copying or privately importing its entities.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/core/api/src/modules/common/others/priorities/index.ts`
- `apps/core/api/src/modules/common/others/priorities/priorities.migration.ts`
- `apps/core/api/src/modules/common/others/priorities/priorities.module.ts`
- `apps/core/api/src/modules/common/others/priorities/priorities.repository.ts`
- `apps/core/api/src/modules/common/others/priorities/priorities.routes.ts`
- `apps/core/api/src/modules/common/others/priorities/priorities.seed.ts`
- `apps/core/api/src/modules/common/others/priorities/priorities.service.ts`
- `apps/core/api/src/modules/common/others/priorities/priorities.types.ts`
- `apps/core/web/src/modules/common/others/priorities/index.ts`
- `apps/core/web/src/modules/common/others/priorities/priorities.form.tsx`
- `apps/core/web/src/modules/common/others/priorities/priorities.hooks.ts`
- `apps/core/web/src/modules/common/others/priorities/priorities.list.tsx`
- `apps/core/web/src/modules/common/others/priorities/priorities.schema.ts`
- `apps/core/web/src/modules/common/others/priorities/priorities.services.ts`
- `apps/core/web/src/modules/common/others/priorities/priorities.types.ts`
- `apps/core/web/src/modules/common/others/priorities/priorities.workspace.tsx`

## Explicit route declarations

- `${PRIORITIES_COLLECTION_PATH}/:id`
- `${PRIORITIES_COLLECTION_PATH}/:id/activate`
- `${PRIORITIES_COLLECTION_PATH}/:id/deactivate`
- `${PRIORITIES_COLLECTION_PATH}/:id/force`

## Tables created by this leaf

- `core_priorities`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
