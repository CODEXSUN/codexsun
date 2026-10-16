# Billing: Quotation

This page records the `quotation` module in the Billing owner. The application business context is: commercial documents, payments, allocations, balances and reporting.

## Workflow role

Billing owns financial entries and settlement rules. Opening stock is not automatically a storefront availability promise.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/billing/api/src/modules/quotation/index.ts`
- `apps/billing/api/src/modules/quotation/quotation.e2e.ts`
- `apps/billing/api/src/modules/quotation/quotation.events.ts`
- `apps/billing/api/src/modules/quotation/quotation.lifecycle-guard.ts`
- `apps/billing/api/src/modules/quotation/quotation.lookup.ts`
- `apps/billing/api/src/modules/quotation/quotation.migration.ts`
- `apps/billing/api/src/modules/quotation/quotation.module.ts`
- `apps/billing/api/src/modules/quotation/quotation.repository-support.ts`
- `apps/billing/api/src/modules/quotation/quotation.repository.ts`
- `apps/billing/api/src/modules/quotation/quotation.routes.ts`
- `apps/billing/api/src/modules/quotation/quotation.seed.ts`
- `apps/billing/api/src/modules/quotation/quotation.service.ts`
- `apps/billing/api/src/modules/quotation/quotation.sync.ts`
- `apps/billing/api/src/modules/quotation/quotation.types.ts`
- `apps/billing/api/src/modules/quotation/quotation.worker.ts`
- `apps/billing/web/src/modules/quotation/index.ts`
- `apps/billing/web/src/modules/quotation/quotation-address-editor.tsx`
- `apps/billing/web/src/modules/quotation/quotation.form-controller.tsx`
- `apps/billing/web/src/modules/quotation/quotation.form-section-1.tsx`
- `apps/billing/web/src/modules/quotation/quotation.form-section-2.tsx`
- `apps/billing/web/src/modules/quotation/quotation.form-section-3.tsx`
- `apps/billing/web/src/modules/quotation/quotation.form-section-4.tsx`
- `apps/billing/web/src/modules/quotation/quotation.form-view.tsx`
- `apps/billing/web/src/modules/quotation/quotation.form.tsx`
- `apps/billing/web/src/modules/quotation/quotation.hooks.ts`
- `apps/billing/web/src/modules/quotation/quotation.link-invoice.tsx`
- `apps/billing/web/src/modules/quotation/quotation.list.tsx`
- `apps/billing/web/src/modules/quotation/quotation.page.tsx`
- `apps/billing/web/src/modules/quotation/quotation.print.tsx`
- `apps/billing/web/src/modules/quotation/quotation.route.ts`
- `apps/billing/web/src/modules/quotation/quotation.schema.ts`
- `apps/billing/web/src/modules/quotation/quotation.services.ts`
- `apps/billing/web/src/modules/quotation/quotation.show.tsx`
- `apps/billing/web/src/modules/quotation/quotation.types.ts`
- `apps/billing/web/src/modules/quotation/quotation.workspace.tsx`

## Explicit route declarations

- `/billing/quotations`
- `/billing/quotations/:id`
- `/billing/quotations/:id/cancel`
- `/billing/quotations/:id/confirm`
- `/billing/quotations/:id/convert-to-sale`
- `/billing/quotations/:id/existing-invoices`
- `/billing/quotations/:id/link-invoice`
- `/billing/quotations/:id/revoke`
- `/billing/quotations/context`
- `/billing/quotations/convert-to-sale`
- `/billing/quotations/lookups/contacts/:id/addresses`
- `/billing/quotations/lookups/contacts/:id/addresses/:addressId`
- `/billing/quotations/page`

## Tables created by this leaf

- `billing_quotation_activities`
- `billing_quotation_items`
- `billing_quotations`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
