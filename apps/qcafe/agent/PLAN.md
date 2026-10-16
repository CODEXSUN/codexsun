# QCafe plan

## Scope

Current priority: finish the Platform-authenticated web app before desktop changes.
Web business data uses tenant MariaDB. Desktop PIN login and SQLite remain separate.
Do not apply the desktop enrollment plan as current web behavior.

## Web delivery

1. Menu and takeaway POS: tenant activation, live permissions, menu maintenance, immutable bills, partial payments, receipt printing, and audit.
2. Dine-in table allocation and kitchen tickets are implemented. Continue with configurable tax and bill correction workflows.
3. Inventory, bookings, reports, and remaining settings pages.
4. Reviewed tenant-specific migration of any historical cloud SQLite records.
5. Resume desktop enrollment and offline synchronization after the web workflows are complete.

Menu entries deactivate instead of deleting historical references. POS owns bill lines and the settlement ledger as one financial aggregate.
The first milestone supports takeaway billing without additional tax. It does not claim full restaurant readiness.
Never upload existing desktop data automatically. Never treat a PIN or license key as Platform identity.

Restaurant operations with a local API, POS web application, and Tauri Windows packaging.

## Ownership contract

Keep local operational data and operator credentials outside disposable build folders. Preserve PIN roles, stock and booking constraints, bill settlement, backups, and print-service boundaries.

The root Agent Guide and governance rules remain authoritative.
Keep one root dependency installation, lockfile, and generated output tree.
Keep business roles inside their owner and compose other components through public contracts.

## Current source surfaces

- `desktop/`: `service`, `src-tauri`.

Source presence is not release evidence. Confirm executable behavior before describing a capability as complete.

## Delivery sequence

1. Read [TASK.md](TASK.md), [SKILLS.md](SKILLS.md), and the affected public entry points.
2. Inventory the current QCafe implementation and its consumers.
3. Define the requested change and acceptance criteria within the scope above.
4. Resolve stored-data and public-contract compatibility before changing behavior.
5. Implement the change in its owner and update legitimate composition points.
6. Verify the owner, denied-access paths where relevant, and dependent applications.
7. Record evidence and remaining work in [TASK.md](TASK.md).

## Verification gates

- `npm run typecheck -w @codexsun/qcafe-web`
- `npm run build -w @codexsun/qcafe-web`

Use `npm run check:component-docs` and the relevant root checks.
Run database, browser, native, and deployment checks when the changed behavior needs them.
Do not mark an untested phase or planned feature complete.

## Web order persistence

POS composes the public Order workspace. Order owns editable tabs, table/seat assignments, KOT snapshots, cancellation, and draft persistence. Table owns restaurant table maintenance and a public locking lookup. POS owns immutable bill snapshots, payment locking, and receipt printing. Composition injects table/menu lookups and transactional bill creation. The order module releases its seat claims from the payment transaction when the bill is paid.

Continue with remaining restaurant modules and deployment checks before desktop sync work. Physical printer validation is a separate runtime check.
