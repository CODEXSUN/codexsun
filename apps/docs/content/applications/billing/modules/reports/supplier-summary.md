# Billing: Reports / Supplier Summary

This page records the `reports/supplier-summary` module in the Billing owner. The application business context is: commercial documents, payments, allocations, balances and reporting.

## Workflow role

Billing owns financial entries and settlement rules. Opening stock is not automatically a storefront availability promise.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/billing/api/src/modules/reports/supplier-summary/index.ts`
- `apps/billing/api/src/modules/reports/supplier-summary/supplier-summary.module.ts`
- `apps/billing/api/src/modules/reports/supplier-summary/supplier-summary.repository.ts`
- `apps/billing/api/src/modules/reports/supplier-summary/supplier-summary.routes.ts`
- `apps/billing/api/src/modules/reports/supplier-summary/supplier-summary.service.ts`
- `apps/billing/api/src/modules/reports/supplier-summary/supplier-summary.types.ts`
- `apps/billing/web/src/modules/reports/supplier-summary/index.ts`
- `apps/billing/web/src/modules/reports/supplier-summary/supplier-summary.form.tsx`
- `apps/billing/web/src/modules/reports/supplier-summary/supplier-summary.hooks.ts`
- `apps/billing/web/src/modules/reports/supplier-summary/supplier-summary.list.tsx`
- `apps/billing/web/src/modules/reports/supplier-summary/supplier-summary.schema.ts`
- `apps/billing/web/src/modules/reports/supplier-summary/supplier-summary.services.ts`
- `apps/billing/web/src/modules/reports/supplier-summary/supplier-summary.types.ts`
- `apps/billing/web/src/modules/reports/supplier-summary/supplier-summary.workspace.tsx`

## Explicit route declarations

- `/billing/reports/supplier-summary`

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
