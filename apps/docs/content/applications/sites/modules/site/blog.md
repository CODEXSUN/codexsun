# Sites: Site / Blog

Owns site-scoped blog authoring and published blog content. The Site host supplies authorized site context.

## Ownership and access

Keep operations inside the owning module. The backend and host adapter resolve current authorization and database scope.
Client payloads and documentation do not grant access. Preserve validation, actor attribution, and revision checks.

## Source contracts

- `apps/sites/api/src/modules/site/blog/blog.migration.ts`
- `apps/sites/api/src/modules/site/blog/blog.module.ts`
- `apps/sites/api/src/modules/site/blog/blog.repository.ts`
- `apps/sites/api/src/modules/site/blog/blog.routes.ts`
- `apps/sites/api/src/modules/site/blog/blog.schema.ts`
- `apps/sites/api/src/modules/site/blog/blog.service.ts`
- `apps/sites/api/src/modules/site/blog/blog.types.ts`
- `apps/sites/api/src/modules/site/blog/index.ts`
- `apps/sites/web/src/modules/site/blog/blog.form.tsx`
- `apps/sites/web/src/modules/site/blog/blog.hooks.ts`
- `apps/sites/web/src/modules/site/blog/blog.list.tsx`
- `apps/sites/web/src/modules/site/blog/blog.schema.ts`
- `apps/sites/web/src/modules/site/blog/blog.services.ts`
- `apps/sites/web/src/modules/site/blog/blog.types.ts`
- `apps/sites/web/src/modules/site/blog/blog.workspace.tsx`
- `apps/sites/web/src/modules/site/blog/index.ts`

## Declared routes

- `/sites/:uuid/blogs`
- `/sites/:uuid/blogs/:postUuid`
- `/sites/:uuid/blogs/:postUuid/delete`

## Verification

Run owner typechecks, lint, module-boundary checks, and relevant tests.
Verify persisted behavior and denied access with an isolated development tenant before release.
Documented source presence is not evidence of remote delivery or production deployment.
