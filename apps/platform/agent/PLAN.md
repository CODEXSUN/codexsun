# Platform plan

## Scope

The authenticated runtime, tenant routing, application composition, entitlements, permissions, queues, storage, administration, and Windows host.

## Ownership contract

Composition registers public app contracts. Business CRUD stays in each owner. Preserve Corporate ID resolution, signed session context, live authorization, and server-only secrets.

The root Agent Guide and governance rules remain authoritative.
Keep one root dependency installation, lockfile, and generated output tree.
Keep business roles inside their owner and compose other components through public contracts.

## Current source surfaces

- `api/src/modules`: `access-control`, `app-orchestration`, `app-registry`, `credential-recovery`, `database-maintenance`, `entitlement`, `industry`, `plan`, `platform-activity`, `qcafe`, `queue-manager`, `storage-manager`, `subscription`, `task-manager`, `tenant`, `tenant-domain`, `tenant-permission`, `tenant-role`, `tenant-role-permission`, `tenant-user`, `tenant-user-role`.
- `web/src/modules`: `access-control`, `app-orchestration`, `app-registry`, `entitlement`, `industry`, `master-database`, `plan`, `plan-access`, `platform-activity`, `queue-management`, `storage-manager`, `subscription`, `task-manager`, `tenant`, `tenant-access`, `tenant-database`, `tenant-domain`, `tenant-permission`, `tenant-portal`, `tenant-role`, `tenant-role-permission`, `tenant-user`, `tenant-user-role`.
- `windows/`: `Packaging`, `scripts`, `src`, `src-tauri`.

Source presence is not release evidence. Confirm executable behavior before describing a capability as complete.

## Delivery sequence

1. Read [TASK.md](TASK.md), [SKILLS.md](SKILLS.md), and the affected public entry points.
2. Inventory the current Platform implementation and its consumers.
3. Define the requested change and acceptance criteria within the scope above.
4. Resolve stored-data and public-contract compatibility before changing behavior.
5. Implement the change in its owner and update legitimate composition points.
6. Verify the owner, denied-access paths where relevant, and dependent applications.
7. Record evidence and remaining work in [TASK.md](TASK.md).

## Verification gates

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

Use `npm run check:component-docs` and the relevant root checks.
Run database, browser, native, and deployment checks when the changed behavior needs them.
Do not mark an untested phase or planned feature complete.

## TConnect buyer composition

Compose the fixed buyer role and dedicated buyer shell. Resolve buyer and member mappings from the signed user UUID.
Keep buyer persistence and business routes inside TConnect. Retain buyer entry parameters when a session expires.

TConnect negotiation extends the existing fixed buyer and seller roles with participant permissions.
Keep quote calculations, messages, privacy checks, and persistence in TConnect. Platform supplies desk navigation and fixed transport adapters.

Compose TConnect credential list/create/update adapters and its staff Credentials tab.
Use Platform Access management for staff permission assignment. Keep evidence review and publication checks in TConnect.
