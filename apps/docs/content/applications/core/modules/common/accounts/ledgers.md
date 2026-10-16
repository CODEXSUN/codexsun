# Core: Common / Accounts / Ledgers

This page records the `common/accounts/ledgers` module in the Core owner. The application business context is: persisted organisation, contact, product and common reference masters.

## Workflow role

Core is the shared business master owner. Billing, CRM and Ecommerce reference its public contracts rather than copying or privately importing its entities.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/core/api/src/modules/common/accounts/ledgers/index.ts`
- `apps/core/api/src/modules/common/accounts/ledgers/ledgers.migration.ts`
- `apps/core/api/src/modules/common/accounts/ledgers/ledgers.module.ts`
- `apps/core/api/src/modules/common/accounts/ledgers/ledgers.repository.ts`
- `apps/core/api/src/modules/common/accounts/ledgers/ledgers.routes.ts`
- `apps/core/api/src/modules/common/accounts/ledgers/ledgers.seed.ts`
- `apps/core/api/src/modules/common/accounts/ledgers/ledgers.service.ts`
- `apps/core/api/src/modules/common/accounts/ledgers/ledgers.types.ts`
- `apps/core/web/src/modules/common/accounts/ledgers/index.ts`
- `apps/core/web/src/modules/common/accounts/ledgers/ledgers.form.tsx`
- `apps/core/web/src/modules/common/accounts/ledgers/ledgers.hooks.ts`
- `apps/core/web/src/modules/common/accounts/ledgers/ledgers.list.tsx`
- `apps/core/web/src/modules/common/accounts/ledgers/ledgers.schema.ts`
- `apps/core/web/src/modules/common/accounts/ledgers/ledgers.services.ts`
- `apps/core/web/src/modules/common/accounts/ledgers/ledgers.types.ts`
- `apps/core/web/src/modules/common/accounts/ledgers/ledgers.workspace.tsx`

## Explicit route declarations

- `${LEDGERS_PATH}/:id`
- `${LEDGERS_PATH}/:id/${action}`
- `${LEDGERS_PATH}/:id/force`

## Tables created by this leaf

- `core_ledgers`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
