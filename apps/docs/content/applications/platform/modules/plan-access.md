# Platform: Plan Access

This page records the `plan-access` module in the Platform owner. The application business context is: tenant identity, access, application activation and operations.

## Workflow role

Platform owns master registry and tenant runtime identity. Business data stays in each app owner.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/platform/web/src/modules/plan-access/index.ts`
- `apps/platform/web/src/modules/plan-access/plan-access.form.tsx`
- `apps/platform/web/src/modules/plan-access/plan-access.hooks.ts`
- `apps/platform/web/src/modules/plan-access/plan-access.list.tsx`
- `apps/platform/web/src/modules/plan-access/plan-access.schema.ts`
- `apps/platform/web/src/modules/plan-access/plan-access.services.ts`
- `apps/platform/web/src/modules/plan-access/plan-access.types.ts`
- `apps/platform/web/src/modules/plan-access/plan-access.workspace.tsx`

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
