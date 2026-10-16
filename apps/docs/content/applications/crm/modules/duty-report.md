# Crm: Duty Report

Crm owns the Duty Report capability. The module keeps its request handling, domain operations, and frontend interactions in the source contracts below.

## Ownership and access

The backend resolves tenant context and authorization for each protected request.
Frontend controls and documentation do not grant access.
Use the public module index for cross-module imports.

## Source contracts

- `apps/crm/api/src/modules/duty-report/duty-report.migration.ts`
- `apps/crm/api/src/modules/duty-report/duty-report.module.ts`
- `apps/crm/api/src/modules/duty-report/duty-report.repository.ts`
- `apps/crm/api/src/modules/duty-report/duty-report.routes.ts`
- `apps/crm/api/src/modules/duty-report/duty-report.service.test.ts`
- `apps/crm/api/src/modules/duty-report/duty-report.service.ts`
- `apps/crm/api/src/modules/duty-report/duty-report.types.ts`
- `apps/crm/api/src/modules/duty-report/index.ts`

## Declared routes

- `/crm/duty-reports`

## Explicit permission checks

- `crm.duty-report.create.own`
- `crm.duty-report.view.all`
- `crm.duty-report.view.own`
