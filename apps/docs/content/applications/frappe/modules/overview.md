# Frappe: Overview

This page records the `overview` module in the Frappe owner. The application business context is: verified external provider connection, source selection and synchronisation.

## Workflow role

Frappe owns provider access/sync. Credentials stay encrypted on the server; selecting a source does not bypass app permissions.

This is an overview/composition surface; it does not by itself implement all domain workflows.

## Source contracts

- `apps/frappe/web/src/modules/overview/index.ts`
- `apps/frappe/web/src/modules/overview/overview.hooks.ts`
- `apps/frappe/web/src/modules/overview/overview.list.tsx`
- `apps/frappe/web/src/modules/overview/overview.services.ts`
- `apps/frappe/web/src/modules/overview/overview.types.ts`
- `apps/frappe/web/src/modules/overview/overview.workspace.tsx`

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
