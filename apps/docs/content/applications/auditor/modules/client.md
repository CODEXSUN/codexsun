# Auditor: Client

This page records the `client` module in the Auditor owner. The application business context is: client portal access and audit-oriented client workspace.

## Workflow role

Auditor owns client portal/credential fields. Its overview does not imply a complete statutory audit platform.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/auditor/api/src/modules/client/client.migration.ts`
- `apps/auditor/api/src/modules/client/client.module.ts`
- `apps/auditor/api/src/modules/client/client.repository.ts`
- `apps/auditor/api/src/modules/client/client.routes.ts`
- `apps/auditor/api/src/modules/client/client.secrets.ts`
- `apps/auditor/api/src/modules/client/client.seed.ts`
- `apps/auditor/api/src/modules/client/client.service.ts`
- `apps/auditor/api/src/modules/client/client.types.ts`
- `apps/auditor/api/src/modules/client/index.ts`
- `apps/auditor/web/src/modules/client/client.credentials.tsx`
- `apps/auditor/web/src/modules/client/client.form.tsx`
- `apps/auditor/web/src/modules/client/client.hooks.ts`
- `apps/auditor/web/src/modules/client/client.list.tsx`
- `apps/auditor/web/src/modules/client/client.schema.ts`
- `apps/auditor/web/src/modules/client/client.services.ts`
- `apps/auditor/web/src/modules/client/client.show.tsx`
- `apps/auditor/web/src/modules/client/client.types.ts`
- `apps/auditor/web/src/modules/client/client.workspace.tsx`
- `apps/auditor/web/src/modules/client/index.ts`

## Explicit route declarations

- `/auditor/clients`
- `/auditor/clients/:id`
- `/auditor/clients/:id/credentials`
- `/auditor/clients/:id/credentials/:portal`
- `/auditor/clients/:id/credentials/:portal/password`

## Tables created by this leaf

- `auditor_client_credentials`
- `auditor_clients`

## Permission declarations

- `auditor.client.create`
- `auditor.client.credentials.reveal`
- `auditor.client.credentials.update`
- `auditor.client.credentials.view`
- `auditor.client.update`
- `auditor.client.view`

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
