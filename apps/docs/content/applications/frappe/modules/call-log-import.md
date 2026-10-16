# Frappe: Call Log Import

Frappe owns the Call Log Import capability. The module keeps its request handling, domain operations, and frontend interactions in the source contracts below.

## Ownership and access

The backend resolves tenant context and authorization for each protected request.
Frontend controls and documentation do not grant access.
Use the public module index for cross-module imports.

## Source contracts

- `apps/frappe/web/src/modules/call-log-import/call-log-import.services.ts`
- `apps/frappe/web/src/modules/call-log-import/call-log-import.types.ts`
- `apps/frappe/web/src/modules/call-log-import/call-log-import.workspace.tsx`
- `apps/frappe/web/src/modules/call-log-import/index.ts`
