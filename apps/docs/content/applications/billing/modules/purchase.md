# Billing: Purchase

This page records the `purchase` module in the Billing owner. The application business context is: commercial documents, payments, allocations, balances and reporting.

## Workflow role

Billing owns financial entries and settlement rules. Opening stock is not automatically a storefront availability promise.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/billing/api/src/modules/purchase/index.ts`
- `apps/billing/api/src/modules/purchase/purchase.allocation-guard.ts`
- `apps/billing/api/src/modules/purchase/purchase.events.ts`
- `apps/billing/api/src/modules/purchase/purchase.lookup.ts`
- `apps/billing/api/src/modules/purchase/purchase.migration.ts`
- `apps/billing/api/src/modules/purchase/purchase.module.ts`
- `apps/billing/api/src/modules/purchase/purchase.repository-support.ts`
- `apps/billing/api/src/modules/purchase/purchase.repository.ts`
- `apps/billing/api/src/modules/purchase/purchase.routes.ts`
- `apps/billing/api/src/modules/purchase/purchase.seed.ts`
- `apps/billing/api/src/modules/purchase/purchase.service.ts`
- `apps/billing/api/src/modules/purchase/purchase.sync.ts`
- `apps/billing/api/src/modules/purchase/purchase.types.ts`
- `apps/billing/api/src/modules/purchase/purchase.worker.ts`
- `apps/billing/web/src/modules/purchase/index.ts`
- `apps/billing/web/src/modules/purchase/purchase-address-editor.tsx`
- `apps/billing/web/src/modules/purchase/purchase.form-controller.tsx`
- `apps/billing/web/src/modules/purchase/purchase.form-section-1.tsx`
- `apps/billing/web/src/modules/purchase/purchase.form-section-2.tsx`
- `apps/billing/web/src/modules/purchase/purchase.form-section-3.tsx`
- `apps/billing/web/src/modules/purchase/purchase.form-section-4.tsx`
- `apps/billing/web/src/modules/purchase/purchase.form-view.tsx`
- `apps/billing/web/src/modules/purchase/purchase.form.tsx`
- `apps/billing/web/src/modules/purchase/purchase.hooks.ts`
- `apps/billing/web/src/modules/purchase/purchase.list.tsx`
- `apps/billing/web/src/modules/purchase/purchase.page.tsx`
- `apps/billing/web/src/modules/purchase/purchase.print.tsx`
- `apps/billing/web/src/modules/purchase/purchase.schema.ts`
- `apps/billing/web/src/modules/purchase/purchase.services.ts`
- `apps/billing/web/src/modules/purchase/purchase.show.tsx`
- `apps/billing/web/src/modules/purchase/purchase.types.ts`
- `apps/billing/web/src/modules/purchase/purchase.workspace.tsx`

## Explicit route declarations

- `/billing/purchases`
- `/billing/purchases/:id`
- `/billing/purchases/:id/cancel`
- `/billing/purchases/:id/confirm`
- `/billing/purchases/:id/convert-to-sale`
- `/billing/purchases/:id/revoke`
- `/billing/purchases/context`
- `/billing/purchases/convert-to-sale`
- `/billing/purchases/lookups/contacts/:id/addresses`
- `/billing/purchases/lookups/contacts/:id/addresses/:addressId`
- `/billing/purchases/page`

## Tables created by this leaf

- `billing_purchase_activities`
- `billing_purchase_items`
- `billing_purchases`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
