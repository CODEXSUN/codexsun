# Core: Common / Products / Colours

This page records the `common/products/colours` module in the Core owner. The application business context is: persisted organisation, contact, product and common reference masters.

## Workflow role

Core is the shared business master owner. Billing, CRM and Ecommerce reference its public contracts rather than copying or privately importing its entities.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/core/api/src/modules/common/products/colours/colours.migration.ts`
- `apps/core/api/src/modules/common/products/colours/colours.module.ts`
- `apps/core/api/src/modules/common/products/colours/colours.repository.ts`
- `apps/core/api/src/modules/common/products/colours/colours.routes.ts`
- `apps/core/api/src/modules/common/products/colours/colours.seed.ts`
- `apps/core/api/src/modules/common/products/colours/colours.service.ts`
- `apps/core/api/src/modules/common/products/colours/colours.types.ts`
- `apps/core/api/src/modules/common/products/colours/index.ts`
- `apps/core/web/src/modules/common/products/colours/colours.form.tsx`
- `apps/core/web/src/modules/common/products/colours/colours.hooks.ts`
- `apps/core/web/src/modules/common/products/colours/colours.list.tsx`
- `apps/core/web/src/modules/common/products/colours/colours.schema.ts`
- `apps/core/web/src/modules/common/products/colours/colours.services.ts`
- `apps/core/web/src/modules/common/products/colours/colours.types.ts`
- `apps/core/web/src/modules/common/products/colours/colours.workspace.tsx`
- `apps/core/web/src/modules/common/products/colours/index.ts`

## Explicit route declarations

- `${COLOURS_COLLECTION_PATH}/:id`
- `${COLOURS_COLLECTION_PATH}/:id/activate`
- `${COLOURS_COLLECTION_PATH}/:id/deactivate`
- `${COLOURS_COLLECTION_PATH}/:id/force`

## Tables created by this leaf

- `core_colours`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
