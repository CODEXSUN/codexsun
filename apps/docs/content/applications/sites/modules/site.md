# Sites: Site

Owns tenant site registry records, slug/domain validation, status changes, and deletion through the Site service.

## Ownership and access

The backend resolves tenant context and authorization for each protected request.
Frontend controls and documentation do not grant access.
Use the public module index for cross-module imports.

## Source contracts

- `apps/sites/api/src/modules/site/index.ts`
- `apps/sites/api/src/modules/site/site.migration.ts`
- `apps/sites/api/src/modules/site/site.module.ts`
- `apps/sites/api/src/modules/site/site.repository.ts`
- `apps/sites/api/src/modules/site/site.routes.ts`
- `apps/sites/api/src/modules/site/site.seed.ts`
- `apps/sites/api/src/modules/site/site.service.ts`
- `apps/sites/api/src/modules/site/site.types.ts`
- `apps/sites/web/src/modules/site/index.ts`
- `apps/sites/web/src/modules/site/site.form.tsx`
- `apps/sites/web/src/modules/site/site.hooks.ts`
- `apps/sites/web/src/modules/site/site.list.tsx`
- `apps/sites/web/src/modules/site/site.schema.ts`
- `apps/sites/web/src/modules/site/site.services.ts`
- `apps/sites/web/src/modules/site/site.types.ts`
- `apps/sites/web/src/modules/site/site.workspace.tsx`

## Declared routes

- `/sites`
- `/sites/:uuid`
- `/sites/:uuid/restore`
- `/sites/:uuid/suspend`
