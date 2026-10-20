# CRM: Schedules and reminders

The CRM scheduler owns schedules linked to enquiries, tasks, call logs, duties, and SOPs. A schedule stores its title, details, scheduled time, reminder time, status, assigned user, and acknowledgement time in the tenant CRM database.

The Enquiry and Task detail pages provide contextual scheduling actions and a Schedules tab. Duty and SOP workflows can also create linked schedules. The CRM Schedules and Reminders pages list permitted records. Platform displays due CRM reminders in its main notification menu and sends acknowledgement requests back to CRM.

## Source contracts

- `apps/crm/api/src/modules/scheduler/index.ts`
- `apps/crm/api/src/modules/scheduler/scheduler.migration.ts`
- `apps/crm/api/src/modules/scheduler/scheduler.module.ts`
- `apps/crm/api/src/modules/scheduler/scheduler.repository.ts`
- `apps/crm/api/src/modules/scheduler/scheduler.routes.ts`
- `apps/crm/api/src/modules/scheduler/scheduler.seed.ts`
- `apps/crm/api/src/modules/scheduler/scheduler.service.ts`
- `apps/crm/api/src/modules/scheduler/scheduler.types.ts`
- `apps/crm/web/src/modules/scheduler/index.ts`
- `apps/crm/web/src/modules/scheduler/scheduler.services.ts`
- `apps/crm/web/src/modules/scheduler/scheduler.workspace.tsx`

## Declared routes

- `GET /crm/schedules`
- `GET /crm/schedules/reminders`
- `GET /crm/schedules/sources`
- `POST /crm/schedules`
- `POST /crm/schedules/:id/acknowledge`
- `POST /crm/schedules/:id/status`

## Explicit permission checks

- `crm.schedule.view`
- `crm.schedule.view-all`
- `crm.schedule.create`
- `crm.schedule.update-own`
- `crm.schedule.manage`

The scheduler migration adds `crm_schedules` with tenant-local record IDs and a public UUID. The permission seed grants normal users view, create, and own-record update access. Admin, Manager, and Super Admin roles receive team-wide access and management actions.
