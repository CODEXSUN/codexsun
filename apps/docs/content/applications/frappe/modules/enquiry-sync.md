# Frappe: Enquiry Sync

This page records the `enquiry-sync` module in the Frappe owner. The application business context is: verified external provider connection, source selection and synchronisation.

## Workflow role

Frappe owns provider access/sync. Credentials stay encrypted on the server; selecting a source does not bypass app permissions.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/frappe/api/src/modules/enquiry-sync/enquiry-sync.module.ts`
- `apps/frappe/api/src/modules/enquiry-sync/enquiry-sync.routes.ts`
- `apps/frappe/api/src/modules/enquiry-sync/enquiry-sync.service.ts`
- `apps/frappe/api/src/modules/enquiry-sync/enquiry-sync.types.ts`
- `apps/frappe/api/src/modules/enquiry-sync/enquiry-sync.worker.ts`
- `apps/frappe/api/src/modules/enquiry-sync/index.ts`
- `apps/frappe/web/src/modules/enquiry-sync/enquiry-sync.hooks.ts`
- `apps/frappe/web/src/modules/enquiry-sync/enquiry-sync.import.tsx`
- `apps/frappe/web/src/modules/enquiry-sync/enquiry-sync.list.tsx`
- `apps/frappe/web/src/modules/enquiry-sync/enquiry-sync.services.ts`
- `apps/frappe/web/src/modules/enquiry-sync/enquiry-sync.types.ts`
- `apps/frappe/web/src/modules/enquiry-sync/enquiry-sync.workspace.tsx`
- `apps/frappe/web/src/modules/enquiry-sync/index.ts`

## Explicit route declarations

- `/frappe/enquiries/import`
- `/frappe/enquiries/import/:jobId`
- `/frappe/enquiries/pull`
- `/frappe/enquiries/remote`

## Tables created by this leaf

No CREATE TABLE literal was found in this leaf. It may be read-only, composition-only, share a parent table, or register its migration through an owner lifecycle.

## Permission declarations

- `frappe.enquiries.import`

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
