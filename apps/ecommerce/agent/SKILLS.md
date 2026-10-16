# Ecommerce working skills

## Apply this guidance

Use this file when planning, implementing, debugging, or reviewing Ecommerce.
Read [the README](../README.md), [TASK.md](TASK.md), and [PLAN.md](PLAN.md) first.
This file is component guidance. It does not install a global Codex skill or grant a runtime capability.

## Domain responsibilities

Staff catalog management, matching and publishing controls, and the public storefront.

Core owns shared product identity and Frappe owns connection credentials. Public routes return published tenant content only. A browser basket does not prove order, payment, or stock-reservation support.

## Implementation rules

- Inspect the affected source and public contracts before editing.
- Keep concrete business behavior in its owning leaf or package.
- Preserve authoritative validation, permission checks, and data ownership.
- Add worker, event, or sync roles only when they contain real implemented behavior.
- Keep secrets, generated files, and local runtime data out of source control.
- Run npm commands from the repository root. Write generated output under root `dist`.
- Update this owner documentation when scope, contracts, or supported operations change.

## Review and evidence

- `node tools/check-module-boundaries.mjs ecommerce`
- `npm run typecheck -w @codexsun/ecommerce-api`
- `npm run lint -w @codexsun/ecommerce-api`
- `npm run build -w @codexsun/ecommerce-api`
- `npm run typecheck -w @codexsun/ecommerce-storefront`
- `npm run lint -w @codexsun/ecommerce-storefront`
- `npm run build -w @codexsun/ecommerce-storefront`
- `npm run typecheck -w @codexsun/ecommerce-web`
- `npm run lint -w @codexsun/ecommerce-web`
- `npm run build -w @codexsun/ecommerce-web`

Check affected consumers and relevant tests. Report skipped or blocked checks explicitly.
Documentation and prompts never replace backend authorization or deployment approval.
