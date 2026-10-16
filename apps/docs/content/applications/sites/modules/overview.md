# Sites: Overview

Builds the Sites overview from the tenant-owned site repository.

## Ownership and access

The backend resolves tenant context and authorization for each protected request.
Frontend controls and documentation do not grant access.
Use the public module index for cross-module imports.

## Source contracts

- `apps/sites/api/src/modules/overview/index.ts`
- `apps/sites/api/src/modules/overview/overview.module.ts`
- `apps/sites/api/src/modules/overview/overview.routes.ts`
- `apps/sites/api/src/modules/overview/overview.seed.ts`
- `apps/sites/api/src/modules/overview/overview.service.ts`
- `apps/sites/api/src/modules/overview/overview.types.ts`
- `apps/sites/web/src/modules/overview/index.ts`
- `apps/sites/web/src/modules/overview/overview.hooks.ts`
- `apps/sites/web/src/modules/overview/overview.services.ts`
- `apps/sites/web/src/modules/overview/overview.types.ts`
- `apps/sites/web/src/modules/overview/overview.workspace.tsx`

## Declared routes

- `/sites/overview`

## Explicit permission checks

- `sites.overview.view`
