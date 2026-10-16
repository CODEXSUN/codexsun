# Billing working skills

## Apply this guidance

Use this file when planning, implementing, debugging, or reviewing Billing.
Read [the README](../README.md), [TASK.md](TASK.md), and [PLAN.md](PLAN.md) first.
This file is component guidance. It does not install a global Codex skill or grant a runtime capability.

## Domain responsibilities

Tenant billing entries, quotations, purchases, sales, receipts, payments, opening balances, and outstanding reports.

Keep company and financial-year scope explicit. Draft reservations do not settle balances. Preserve allocation, tax, lifecycle, and accounting reconciliation rules.

## Implementation rules

- Inspect the affected source and public contracts before editing.
- Keep concrete business behavior in its owning leaf or package.
- Preserve authoritative validation, permission checks, and data ownership.
- Add worker, event, or sync roles only when they contain real implemented behavior.
- Keep secrets, generated files, and local runtime data out of source control.
- Run npm commands from the repository root. Write generated output under root `dist`.
- Update this owner documentation when scope, contracts, or supported operations change.

## Review and evidence

- `node tools/check-module-boundaries.mjs billing`
- `npm run typecheck -w @codexsun/billing-api`
- `npm run lint -w @codexsun/billing-api`
- `npm run build -w @codexsun/billing-api`
- `npm run typecheck -w @codexsun/billing-web`
- `npm run lint -w @codexsun/billing-web`
- `npm run build -w @codexsun/billing-web`

Check affected consumers and relevant tests. Report skipped or blocked checks explicitly.
Documentation and prompts never replace backend authorization or deployment approval.
