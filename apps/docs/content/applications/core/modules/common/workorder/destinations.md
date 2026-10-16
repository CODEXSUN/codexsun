# Core: Common / Workorder / Destinations

This page records the `common/workorder/destinations` module in the Core owner. The application business context is: persisted organisation, contact, product and common reference masters.

## Workflow role

Core is the shared business master owner. Billing, CRM and Ecommerce reference its public contracts rather than copying or privately importing its entities.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/core/api/src/modules/common/workorder/destinations/destinations.migration.ts`
- `apps/core/api/src/modules/common/workorder/destinations/destinations.module.ts`
- `apps/core/api/src/modules/common/workorder/destinations/destinations.repository.ts`
- `apps/core/api/src/modules/common/workorder/destinations/destinations.routes.ts`
- `apps/core/api/src/modules/common/workorder/destinations/destinations.seed.ts`
- `apps/core/api/src/modules/common/workorder/destinations/destinations.service.ts`
- `apps/core/api/src/modules/common/workorder/destinations/destinations.types.ts`
- `apps/core/api/src/modules/common/workorder/destinations/index.ts`
- `apps/core/web/src/modules/common/workorder/destinations/destinations.form.tsx`
- `apps/core/web/src/modules/common/workorder/destinations/destinations.hooks.ts`
- `apps/core/web/src/modules/common/workorder/destinations/destinations.list.tsx`
- `apps/core/web/src/modules/common/workorder/destinations/destinations.schema.ts`
- `apps/core/web/src/modules/common/workorder/destinations/destinations.services.ts`
- `apps/core/web/src/modules/common/workorder/destinations/destinations.types.ts`
- `apps/core/web/src/modules/common/workorder/destinations/destinations.workspace.tsx`
- `apps/core/web/src/modules/common/workorder/destinations/index.ts`

## Explicit route declarations

- `${DESTINATIONS_COLLECTION_PATH}/:id`
- `${DESTINATIONS_COLLECTION_PATH}/:id/activate`
- `${DESTINATIONS_COLLECTION_PATH}/:id/deactivate`
- `${DESTINATIONS_COLLECTION_PATH}/:id/force`

## Tables created by this leaf

- `core_destinations`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
