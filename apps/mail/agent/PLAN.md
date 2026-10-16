# Mail plan

## Scope

Tenant mail API operations and app-owned mail workspaces.

## Ownership contract

Keep message records and delivery behavior in Mail. External sends require the applicable approval, permissions, tenant context, and delivery audit.

The root Agent Guide and governance rules remain authoritative.
Keep one root dependency installation, lockfile, and generated output tree.
Keep business roles inside their owner and compose other components through public contracts.

## Current source surfaces

- `api/src/modules`: `mail`.
- `web/src/modules`: `mail`.

Source presence is not release evidence. Confirm executable behavior before describing a capability as complete.

## Delivery sequence

1. Read [TASK.md](TASK.md), [SKILLS.md](SKILLS.md), and the affected public entry points.
2. Inventory the current Mail implementation and its consumers.
3. Define the requested change and acceptance criteria within the scope above.
4. Resolve stored-data and public-contract compatibility before changing behavior.
5. Implement the change in its owner and update legitimate composition points.
6. Verify the owner, denied-access paths where relevant, and dependent applications.
7. Record evidence and remaining work in [TASK.md](TASK.md).

## Verification gates

- `node tools/check-module-boundaries.mjs mail`
- `npm run typecheck -w @codexsun/mail-api`
- `npm run lint -w @codexsun/mail-api`
- `npm run build -w @codexsun/mail-api`
- `npm run typecheck -w @codexsun/mail-web`
- `npm run lint -w @codexsun/mail-web`
- `npm run build -w @codexsun/mail-web`

Use `npm run check:component-docs` and the relevant root checks.
Run database, browser, native, and deployment checks when the changed behavior needs them.
Do not mark an untested phase or planned feature complete.
