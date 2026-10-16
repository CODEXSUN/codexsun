# Crm: Sop

Crm owns the Sop capability. The module keeps its request handling, domain operations, and frontend interactions in the source contracts below.

## Ownership and access

The backend resolves tenant context and authorization for each protected request.
Frontend controls and documentation do not grant access.
Use the public module index for cross-module imports.

## Source contracts

- `apps/crm/api/src/modules/sop/index.ts`
- `apps/crm/api/src/modules/sop/sop.migration.ts`
- `apps/crm/api/src/modules/sop/sop.module.ts`
- `apps/crm/api/src/modules/sop/sop.repository.ts`
- `apps/crm/api/src/modules/sop/sop.routes.ts`
- `apps/crm/api/src/modules/sop/sop.seed.ts`
- `apps/crm/api/src/modules/sop/sop.service.ts`
- `apps/crm/api/src/modules/sop/sop.types.ts`
- `apps/crm/web/src/modules/sop/index.ts`
- `apps/crm/web/src/modules/sop/sop.services.ts`
- `apps/crm/web/src/modules/sop/sop.workspace.tsx`

## Explicit permission checks

- `crm.sop.create`
- `crm.sop.deactivate`
- `crm.sop.update`
- `crm.sop.view`
