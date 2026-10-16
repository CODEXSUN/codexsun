# Crm: Duties

Crm owns the Duties capability. The module keeps its request handling, domain operations, and frontend interactions in the source contracts below.

## Ownership and access

The backend resolves tenant context and authorization for each protected request.
Frontend controls and documentation do not grant access.
Use the public module index for cross-module imports.

## Source contracts

- `apps/crm/web/src/modules/duties/duties.services.ts`
- `apps/crm/web/src/modules/duties/duties.workspace.tsx`
- `apps/crm/web/src/modules/duties/index.ts`
