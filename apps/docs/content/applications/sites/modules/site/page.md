# Sites: Site / Page

Owns structured site page content, revision checks, and publication state. Publishing requires an active site.

## Ownership and access

Keep operations inside the owning module. The backend and host adapter resolve current authorization and database scope.
Client payloads and documentation do not grant access. Preserve validation, actor attribution, and revision checks.

## Source contracts

- `apps/sites/api/src/modules/site/page/index.ts`
- `apps/sites/api/src/modules/site/page/page.content.ts`
- `apps/sites/api/src/modules/site/page/page.defaults.ts`
- `apps/sites/api/src/modules/site/page/page.logicx-content.ts`
- `apps/sites/api/src/modules/site/page/page.migration.ts`
- `apps/sites/api/src/modules/site/page/page.module.ts`
- `apps/sites/api/src/modules/site/page/page.repository.ts`
- `apps/sites/api/src/modules/site/page/page.routes.ts`
- `apps/sites/api/src/modules/site/page/page.schema.ts`
- `apps/sites/api/src/modules/site/page/page.seed.ts`
- `apps/sites/api/src/modules/site/page/page.service.ts`
- `apps/sites/api/src/modules/site/page/page.types.ts`
- `apps/sites/web/src/modules/site/page/index.ts`
- `apps/sites/web/src/modules/site/page/page.company-phone.tsx`
- `apps/sites/web/src/modules/site/page/page.fields.tsx`
- `apps/sites/web/src/modules/site/page/page.finishes-form.tsx`
- `apps/sites/web/src/modules/site/page/page.form.tsx`
- `apps/sites/web/src/modules/site/page/page.hooks.ts`
- `apps/sites/web/src/modules/site/page/page.list.tsx`
- `apps/sites/web/src/modules/site/page/page.processing-form.tsx`
- `apps/sites/web/src/modules/site/page/page.profile-form.tsx`
- `apps/sites/web/src/modules/site/page/page.responsibility-form.tsx`
- `apps/sites/web/src/modules/site/page/page.schema.ts`
- `apps/sites/web/src/modules/site/page/page.services.ts`
- `apps/sites/web/src/modules/site/page/page.title-form.tsx`
- `apps/sites/web/src/modules/site/page/page.types.ts`
- `apps/sites/web/src/modules/site/page/page.workspace.tsx`

## Declared routes

- `/sites/:uuid/page`
- `/sites/:uuid/page/activity`
- `/sites/:uuid/page/publish`

## Verification

Run owner typechecks, lint, module-boundary checks, and relevant tests.
Verify persisted behavior and denied access with an isolated development tenant before release.
Documented source presence is not evidence of remote delivery or production deployment.
