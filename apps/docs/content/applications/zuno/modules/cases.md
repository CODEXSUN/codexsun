# Zuno: Cases

This page records the `cases` module in the Zuno owner. The application business context is: super admin development diagnosis, conversations, cases and operational watch.

## Workflow role

Zuno is a privileged development/operations devkit, not a tenant business app. It reads repository baseline docs, not another tenant's overrides.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `devkits/zuno/api/src/modules/cases/cases.migration.ts`
- `devkits/zuno/api/src/modules/cases/cases.module.ts`
- `devkits/zuno/api/src/modules/cases/cases.repository.ts`
- `devkits/zuno/api/src/modules/cases/cases.routes.ts`
- `devkits/zuno/api/src/modules/cases/cases.service.ts`
- `devkits/zuno/api/src/modules/cases/cases.types.ts`
- `devkits/zuno/api/src/modules/cases/index.ts`
- `devkits/zuno/web/src/modules/cases/cases.form.tsx`
- `devkits/zuno/web/src/modules/cases/cases.hooks.ts`
- `devkits/zuno/web/src/modules/cases/cases.list.tsx`
- `devkits/zuno/web/src/modules/cases/cases.schema.ts`
- `devkits/zuno/web/src/modules/cases/cases.services.ts`
- `devkits/zuno/web/src/modules/cases/cases.show.tsx`
- `devkits/zuno/web/src/modules/cases/cases.types.ts`
- `devkits/zuno/web/src/modules/cases/cases.workspace.tsx`
- `devkits/zuno/web/src/modules/cases/index.ts`

## Explicit route declarations

- `/cases`
- `/cases/:uuid`
- `/cases/:uuid/approve`
- `/cases/:uuid/cancel`
- `/cases/:uuid/complete`
- `/cases/:uuid/execute-sql`
- `/cases/:uuid/proposal`
- `/cases/:uuid/reconcile-sql`
- `/cases/:uuid/sql-plan`
- `/cases/targets`

## Tables created by this leaf

- `zuno_case_activity`
- `zuno_cases`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
