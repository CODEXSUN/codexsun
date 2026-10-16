# Accounts: Cash Book

This page records the `cash-book` module in the Accounts owner. The application business context is: accounting views and ledger/journal foundation.

## Workflow role

Accounting leaves own their contract; do not infer full automatic financial posting from an overview or composed screen.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/accounts/api/src/modules/cash-book/cash-book.lookup.ts`
- `apps/accounts/api/src/modules/cash-book/cash-book.module.ts`
- `apps/accounts/api/src/modules/cash-book/cash-book.repository.ts`
- `apps/accounts/api/src/modules/cash-book/cash-book.routes.ts`
- `apps/accounts/api/src/modules/cash-book/cash-book.service.ts`
- `apps/accounts/api/src/modules/cash-book/cash-book.types.ts`
- `apps/accounts/api/src/modules/cash-book/index.ts`

## Explicit route declarations

- `/cash-book`
- `/cash-book/context`
- `/cash-book/entries`
- `/cash-book/entries/:id`
- `/cash-book/ledger-groups`
- `/cash-book/ledgers`

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
