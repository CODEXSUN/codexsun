# Frappe: Export

Frappe owns the Export capability. The module keeps its request handling, domain operations, and frontend interactions in the source contracts below.

## Ownership and access

The backend resolves tenant context and authorization for each protected request.
Frontend controls and documentation do not grant access.
Use the public module index for cross-module imports.

## Source contracts

- `apps/frappe/api/src/modules/export/export.module.ts`
- `apps/frappe/api/src/modules/export/export.routes.ts`
- `apps/frappe/api/src/modules/export/export.service.ts`
- `apps/frappe/api/src/modules/export/export.types.ts`
- `apps/frappe/api/src/modules/export/export.worker.test.ts`
- `apps/frappe/api/src/modules/export/export.worker.ts`
- `apps/frappe/api/src/modules/export/index.ts`
- `apps/frappe/web/src/modules/export/export.services.ts`
- `apps/frappe/web/src/modules/export/export.types.ts`
- `apps/frappe/web/src/modules/export/export.workspace.tsx`
- `apps/frappe/web/src/modules/export/index.ts`

## Declared routes

- `/frappe/export/:kind`
- `/frappe/export/jobs/:jobId`
