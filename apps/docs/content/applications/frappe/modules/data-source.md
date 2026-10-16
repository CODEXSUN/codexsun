# Frappe: Data Source

This page records the `data-source` module in the Frappe owner. The application business context is: verified external provider connection, source selection and synchronisation.

## Workflow role

Frappe owns provider access/sync. Credentials stay encrypted on the server; selecting a source does not bypass app permissions.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/frappe/web/src/modules/data-source/data-source.workspace.tsx`
- `apps/frappe/web/src/modules/data-source/index.ts`

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
