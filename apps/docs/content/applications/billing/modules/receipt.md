# Billing: Receipt

This page records the `receipt` module in the Billing owner. The application business context is: commercial documents, payments, allocations, balances and reporting.

## Workflow role

Billing owns financial entries and settlement rules. Opening stock is not automatically a storefront availability promise.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/billing/api/src/modules/receipt/index.ts`
- `apps/billing/api/src/modules/receipt/receipt.events.ts`
- `apps/billing/api/src/modules/receipt/receipt.export-allocation.guard.ts`
- `apps/billing/api/src/modules/receipt/receipt.export-allocation.migration.ts`
- `apps/billing/api/src/modules/receipt/receipt.export-allocation.repository.ts`
- `apps/billing/api/src/modules/receipt/receipt.lookup.ts`
- `apps/billing/api/src/modules/receipt/receipt.migration.ts`
- `apps/billing/api/src/modules/receipt/receipt.module.ts`
- `apps/billing/api/src/modules/receipt/receipt.repository.ts`
- `apps/billing/api/src/modules/receipt/receipt.routes.ts`
- `apps/billing/api/src/modules/receipt/receipt.seed.ts`
- `apps/billing/api/src/modules/receipt/receipt.service.ts`
- `apps/billing/api/src/modules/receipt/receipt.sync.ts`
- `apps/billing/api/src/modules/receipt/receipt.types.ts`
- `apps/billing/api/src/modules/receipt/receipt.worker.ts`
- `apps/billing/web/src/modules/receipt/index.ts`
- `apps/billing/web/src/modules/receipt/receipt.allocation.ts`
- `apps/billing/web/src/modules/receipt/receipt.contact-dialog.tsx`
- `apps/billing/web/src/modules/receipt/receipt.form.tsx`
- `apps/billing/web/src/modules/receipt/receipt.hooks.ts`
- `apps/billing/web/src/modules/receipt/receipt.list.tsx`
- `apps/billing/web/src/modules/receipt/receipt.page.tsx`
- `apps/billing/web/src/modules/receipt/receipt.print.tsx`
- `apps/billing/web/src/modules/receipt/receipt.schema.ts`
- `apps/billing/web/src/modules/receipt/receipt.services.ts`
- `apps/billing/web/src/modules/receipt/receipt.types.ts`
- `apps/billing/web/src/modules/receipt/receipt.workspace.tsx`

## Explicit route declarations

- `/billing/receipts`
- `/billing/receipts/:id`
- `/billing/receipts/:id/activity`
- `/billing/receipts/:id/cancel`
- `/billing/receipts/:id/post`
- `/billing/receipts/allocations`
- `/billing/receipts/context`
- `/billing/receipts/lookups/address-types`
- `/billing/receipts/lookups/cities`
- `/billing/receipts/lookups/contact-types`
- `/billing/receipts/lookups/contacts`
- `/billing/receipts/lookups/countries`
- `/billing/receipts/lookups/districts`
- `/billing/receipts/lookups/ledgers`
- `/billing/receipts/lookups/pincodes`
- `/billing/receipts/lookups/states`
- `/billing/receipts/page`

## Tables created by this leaf

- `billing_receipt_activities`
- `billing_receipt_allocations`
- `billing_receipt_export_allocations`
- `billing_receipts`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
