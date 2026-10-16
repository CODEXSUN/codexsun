# Billing: Export Sales

This page records the `export-sales` module in the Billing owner. The application business context is: commercial documents, payments, allocations, balances and reporting.

## Workflow role

Billing owns financial entries and settlement rules. Opening stock is not automatically a storefront availability promise.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/billing/api/src/modules/export-sales/export-sales-whitebooks.client.ts`
- `apps/billing/api/src/modules/export-sales/export-sales.events.ts`
- `apps/billing/api/src/modules/export-sales/export-sales.lookup.ts`
- `apps/billing/api/src/modules/export-sales/export-sales.migration.ts`
- `apps/billing/api/src/modules/export-sales/export-sales.module.ts`
- `apps/billing/api/src/modules/export-sales/export-sales.repository-support.ts`
- `apps/billing/api/src/modules/export-sales/export-sales.repository.ts`
- `apps/billing/api/src/modules/export-sales/export-sales.routes.ts`
- `apps/billing/api/src/modules/export-sales/export-sales.seed.ts`
- `apps/billing/api/src/modules/export-sales/export-sales.service.ts`
- `apps/billing/api/src/modules/export-sales/export-sales.sync.ts`
- `apps/billing/api/src/modules/export-sales/export-sales.types.ts`
- `apps/billing/api/src/modules/export-sales/export-sales.worker.ts`
- `apps/billing/api/src/modules/export-sales/index.ts`
- `apps/billing/web/src/modules/export-sales/export-sales-address-editor.tsx`
- `apps/billing/web/src/modules/export-sales/export-sales.form-controller.tsx`
- `apps/billing/web/src/modules/export-sales/export-sales.form-section-1.tsx`
- `apps/billing/web/src/modules/export-sales/export-sales.form-section-2.tsx`
- `apps/billing/web/src/modules/export-sales/export-sales.form-section-3.tsx`
- `apps/billing/web/src/modules/export-sales/export-sales.form-section-4.tsx`
- `apps/billing/web/src/modules/export-sales/export-sales.form-section-5.tsx`
- `apps/billing/web/src/modules/export-sales/export-sales.form-view.tsx`
- `apps/billing/web/src/modules/export-sales/export-sales.form.tsx`
- `apps/billing/web/src/modules/export-sales/export-sales.hooks.ts`
- `apps/billing/web/src/modules/export-sales/export-sales.list.tsx`
- `apps/billing/web/src/modules/export-sales/export-sales.page.tsx`
- `apps/billing/web/src/modules/export-sales/export-sales.print.tsx`
- `apps/billing/web/src/modules/export-sales/export-sales.schema.ts`
- `apps/billing/web/src/modules/export-sales/export-sales.services.ts`
- `apps/billing/web/src/modules/export-sales/export-sales.show.tsx`
- `apps/billing/web/src/modules/export-sales/export-sales.types.ts`
- `apps/billing/web/src/modules/export-sales/export-sales.workspace.tsx`
- `apps/billing/web/src/modules/export-sales/index.ts`

## Explicit route declarations

- `/billing/export-sales`
- `/billing/export-sales/:id`
- `/billing/export-sales/:id/cancel`
- `/billing/export-sales/:id/confirm`
- `/billing/export-sales/:id/einvoice/generate`
- `/billing/export-sales/:id/eway/generate`
- `/billing/export-sales/:id/revoke`
- `/billing/export-sales/context`
- `/billing/export-sales/lookups/contacts/:id/addresses`
- `/billing/export-sales/lookups/contacts/:id/addresses/:addressId`
- `/billing/export-sales/page`

## Tables created by this leaf

- `billing_export_sales`
- `billing_export_sales_activities`
- `billing_export_sales_comments`
- `billing_export_sales_einvoices`
- `billing_export_sales_entry_tools`
- `billing_export_sales_eway_bills`
- `billing_export_sales_items`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
