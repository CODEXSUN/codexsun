# Platform: App Registry

This page records the `app-registry` module in the Platform owner. The application business context is: tenant identity, access, application activation and operations.

## Workflow role

Platform owns master registry and tenant runtime identity. Business data stays in each app owner.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/platform/api/src/modules/app-registry/app-registry.events.ts`
- `apps/platform/api/src/modules/app-registry/app-registry.migration.ts`
- `apps/platform/api/src/modules/app-registry/app-registry.module.ts`
- `apps/platform/api/src/modules/app-registry/app-registry.repository.ts`
- `apps/platform/api/src/modules/app-registry/app-registry.routes.ts`
- `apps/platform/api/src/modules/app-registry/app-registry.schemas.ts`
- `apps/platform/api/src/modules/app-registry/app-registry.seed.ts`
- `apps/platform/api/src/modules/app-registry/app-registry.service.ts`
- `apps/platform/api/src/modules/app-registry/app-registry.sync.ts`
- `apps/platform/api/src/modules/app-registry/app-registry.types.ts`
- `apps/platform/api/src/modules/app-registry/app-registry.worker.ts`
- `apps/platform/api/src/modules/app-registry/index.ts`
- `apps/platform/web/src/modules/app-registry/app-registry.form.tsx`
- `apps/platform/web/src/modules/app-registry/app-registry.hooks.ts`
- `apps/platform/web/src/modules/app-registry/app-registry.list.tsx`
- `apps/platform/web/src/modules/app-registry/app-registry.schema.ts`
- `apps/platform/web/src/modules/app-registry/app-registry.services.ts`
- `apps/platform/web/src/modules/app-registry/app-registry.types.ts`
- `apps/platform/web/src/modules/app-registry/app-registry.workspace.tsx`
- `apps/platform/web/src/modules/app-registry/index.ts`

## Explicit route declarations

- `/admin/apps`
- `/admin/apps/:id`

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
