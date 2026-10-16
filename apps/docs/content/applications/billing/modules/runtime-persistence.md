# Billing: Runtime Persistence

This page records the `runtime-persistence` module in the Billing owner. The application business context is: commercial documents, payments, allocations, balances and reporting.

## Workflow role

Billing owns financial entries and settlement rules. Opening stock is not automatically a storefront availability promise.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/billing/api/src/modules/runtime-persistence/index.ts`
- `apps/billing/api/src/modules/runtime-persistence/runtime-persistence.events.ts`
- `apps/billing/api/src/modules/runtime-persistence/runtime-persistence.migration.ts`
- `apps/billing/api/src/modules/runtime-persistence/runtime-persistence.module.ts`
- `apps/billing/api/src/modules/runtime-persistence/runtime-persistence.repository.ts`
- `apps/billing/api/src/modules/runtime-persistence/runtime-persistence.routes.ts`
- `apps/billing/api/src/modules/runtime-persistence/runtime-persistence.seed.ts`
- `apps/billing/api/src/modules/runtime-persistence/runtime-persistence.service.ts`
- `apps/billing/api/src/modules/runtime-persistence/runtime-persistence.sync.ts`
- `apps/billing/api/src/modules/runtime-persistence/runtime-persistence.types.ts`
- `apps/billing/api/src/modules/runtime-persistence/runtime-persistence.worker.ts`

## Explicit route declarations

No fixed URL literal was found in this leaf. Check its public registration/composition exports for inherited or generated routes.

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
