# Crm: Call Log

Crm owns the Call Log capability. The module keeps its request handling, domain operations, and frontend interactions in the source contracts below.

## Ownership and access

The backend resolves tenant context and authorization for each protected request.
Frontend controls and documentation do not grant access.
Use the public module index for cross-module imports.

## Source contracts

- `apps/crm/api/src/modules/call-log/call-log.migration.ts`
- `apps/crm/api/src/modules/call-log/call-log.module.ts`
- `apps/crm/api/src/modules/call-log/call-log.repository.ts`
- `apps/crm/api/src/modules/call-log/call-log.routes.ts`
- `apps/crm/api/src/modules/call-log/call-log.seed.ts`
- `apps/crm/api/src/modules/call-log/call-log.service.test.ts`
- `apps/crm/api/src/modules/call-log/call-log.service.ts`
- `apps/crm/api/src/modules/call-log/call-log.types.ts`
- `apps/crm/api/src/modules/call-log/index.ts`
- `apps/crm/web/src/modules/call-log/call-log.form.tsx`
- `apps/crm/web/src/modules/call-log/call-log.hooks.ts`
- `apps/crm/web/src/modules/call-log/call-log.list.tsx`
- `apps/crm/web/src/modules/call-log/call-log.schema.ts`
- `apps/crm/web/src/modules/call-log/call-log.services.ts`
- `apps/crm/web/src/modules/call-log/call-log.types.ts`
- `apps/crm/web/src/modules/call-log/call-log.workspace.tsx`
- `apps/crm/web/src/modules/call-log/index.ts`

## Declared routes

- `/crm/call-logs`
- `/crm/call-logs/:name/comments`
- `/crm/call-logs/options`
- `/crm/call-logs/users`
- `/crm/mobile/call-logs`
- `/crm/mobile/call-logs/:name/comments`
