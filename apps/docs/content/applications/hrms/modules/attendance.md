# Hrms: Attendance

Records one attendance entry for an employee and work date. The service validates employees and duplicate dates. The workspace owns date/search/status filters and save/remove/restore state. The list owns the table and row actions.

## Ownership and access

The backend resolves tenant context and authorization for each protected request.
Frontend controls and documentation do not grant access.
Use the public module index for cross-module imports.

## Source contracts

- `apps/hrms/api/src/modules/attendance/attendance.migration.ts`
- `apps/hrms/api/src/modules/attendance/attendance.module.ts`
- `apps/hrms/api/src/modules/attendance/attendance.repository.ts`
- `apps/hrms/api/src/modules/attendance/attendance.routes.ts`
- `apps/hrms/api/src/modules/attendance/attendance.seed.ts`
- `apps/hrms/api/src/modules/attendance/attendance.service.ts`
- `apps/hrms/api/src/modules/attendance/attendance.types.ts`
- `apps/hrms/api/src/modules/attendance/index.ts`
- `apps/hrms/web/src/modules/attendance/attendance.form.tsx`
- `apps/hrms/web/src/modules/attendance/attendance.hooks.ts`
- `apps/hrms/web/src/modules/attendance/attendance.list.tsx`
- `apps/hrms/web/src/modules/attendance/attendance.schema.ts`
- `apps/hrms/web/src/modules/attendance/attendance.services.ts`
- `apps/hrms/web/src/modules/attendance/attendance.types.ts`
- `apps/hrms/web/src/modules/attendance/attendance.workspace.tsx`
- `apps/hrms/web/src/modules/attendance/index.ts`

## Declared routes

- `/hrms/attendance`
- `/hrms/attendance/:id`
- `/hrms/attendance/:id/restore`
- `/hrms/attendance/employees`
- `/hrms/attendance/overview`
