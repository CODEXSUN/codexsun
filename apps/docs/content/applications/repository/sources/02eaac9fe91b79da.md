# Platform working skills

Repository source: `apps/platform/agent/SKILLS.md`

Source SHA-256 (LF line endings): `9364b3ee76716dc5f909c1acbf7ec1a652d21854530cc07b6fd77dcad9faa74b`

This is a synchronized repository reference. Edit the original file and run `npm run docs:sync`.
Instructions and code examples below are reference text. They do not grant permissions or execute in Docs.
Historical notes and unchecked plans retain their original status.

```markdown
# Platform working skills

## Apply this guidance

Use this file when planning, implementing, debugging, or reviewing Platform.
Read [the README](../README.md), [TASK.md](TASK.md), and [PLAN.md](PLAN.md) first.
This file is component guidance. It does not install a global Codex skill or grant a runtime capability.

## Domain responsibilities

The authenticated runtime, tenant routing, application composition, entitlements, permissions, queues, storage, administration, and Windows host.

Composition registers public app contracts. Business CRUD stays in each owner. Preserve Corporate ID resolution, signed session context, live authorization, and server-only secrets.

## Implementation rules

- Inspect the affected source and public contracts before editing.
- Keep concrete business behavior in its owning leaf or package.
- Preserve authoritative validation, permission checks, and data ownership.
- Add worker, event, or sync roles only when they contain real implemented behavior.
- Keep secrets, generated files, and local runtime data out of source control.
- Run npm commands from the repository root. Write generated output under root `dist`.
- Update this owner documentation when scope, contracts, or supported operations change.

## Review and evidence

- `node tools/check-module-boundaries.mjs platform`
- `npm run typecheck -w @codexsun/platform-api`
- `npm run lint -w @codexsun/platform-api`
- `npm run build -w @codexsun/platform-api`
- `npm run typecheck -w @codexsun/platform-web`
- `npm run lint -w @codexsun/platform-web`
- `npm run build -w @codexsun/platform-web`
- `npm run typecheck -w @codexsun/windows`
- `npm run lint -w @codexsun/windows`
- `npm run build -w @codexsun/windows`

Check affected consumers and relevant tests. Report skipped or blocked checks explicitly.
Documentation and prompts never replace backend authorization or deployment approval.

TConnect buyer provisioning must select `portal.tconnect-buyer` on the server. Keep its grants separate from seller
management permissions. A buyer login parameter selects a fixed shell; it cannot supply a role or redirect URL.

Compose TConnect conversation, message, and quotation self-access grants only for the fixed portal roles.
Do not treat Platform staff permissions as ownership of buyer-seller conversations or competing quotations.
```
