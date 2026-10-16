# Crm: Sop Item

Crm owns the Sop Item capability. The module keeps its request handling, domain operations, and frontend interactions in the source contracts below.

## Ownership and access

The backend resolves tenant context and authorization for each protected request.
Frontend controls and documentation do not grant access.
Use the public module index for cross-module imports.

## Source contracts

- `apps/crm/api/src/modules/sop-item/index.ts`
- `apps/crm/api/src/modules/sop-item/sop-item.migration.ts`
- `apps/crm/api/src/modules/sop-item/sop-item.module.ts`
- `apps/crm/api/src/modules/sop-item/sop-item.repository.ts`
- `apps/crm/api/src/modules/sop-item/sop-item.routes.ts`
- `apps/crm/api/src/modules/sop-item/sop-item.service.ts`
- `apps/crm/api/src/modules/sop-item/sop-item.types.ts`

## Explicit permission checks

- `crm.sop.publish`
- `crm.sop.update`
- `crm.sop.view`
