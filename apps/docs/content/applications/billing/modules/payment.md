# Billing: Payment

This page records the `payment` module in the Billing owner. The application business context is: commercial documents, payments, allocations, balances and reporting.

## Workflow role

Billing owns financial entries and settlement rules. Opening stock is not automatically a storefront availability promise.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/billing/api/src/modules/payment/index.ts`
- `apps/billing/api/src/modules/payment/payment.events.ts`
- `apps/billing/api/src/modules/payment/payment.lookup.ts`
- `apps/billing/api/src/modules/payment/payment.migration.ts`
- `apps/billing/api/src/modules/payment/payment.module.ts`
- `apps/billing/api/src/modules/payment/payment.repository.ts`
- `apps/billing/api/src/modules/payment/payment.routes.ts`
- `apps/billing/api/src/modules/payment/payment.seed.ts`
- `apps/billing/api/src/modules/payment/payment.service.ts`
- `apps/billing/api/src/modules/payment/payment.sync.ts`
- `apps/billing/api/src/modules/payment/payment.types.ts`
- `apps/billing/api/src/modules/payment/payment.worker.ts`
- `apps/billing/web/src/modules/payment/index.ts`
- `apps/billing/web/src/modules/payment/payment.allocation.ts`
- `apps/billing/web/src/modules/payment/payment.contact-dialog.tsx`
- `apps/billing/web/src/modules/payment/payment.form.tsx`
- `apps/billing/web/src/modules/payment/payment.hooks.ts`
- `apps/billing/web/src/modules/payment/payment.list.tsx`
- `apps/billing/web/src/modules/payment/payment.page.tsx`
- `apps/billing/web/src/modules/payment/payment.print.tsx`
- `apps/billing/web/src/modules/payment/payment.schema.ts`
- `apps/billing/web/src/modules/payment/payment.services.ts`
- `apps/billing/web/src/modules/payment/payment.types.ts`
- `apps/billing/web/src/modules/payment/payment.workspace.tsx`

## Explicit route declarations

- `/billing/payments`
- `/billing/payments/:id`
- `/billing/payments/:id/activity`
- `/billing/payments/:id/cancel`
- `/billing/payments/:id/post`
- `/billing/payments/allocations`
- `/billing/payments/context`
- `/billing/payments/lookups/address-types`
- `/billing/payments/lookups/cities`
- `/billing/payments/lookups/contact-types`
- `/billing/payments/lookups/contacts`
- `/billing/payments/lookups/countries`
- `/billing/payments/lookups/districts`
- `/billing/payments/lookups/ledgers`
- `/billing/payments/lookups/pincodes`
- `/billing/payments/lookups/states`
- `/billing/payments/page`

## Tables created by this leaf

- `billing_payment_activities`
- `billing_payment_allocations`
- `billing_payments`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
