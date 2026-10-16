# Billing: Reports / Stock Statement

This page records the `reports/stock-statement` module in the Billing owner. The application business context is: commercial documents, payments, allocations, balances and reporting.

## Workflow role

Billing owns financial entries and settlement rules. Opening stock is not automatically a storefront availability promise.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/billing/api/src/modules/reports/stock-statement/index.ts`
- `apps/billing/api/src/modules/reports/stock-statement/stock-statement.module.ts`
- `apps/billing/api/src/modules/reports/stock-statement/stock-statement.repository.ts`
- `apps/billing/api/src/modules/reports/stock-statement/stock-statement.routes.ts`
- `apps/billing/api/src/modules/reports/stock-statement/stock-statement.service.ts`
- `apps/billing/api/src/modules/reports/stock-statement/stock-statement.types.ts`
- `apps/billing/web/src/modules/reports/stock-statement/index.ts`
- `apps/billing/web/src/modules/reports/stock-statement/stock-statement.form.tsx`
- `apps/billing/web/src/modules/reports/stock-statement/stock-statement.hooks.ts`
- `apps/billing/web/src/modules/reports/stock-statement/stock-statement.list.tsx`
- `apps/billing/web/src/modules/reports/stock-statement/stock-statement.page.tsx`
- `apps/billing/web/src/modules/reports/stock-statement/stock-statement.print.tsx`
- `apps/billing/web/src/modules/reports/stock-statement/stock-statement.schema.ts`
- `apps/billing/web/src/modules/reports/stock-statement/stock-statement.services.ts`
- `apps/billing/web/src/modules/reports/stock-statement/stock-statement.types.ts`
- `apps/billing/web/src/modules/reports/stock-statement/stock-statement.workspace.tsx`

## Explicit route declarations

- `/billing/reports/stock-statement`

## Tables created by this leaf

No CREATE TABLE literal was found in this leaf. It may be read-only, composition-only, share a parent table, or register its migration through an owner lifecycle.

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
