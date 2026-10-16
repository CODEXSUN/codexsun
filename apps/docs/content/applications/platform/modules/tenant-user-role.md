# Platform: Tenant User Role

This page records the `tenant-user-role` module in the Platform owner. The application business context is: tenant identity, access, application activation and operations.

## Workflow role

Platform owns master registry and tenant runtime identity. Business data stays in each app owner.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/platform/api/src/modules/tenant-user-role/index.ts`
- `apps/platform/api/src/modules/tenant-user-role/tenant-user-role.migration.ts`
- `apps/platform/api/src/modules/tenant-user-role/tenant-user-role.module.ts`
- `apps/platform/api/src/modules/tenant-user-role/tenant-user-role.repository.ts`
- `apps/platform/api/src/modules/tenant-user-role/tenant-user-role.routes.ts`
- `apps/platform/api/src/modules/tenant-user-role/tenant-user-role.seed.ts`
- `apps/platform/api/src/modules/tenant-user-role/tenant-user-role.service.ts`
- `apps/platform/api/src/modules/tenant-user-role/tenant-user-role.types.ts`
- `apps/platform/web/src/modules/tenant-user-role/index.ts`
- `apps/platform/web/src/modules/tenant-user-role/tenant-user-role.form.tsx`
- `apps/platform/web/src/modules/tenant-user-role/tenant-user-role.hooks.ts`
- `apps/platform/web/src/modules/tenant-user-role/tenant-user-role.list.tsx`
- `apps/platform/web/src/modules/tenant-user-role/tenant-user-role.schema.ts`
- `apps/platform/web/src/modules/tenant-user-role/tenant-user-role.services.ts`
- `apps/platform/web/src/modules/tenant-user-role/tenant-user-role.types.ts`
- `apps/platform/web/src/modules/tenant-user-role/tenant-user-role.workspace.tsx`

## Explicit route declarations

- `${path}/:id`
- `${path}/:id/${name}`
- `${path}/:id/force`

## Tables created by this leaf

- `app_user_roles`

## Permission declarations

- `platform.application.user-role.update`
- `platform.application.user-role.view`

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
