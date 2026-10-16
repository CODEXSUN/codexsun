# Core: Common / Products / Taxes

This page records the `common/products/taxes` module in the Core owner. The application business context is: persisted organisation, contact, product and common reference masters.

## Workflow role

Core is the shared business master owner. Billing, CRM and Ecommerce reference its public contracts rather than copying or privately importing its entities.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/core/api/src/modules/common/products/taxes/index.ts`
- `apps/core/api/src/modules/common/products/taxes/taxes.migration.ts`
- `apps/core/api/src/modules/common/products/taxes/taxes.module.ts`
- `apps/core/api/src/modules/common/products/taxes/taxes.repository.ts`
- `apps/core/api/src/modules/common/products/taxes/taxes.routes.ts`
- `apps/core/api/src/modules/common/products/taxes/taxes.seed.ts`
- `apps/core/api/src/modules/common/products/taxes/taxes.service.ts`
- `apps/core/api/src/modules/common/products/taxes/taxes.types.ts`
- `apps/core/web/src/modules/common/products/taxes/index.ts`
- `apps/core/web/src/modules/common/products/taxes/taxes.form.tsx`
- `apps/core/web/src/modules/common/products/taxes/taxes.hooks.ts`
- `apps/core/web/src/modules/common/products/taxes/taxes.list.tsx`
- `apps/core/web/src/modules/common/products/taxes/taxes.schema.ts`
- `apps/core/web/src/modules/common/products/taxes/taxes.services.ts`
- `apps/core/web/src/modules/common/products/taxes/taxes.types.ts`
- `apps/core/web/src/modules/common/products/taxes/taxes.workspace.tsx`

## Explicit route declarations

- `${TAXES_COLLECTION_PATH}/:id`
- `${TAXES_COLLECTION_PATH}/:id/activate`
- `${TAXES_COLLECTION_PATH}/:id/deactivate`
- `${TAXES_COLLECTION_PATH}/:id/force`

## Tables created by this leaf

- `core_taxes`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
