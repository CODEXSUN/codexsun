# Platform: Tenant Permission

This page records the `tenant-permission` module in the Platform owner. The application business context is: tenant identity, access, application activation and operations.

## Workflow role

Platform owns master registry and tenant runtime identity. Business data stays in each app owner.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/platform/api/src/modules/tenant-permission/index.ts`
- `apps/platform/api/src/modules/tenant-permission/tenant-permission.migration.ts`
- `apps/platform/api/src/modules/tenant-permission/tenant-permission.module.ts`
- `apps/platform/api/src/modules/tenant-permission/tenant-permission.repository.ts`
- `apps/platform/api/src/modules/tenant-permission/tenant-permission.routes.ts`
- `apps/platform/api/src/modules/tenant-permission/tenant-permission.seed.ts`
- `apps/platform/api/src/modules/tenant-permission/tenant-permission.service.ts`
- `apps/platform/api/src/modules/tenant-permission/tenant-permission.types.ts`
- `apps/platform/web/src/modules/tenant-permission/index.ts`
- `apps/platform/web/src/modules/tenant-permission/tenant-permission.form.tsx`
- `apps/platform/web/src/modules/tenant-permission/tenant-permission.hooks.ts`
- `apps/platform/web/src/modules/tenant-permission/tenant-permission.list.tsx`
- `apps/platform/web/src/modules/tenant-permission/tenant-permission.schema.ts`
- `apps/platform/web/src/modules/tenant-permission/tenant-permission.services.ts`
- `apps/platform/web/src/modules/tenant-permission/tenant-permission.types.ts`
- `apps/platform/web/src/modules/tenant-permission/tenant-permission.workspace.tsx`

## Explicit route declarations

- `${path}/:id`
- `${path}/:id/${name}`
- `${path}/:id/force`

## Tables created by this leaf

- `app_permissions`

## Permission declarations

- `platform.application.permission.create`
- `platform.application.permission.delete`
- `platform.application.permission.update`
- `platform.application.permission.view`

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
