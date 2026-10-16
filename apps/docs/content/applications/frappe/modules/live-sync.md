# Frappe: Live Sync

Frappe owns the Live Sync capability. The module keeps its request handling, domain operations, and frontend interactions in the source contracts below.

## Ownership and access

The backend resolves tenant context and authorization for each protected request.
Frontend controls and documentation do not grant access.
Use the public module index for cross-module imports.

## Source contracts

- `apps/frappe/api/src/modules/live-sync/index.ts`
- `apps/frappe/api/src/modules/live-sync/live-sync.module.ts`
- `apps/frappe/api/src/modules/live-sync/live-sync.routes.ts`
- `apps/frappe/api/src/modules/live-sync/live-sync.service.ts`
- `apps/frappe/api/src/modules/live-sync/live-sync.types.ts`
- `apps/frappe/web/src/modules/live-sync/index.ts`
- `apps/frappe/web/src/modules/live-sync/live-sync.services.ts`
- `apps/frappe/web/src/modules/live-sync/live-sync.types.ts`
- `apps/frappe/web/src/modules/live-sync/live-sync.workspace.tsx`

## Declared routes

- `/frappe/live-sync`
- `/frappe/live-sync/:kind/resync`
- `/frappe/live-sync/jobs`
