# Accounts: Overview

This page records the `overview` module in the Accounts owner. The application business context is: accounting views and ledger/journal foundation.

## Workflow role

Accounting leaves own their contract; do not infer full automatic financial posting from an overview or composed screen.

This is an overview/composition surface; it does not by itself implement all domain workflows.

## Source contracts

- `apps/accounts/api/src/modules/overview/index.ts`
- `apps/accounts/api/src/modules/overview/overview.module.ts`
- `apps/accounts/api/src/modules/overview/overview.routes.ts`
- `apps/accounts/api/src/modules/overview/overview.service.ts`
- `apps/accounts/api/src/modules/overview/overview.types.ts`
- `apps/accounts/web/src/modules/overview/index.ts`
- `apps/accounts/web/src/modules/overview/overview.api.ts`
- `apps/accounts/web/src/modules/overview/overview.hooks.ts`
- `apps/accounts/web/src/modules/overview/overview.types.ts`
- `apps/accounts/web/src/modules/overview/overview.widgets.tsx`
- `apps/accounts/web/src/modules/overview/overview.workspace.tsx`

## Explicit route declarations

- `/accounts/overview`

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
