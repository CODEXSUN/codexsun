# HRMS working skills

## Apply this guidance

Use this file when planning, implementing, debugging, or reviewing HRMS.
Read [the README](../README.md), [TASK.md](TASK.md), and [PLAN.md](PLAN.md) first.
This file is component guidance. It does not install a global Codex skill or grant a runtime capability.

## Domain responsibilities

Employee administration, manual attendance, Department and Designation leaves, and the workforce overview.

Preserve one attendance record per employee and date. Distinguish standalone master leaves from completed Platform composition. Keep planned leave and device integration separate from implemented flows.

## Implementation rules

- Inspect the affected source and public contracts before editing.
- Keep concrete business behavior in its owning leaf or package.
- Preserve authoritative validation, permission checks, and data ownership.
- Add worker, event, or sync roles only when they contain real implemented behavior.
- Keep secrets, generated files, and local runtime data out of source control.
- Run npm commands from the repository root. Write generated output under root `dist`.
- Update this owner documentation when scope, contracts, or supported operations change.

## Review and evidence

- `node tools/check-module-boundaries.mjs hrms`
- `npm run typecheck -w @codexsun/hrms-api`
- `npm run lint -w @codexsun/hrms-api`
- `npm run build -w @codexsun/hrms-api`
- `npm run typecheck -w @codexsun/hrms-web`
- `npm run lint -w @codexsun/hrms-web`
- `npm run build -w @codexsun/hrms-web`

Check affected consumers and relevant tests. Report skipped or blocked checks explicitly.
Documentation and prompts never replace backend authorization or deployment approval.
