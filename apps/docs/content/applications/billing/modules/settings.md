# Billing: Settings

This page records the `settings` module in the Billing owner. The application business context is: commercial documents, payments, allocations, balances and reporting.

## Workflow role

Billing owns financial entries and settlement rules. Opening stock is not automatically a storefront availability promise.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/billing/api/src/modules/settings/index.ts`
- `apps/billing/api/src/modules/settings/settings.events.ts`
- `apps/billing/api/src/modules/settings/settings.migration.ts`
- `apps/billing/api/src/modules/settings/settings.module.ts`
- `apps/billing/api/src/modules/settings/settings.repository.ts`
- `apps/billing/api/src/modules/settings/settings.routes.ts`
- `apps/billing/api/src/modules/settings/settings.seed.ts`
- `apps/billing/api/src/modules/settings/settings.service.ts`
- `apps/billing/api/src/modules/settings/settings.sync.ts`
- `apps/billing/api/src/modules/settings/settings.types.ts`
- `apps/billing/api/src/modules/settings/settings.worker.ts`
- `apps/billing/web/src/modules/settings/index.ts`
- `apps/billing/web/src/modules/settings/settings.billing-workspace.tsx`
- `apps/billing/web/src/modules/settings/settings.document-header.tsx`
- `apps/billing/web/src/modules/settings/settings.document-workspace.tsx`
- `apps/billing/web/src/modules/settings/settings.form.tsx`
- `apps/billing/web/src/modules/settings/settings.hooks.ts`
- `apps/billing/web/src/modules/settings/settings.list.tsx`
- `apps/billing/web/src/modules/settings/settings.schema.ts`
- `apps/billing/web/src/modules/settings/settings.services.ts`
- `apps/billing/web/src/modules/settings/settings.types.ts`
- `apps/billing/web/src/modules/settings/settings.workspace.tsx`

## Explicit route declarations

- `/billing/document-settings`
- `/billing/settings`
- `/billing/settings/sales`

## Tables created by this leaf

- `billing_company_settings`
- `billing_settings`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
