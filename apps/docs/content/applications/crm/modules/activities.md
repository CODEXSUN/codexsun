# Crm: Activities

Crm owns the Activities capability. The module keeps its request handling, domain operations, and frontend interactions in the source contracts below.

## Ownership and access

The backend resolves tenant context and authorization for each protected request.
Frontend controls and documentation do not grant access.
Use the public module index for cross-module imports.

## Source contracts

- `apps/crm/api/src/modules/activities/activities.module.ts`
- `apps/crm/api/src/modules/activities/activities.repository.test.ts`
- `apps/crm/api/src/modules/activities/activities.repository.ts`
- `apps/crm/api/src/modules/activities/activities.routes.ts`
- `apps/crm/api/src/modules/activities/activities.service.ts`
- `apps/crm/api/src/modules/activities/activities.types.ts`
- `apps/crm/api/src/modules/activities/index.ts`
- `apps/crm/web/src/modules/activities/activities.hooks.ts`
- `apps/crm/web/src/modules/activities/activities.list.tsx`
- `apps/crm/web/src/modules/activities/activities.services.ts`
- `apps/crm/web/src/modules/activities/activities.types.ts`
- `apps/crm/web/src/modules/activities/activities.workspace.tsx`
- `apps/crm/web/src/modules/activities/index.ts`

## Declared routes

- `/crm/activities`
- `/crm/activities/options`
