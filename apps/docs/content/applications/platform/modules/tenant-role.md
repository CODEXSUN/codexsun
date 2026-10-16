# Platform: Tenant Role

This page records the `tenant-role` module in the Platform owner. The application business context is: tenant identity, access, application activation and operations.

## Workflow role

Platform owns master registry and tenant runtime identity. Business data stays in each app owner.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/platform/api/src/modules/tenant-role/index.ts`
- `apps/platform/api/src/modules/tenant-role/tenant-role.migration.ts`
- `apps/platform/api/src/modules/tenant-role/tenant-role.module.ts`
- `apps/platform/api/src/modules/tenant-role/tenant-role.repository.ts`
- `apps/platform/api/src/modules/tenant-role/tenant-role.routes.ts`
- `apps/platform/api/src/modules/tenant-role/tenant-role.seed.ts`
- `apps/platform/api/src/modules/tenant-role/tenant-role.service.ts`
- `apps/platform/api/src/modules/tenant-role/tenant-role.types.ts`
- `apps/platform/web/src/modules/tenant-role/index.ts`
- `apps/platform/web/src/modules/tenant-role/tenant-role.form.tsx`
- `apps/platform/web/src/modules/tenant-role/tenant-role.hooks.ts`
- `apps/platform/web/src/modules/tenant-role/tenant-role.list.tsx`
- `apps/platform/web/src/modules/tenant-role/tenant-role.schema.ts`
- `apps/platform/web/src/modules/tenant-role/tenant-role.services.ts`
- `apps/platform/web/src/modules/tenant-role/tenant-role.types.ts`
- `apps/platform/web/src/modules/tenant-role/tenant-role.workspace.tsx`

## Explicit route declarations

- `${path}/:id`
- `${path}/:id/${name}`
- `${path}/:id/force`

## Tables created by this leaf

- `app_roles`

## Permission declarations

- `platform.application.role.create`
- `platform.application.role.delete`
- `platform.application.role.update`
- `platform.application.role.view`

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
