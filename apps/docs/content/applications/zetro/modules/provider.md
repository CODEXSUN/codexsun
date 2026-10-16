# Zetro: Provider

This page records the `provider` module in the Zetro owner. The application business context is: permission-aware tenant ai coworker and reviewed read skills.

## Workflow role

Zetro can read only backend-authorised evidence. Draft patterns and model output cannot grant permissions or run SQL/shell actions.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/zetro/api/src/modules/provider/index.ts`
- `apps/zetro/api/src/modules/provider/provider.admin.routes.ts`
- `apps/zetro/api/src/modules/provider/provider.codex-cli.ts`
- `apps/zetro/api/src/modules/provider/provider.codex-local.ts`
- `apps/zetro/api/src/modules/provider/provider.migration.ts`
- `apps/zetro/api/src/modules/provider/provider.module.ts`
- `apps/zetro/api/src/modules/provider/provider.repository.ts`
- `apps/zetro/api/src/modules/provider/provider.routes.ts`
- `apps/zetro/api/src/modules/provider/provider.secrets.ts`
- `apps/zetro/api/src/modules/provider/provider.seed.ts`
- `apps/zetro/api/src/modules/provider/provider.service.ts`
- `apps/zetro/api/src/modules/provider/provider.types.ts`
- `apps/zetro/web/src/modules/provider/index.ts`
- `apps/zetro/web/src/modules/provider/provider.services.ts`
- `apps/zetro/web/src/modules/provider/provider.types.ts`
- `apps/zetro/web/src/modules/provider/provider.workspace.tsx`

## Explicit route declarations

- `/zetro/admin/tenants/:tenantId/provider`
- `/zetro/admin/tenants/:tenantId/provider/models`
- `/zetro/provider`
- `/zetro/provider/codex/bind-local`
- `/zetro/provider/codex/device-login`
- `/zetro/provider/codex/disconnect`
- `/zetro/provider/codex/local-status`
- `/zetro/provider/codex/status`
- `/zetro/provider/models`

## Tables created by this leaf

- `zetro_provider_settings`

## Permission declarations

- `zetro.provider.manage`

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
