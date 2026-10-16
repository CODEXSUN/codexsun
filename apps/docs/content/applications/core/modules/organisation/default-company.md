# Core: Organisation / Default Company

This page records the `organisation/default-company` module in the Core owner. The application business context is: persisted organisation, contact, product and common reference masters.

## Workflow role

Core is the shared business master owner. Billing, CRM and Ecommerce reference its public contracts rather than copying or privately importing its entities.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/core/api/src/modules/organisation/default-company/default-company.migration.ts`
- `apps/core/api/src/modules/organisation/default-company/default-company.module.ts`
- `apps/core/api/src/modules/organisation/default-company/default-company.repository.ts`
- `apps/core/api/src/modules/organisation/default-company/default-company.routes.ts`
- `apps/core/api/src/modules/organisation/default-company/default-company.seed.ts`
- `apps/core/api/src/modules/organisation/default-company/default-company.service.ts`
- `apps/core/api/src/modules/organisation/default-company/default-company.types.ts`
- `apps/core/api/src/modules/organisation/default-company/index.ts`
- `apps/core/web/src/modules/organisation/default-company/default-company.form.tsx`
- `apps/core/web/src/modules/organisation/default-company/default-company.hooks.ts`
- `apps/core/web/src/modules/organisation/default-company/default-company.list.tsx`
- `apps/core/web/src/modules/organisation/default-company/default-company.schema.ts`
- `apps/core/web/src/modules/organisation/default-company/default-company.services.ts`
- `apps/core/web/src/modules/organisation/default-company/default-company.types.ts`
- `apps/core/web/src/modules/organisation/default-company/default-company.workspace.tsx`
- `apps/core/web/src/modules/organisation/default-company/index.ts`

## Explicit route declarations

- `${DEFAULT_COMPANY_PATH}/company-lookups`
- `${DEFAULT_COMPANY_PATH}/financial-year-lookups`

## Tables created by this leaf

- `core_default_company_settings`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
