# UI working skills

## Apply this guidance

Use this file when planning, implementing, debugging, or reviewing UI.
Read [the README](../README.md), [TASK.md](TASK.md), and [PLAN.md](PLAN.md) first.
This file is component guidance. It does not install a global Codex skill or grant a runtime capability.

## Domain responsibilities

Shared controls, workspace primitives, layouts, styles, blocks, and interface-topology contracts.

Keep app fields, persistence, permissions, and business rules out of shared UI. Preserve accessibility, required-field feedback, action propagation, and Main Layout technical names.

## Implementation rules

- Inspect the affected source and public contracts before editing.
- Keep concrete business behavior in its owning leaf or package.
- Preserve authoritative validation, permission checks, and data ownership.
- Add worker, event, or sync roles only when they contain real implemented behavior.
- Keep secrets, generated files, and local runtime data out of source control.
- Run npm commands from the repository root. Write generated output under root `dist`.
- Update this owner documentation when scope, contracts, or supported operations change.

## Review and evidence

- `npm run typecheck -w @codexsun/ui`
- `npm run lint -w @codexsun/ui`
- `npm run build -w @codexsun/ui`

Check affected consumers and relevant tests. Report skipped or blocked checks explicitly.
Documentation and prompts never replace backend authorization or deployment approval.
