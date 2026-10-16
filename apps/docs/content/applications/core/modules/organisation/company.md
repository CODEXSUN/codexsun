# Core: Organisation / Company

This page records the `organisation/company` module in the Core owner. The application business context is: persisted organisation, contact, product and common reference masters.

## Workflow role

Core is the shared business master owner. Billing, CRM and Ecommerce reference its public contracts rather than copying or privately importing its entities.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/core/api/src/modules/organisation/company/company.migration.ts`
- `apps/core/api/src/modules/organisation/company/company.module.ts`
- `apps/core/api/src/modules/organisation/company/company.repository.ts`
- `apps/core/api/src/modules/organisation/company/company.routes.ts`
- `apps/core/api/src/modules/organisation/company/company.seed.ts`
- `apps/core/api/src/modules/organisation/company/company.service.ts`
- `apps/core/api/src/modules/organisation/company/company.types.ts`
- `apps/core/api/src/modules/organisation/company/index.ts`
- `apps/core/web/src/modules/organisation/company/company.branding.ts`
- `apps/core/web/src/modules/organisation/company/company.form.tsx`
- `apps/core/web/src/modules/organisation/company/company.hooks.ts`
- `apps/core/web/src/modules/organisation/company/company.list.tsx`
- `apps/core/web/src/modules/organisation/company/company.schema.ts`
- `apps/core/web/src/modules/organisation/company/company.services.ts`
- `apps/core/web/src/modules/organisation/company/company.spec.ts`
- `apps/core/web/src/modules/organisation/company/company.types.ts`
- `apps/core/web/src/modules/organisation/company/company.workspace.tsx`
- `apps/core/web/src/modules/organisation/company/index.ts`

## Explicit route declarations

- `https://codexsun.com`
- `${COMPANY_COLLECTION_PATH}/:id`
- `${COMPANY_COLLECTION_PATH}/:id/${action}`
- `${COMPANY_COLLECTION_PATH}/:id/force`

## Tables created by this leaf

- `core_companies`
- `core_companies_`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
