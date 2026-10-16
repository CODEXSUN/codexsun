# Docs: Overview

This page records the `overview` module in the Docs owner. The application business context is: developer documentation authored in git with tenant-owned metadata and markdown overrides.

## Workflow role

Docs owns developer reference metadata, overrides and audit. Assist governance remains authoritative for coding rules; documentation does not grant runtime access.

This is an overview/composition surface; it does not by itself implement all domain workflows.

## Source contracts

- `apps/docs/api/src/modules/overview/index.ts`
- `apps/docs/api/src/modules/overview/overview.module.ts`
- `apps/docs/api/src/modules/overview/overview.routes.ts`
- `apps/docs/api/src/modules/overview/overview.seed.ts`
- `apps/docs/api/src/modules/overview/overview.service.ts`
- `apps/docs/api/src/modules/overview/overview.types.ts`
- `apps/docs/web/src/modules/overview/index.ts`
- `apps/docs/web/src/modules/overview/overview.hooks.ts`
- `apps/docs/web/src/modules/overview/overview.services.ts`
- `apps/docs/web/src/modules/overview/overview.types.ts`
- `apps/docs/web/src/modules/overview/overview.workspace.tsx`

## Explicit route declarations

- `/docs/overview`

## Tables created by this leaf

No CREATE TABLE literal was found in this leaf. It may be read-only, composition-only, share a parent table, or register its migration through an owner lifecycle.

## Permission declarations

- `docs.overview.view`

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
