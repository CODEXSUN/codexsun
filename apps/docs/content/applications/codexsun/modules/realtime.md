# Codexsun: Realtime

Registers the CODEXSUN realtime capability and its scoped delivery behavior.

## Ownership and access

The backend resolves tenant context and authorization for each protected request.
Frontend controls and documentation do not grant access.
Use the public module index for cross-module imports.

## Source contracts

- `apps/codexsun/api/src/modules/realtime/index.ts`
- `apps/codexsun/api/src/modules/realtime/realtime.module.ts`
- `apps/codexsun/api/src/modules/realtime/realtime.service.ts`
- `apps/codexsun/api/src/modules/realtime/realtime.test.ts`
- `apps/codexsun/api/src/modules/realtime/realtime.types.ts`

## Declared routes

- `/codexsun/socket.io`
