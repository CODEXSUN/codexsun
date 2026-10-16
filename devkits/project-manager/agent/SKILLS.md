# Project Manager working skills

## Apply this guidance

Use this file when planning, implementing, debugging, or reviewing Project Manager.
Read [the README](../README.md), [TASK.md](TASK.md), and [PLAN.md](PLAN.md) first.
This file is component guidance. It does not install a global Codex skill or grant a runtime capability.

## Domain responsibilities

Platform Registry records and Ideas workspaces with owned persistence and activity.

Keep project_manager data and business operations in this DevKit. Platform supplies authenticated actors and database context through public adapters.

## Implementation rules

- Inspect the affected source and public contracts before editing.
- Keep concrete business behavior in its owning leaf or package.
- Preserve authoritative validation, permission checks, and data ownership.
- Add worker, event, or sync roles only when they contain real implemented behavior.
- Keep secrets, generated files, and local runtime data out of source control.
- Run npm commands from the repository root. Write generated output under root `dist`.
- Update this owner documentation when scope, contracts, or supported operations change.

## Review and evidence

- `node tools/check-module-boundaries.mjs project-manager`
- `npm run typecheck -w @codexsun/project-manager-api`
- `npm run lint -w @codexsun/project-manager-api`
- `npm run build -w @codexsun/project-manager-api`
- `npm run typecheck -w @codexsun/project-manager-web`
- `npm run lint -w @codexsun/project-manager-web`
- `npm run build -w @codexsun/project-manager-web`

Check affected consumers and relevant tests. Report skipped or blocked checks explicitly.
Documentation and prompts never replace backend authorization or deployment approval.
