# Frappe: Connection

This page records the `connection` module in the Frappe owner. The application business context is: verified external provider connection, source selection and synchronisation.

## Workflow role

Frappe owns provider access/sync. Credentials stay encrypted on the server; selecting a source does not bypass app permissions.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/frappe/api/src/modules/connection/connection.access.ts`
- `apps/frappe/api/src/modules/connection/connection.aggregate-enquiries.ts`
- `apps/frappe/api/src/modules/connection/connection.data-source.ts`
- `apps/frappe/api/src/modules/connection/connection.live-actions.ts`
- `apps/frappe/api/src/modules/connection/connection.live-enquiries.ts`
- `apps/frappe/api/src/modules/connection/connection.migration.ts`
- `apps/frappe/api/src/modules/connection/connection.module.ts`
- `apps/frappe/api/src/modules/connection/connection.repository.ts`
- `apps/frappe/api/src/modules/connection/connection.routes.ts`
- `apps/frappe/api/src/modules/connection/connection.secrets.ts`
- `apps/frappe/api/src/modules/connection/connection.seed.ts`
- `apps/frappe/api/src/modules/connection/connection.service.ts`
- `apps/frappe/api/src/modules/connection/connection.types.ts`
- `apps/frappe/api/src/modules/connection/index.ts`
- `apps/frappe/web/src/modules/connection/connection.form.tsx`
- `apps/frappe/web/src/modules/connection/connection.hooks.ts`
- `apps/frappe/web/src/modules/connection/connection.schema.ts`
- `apps/frappe/web/src/modules/connection/connection.services.ts`
- `apps/frappe/web/src/modules/connection/connection.types.ts`
- `apps/frappe/web/src/modules/connection/connection.workspace.tsx`
- `apps/frappe/web/src/modules/connection/index.ts`

## Explicit route declarations

- `/frappe/connection`
- `/frappe/connection/verify`
- `/frappe/data-sources/crm.enquiries`
- `/frappe/enquiries/:id/sync`
- `/frappe/overview`

## Tables created by this leaf

- `frappe_connection_settings`
- `frappe_data_sources`
- `frappe_enquiry_sync`

## Permission declarations

- `frappe.connection.manage`

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
