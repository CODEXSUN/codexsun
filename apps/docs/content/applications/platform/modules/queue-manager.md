# Platform: Queue Manager

This page records the `queue-manager` module in the Platform owner. The application business context is: tenant identity, access, application activation and operations.

## Workflow role

Platform owns master registry and tenant runtime identity. Business data stays in each app owner.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/platform/api/src/modules/queue-manager/index.ts`
- `apps/platform/api/src/modules/queue-manager/queue-manager.bullmq.ts`
- `apps/platform/api/src/modules/queue-manager/queue-manager.events.ts`
- `apps/platform/api/src/modules/queue-manager/queue-manager.migration.ts`
- `apps/platform/api/src/modules/queue-manager/queue-manager.module.ts`
- `apps/platform/api/src/modules/queue-manager/queue-manager.repository.ts`
- `apps/platform/api/src/modules/queue-manager/queue-manager.routes.ts`
- `apps/platform/api/src/modules/queue-manager/queue-manager.runtime.ts`
- `apps/platform/api/src/modules/queue-manager/queue-manager.seed.ts`
- `apps/platform/api/src/modules/queue-manager/queue-manager.service.ts`
- `apps/platform/api/src/modules/queue-manager/queue-manager.sync.ts`
- `apps/platform/api/src/modules/queue-manager/queue-manager.types.ts`
- `apps/platform/api/src/modules/queue-manager/queue-manager.worker.ts`

## Explicit route declarations

- `/admin/queue/settings/backend`
- `/tenant/queue/artifacts`

## Tables created by this leaf

No CREATE TABLE literal was found in this leaf. It may be read-only, composition-only, share a parent table, or register its migration through an owner lifecycle.

## Permission declarations

- `frappe.enquiries.import`

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
