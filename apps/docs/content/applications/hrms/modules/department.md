# Hrms: Department

Manages tenant departments through owned repository, validation, routes, migration, and permission seeds.

## Ownership and access

The backend resolves tenant context and authorization for each protected request.
Frontend controls and documentation do not grant access.
Use the public module index for cross-module imports.

## Source contracts

- `apps/hrms/api/src/modules/department/department.migration.ts`
- `apps/hrms/api/src/modules/department/department.module.ts`
- `apps/hrms/api/src/modules/department/department.repository.ts`
- `apps/hrms/api/src/modules/department/department.routes.ts`
- `apps/hrms/api/src/modules/department/department.seed.ts`
- `apps/hrms/api/src/modules/department/department.service.ts`
- `apps/hrms/api/src/modules/department/department.types.ts`
- `apps/hrms/api/src/modules/department/index.ts`
- `apps/hrms/web/src/modules/department/department.form.tsx`
- `apps/hrms/web/src/modules/department/department.hooks.ts`
- `apps/hrms/web/src/modules/department/department.list.tsx`
- `apps/hrms/web/src/modules/department/department.routing.ts`
- `apps/hrms/web/src/modules/department/department.schema.ts`
- `apps/hrms/web/src/modules/department/department.services.ts`
- `apps/hrms/web/src/modules/department/department.show.tsx`
- `apps/hrms/web/src/modules/department/department.types.ts`
- `apps/hrms/web/src/modules/department/department.upsert.tsx`
- `apps/hrms/web/src/modules/department/department.workspace.tsx`
- `apps/hrms/web/src/modules/department/index.ts`

## Declared routes

- `/hrms/departments`
- `/hrms/departments/:id`
- `/hrms/departments/:id/activity`
- `/hrms/departments/:id/force`
- `/hrms/departments/:id/restore`
- `/hrms/departments/:id/status`
