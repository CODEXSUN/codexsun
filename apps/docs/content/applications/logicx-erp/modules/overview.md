# LogicX ERP: Overview

This page records the `overview` module in the LogicX ERP owner. The application business context is: erp overview and billing-linked scheme operations.

## Workflow role

Scheme rules stay in LogicX ERP; shared masters and financial documents keep their original owners.

This is an overview/composition surface; it does not by itself implement all domain workflows.

## Source contracts

- `apps/logicx-erp/api/src/modules/overview/index.ts`
- `apps/logicx-erp/api/src/modules/overview/overview.module.ts`
- `apps/logicx-erp/api/src/modules/overview/overview.routes.ts`
- `apps/logicx-erp/api/src/modules/overview/overview.seed.ts`
- `apps/logicx-erp/api/src/modules/overview/overview.service.ts`
- `apps/logicx-erp/api/src/modules/overview/overview.types.ts`
- `apps/logicx-erp/web/src/modules/overview/index.ts`
- `apps/logicx-erp/web/src/modules/overview/overview.hooks.ts`
- `apps/logicx-erp/web/src/modules/overview/overview.services.ts`
- `apps/logicx-erp/web/src/modules/overview/overview.types.ts`
- `apps/logicx-erp/web/src/modules/overview/overview.workspace.tsx`

## Explicit route declarations

- `/logicx-erp/overview`

## Tables created by this leaf

No CREATE TABLE literal was found in this leaf. It may be read-only, composition-only, share a parent table, or register its migration through an owner lifecycle.

## Permission declarations

- `logicx-erp.overview.view`

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
