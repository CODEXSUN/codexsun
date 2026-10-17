# CRM working skills

## Apply this guidance

Use this file when planning, implementing, debugging, or reviewing CRM.
Read [the README](../README.md), [TASK.md](TASK.md), and [PLAN.md](PLAN.md) first.
This file is component guidance. It does not install a global Codex skill or grant a runtime capability.

## Domain responsibilities

Local enquiries, contact activity, follow-up tasks, SOPs, duty assignments, and duty reporting across web and mobile.

Core owns contact identity. Local CRM records remain authoritative. Only the approved SOP and Duty outbox transfers those records to Frappe. Preserve assignment scope and activity history.

## Implementation rules

- For custom Frappe contracts, refer to [CODEXSUN/logicx-biz](https://github.com/CODEXSUN/logicx-biz.git).
- Read [the Frappe comparison](FRAPPE-COMPARISON.md) before changing CRM transfer contracts. It does not expand approved sync scope.

- Inspect the affected source and public contracts before editing.
- Keep concrete business behavior in its owning leaf or package.
- Preserve authoritative validation, permission checks, and data ownership.
- Add worker, event, or sync roles only when they contain real implemented behavior.
- Keep secrets, generated files, and local runtime data out of source control.
- Run npm commands from the repository root. Write generated output under root `dist`.
- Update this owner documentation when scope, contracts, or supported operations change.

## Review and evidence

- `node tools/check-module-boundaries.mjs crm`
- `npm run typecheck -w @codexsun/crm-api`
- `npm run lint -w @codexsun/crm-api`
- `npm run build -w @codexsun/crm-api`
- `npm run typecheck -w @codexsun/crm-web`
- `npm run lint -w @codexsun/crm-web`
- `npm run build -w @codexsun/crm-web`

Check affected consumers and relevant tests. Report skipped or blocked checks explicitly.
Documentation and prompts never replace backend authorization or deployment approval.
