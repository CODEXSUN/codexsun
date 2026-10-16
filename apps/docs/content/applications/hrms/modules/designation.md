# Hrms: Designation

Manages tenant employee designations through owned repository, validation, routes, migration, and permission seeds.

## Ownership and access

The backend resolves tenant context and authorization for each protected request.
Frontend controls and documentation do not grant access.
Use the public module index for cross-module imports.

## Source contracts

- `apps/hrms/api/src/modules/designation/designation.migration.ts`
- `apps/hrms/api/src/modules/designation/designation.module.ts`
- `apps/hrms/api/src/modules/designation/designation.repository.ts`
- `apps/hrms/api/src/modules/designation/designation.routes.ts`
- `apps/hrms/api/src/modules/designation/designation.seed.ts`
- `apps/hrms/api/src/modules/designation/designation.service.ts`
- `apps/hrms/api/src/modules/designation/designation.types.ts`
- `apps/hrms/api/src/modules/designation/index.ts`
- `apps/hrms/web/src/modules/designation/designation.form.tsx`
- `apps/hrms/web/src/modules/designation/designation.hooks.ts`
- `apps/hrms/web/src/modules/designation/designation.list.tsx`
- `apps/hrms/web/src/modules/designation/designation.routing.ts`
- `apps/hrms/web/src/modules/designation/designation.schema.ts`
- `apps/hrms/web/src/modules/designation/designation.services.ts`
- `apps/hrms/web/src/modules/designation/designation.show.tsx`
- `apps/hrms/web/src/modules/designation/designation.types.ts`
- `apps/hrms/web/src/modules/designation/designation.upsert.tsx`
- `apps/hrms/web/src/modules/designation/designation.workspace.tsx`
- `apps/hrms/web/src/modules/designation/index.ts`

## Declared routes

- `/hrms/designations`
- `/hrms/designations/:id`
- `/hrms/designations/:id/activity`
- `/hrms/designations/:id/force`
- `/hrms/designations/:id/restore`
- `/hrms/designations/:id/status`
