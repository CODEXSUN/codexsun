# Platform: Entitlement

This page records the `entitlement` module in the Platform owner. The application business context is: tenant identity, access, application activation and operations.

## Workflow role

Platform owns master registry and tenant runtime identity. Business data stays in each app owner.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/platform/api/src/modules/entitlement/entitlement.access.ts`
- `apps/platform/api/src/modules/entitlement/entitlement.events.ts`
- `apps/platform/api/src/modules/entitlement/entitlement.migration.ts`
- `apps/platform/api/src/modules/entitlement/entitlement.module.ts`
- `apps/platform/api/src/modules/entitlement/entitlement.repository.ts`
- `apps/platform/api/src/modules/entitlement/entitlement.routes.ts`
- `apps/platform/api/src/modules/entitlement/entitlement.seed.ts`
- `apps/platform/api/src/modules/entitlement/entitlement.service.ts`
- `apps/platform/api/src/modules/entitlement/entitlement.sync.ts`
- `apps/platform/api/src/modules/entitlement/entitlement.types.ts`
- `apps/platform/api/src/modules/entitlement/entitlement.worker.ts`
- `apps/platform/api/src/modules/entitlement/index.ts`
- `apps/platform/web/src/modules/entitlement/entitlement.form.tsx`
- `apps/platform/web/src/modules/entitlement/entitlement.hooks.ts`
- `apps/platform/web/src/modules/entitlement/entitlement.list.tsx`
- `apps/platform/web/src/modules/entitlement/entitlement.schema.ts`
- `apps/platform/web/src/modules/entitlement/entitlement.services.ts`
- `apps/platform/web/src/modules/entitlement/entitlement.types.ts`
- `apps/platform/web/src/modules/entitlement/entitlement.workspace.tsx`
- `apps/platform/web/src/modules/entitlement/index.ts`

## Explicit route declarations

No fixed URL literal was found in this leaf. Check its public registration/composition exports for inherited or generated routes.

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
