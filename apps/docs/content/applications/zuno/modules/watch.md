# Zuno: Watch

This page records the `watch` module in the Zuno owner. The application business context is: super admin development diagnosis, conversations, cases and operational watch.

## Workflow role

Zuno is a privileged development/operations devkit, not a tenant business app. It reads repository baseline docs, not another tenant's overrides.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `devkits/zuno/api/src/modules/watch/index.ts`
- `devkits/zuno/api/src/modules/watch/watch.module.ts`
- `devkits/zuno/api/src/modules/watch/watch.repository.ts`
- `devkits/zuno/api/src/modules/watch/watch.routes.ts`
- `devkits/zuno/api/src/modules/watch/watch.service.ts`
- `devkits/zuno/api/src/modules/watch/watch.types.ts`
- `devkits/zuno/web/src/modules/watch/index.ts`
- `devkits/zuno/web/src/modules/watch/watch.hooks.ts`
- `devkits/zuno/web/src/modules/watch/watch.list.tsx`
- `devkits/zuno/web/src/modules/watch/watch.services.ts`
- `devkits/zuno/web/src/modules/watch/watch.types.ts`
- `devkits/zuno/web/src/modules/watch/watch.workspace.tsx`

## Explicit route declarations

- `/watch`

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
