# Platform: Database Maintenance

This page records the `database-maintenance` module in the Platform owner. The application business context is: tenant identity, access, application activation and operations.

## Workflow role

Platform owns master registry and tenant runtime identity. Business data stays in each app owner.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/platform/api/src/modules/database-maintenance/database-maintenance.backups.ts`
- `apps/platform/api/src/modules/database-maintenance/database-maintenance.events.ts`
- `apps/platform/api/src/modules/database-maintenance/database-maintenance.executor.ts`
- `apps/platform/api/src/modules/database-maintenance/database-maintenance.migration.ts`
- `apps/platform/api/src/modules/database-maintenance/database-maintenance.module.ts`
- `apps/platform/api/src/modules/database-maintenance/database-maintenance.repository.ts`
- `apps/platform/api/src/modules/database-maintenance/database-maintenance.routes.ts`
- `apps/platform/api/src/modules/database-maintenance/database-maintenance.seed.ts`
- `apps/platform/api/src/modules/database-maintenance/database-maintenance.service.ts`
- `apps/platform/api/src/modules/database-maintenance/database-maintenance.sync.ts`
- `apps/platform/api/src/modules/database-maintenance/database-maintenance.tenant-backups.ts`
- `apps/platform/api/src/modules/database-maintenance/database-maintenance.types.ts`
- `apps/platform/api/src/modules/database-maintenance/database-maintenance.worker.ts`
- `apps/platform/api/src/modules/database-maintenance/index.ts`

## Explicit route declarations

- `/admin/database/master/restore`
- `/admin/database/master/restores/:id`
- `/admin/database/tenants/:id/${operation}`
- `/admin/database/tenants/:id/restore`
- `/admin/database/tenants/:id/restores/:runId`

## Tables created by this leaf

No CREATE TABLE literal was found in this leaf. It may be read-only, composition-only, share a parent table, or register its migration through an owner lifecycle.

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
