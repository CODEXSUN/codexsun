# Platform: Tenant Role Permission

This page records the `tenant-role-permission` module in the Platform owner. The application business context is: tenant identity, access, application activation and operations.

## Workflow role

Platform owns master registry and tenant runtime identity. Business data stays in each app owner.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/platform/api/src/modules/tenant-role-permission/index.ts`
- `apps/platform/api/src/modules/tenant-role-permission/tenant-role-permission.migration.ts`
- `apps/platform/api/src/modules/tenant-role-permission/tenant-role-permission.module.ts`
- `apps/platform/api/src/modules/tenant-role-permission/tenant-role-permission.repository.ts`
- `apps/platform/api/src/modules/tenant-role-permission/tenant-role-permission.routes.ts`
- `apps/platform/api/src/modules/tenant-role-permission/tenant-role-permission.seed.ts`
- `apps/platform/api/src/modules/tenant-role-permission/tenant-role-permission.service.ts`
- `apps/platform/api/src/modules/tenant-role-permission/tenant-role-permission.types.ts`
- `apps/platform/web/src/modules/tenant-role-permission/index.ts`
- `apps/platform/web/src/modules/tenant-role-permission/tenant-role-permission.form.tsx`
- `apps/platform/web/src/modules/tenant-role-permission/tenant-role-permission.hooks.ts`
- `apps/platform/web/src/modules/tenant-role-permission/tenant-role-permission.list.tsx`
- `apps/platform/web/src/modules/tenant-role-permission/tenant-role-permission.schema.ts`
- `apps/platform/web/src/modules/tenant-role-permission/tenant-role-permission.services.ts`
- `apps/platform/web/src/modules/tenant-role-permission/tenant-role-permission.types.ts`
- `apps/platform/web/src/modules/tenant-role-permission/tenant-role-permission.workspace.tsx`

## Explicit route declarations

- `${path}/:id`
- `${path}/:id/${name}`
- `${path}/:id/force`

## Tables created by this leaf

- `app_role_permissions`

## Permission declarations

- `platform.application.role-permission.update`
- `platform.application.role-permission.view`

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
