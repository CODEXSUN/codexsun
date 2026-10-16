# Crm: Task

Crm owns the Task capability. The module keeps its request handling, domain operations, and frontend interactions in the source contracts below.

## Ownership and access

The backend resolves tenant context and authorization for each protected request.
Frontend controls and documentation do not grant access.
Use the public module index for cross-module imports.

## Source contracts

- `apps/crm/api/src/modules/task/index.ts`
- `apps/crm/api/src/modules/task/task.migration.ts`
- `apps/crm/api/src/modules/task/task.module.ts`
- `apps/crm/api/src/modules/task/task.repository.ts`
- `apps/crm/api/src/modules/task/task.routes.ts`
- `apps/crm/api/src/modules/task/task.seed.ts`
- `apps/crm/api/src/modules/task/task.service.test.ts`
- `apps/crm/api/src/modules/task/task.service.ts`
- `apps/crm/api/src/modules/task/task.types.ts`
- `apps/crm/web/src/modules/task/index.ts`
- `apps/crm/web/src/modules/task/task.creation-context.tsx`
- `apps/crm/web/src/modules/task/task.form.tsx`
- `apps/crm/web/src/modules/task/task.hooks.ts`
- `apps/crm/web/src/modules/task/task.inline-filter.tsx`
- `apps/crm/web/src/modules/task/task.list.tsx`
- `apps/crm/web/src/modules/task/task.schema.ts`
- `apps/crm/web/src/modules/task/task.services.ts`
- `apps/crm/web/src/modules/task/task.show.tsx`
- `apps/crm/web/src/modules/task/task.types.ts`
- `apps/crm/web/src/modules/task/task.workspace.tsx`

## Declared routes

- `/crm/tasks`
- `/crm/tasks/:id`
- `/crm/tasks/:id/activity`
- `/crm/tasks/:id/closure-requests`
- `/crm/tasks/:id/comments`
- `/crm/tasks/:id/jobs`
- `/crm/tasks/:id/jobs/start`
- `/crm/tasks/:id/jobs/stop`
- `/crm/tasks/:id/properties`
- `/crm/tasks/closure-requests/:id/review`
- `/crm/tasks/options`

## Explicit permission checks

- `crm.task.closure.review`
- `crm.task.create`
- `crm.task.respond`
- `crm.task.update`
- `crm.task.view`
- `crm.task.work`
