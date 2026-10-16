# Billing: Reports / Gst Statement

This page records the `reports/gst-statement` module in the Billing owner. The application business context is: commercial documents, payments, allocations, balances and reporting.

## Workflow role

Billing owns financial entries and settlement rules. Opening stock is not automatically a storefront availability promise.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/billing/api/src/modules/reports/gst-statement/gst-statement.migration.ts`
- `apps/billing/api/src/modules/reports/gst-statement/gst-statement.module.ts`
- `apps/billing/api/src/modules/reports/gst-statement/gst-statement.repository.ts`
- `apps/billing/api/src/modules/reports/gst-statement/gst-statement.routes.ts`
- `apps/billing/api/src/modules/reports/gst-statement/gst-statement.service.ts`
- `apps/billing/api/src/modules/reports/gst-statement/gst-statement.types.ts`
- `apps/billing/api/src/modules/reports/gst-statement/index.ts`
- `apps/billing/web/src/modules/reports/gst-statement/gst-statement.form.tsx`
- `apps/billing/web/src/modules/reports/gst-statement/gst-statement.hooks.ts`
- `apps/billing/web/src/modules/reports/gst-statement/gst-statement.list.tsx`
- `apps/billing/web/src/modules/reports/gst-statement/gst-statement.page.tsx`
- `apps/billing/web/src/modules/reports/gst-statement/gst-statement.print.tsx`
- `apps/billing/web/src/modules/reports/gst-statement/gst-statement.schema.ts`
- `apps/billing/web/src/modules/reports/gst-statement/gst-statement.services.ts`
- `apps/billing/web/src/modules/reports/gst-statement/gst-statement.types.ts`
- `apps/billing/web/src/modules/reports/gst-statement/gst-statement.workspace.tsx`
- `apps/billing/web/src/modules/reports/gst-statement/index.ts`

## Explicit route declarations

- `/billing/reports/gst-statement`
- `/billing/reports/gst-statement/filing`

## Tables created by this leaf

- `billing_gst_filings`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
