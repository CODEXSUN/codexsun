# LogicX ERP: Scheme

This page records the `scheme` module in the LogicX ERP owner. The application business context is: erp overview and billing-linked scheme operations.

## Workflow role

Scheme rules stay in LogicX ERP; shared masters and financial documents keep their original owners.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/logicx-erp/api/src/modules/scheme/index.ts`
- `apps/logicx-erp/api/src/modules/scheme/scheme.migration.ts`
- `apps/logicx-erp/api/src/modules/scheme/scheme.module.ts`
- `apps/logicx-erp/api/src/modules/scheme/scheme.repository.ts`
- `apps/logicx-erp/api/src/modules/scheme/scheme.routes.ts`
- `apps/logicx-erp/api/src/modules/scheme/scheme.seed.ts`
- `apps/logicx-erp/api/src/modules/scheme/scheme.service.ts`
- `apps/logicx-erp/api/src/modules/scheme/scheme.types.ts`
- `apps/logicx-erp/web/src/modules/scheme/index.ts`
- `apps/logicx-erp/web/src/modules/scheme/scheme.form.tsx`
- `apps/logicx-erp/web/src/modules/scheme/scheme.hooks.ts`
- `apps/logicx-erp/web/src/modules/scheme/scheme.list.tsx`
- `apps/logicx-erp/web/src/modules/scheme/scheme.schema.ts`
- `apps/logicx-erp/web/src/modules/scheme/scheme.services.ts`
- `apps/logicx-erp/web/src/modules/scheme/scheme.show.tsx`
- `apps/logicx-erp/web/src/modules/scheme/scheme.types.ts`
- `apps/logicx-erp/web/src/modules/scheme/scheme.workspace.tsx`

## Explicit route declarations

- `/logicx-erp/schemes`
- `/logicx-erp/schemes/:id`
- `/logicx-erp/schemes/:id/activity`
- `/logicx-erp/schemes/:id/status`
- `/logicx-erp/schemes/lookups`
- `/logicx-erp/schemes/lookups/invoices`

## Tables created by this leaf

- `logicx_erp_scheme_activity`
- `logicx_erp_schemes`

## Permission declarations

- `logicx-erp.scheme.create`
- `logicx-erp.scheme.delete`
- `logicx-erp.scheme.update`
- `logicx-erp.scheme.view`

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
