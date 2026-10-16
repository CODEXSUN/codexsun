# Billing: Sales

This page records the `sales` module in the Billing owner. The application business context is: commercial documents, payments, allocations, balances and reporting.

## Workflow role

Billing owns financial entries and settlement rules. Opening stock is not automatically a storefront availability promise.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/billing/api/src/modules/sales/index.ts`
- `apps/billing/api/src/modules/sales/sales.allocation-guard.ts`
- `apps/billing/api/src/modules/sales/sales.events.ts`
- `apps/billing/api/src/modules/sales/sales.lookup.ts`
- `apps/billing/api/src/modules/sales/sales.migration.ts`
- `apps/billing/api/src/modules/sales/sales.module.ts`
- `apps/billing/api/src/modules/sales/sales.quotation-link-guard.ts`
- `apps/billing/api/src/modules/sales/sales.repository-support.ts`
- `apps/billing/api/src/modules/sales/sales.repository.ts`
- `apps/billing/api/src/modules/sales/sales.routes.ts`
- `apps/billing/api/src/modules/sales/sales.seed.ts`
- `apps/billing/api/src/modules/sales/sales.service.ts`
- `apps/billing/api/src/modules/sales/sales.sync.ts`
- `apps/billing/api/src/modules/sales/sales.types.ts`
- `apps/billing/api/src/modules/sales/sales.worker.ts`
- `apps/billing/api/src/modules/sales/whitebooks.client.ts`
- `apps/billing/web/src/modules/sales/index.ts`
- `apps/billing/web/src/modules/sales/sales-address-editor.tsx`
- `apps/billing/web/src/modules/sales/sales.form-controller.tsx`
- `apps/billing/web/src/modules/sales/sales.form-section-1.tsx`
- `apps/billing/web/src/modules/sales/sales.form-section-2.tsx`
- `apps/billing/web/src/modules/sales/sales.form-section-3.tsx`
- `apps/billing/web/src/modules/sales/sales.form-section-4.tsx`
- `apps/billing/web/src/modules/sales/sales.form-section-5.tsx`
- `apps/billing/web/src/modules/sales/sales.form-view.tsx`
- `apps/billing/web/src/modules/sales/sales.form.tsx`
- `apps/billing/web/src/modules/sales/sales.hooks.ts`
- `apps/billing/web/src/modules/sales/sales.list.tsx`
- `apps/billing/web/src/modules/sales/sales.page.tsx`
- `apps/billing/web/src/modules/sales/sales.print-compliance.ts`
- `apps/billing/web/src/modules/sales/sales.print.tsx`
- `apps/billing/web/src/modules/sales/sales.schema.ts`
- `apps/billing/web/src/modules/sales/sales.services.ts`
- `apps/billing/web/src/modules/sales/sales.show.tsx`
- `apps/billing/web/src/modules/sales/sales.types.ts`
- `apps/billing/web/src/modules/sales/sales.workspace.tsx`

## Explicit route declarations

- `/billing/sales`
- `/billing/sales/:id`
- `/billing/sales/:id/cancel`
- `/billing/sales/:id/confirm`
- `/billing/sales/:id/einvoice`
- `/billing/sales/:id/einvoice/generate`
- `/billing/sales/:id/eway`
- `/billing/sales/:id/eway/generate`
- `/billing/sales/:id/revoke`
- `/billing/sales/context`
- `/billing/sales/lookups/contacts/:id/addresses`
- `/billing/sales/lookups/contacts/:id/addresses/:addressId`
- `/billing/sales/page`

## Tables created by this leaf

- `billing_sales`
- `billing_sales_activities`
- `billing_sales_comments`
- `billing_sales_einvoices`
- `billing_sales_entry_tools`
- `billing_sales_eway_bills`
- `billing_sales_items`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
