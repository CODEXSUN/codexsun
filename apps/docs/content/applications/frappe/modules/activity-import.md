# Frappe: Activity Import

Frappe owns the Activity Import capability. The module keeps its request handling, domain operations, and frontend interactions in the source contracts below.

## Ownership and access

The backend resolves tenant context and authorization for each protected request.
Frontend controls and documentation do not grant access.
Use the public module index for cross-module imports.

## Source contracts

- `apps/frappe/api/src/modules/activity-import/activity-import.module.ts`
- `apps/frappe/api/src/modules/activity-import/activity-import.routes.ts`
- `apps/frappe/api/src/modules/activity-import/activity-import.service.ts`
- `apps/frappe/api/src/modules/activity-import/activity-import.types.ts`
- `apps/frappe/api/src/modules/activity-import/index.ts`
- `apps/frappe/web/src/modules/activity-import/activity-import.services.ts`
- `apps/frappe/web/src/modules/activity-import/activity-import.types.ts`
- `apps/frappe/web/src/modules/activity-import/activity-import.workspace.tsx`
- `apps/frappe/web/src/modules/activity-import/index.ts`

## Declared routes

- `/frappe/activities/pull`
- `/frappe/activities/remote`
