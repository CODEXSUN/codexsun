# Qcafe: Table

Owns restaurant table identity, seats, validation, and table lifecycle.

## Ownership and access

Keep operations inside the owning module. The backend and host adapter resolve current authorization and database scope.
Client payloads and documentation do not grant access. Preserve validation, actor attribution, and revision checks.

## Source contracts

- `apps/qcafe/api/src/modules/table/index.ts`
- `apps/qcafe/api/src/modules/table/table.migration.ts`
- `apps/qcafe/api/src/modules/table/table.module.ts`
- `apps/qcafe/api/src/modules/table/table.repository.ts`
- `apps/qcafe/api/src/modules/table/table.routes.ts`
- `apps/qcafe/api/src/modules/table/table.seed.ts`
- `apps/qcafe/api/src/modules/table/table.service.ts`
- `apps/qcafe/api/src/modules/table/table.types.ts`
- `apps/qcafe/web/src/modules/table/index.ts`
- `apps/qcafe/web/src/modules/table/table.form.tsx`
- `apps/qcafe/web/src/modules/table/table.hooks.ts`
- `apps/qcafe/web/src/modules/table/table.list.tsx`
- `apps/qcafe/web/src/modules/table/table.schema.ts`
- `apps/qcafe/web/src/modules/table/table.services.ts`
- `apps/qcafe/web/src/modules/table/table.types.ts`
- `apps/qcafe/web/src/modules/table/table.workspace.tsx`

## Declared routes

- `/qcafe/tables`
- `/qcafe/tables/:uuid`

## Verification

Run owner typechecks, lint, module-boundary checks, and relevant tests.
Verify persisted behavior and denied access with an isolated development tenant before release.
Documented source presence is not evidence of remote delivery or production deployment.
