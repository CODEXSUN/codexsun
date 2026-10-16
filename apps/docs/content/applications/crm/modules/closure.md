# Crm: Closure

Crm owns the Closure capability. The module keeps its request handling, domain operations, and frontend interactions in the source contracts below.

## Ownership and access

The backend resolves tenant context and authorization for each protected request.
Frontend controls and documentation do not grant access.
Use the public module index for cross-module imports.

## Source contracts

- `apps/crm/api/src/modules/closure/closure.migration.ts`
- `apps/crm/api/src/modules/closure/closure.module.ts`
- `apps/crm/api/src/modules/closure/closure.routes.ts`
- `apps/crm/api/src/modules/closure/closure.seed.ts`
- `apps/crm/api/src/modules/closure/closure.types.ts`
- `apps/crm/api/src/modules/closure/index.ts`
- `apps/crm/web/src/modules/closure/closure.enquiry-card.tsx`
- `apps/crm/web/src/modules/closure/closure.services.ts`
- `apps/crm/web/src/modules/closure/closure.types.ts`
- `apps/crm/web/src/modules/closure/closure.workspace.tsx`
- `apps/crm/web/src/modules/closure/index.ts`

## Declared routes

- `/crm/closure-requests`
- `/crm/closure-requests/:id/review`
- `/crm/enquiries/:id/closure-requests`
- `/crm/enquiries/:id/closure-requests/latest`
