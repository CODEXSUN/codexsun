# Platform: Tenant User

This page records the `tenant-user` module in the Platform owner. The application business context is: tenant identity, access, application activation and operations.

## Workflow role

Platform owns master registry and tenant runtime identity. Business data stays in each app owner.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/platform/api/src/modules/tenant-user/index.ts`
- `apps/platform/api/src/modules/tenant-user/tenant-user.migration.ts`
- `apps/platform/api/src/modules/tenant-user/tenant-user.module.ts`
- `apps/platform/api/src/modules/tenant-user/tenant-user.repository.ts`
- `apps/platform/api/src/modules/tenant-user/tenant-user.routes.ts`
- `apps/platform/api/src/modules/tenant-user/tenant-user.seed.ts`
- `apps/platform/api/src/modules/tenant-user/tenant-user.service.ts`
- `apps/platform/api/src/modules/tenant-user/tenant-user.types.ts`
- `apps/platform/web/src/modules/tenant-user/index.ts`
- `apps/platform/web/src/modules/tenant-user/tenant-user.form.tsx`
- `apps/platform/web/src/modules/tenant-user/tenant-user.hooks.ts`
- `apps/platform/web/src/modules/tenant-user/tenant-user.list.tsx`
- `apps/platform/web/src/modules/tenant-user/tenant-user.schema.ts`
- `apps/platform/web/src/modules/tenant-user/tenant-user.services.ts`
- `apps/platform/web/src/modules/tenant-user/tenant-user.types.ts`
- `apps/platform/web/src/modules/tenant-user/tenant-user.workspace.tsx`

## Explicit route declarations

- `${adminPath}/:id`
- `${adminPath}/:id/force`
- `${adminPath}/role-options`
- `${path}/:id`
- `${path}/:id/${name}`
- `${path}/:id/force`
- `${path}/role-options`
- `/admin/tenants/:tenantId/users/:id/${name}`

## Tables created by this leaf

- `app_users`

## Permission declarations

- `platform.application.user-role.update`
- `platform.application.user.create`
- `platform.application.user.delete`
- `platform.application.user.update`
- `platform.application.user.view`

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
