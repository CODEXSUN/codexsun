# Frappe: Call Log Sync

Frappe owns the Call Log Sync capability. The module keeps its request handling, domain operations, and frontend interactions in the source contracts below.

## Ownership and access

The backend resolves tenant context and authorization for each protected request.
Frontend controls and documentation do not grant access.
Use the public module index for cross-module imports.

## Source contracts

- `apps/frappe/api/src/modules/call-log-sync/call-log-sync.module.ts`
- `apps/frappe/api/src/modules/call-log-sync/call-log-sync.outbound.ts`
- `apps/frappe/api/src/modules/call-log-sync/call-log-sync.routes.ts`
- `apps/frappe/api/src/modules/call-log-sync/call-log-sync.service.ts`
- `apps/frappe/api/src/modules/call-log-sync/call-log-sync.types.ts`
- `apps/frappe/api/src/modules/call-log-sync/index.ts`

## Declared routes

- `/frappe/call-logs/backfill`
- `/frappe/call-logs/backfill/:jobId`
- `/frappe/call-logs/pull`
- `/frappe/call-logs/remote`
- `/frappe/call-logs/sync-queue/:eventId/retry`
