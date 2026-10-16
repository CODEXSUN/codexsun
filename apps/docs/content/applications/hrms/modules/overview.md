# HRMS: Overview

This page records the `overview` module in the HRMS owner. The application business context is: human resource management system app foundation.

## Workflow role

Only the authenticated foundation is implemented. Workforce CRUD and payroll are planned; do not claim employee data is present.

This is an overview/composition surface; it does not by itself implement all domain workflows.

## Source contracts

- `apps/hrms/api/src/modules/overview/index.ts`
- `apps/hrms/api/src/modules/overview/overview.module.ts`
- `apps/hrms/api/src/modules/overview/overview.routes.ts`
- `apps/hrms/api/src/modules/overview/overview.seed.ts`
- `apps/hrms/api/src/modules/overview/overview.service.ts`
- `apps/hrms/api/src/modules/overview/overview.types.ts`
- `apps/hrms/web/src/modules/overview/index.ts`
- `apps/hrms/web/src/modules/overview/overview.hooks.ts`
- `apps/hrms/web/src/modules/overview/overview.services.ts`
- `apps/hrms/web/src/modules/overview/overview.types.ts`
- `apps/hrms/web/src/modules/overview/overview.workspace.tsx`

## Explicit route declarations

- `/hrms/overview`

## Tables created by this leaf

No CREATE TABLE literal was found in this leaf. It may be read-only, composition-only, share a parent table, or register its migration through an owner lifecycle.

## Permission declarations

- `hrms.overview.view`

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
