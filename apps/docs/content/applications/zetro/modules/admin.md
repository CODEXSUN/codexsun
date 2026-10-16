# Zetro: Admin

This page records the `admin` module in the Zetro owner. The application business context is: permission-aware tenant ai coworker and reviewed read skills.

## Workflow role

Zetro can read only backend-authorised evidence. Draft patterns and model output cannot grant permissions or run SQL/shell actions.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/zetro/web/src/modules/admin/admin.form.tsx`
- `apps/zetro/web/src/modules/admin/admin.grants.tsx`
- `apps/zetro/web/src/modules/admin/admin.hooks.ts`
- `apps/zetro/web/src/modules/admin/admin.list.tsx`
- `apps/zetro/web/src/modules/admin/admin.review.tsx`
- `apps/zetro/web/src/modules/admin/admin.schema.ts`
- `apps/zetro/web/src/modules/admin/admin.services.ts`
- `apps/zetro/web/src/modules/admin/admin.types.ts`
- `apps/zetro/web/src/modules/admin/admin.workspace.tsx`
- `apps/zetro/web/src/modules/admin/index.ts`

## Explicit route declarations

No fixed URL literal was found in this leaf. Check its public registration/composition exports for inherited or generated routes.

## Tables created by this leaf

No CREATE TABLE literal was found in this leaf. It may be read-only, composition-only, share a parent table, or register its migration through an owner lifecycle.

## Permission declarations

- `billing.aged-sales.read`
- `billing.customer-outstanding.read`
- `billing.daily-summary.read`
- `billing.monthly-summary.read`
- `crm.assigned-enquiries.read`

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
