# Himsx: Overview

This page records the `overview` module in the Himsx owner. The application business context is: hospital information management system app foundation.

## Workflow role

Patient, appointment, admission and clinical workflows are planned, not implemented by the overview.

This is an overview/composition surface; it does not by itself implement all domain workflows.

## Source contracts

- `apps/himsx/api/src/modules/overview/index.ts`
- `apps/himsx/api/src/modules/overview/overview.module.ts`
- `apps/himsx/api/src/modules/overview/overview.routes.ts`
- `apps/himsx/api/src/modules/overview/overview.seed.ts`
- `apps/himsx/api/src/modules/overview/overview.service.ts`
- `apps/himsx/api/src/modules/overview/overview.types.ts`
- `apps/himsx/web/src/modules/overview/index.ts`
- `apps/himsx/web/src/modules/overview/overview.hooks.ts`
- `apps/himsx/web/src/modules/overview/overview.services.ts`
- `apps/himsx/web/src/modules/overview/overview.types.ts`
- `apps/himsx/web/src/modules/overview/overview.workspace.tsx`

## Explicit route declarations

- `/himsx/overview`

## Tables created by this leaf

No CREATE TABLE literal was found in this leaf. It may be read-only, composition-only, share a parent table, or register its migration through an owner lifecycle.

## Permission declarations

- `himsx.overview.view`

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
