# Zuno: Conversations

This page records the `conversations` module in the Zuno owner. The application business context is: super admin development diagnosis, conversations, cases and operational watch.

## Workflow role

Zuno is a privileged development/operations devkit, not a tenant business app. It reads repository baseline docs, not another tenant's overrides.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `devkits/zuno/api/src/modules/conversations/conversations.migration.ts`
- `devkits/zuno/api/src/modules/conversations/conversations.module.ts`
- `devkits/zuno/api/src/modules/conversations/conversations.repository.ts`
- `devkits/zuno/api/src/modules/conversations/conversations.routes.ts`
- `devkits/zuno/api/src/modules/conversations/conversations.service.ts`
- `devkits/zuno/api/src/modules/conversations/conversations.types.ts`
- `devkits/zuno/api/src/modules/conversations/index.ts`
- `devkits/zuno/web/src/modules/conversations/conversations.form.tsx`
- `devkits/zuno/web/src/modules/conversations/conversations.hooks.ts`
- `devkits/zuno/web/src/modules/conversations/conversations.list.tsx`
- `devkits/zuno/web/src/modules/conversations/conversations.schema.ts`
- `devkits/zuno/web/src/modules/conversations/conversations.services.ts`
- `devkits/zuno/web/src/modules/conversations/conversations.show.tsx`
- `devkits/zuno/web/src/modules/conversations/conversations.types.ts`
- `devkits/zuno/web/src/modules/conversations/conversations.workspace.tsx`
- `devkits/zuno/web/src/modules/conversations/index.ts`

## Explicit route declarations

- `/conversations`
- `/conversations/:uuid`
- `/conversations/:uuid/archive`
- `/conversations/:uuid/messages`
- `/conversations/:uuid/recover`
- `/conversations/:uuid/restore`
- `/conversations/:uuid/title`

## Tables created by this leaf

- `zuno_messages`
- `zuno_threads`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
