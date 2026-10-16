# Billing: Dashboard

This page records the `dashboard` module in the Billing owner. The application business context is: commercial documents, payments, allocations, balances and reporting.

## Workflow role

Billing owns financial entries and settlement rules. Opening stock is not automatically a storefront availability promise.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/billing/api/src/modules/dashboard/dashboard.assistant-read.ts`
- `apps/billing/api/src/modules/dashboard/dashboard.events.ts`
- `apps/billing/api/src/modules/dashboard/dashboard.migration.ts`
- `apps/billing/api/src/modules/dashboard/dashboard.module.ts`
- `apps/billing/api/src/modules/dashboard/dashboard.repository.ts`
- `apps/billing/api/src/modules/dashboard/dashboard.routes.ts`
- `apps/billing/api/src/modules/dashboard/dashboard.seed.ts`
- `apps/billing/api/src/modules/dashboard/dashboard.service.ts`
- `apps/billing/api/src/modules/dashboard/dashboard.sync.ts`
- `apps/billing/api/src/modules/dashboard/dashboard.types.ts`
- `apps/billing/api/src/modules/dashboard/dashboard.worker.ts`
- `apps/billing/api/src/modules/dashboard/index.ts`
- `apps/billing/web/src/modules/dashboard/dashboard.api.ts`
- `apps/billing/web/src/modules/dashboard/dashboard.hooks.ts`
- `apps/billing/web/src/modules/dashboard/dashboard.types.ts`
- `apps/billing/web/src/modules/dashboard/dashboard.widgets.tsx`
- `apps/billing/web/src/modules/dashboard/dashboard.workspace.tsx`
- `apps/billing/web/src/modules/dashboard/index.ts`

## Explicit route declarations

- `/billing/dashboard`

## Tables created by this leaf

- `billing_dashboard_snapshots`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
