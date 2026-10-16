# Accounts: Accounting

This page records the `accounting` module in the Accounts owner. The application business context is: accounting views and ledger/journal foundation.

## Workflow role

Accounting leaves own their contract; do not infer full automatic financial posting from an overview or composed screen.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/accounts/api/src/modules/accounting/accounting.e2e.ts`
- `apps/accounts/api/src/modules/accounting/accounting.events.ts`
- `apps/accounts/api/src/modules/accounting/accounting.migration.ts`
- `apps/accounts/api/src/modules/accounting/accounting.module.ts`
- `apps/accounts/api/src/modules/accounting/accounting.repository.ts`
- `apps/accounts/api/src/modules/accounting/accounting.routes.ts`
- `apps/accounts/api/src/modules/accounting/accounting.seed.ts`
- `apps/accounts/api/src/modules/accounting/accounting.service.ts`
- `apps/accounts/api/src/modules/accounting/accounting.sync.ts`
- `apps/accounts/api/src/modules/accounting/accounting.types.ts`
- `apps/accounts/api/src/modules/accounting/accounting.worker.ts`
- `apps/accounts/api/src/modules/accounting/index.ts`
- `apps/accounts/web/src/modules/accounting/accounting.bank-book.tsx`
- `apps/accounts/web/src/modules/accounting/accounting.book-form.tsx`
- `apps/accounts/web/src/modules/accounting/accounting.book-list.tsx`
- `apps/accounts/web/src/modules/accounting/accounting.book-show.tsx`
- `apps/accounts/web/src/modules/accounting/accounting.book.tsx`
- `apps/accounts/web/src/modules/accounting/accounting.cash-book.tsx`
- `apps/accounts/web/src/modules/accounting/accounting.form.tsx`
- `apps/accounts/web/src/modules/accounting/accounting.hooks.ts`
- `apps/accounts/web/src/modules/accounting/accounting.ledger.tsx`
- `apps/accounts/web/src/modules/accounting/accounting.list.tsx`
- `apps/accounts/web/src/modules/accounting/accounting.periods.tsx`
- `apps/accounts/web/src/modules/accounting/accounting.services.ts`
- `apps/accounts/web/src/modules/accounting/accounting.show.tsx`
- `apps/accounts/web/src/modules/accounting/accounting.types.ts`
- `apps/accounts/web/src/modules/accounting/accounting.workspace.tsx`
- `apps/accounts/web/src/modules/accounting/index.ts`

## Explicit route declarations

- `/accounts`
- `/accounts/:id`
- `/accounts/:id/status`
- `/accounts/context`
- `/accounts/groups`
- `/accounts/groups/:id`
- `/accounts/journals`
- `/accounts/journals/:id`
- `/accounts/journals/:id/cancel`
- `/accounts/journals/:id/post`
- `/accounts/journals/:id/reverse`
- `/accounts/journals/:id/submit`
- `/accounts/journals/page`
- `/accounts/periods`
- `/accounts/periods/:id/status`

## Tables created by this leaf

- `accounts_account_groups`
- `accounts_accounting_periods`
- `accounts_accounting_rules`
- `accounts_accounts`
- `accounts_bank_entries`
- `accounts_cash_entries`
- `accounts_cash_entry_lines`
- `accounts_core_ledger_links`
- `accounts_entries`
- `accounts_entry_lines`
- `accounts_journal_entries`
- `accounts_journal_lines`
- `accounts_ledger`

## Permission declarations

- `accounts.accounting.account.status`
- `accounts.accounting.create`
- `accounts.accounting.delete`
- `accounts.accounting.period.status`
- `accounts.accounting.update`
- `accounts.accounting.view`

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
