# Core: Common / Products / Units

This page records the `common/products/units` module in the Core owner. The application business context is: persisted organisation, contact, product and common reference masters.

## Workflow role

Core is the shared business master owner. Billing, CRM and Ecommerce reference its public contracts rather than copying or privately importing its entities.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/core/api/src/modules/common/products/units/index.ts`
- `apps/core/api/src/modules/common/products/units/units.migration.ts`
- `apps/core/api/src/modules/common/products/units/units.module.ts`
- `apps/core/api/src/modules/common/products/units/units.repository.ts`
- `apps/core/api/src/modules/common/products/units/units.routes.ts`
- `apps/core/api/src/modules/common/products/units/units.seed.ts`
- `apps/core/api/src/modules/common/products/units/units.service.ts`
- `apps/core/api/src/modules/common/products/units/units.types.ts`
- `apps/core/web/src/modules/common/products/units/index.ts`
- `apps/core/web/src/modules/common/products/units/units.form.tsx`
- `apps/core/web/src/modules/common/products/units/units.hooks.ts`
- `apps/core/web/src/modules/common/products/units/units.list.tsx`
- `apps/core/web/src/modules/common/products/units/units.schema.ts`
- `apps/core/web/src/modules/common/products/units/units.services.ts`
- `apps/core/web/src/modules/common/products/units/units.types.ts`
- `apps/core/web/src/modules/common/products/units/units.workspace.tsx`

## Explicit route declarations

- `${UNITS_COLLECTION_PATH}/:id`
- `${UNITS_COLLECTION_PATH}/:id/activate`
- `${UNITS_COLLECTION_PATH}/:id/deactivate`
- `${UNITS_COLLECTION_PATH}/:id/force`

## Tables created by this leaf

- `core_units`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
