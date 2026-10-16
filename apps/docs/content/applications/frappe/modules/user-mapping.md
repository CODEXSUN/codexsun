# Frappe: User Mapping

This page records the `user-mapping` module in the Frappe owner. The application business context is: verified external provider connection, source selection and synchronisation.

## Workflow role

Frappe owns provider access/sync. Credentials stay encrypted on the server; selecting a source does not bypass app permissions.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/frappe/api/src/modules/user-mapping/index.ts`
- `apps/frappe/api/src/modules/user-mapping/user-mapping.migration.ts`
- `apps/frappe/api/src/modules/user-mapping/user-mapping.module.ts`
- `apps/frappe/api/src/modules/user-mapping/user-mapping.repository.ts`
- `apps/frappe/api/src/modules/user-mapping/user-mapping.routes.ts`
- `apps/frappe/api/src/modules/user-mapping/user-mapping.service.ts`
- `apps/frappe/api/src/modules/user-mapping/user-mapping.types.ts`
- `apps/frappe/web/src/modules/user-mapping/index.ts`
- `apps/frappe/web/src/modules/user-mapping/user-mapping.form.tsx`
- `apps/frappe/web/src/modules/user-mapping/user-mapping.hooks.ts`
- `apps/frappe/web/src/modules/user-mapping/user-mapping.list.tsx`
- `apps/frappe/web/src/modules/user-mapping/user-mapping.schema.ts`
- `apps/frappe/web/src/modules/user-mapping/user-mapping.services.ts`
- `apps/frappe/web/src/modules/user-mapping/user-mapping.types.ts`
- `apps/frappe/web/src/modules/user-mapping/user-mapping.workspace.tsx`

## Explicit route declarations

- `/frappe/user-mappings`
- `/frappe/user-mappings/:localUserId`

## Tables created by this leaf

- `frappe_user_mappings`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
