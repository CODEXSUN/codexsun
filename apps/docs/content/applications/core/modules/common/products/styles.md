# Core: Common / Products / Styles

This page records the `common/products/styles` module in the Core owner. The application business context is: persisted organisation, contact, product and common reference masters.

## Workflow role

Core is the shared business master owner. Billing, CRM and Ecommerce reference its public contracts rather than copying or privately importing its entities.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/core/api/src/modules/common/products/styles/index.ts`
- `apps/core/api/src/modules/common/products/styles/styles.migration.ts`
- `apps/core/api/src/modules/common/products/styles/styles.module.ts`
- `apps/core/api/src/modules/common/products/styles/styles.repository.ts`
- `apps/core/api/src/modules/common/products/styles/styles.routes.ts`
- `apps/core/api/src/modules/common/products/styles/styles.seed.ts`
- `apps/core/api/src/modules/common/products/styles/styles.service.ts`
- `apps/core/api/src/modules/common/products/styles/styles.types.ts`
- `apps/core/web/src/modules/common/products/styles/index.ts`
- `apps/core/web/src/modules/common/products/styles/styles.form.tsx`
- `apps/core/web/src/modules/common/products/styles/styles.hooks.ts`
- `apps/core/web/src/modules/common/products/styles/styles.list.tsx`
- `apps/core/web/src/modules/common/products/styles/styles.schema.ts`
- `apps/core/web/src/modules/common/products/styles/styles.services.ts`
- `apps/core/web/src/modules/common/products/styles/styles.types.ts`
- `apps/core/web/src/modules/common/products/styles/styles.workspace.tsx`

## Explicit route declarations

- `${STYLES_COLLECTION_PATH}/:id`
- `${STYLES_COLLECTION_PATH}/:id/activate`
- `${STYLES_COLLECTION_PATH}/:id/deactivate`
- `${STYLES_COLLECTION_PATH}/:id/force`

## Tables created by this leaf

- `core_styles`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
