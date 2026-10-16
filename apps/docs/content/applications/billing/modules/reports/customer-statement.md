# Billing: Reports / Customer Statement

This page records the `reports/customer-statement` module in the Billing owner. The application business context is: commercial documents, payments, allocations, balances and reporting.

## Workflow role

Billing owns financial entries and settlement rules. Opening stock is not automatically a storefront availability promise.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/billing/api/src/modules/reports/customer-statement/customer-statement.ageing.ts`
- `apps/billing/api/src/modules/reports/customer-statement/customer-statement.module.ts`
- `apps/billing/api/src/modules/reports/customer-statement/customer-statement.repository.ts`
- `apps/billing/api/src/modules/reports/customer-statement/customer-statement.routes.ts`
- `apps/billing/api/src/modules/reports/customer-statement/customer-statement.service.ts`
- `apps/billing/api/src/modules/reports/customer-statement/customer-statement.types.ts`
- `apps/billing/api/src/modules/reports/customer-statement/index.ts`
- `apps/billing/web/src/modules/reports/customer-statement/customer-statement.form.tsx`
- `apps/billing/web/src/modules/reports/customer-statement/customer-statement.hooks.ts`
- `apps/billing/web/src/modules/reports/customer-statement/customer-statement.list.tsx`
- `apps/billing/web/src/modules/reports/customer-statement/customer-statement.page.tsx`
- `apps/billing/web/src/modules/reports/customer-statement/customer-statement.print.tsx`
- `apps/billing/web/src/modules/reports/customer-statement/customer-statement.schema.ts`
- `apps/billing/web/src/modules/reports/customer-statement/customer-statement.services.ts`
- `apps/billing/web/src/modules/reports/customer-statement/customer-statement.types.ts`
- `apps/billing/web/src/modules/reports/customer-statement/customer-statement.workspace.tsx`
- `apps/billing/web/src/modules/reports/customer-statement/index.ts`

## Explicit route declarations

- `/billing/reports/customer-statement`

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
