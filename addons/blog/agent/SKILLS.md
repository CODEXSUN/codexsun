# Blog add-on working skills

## Apply this guidance

Use this file when planning, implementing, debugging, or reviewing Blog add-on.
Read [the README](../README.md), [TASK.md](TASK.md), and [PLAN.md](PLAN.md) first.
This file is component guidance. It does not install a global Codex skill or grant a runtime capability.

## Domain responsibilities

The host integration for the external @codexsun/blog npm package.

Vendor source remains in the published package. This folder contains integration documentation only. Keep exact version pins, integrity locks, manifest contracts, permissions, migrations, and public API/web composition aligned.

## Implementation rules

- Inspect the affected source and public contracts before editing.
- Keep concrete business behavior in its owning leaf or package.
- Preserve authoritative validation, permission checks, and data ownership.
- Add worker, event, or sync roles only when they contain real implemented behavior.
- Keep secrets, generated files, and local runtime data out of source control.
- Run npm commands from the repository root. Write generated output under root `dist`.
- Update this owner documentation when scope, contracts, or supported operations change.

## Review and evidence

- `npm run addons:check`
- `npm run test:addon-contract`

Check affected consumers and relevant tests. Report skipped or blocked checks explicitly.
Documentation and prompts never replace backend authorization or deployment approval.
