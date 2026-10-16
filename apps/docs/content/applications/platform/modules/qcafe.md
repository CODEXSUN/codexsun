# Platform: Qcafe

Hosts QCafe contracts in the authenticated Platform runtime. Image uploads validate names, file types, and size before writing tenant storage.

## Ownership and access

The backend resolves tenant context and authorization for each protected request.
Frontend controls and documentation do not grant access.
Use the public module index for cross-module imports.

## Source contracts

- `apps/platform/api/src/modules/qcafe/index.ts`
- `apps/platform/api/src/modules/qcafe/qcafe.module.ts`
- `apps/platform/api/src/modules/qcafe/qcafe.routes.ts`
- `apps/platform/api/src/modules/qcafe/qcafe.types.ts`
