# Crm: Duty Assignment

Crm owns the Duty Assignment capability. The module keeps its request handling, domain operations, and frontend interactions in the source contracts below.

## Ownership and access

The backend resolves tenant context and authorization for each protected request.
Frontend controls and documentation do not grant access.
Use the public module index for cross-module imports.

## Source contracts

- `apps/crm/api/src/modules/duty-assignment/duty-assignment.migration.ts`
- `apps/crm/api/src/modules/duty-assignment/duty-assignment.module.ts`
- `apps/crm/api/src/modules/duty-assignment/duty-assignment.repository.ts`
- `apps/crm/api/src/modules/duty-assignment/duty-assignment.routes.ts`
- `apps/crm/api/src/modules/duty-assignment/duty-assignment.service.ts`
- `apps/crm/api/src/modules/duty-assignment/duty-assignment.types.ts`
- `apps/crm/api/src/modules/duty-assignment/index.ts`

## Declared routes

- `/crm/duties`
- `/crm/duty-users`

## Explicit permission checks

- `crm.duty.assign`
- `crm.duty.manage`
- `crm.duty.view.all`
- `crm.duty.view.own`
