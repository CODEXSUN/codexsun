# Hrms: Employee

Manages tenant employee identities and organization relationships. Other modules use the public employee contract rather than private repository access.

## Ownership and access

The backend resolves tenant context and authorization for each protected request.
Frontend controls and documentation do not grant access.
Use the public module index for cross-module imports.

## Source contracts

- `apps/hrms/api/src/modules/employee/employee.e2e.ts`
- `apps/hrms/api/src/modules/employee/employee.migration.ts`
- `apps/hrms/api/src/modules/employee/employee.module.ts`
- `apps/hrms/api/src/modules/employee/employee.repository.ts`
- `apps/hrms/api/src/modules/employee/employee.routes.ts`
- `apps/hrms/api/src/modules/employee/employee.seed.ts`
- `apps/hrms/api/src/modules/employee/employee.service.ts`
- `apps/hrms/api/src/modules/employee/employee.types.ts`
- `apps/hrms/api/src/modules/employee/index.ts`
- `apps/hrms/web/src/modules/employee/employee.form.tsx`
- `apps/hrms/web/src/modules/employee/employee.hooks.ts`
- `apps/hrms/web/src/modules/employee/employee.list.tsx`
- `apps/hrms/web/src/modules/employee/employee.routing.ts`
- `apps/hrms/web/src/modules/employee/employee.schema.ts`
- `apps/hrms/web/src/modules/employee/employee.services.ts`
- `apps/hrms/web/src/modules/employee/employee.show.tsx`
- `apps/hrms/web/src/modules/employee/employee.types.ts`
- `apps/hrms/web/src/modules/employee/employee.upsert.tsx`
- `apps/hrms/web/src/modules/employee/employee.workspace.tsx`
- `apps/hrms/web/src/modules/employee/index.ts`

## Declared routes

- `/hrms/attendance`
- `/hrms/attendance/employees`
- `/hrms/attendance/overview`
- `/hrms/departments`
- `/hrms/designations`
- `/hrms/employees`
- `/hrms/employees/:id`
- `/hrms/employees/:id/activity`
- `/hrms/employees/:id/force`
- `/hrms/employees/:id/restore`
- `/hrms/employees/:id/status`
- `/hrms/employees/users`
