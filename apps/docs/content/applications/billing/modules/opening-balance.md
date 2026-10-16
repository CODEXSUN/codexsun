# Billing: Opening Balance

This page records the `opening-balance` module in the Billing owner. The application business context is: commercial documents, payments, allocations, balances and reporting.

## Workflow role

Billing owns financial entries and settlement rules. Opening stock is not automatically a storefront availability promise.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/billing/api/src/modules/opening-balance/index.ts`
- `apps/billing/api/src/modules/opening-balance/opening-balance.migration.ts`
- `apps/billing/api/src/modules/opening-balance/opening-balance.module.ts`
- `apps/billing/api/src/modules/opening-balance/opening-balance.repository.ts`
- `apps/billing/api/src/modules/opening-balance/opening-balance.routes.ts`
- `apps/billing/api/src/modules/opening-balance/opening-balance.seed.ts`
- `apps/billing/api/src/modules/opening-balance/opening-balance.service.ts`
- `apps/billing/api/src/modules/opening-balance/opening-balance.types.ts`
- `apps/billing/web/src/modules/opening-balance/index.ts`
- `apps/billing/web/src/modules/opening-balance/opening-balance.form.tsx`
- `apps/billing/web/src/modules/opening-balance/opening-balance.hooks.ts`
- `apps/billing/web/src/modules/opening-balance/opening-balance.list.tsx`
- `apps/billing/web/src/modules/opening-balance/opening-balance.schema.ts`
- `apps/billing/web/src/modules/opening-balance/opening-balance.services.ts`
- `apps/billing/web/src/modules/opening-balance/opening-balance.types.ts`
- `apps/billing/web/src/modules/opening-balance/opening-balance.workspace.tsx`

## Explicit route declarations

- `/billing/opening-balances`

## Tables created by this leaf

- `billing_opening_balance_activities`
- `billing_opening_balance_legacy_assignments`
- `billing_opening_balances`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
