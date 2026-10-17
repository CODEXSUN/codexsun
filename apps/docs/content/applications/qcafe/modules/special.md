# Qcafe: Special

Owns enabled special definitions, selected prefixes, unique-prefix validation, and revision-aware special settings.

## Ownership and access

Keep operations inside the owning module. The backend and host adapter resolve current authorization and database scope.
Client payloads and documentation do not grant access. Preserve validation, actor attribution, and revision checks.

## Source contracts

- `apps/qcafe/api/src/modules/special/index.ts`
- `apps/qcafe/api/src/modules/special/special.migration.ts`
- `apps/qcafe/api/src/modules/special/special.module.ts`
- `apps/qcafe/api/src/modules/special/special.repository.ts`
- `apps/qcafe/api/src/modules/special/special.routes.ts`
- `apps/qcafe/api/src/modules/special/special.seed.ts`
- `apps/qcafe/api/src/modules/special/special.service.ts`
- `apps/qcafe/api/src/modules/special/special.types.ts`
- `apps/qcafe/web/src/modules/special/index.ts`
- `apps/qcafe/web/src/modules/special/special.form.tsx`
- `apps/qcafe/web/src/modules/special/special.hooks.ts`
- `apps/qcafe/web/src/modules/special/special.list.tsx`
- `apps/qcafe/web/src/modules/special/special.schema.ts`
- `apps/qcafe/web/src/modules/special/special.services.ts`
- `apps/qcafe/web/src/modules/special/special.types.ts`
- `apps/qcafe/web/src/modules/special/special.workspace.tsx`

## Declared routes

- `/qcafe/specials`

## Verification

Run owner typechecks, lint, module-boundary checks, and relevant tests.
Verify persisted behavior and denied access with an isolated development tenant before release.
Documented source presence is not evidence of remote delivery or production deployment.
