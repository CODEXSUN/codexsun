# Project Manager: Ideas

This page records the `ideas` module in the Project Manager owner. The application business context is: super admin platform registry and implementation ideas.

## Workflow role

Project Manager is a Super Admin devkit. Registry metadata does not create business routes or bypass activation.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `devkits/project-manager/api/src/modules/ideas/ideas.migration.ts`
- `devkits/project-manager/api/src/modules/ideas/ideas.module.ts`
- `devkits/project-manager/api/src/modules/ideas/ideas.repository.ts`
- `devkits/project-manager/api/src/modules/ideas/ideas.routes.ts`
- `devkits/project-manager/api/src/modules/ideas/ideas.service.ts`
- `devkits/project-manager/api/src/modules/ideas/ideas.types.ts`
- `devkits/project-manager/api/src/modules/ideas/index.ts`
- `devkits/project-manager/web/src/modules/ideas/ideas.form.tsx`
- `devkits/project-manager/web/src/modules/ideas/ideas.hooks.ts`
- `devkits/project-manager/web/src/modules/ideas/ideas.list.tsx`
- `devkits/project-manager/web/src/modules/ideas/ideas.schema.ts`
- `devkits/project-manager/web/src/modules/ideas/ideas.services.ts`
- `devkits/project-manager/web/src/modules/ideas/ideas.types.ts`
- `devkits/project-manager/web/src/modules/ideas/ideas.workspace.tsx`
- `devkits/project-manager/web/src/modules/ideas/index.ts`

## Explicit route declarations

- `${path}/:uuid`
- `${path}/:uuid/archive`

## Tables created by this leaf

- `project_manager_ideas`
- `project_manager_ideas_activity`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
