# Codexsun: Requirements

Owns requirement records, validation, persistence, and workspace interactions.

## Ownership and access

The backend resolves tenant context and authorization for each protected request.
Frontend controls and documentation do not grant access.
Use the public module index for cross-module imports.

## Source contracts

- `apps/codexsun/api/src/modules/requirements/index.ts`
- `apps/codexsun/api/src/modules/requirements/requirements.migration.ts`
- `apps/codexsun/api/src/modules/requirements/requirements.module.ts`
- `apps/codexsun/api/src/modules/requirements/requirements.repository.ts`
- `apps/codexsun/api/src/modules/requirements/requirements.routes.ts`
- `apps/codexsun/api/src/modules/requirements/requirements.seed.ts`
- `apps/codexsun/api/src/modules/requirements/requirements.service.ts`
- `apps/codexsun/api/src/modules/requirements/requirements.test.ts`
- `apps/codexsun/api/src/modules/requirements/requirements.types.ts`
- `apps/codexsun/web/src/modules/requirements/index.ts`
- `apps/codexsun/web/src/modules/requirements/requirements.form.tsx`
- `apps/codexsun/web/src/modules/requirements/requirements.hooks.ts`
- `apps/codexsun/web/src/modules/requirements/requirements.list.tsx`
- `apps/codexsun/web/src/modules/requirements/requirements.schema.ts`
- `apps/codexsun/web/src/modules/requirements/requirements.services.ts`
- `apps/codexsun/web/src/modules/requirements/requirements.show.tsx`
- `apps/codexsun/web/src/modules/requirements/requirements.types.ts`
- `apps/codexsun/web/src/modules/requirements/requirements.workspace.tsx`

## Declared routes

- `/codexsun/context`
- `/codexsun/requirements`
