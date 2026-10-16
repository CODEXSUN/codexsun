# LogicX ERP working skills

## Apply this guidance

Use this file when planning, implementing, debugging, or reviewing LogicX ERP.
Read [the README](../README.md), [TASK.md](TASK.md), and [PLAN.md](PLAN.md) first.
This file is component guidance. It does not install a global Codex skill or grant a runtime capability.

## Domain responsibilities

The tenant ERP overview and owned Scheme capability.

Keep Scheme validation, persistence, and UI in its leaf. The current source inventory is not evidence of a complete ERP suite or of unimplemented industry workflows.

## Implementation rules

- Inspect the affected source and public contracts before editing.
- Keep concrete business behavior in its owning leaf or package.
- Preserve authoritative validation, permission checks, and data ownership.
- Add worker, event, or sync roles only when they contain real implemented behavior.
- Keep secrets, generated files, and local runtime data out of source control.
- Run npm commands from the repository root. Write generated output under root `dist`.
- Update this owner documentation when scope, contracts, or supported operations change.

## Review and evidence

- `node tools/check-module-boundaries.mjs logicx-erp`
- `npm run typecheck -w @codexsun/logicx-erp-api`
- `npm run lint -w @codexsun/logicx-erp-api`
- `npm run build -w @codexsun/logicx-erp-api`
- `npm run typecheck -w @codexsun/logicx-erp-web`
- `npm run lint -w @codexsun/logicx-erp-web`
- `npm run build -w @codexsun/logicx-erp-web`

Check affected consumers and relevant tests. Report skipped or blocked checks explicitly.
Documentation and prompts never replace backend authorization or deployment approval.
