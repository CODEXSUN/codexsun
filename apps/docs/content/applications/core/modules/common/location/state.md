# Core: Common / Location / State

This page records the `common/location/state` module in the Core owner. The application business context is: persisted organisation, contact, product and common reference masters.

## Workflow role

Core is the shared business master owner. Billing, CRM and Ecommerce reference its public contracts rather than copying or privately importing its entities.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/core/api/src/modules/common/location/state/index.ts`
- `apps/core/api/src/modules/common/location/state/state.migration.ts`
- `apps/core/api/src/modules/common/location/state/state.module.ts`
- `apps/core/api/src/modules/common/location/state/state.repository.ts`
- `apps/core/api/src/modules/common/location/state/state.routes.ts`
- `apps/core/api/src/modules/common/location/state/state.seed.ts`
- `apps/core/api/src/modules/common/location/state/state.service.ts`
- `apps/core/api/src/modules/common/location/state/state.types.ts`
- `apps/core/web/src/modules/common/location/state/index.ts`
- `apps/core/web/src/modules/common/location/state/state.form.tsx`
- `apps/core/web/src/modules/common/location/state/state.hooks.ts`
- `apps/core/web/src/modules/common/location/state/state.list.tsx`
- `apps/core/web/src/modules/common/location/state/state.schema.ts`
- `apps/core/web/src/modules/common/location/state/state.services.ts`
- `apps/core/web/src/modules/common/location/state/state.types.ts`
- `apps/core/web/src/modules/common/location/state/state.workspace.tsx`

## Explicit route declarations

- `${STATE_COLLECTION_PATH}/:id`
- `${STATE_COLLECTION_PATH}/:id/${action}`
- `${STATE_COLLECTION_PATH}/:id/force`

## Tables created by this leaf

- `core_states`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
