# Accounts

## Component documentation

Accounting workspaces and owned accounting, bank-book, and cash-book API contracts.

Keep ledger and book behavior inside Accounts. Billing owns sales, purchases, receipts, and payments. Reconcile persisted balances before changing accounting sources.

- [TASK.md](agent/TASK.md): work items and acceptance evidence.
- [PLAN.md](agent/PLAN.md): scope, ownership, delivery order, and verification gates.
- [SKILLS.md](agent/SKILLS.md): component working rules and safety constraints.

### Source inventory

- `api/src/modules`: `accounting`, `bank-book`, `cash-book`, `overview`.
- `web/src/modules`: `accounting`, `overview`.

This inventory records source presence. It does not certify a deployed feature.

### Workspace verification

Run these commands from the repository root. Use the root installation and `dist` output tree.

- `node tools/check-module-boundaries.mjs accounts`
- `npm run typecheck -w @codexsun/accounts-api`
- `npm run lint -w @codexsun/accounts-api`
- `npm run build -w @codexsun/accounts-api`
- `npm run typecheck -w @codexsun/accounts-web`
- `npm run lint -w @codexsun/accounts-web`
- `npm run build -w @codexsun/accounts-web`

Run `npm run check:component-docs` to verify the required documentation files.
Run the relevant app tests and root release gates when implementation changes.
Report database, browser, native, and deployment checks separately.

### Workspace packages

- `api`: `@codexsun/accounts-api`.
- `web`: `@codexsun/accounts-web`.

### Declared internal dependencies

- `@codexsun/framework`
- `@codexsun/ui`

### Public package entry points

- `@codexsun/accounts-api`: `.`.
- `@codexsun/accounts-web`: `.`, `./modules/overview`, `./modules/accounting`.
