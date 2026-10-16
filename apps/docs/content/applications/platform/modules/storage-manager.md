# Platform: Storage Manager

This page records the `storage-manager` module in the Platform owner. The application business context is: tenant identity, access, application activation and operations.

## Workflow role

Platform owns master registry and tenant runtime identity. Business data stays in each app owner.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/platform/api/src/modules/storage-manager/index.ts`
- `apps/platform/api/src/modules/storage-manager/storage-manager.events.ts`
- `apps/platform/api/src/modules/storage-manager/storage-manager.migration.ts`
- `apps/platform/api/src/modules/storage-manager/storage-manager.module.ts`
- `apps/platform/api/src/modules/storage-manager/storage-manager.paths.ts`
- `apps/platform/api/src/modules/storage-manager/storage-manager.repository.ts`
- `apps/platform/api/src/modules/storage-manager/storage-manager.routes.ts`
- `apps/platform/api/src/modules/storage-manager/storage-manager.seed.ts`
- `apps/platform/api/src/modules/storage-manager/storage-manager.service.ts`
- `apps/platform/api/src/modules/storage-manager/storage-manager.sync.ts`
- `apps/platform/api/src/modules/storage-manager/storage-manager.types.ts`
- `apps/platform/api/src/modules/storage-manager/storage-manager.worker.ts`
- `apps/platform/web/src/modules/storage-manager/index.ts`
- `apps/platform/web/src/modules/storage-manager/storage-manager.form.tsx`
- `apps/platform/web/src/modules/storage-manager/storage-manager.hooks.ts`
- `apps/platform/web/src/modules/storage-manager/storage-manager.list.tsx`
- `apps/platform/web/src/modules/storage-manager/storage-manager.schema.ts`
- `apps/platform/web/src/modules/storage-manager/storage-manager.services.ts`
- `apps/platform/web/src/modules/storage-manager/storage-manager.types.ts`
- `apps/platform/web/src/modules/storage-manager/storage-manager.workspace.tsx`

## Explicit route declarations

No fixed URL literal was found in this leaf. Check its public registration/composition exports for inherited or generated routes.

## Tables created by this leaf

No CREATE TABLE literal was found in this leaf. It may be read-only, composition-only, share a parent table, or register its migration through an owner lifecycle.

## Permission declarations

- `core.application.records.update`
- `core.application.records.view`

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
