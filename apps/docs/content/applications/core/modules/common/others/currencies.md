# Core: Common / Others / Currencies

This page records the `common/others/currencies` module in the Core owner. The application business context is: persisted organisation, contact, product and common reference masters.

## Workflow role

Core is the shared business master owner. Billing, CRM and Ecommerce reference its public contracts rather than copying or privately importing its entities.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/core/api/src/modules/common/others/currencies/currencies.migration.ts`
- `apps/core/api/src/modules/common/others/currencies/currencies.module.ts`
- `apps/core/api/src/modules/common/others/currencies/currencies.repository.ts`
- `apps/core/api/src/modules/common/others/currencies/currencies.routes.ts`
- `apps/core/api/src/modules/common/others/currencies/currencies.seed.ts`
- `apps/core/api/src/modules/common/others/currencies/currencies.service.ts`
- `apps/core/api/src/modules/common/others/currencies/currencies.types.ts`
- `apps/core/api/src/modules/common/others/currencies/index.ts`
- `apps/core/web/src/modules/common/others/currencies/currencies.form.tsx`
- `apps/core/web/src/modules/common/others/currencies/currencies.hooks.ts`
- `apps/core/web/src/modules/common/others/currencies/currencies.list.tsx`
- `apps/core/web/src/modules/common/others/currencies/currencies.schema.ts`
- `apps/core/web/src/modules/common/others/currencies/currencies.services.ts`
- `apps/core/web/src/modules/common/others/currencies/currencies.types.ts`
- `apps/core/web/src/modules/common/others/currencies/currencies.workspace.tsx`
- `apps/core/web/src/modules/common/others/currencies/index.ts`

## Explicit route declarations

- `${CURRENCIES_COLLECTION_PATH}/:id`
- `${CURRENCIES_COLLECTION_PATH}/:id/activate`
- `${CURRENCIES_COLLECTION_PATH}/:id/deactivate`
- `${CURRENCIES_COLLECTION_PATH}/:id/force`

## Tables created by this leaf

- `core_currencies`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
