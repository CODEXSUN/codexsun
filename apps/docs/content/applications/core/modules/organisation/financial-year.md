# Core: Organisation / Financial Year

This page records the `organisation/financial-year` module in the Core owner. The application business context is: persisted organisation, contact, product and common reference masters.

## Workflow role

Core is the shared business master owner. Billing, CRM and Ecommerce reference its public contracts rather than copying or privately importing its entities.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/core/api/src/modules/organisation/financial-year/financial-year.migration.ts`
- `apps/core/api/src/modules/organisation/financial-year/financial-year.module.ts`
- `apps/core/api/src/modules/organisation/financial-year/financial-year.repository.ts`
- `apps/core/api/src/modules/organisation/financial-year/financial-year.routes.ts`
- `apps/core/api/src/modules/organisation/financial-year/financial-year.seed.ts`
- `apps/core/api/src/modules/organisation/financial-year/financial-year.service.ts`
- `apps/core/api/src/modules/organisation/financial-year/financial-year.types.ts`
- `apps/core/api/src/modules/organisation/financial-year/index.ts`
- `apps/core/web/src/modules/organisation/financial-year/financial-year.form.tsx`
- `apps/core/web/src/modules/organisation/financial-year/financial-year.hooks.ts`
- `apps/core/web/src/modules/organisation/financial-year/financial-year.list.tsx`
- `apps/core/web/src/modules/organisation/financial-year/financial-year.schema.ts`
- `apps/core/web/src/modules/organisation/financial-year/financial-year.services.ts`
- `apps/core/web/src/modules/organisation/financial-year/financial-year.types.ts`
- `apps/core/web/src/modules/organisation/financial-year/financial-year.workspace.tsx`
- `apps/core/web/src/modules/organisation/financial-year/index.ts`

## Explicit route declarations

- `${FINANCIAL_YEAR_COLLECTION_PATH}/:id`
- `${FINANCIAL_YEAR_COLLECTION_PATH}/:id/${action}`
- `${FINANCIAL_YEAR_COLLECTION_PATH}/:id/force`
- `${FINANCIAL_YEAR_COLLECTION_PATH}/current`

## Tables created by this leaf

- `core_financial_years`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
