# Core: Common / Location / District

This page records the `common/location/district` module in the Core owner. The application business context is: persisted organisation, contact, product and common reference masters.

## Workflow role

Core is the shared business master owner. Billing, CRM and Ecommerce reference its public contracts rather than copying or privately importing its entities.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/core/api/src/modules/common/location/district/district.migration.ts`
- `apps/core/api/src/modules/common/location/district/district.module.ts`
- `apps/core/api/src/modules/common/location/district/district.repository.ts`
- `apps/core/api/src/modules/common/location/district/district.routes.ts`
- `apps/core/api/src/modules/common/location/district/district.seed.ts`
- `apps/core/api/src/modules/common/location/district/district.service.ts`
- `apps/core/api/src/modules/common/location/district/district.types.ts`
- `apps/core/api/src/modules/common/location/district/index.ts`
- `apps/core/web/src/modules/common/location/district/district.form.tsx`
- `apps/core/web/src/modules/common/location/district/district.hooks.ts`
- `apps/core/web/src/modules/common/location/district/district.list.tsx`
- `apps/core/web/src/modules/common/location/district/district.schema.ts`
- `apps/core/web/src/modules/common/location/district/district.services.ts`
- `apps/core/web/src/modules/common/location/district/district.types.ts`
- `apps/core/web/src/modules/common/location/district/district.workspace.tsx`
- `apps/core/web/src/modules/common/location/district/index.ts`

## Explicit route declarations

- `${DISTRICT_COLLECTION_PATH}/:id`
- `${DISTRICT_COLLECTION_PATH}/:id/${action}`
- `${DISTRICT_COLLECTION_PATH}/:id/force`

## Tables created by this leaf

- `core_districts`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
