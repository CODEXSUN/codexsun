# Project Manager: Platform Registry

This page records the `platform-registry` module in the Project Manager owner. The application business context is: super admin platform registry and implementation ideas.

## Workflow role

Project Manager is a Super Admin devkit. Registry metadata does not create business routes or bypass activation.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `devkits/project-manager/api/src/modules/platform-registry/index.ts`
- `devkits/project-manager/api/src/modules/platform-registry/platform-registry.migration.ts`
- `devkits/project-manager/api/src/modules/platform-registry/platform-registry.module.ts`
- `devkits/project-manager/api/src/modules/platform-registry/platform-registry.repository.ts`
- `devkits/project-manager/api/src/modules/platform-registry/platform-registry.routes.ts`
- `devkits/project-manager/api/src/modules/platform-registry/platform-registry.seed.ts`
- `devkits/project-manager/api/src/modules/platform-registry/platform-registry.service.ts`
- `devkits/project-manager/api/src/modules/platform-registry/platform-registry.types.ts`
- `devkits/project-manager/web/src/modules/platform-registry/index.ts`
- `devkits/project-manager/web/src/modules/platform-registry/platform-registry.contracts.ts`
- `devkits/project-manager/web/src/modules/platform-registry/platform-registry.form.tsx`
- `devkits/project-manager/web/src/modules/platform-registry/platform-registry.hooks.ts`
- `devkits/project-manager/web/src/modules/platform-registry/platform-registry.list.tsx`
- `devkits/project-manager/web/src/modules/platform-registry/platform-registry.schema.ts`
- `devkits/project-manager/web/src/modules/platform-registry/platform-registry.services.ts`
- `devkits/project-manager/web/src/modules/platform-registry/platform-registry.show.tsx`
- `devkits/project-manager/web/src/modules/platform-registry/platform-registry.types.ts`
- `devkits/project-manager/web/src/modules/platform-registry/platform-registry.workspace.tsx`

## Explicit route declarations

No fixed URL literal was found in this leaf. Check its public registration/composition exports for inherited or generated routes.

## Tables created by this leaf

- `devkit_platform_registry_activity`
- `devkit_platform_registry_groups`
- `devkit_platform_registry_modules`
- `devkit_platform_registry_platforms`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
