# LogicX ERP plan

## Scope

The tenant ERP overview and owned Scheme capability.

## Ownership contract

Keep Scheme validation, persistence, and UI in its leaf. The current source inventory is not evidence of a complete ERP suite or of unimplemented industry workflows.

The root Agent Guide and governance rules remain authoritative.
Keep one root dependency installation, lockfile, and generated output tree.
Keep business roles inside their owner and compose other components through public contracts.

## Current source surfaces

- `api/src/modules`: `overview`, `scheme`.
- `web/src/modules`: `overview`, `scheme`.

Source presence is not release evidence. Confirm executable behavior before describing a capability as complete.

## Delivery sequence

1. Read [TASK.md](TASK.md), [SKILLS.md](SKILLS.md), and the affected public entry points.
2. Inventory the current LogicX ERP implementation and its consumers.
3. Define the requested change and acceptance criteria within the scope above.
4. Resolve stored-data and public-contract compatibility before changing behavior.
5. Implement the change in its owner and update legitimate composition points.
6. Verify the owner, denied-access paths where relevant, and dependent applications.
7. Record evidence and remaining work in [TASK.md](TASK.md).

## Verification gates

- `node tools/check-module-boundaries.mjs logicx-erp`
- `npm run typecheck -w @codexsun/logicx-erp-api`
- `npm run lint -w @codexsun/logicx-erp-api`
- `npm run build -w @codexsun/logicx-erp-api`
- `npm run typecheck -w @codexsun/logicx-erp-web`
- `npm run lint -w @codexsun/logicx-erp-web`
- `npm run build -w @codexsun/logicx-erp-web`

Use `npm run check:component-docs` and the relevant root checks.
Run database, browser, native, and deployment checks when the changed behavior needs them.
Do not mark an untested phase or planned feature complete.
