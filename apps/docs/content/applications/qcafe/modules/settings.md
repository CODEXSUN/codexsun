# Qcafe: Settings

Owns restaurant identity, receipt text, tax and service defaults, and revision-aware settings.

## Ownership and access

Keep operations inside the owning module. The backend and host adapter resolve current authorization and database scope.
Client payloads and documentation do not grant access. Preserve validation, actor attribution, and revision checks.

## Source contracts

- `apps/qcafe/api/src/modules/settings/index.ts`
- `apps/qcafe/api/src/modules/settings/settings.migration.ts`
- `apps/qcafe/api/src/modules/settings/settings.module.ts`
- `apps/qcafe/api/src/modules/settings/settings.repository.ts`
- `apps/qcafe/api/src/modules/settings/settings.routes.ts`
- `apps/qcafe/api/src/modules/settings/settings.seed.ts`
- `apps/qcafe/api/src/modules/settings/settings.service.ts`
- `apps/qcafe/api/src/modules/settings/settings.types.ts`
- `apps/qcafe/web/src/modules/settings/index.ts`
- `apps/qcafe/web/src/modules/settings/settings.form.tsx`
- `apps/qcafe/web/src/modules/settings/settings.hooks.ts`
- `apps/qcafe/web/src/modules/settings/settings.list.tsx`
- `apps/qcafe/web/src/modules/settings/settings.schema.ts`
- `apps/qcafe/web/src/modules/settings/settings.services.ts`
- `apps/qcafe/web/src/modules/settings/settings.types.ts`
- `apps/qcafe/web/src/modules/settings/settings.workspace.tsx`

## Declared routes

- `/qcafe/settings`

## Verification

Run owner typechecks, lint, module-boundary checks, and relevant tests.
Verify persisted behavior and denied access with an isolated development tenant before release.
Documented source presence is not evidence of remote delivery or production deployment.
