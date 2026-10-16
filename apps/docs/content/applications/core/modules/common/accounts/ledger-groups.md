# Core: Common / Accounts / Ledger Groups

This page records the `common/accounts/ledger-groups` module in the Core owner. The application business context is: persisted organisation, contact, product and common reference masters.

## Workflow role

Core is the shared business master owner. Billing, CRM and Ecommerce reference its public contracts rather than copying or privately importing its entities.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/core/api/src/modules/common/accounts/ledger-groups/index.ts`
- `apps/core/api/src/modules/common/accounts/ledger-groups/ledger-groups.migration.ts`
- `apps/core/api/src/modules/common/accounts/ledger-groups/ledger-groups.module.ts`
- `apps/core/api/src/modules/common/accounts/ledger-groups/ledger-groups.repository.ts`
- `apps/core/api/src/modules/common/accounts/ledger-groups/ledger-groups.routes.ts`
- `apps/core/api/src/modules/common/accounts/ledger-groups/ledger-groups.seed.ts`
- `apps/core/api/src/modules/common/accounts/ledger-groups/ledger-groups.service.ts`
- `apps/core/api/src/modules/common/accounts/ledger-groups/ledger-groups.types.ts`
- `apps/core/web/src/modules/common/accounts/ledger-groups/index.ts`
- `apps/core/web/src/modules/common/accounts/ledger-groups/ledger-groups.form.tsx`
- `apps/core/web/src/modules/common/accounts/ledger-groups/ledger-groups.hooks.ts`
- `apps/core/web/src/modules/common/accounts/ledger-groups/ledger-groups.list.tsx`
- `apps/core/web/src/modules/common/accounts/ledger-groups/ledger-groups.schema.ts`
- `apps/core/web/src/modules/common/accounts/ledger-groups/ledger-groups.services.ts`
- `apps/core/web/src/modules/common/accounts/ledger-groups/ledger-groups.types.ts`
- `apps/core/web/src/modules/common/accounts/ledger-groups/ledger-groups.workspace.tsx`

## Explicit route declarations

- `${LEDGER_GROUPS_PATH}/:id`
- `${LEDGER_GROUPS_PATH}/:id/${action}`
- `${LEDGER_GROUPS_PATH}/:id/force`

## Tables created by this leaf

- `core_ledger_groups`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
