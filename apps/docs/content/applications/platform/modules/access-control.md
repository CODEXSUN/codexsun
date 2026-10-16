# Platform: Access Control

This page records the `access-control` module in the Platform owner. The application business context is: tenant identity, access, application activation and operations.

## Workflow role

Platform owns master registry and tenant runtime identity. Business data stays in each app owner.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/platform/api/src/modules/access-control/access-control.events.ts`
- `apps/platform/api/src/modules/access-control/access-control.migration.ts`
- `apps/platform/api/src/modules/access-control/access-control.module.ts`
- `apps/platform/api/src/modules/access-control/access-control.repository.ts`
- `apps/platform/api/src/modules/access-control/access-control.routes.ts`
- `apps/platform/api/src/modules/access-control/access-control.seed.ts`
- `apps/platform/api/src/modules/access-control/access-control.service.ts`
- `apps/platform/api/src/modules/access-control/access-control.sync.ts`
- `apps/platform/api/src/modules/access-control/access-control.types.ts`
- `apps/platform/api/src/modules/access-control/access-control.worker.ts`
- `apps/platform/api/src/modules/access-control/index.ts`
- `apps/platform/web/src/modules/access-control/access-control.form.tsx`
- `apps/platform/web/src/modules/access-control/access-control.hooks.ts`
- `apps/platform/web/src/modules/access-control/access-control.list.tsx`
- `apps/platform/web/src/modules/access-control/access-control.schema.ts`
- `apps/platform/web/src/modules/access-control/access-control.services.ts`
- `apps/platform/web/src/modules/access-control/access-control.types.ts`
- `apps/platform/web/src/modules/access-control/access-control.workspace.tsx`
- `apps/platform/web/src/modules/access-control/index.ts`

## Explicit route declarations

No fixed URL literal was found in this leaf. Check its public registration/composition exports for inherited or generated routes.

## Tables created by this leaf

No CREATE TABLE literal was found in this leaf. It may be read-only, composition-only, share a parent table, or register its migration through an owner lifecycle.

## Permission declarations

- `platform.access.manage`
- `platform.entitlements.manage`
- `platform.plans.manage`
- `platform.tenants.manage`

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
