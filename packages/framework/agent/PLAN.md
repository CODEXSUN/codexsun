# Framework plan

## Scope

Shared transport, configuration, database, environment, error, event, health, logging, module, queue, and storage contracts.

## Ownership contract

Keep this package free of app-owned fields and business CRUD. Expose intentional public contracts. Preserve runtime and source export resolution and root output paths.

The root Agent Guide and governance rules remain authoritative.
Keep one root dependency installation, lockfile, and generated output tree.
Keep business roles inside their owner and compose other components through public contracts.

## Current source surfaces

- `src/`: `addons`, `api`, `config`, `db`, `env`, `errors`, `events`, `health`, `http`, `logger`, `modules`, `queue`, `storage`.

Source presence is not release evidence. Confirm executable behavior before describing a capability as complete.

## Delivery sequence

1. Read [TASK.md](TASK.md), [SKILLS.md](SKILLS.md), and the affected public entry points.
2. Inventory the current Framework implementation and its consumers.
3. Define the requested change and acceptance criteria within the scope above.
4. Resolve stored-data and public-contract compatibility before changing behavior.
5. Implement the change in its owner and update legitimate composition points.
6. Verify the owner, denied-access paths where relevant, and dependent applications.
7. Record evidence and remaining work in [TASK.md](TASK.md).

## Verification gates

- `npm run typecheck -w @codexsun/framework`
- `npm run lint -w @codexsun/framework`
- `npm run build -w @codexsun/framework`

Use `npm run check:component-docs` and the relevant root checks.
Run database, browser, native, and deployment checks when the changed behavior needs them.
Do not mark an untested phase or planned feature complete.
