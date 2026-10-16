# Core: Common / Products / Hsn Codes

This page records the `common/products/hsn-codes` module in the Core owner. The application business context is: persisted organisation, contact, product and common reference masters.

## Workflow role

Core is the shared business master owner. Billing, CRM and Ecommerce reference its public contracts rather than copying or privately importing its entities.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/core/api/src/modules/common/products/hsn-codes/hsn-codes.migration.ts`
- `apps/core/api/src/modules/common/products/hsn-codes/hsn-codes.module.ts`
- `apps/core/api/src/modules/common/products/hsn-codes/hsn-codes.repository.ts`
- `apps/core/api/src/modules/common/products/hsn-codes/hsn-codes.routes.ts`
- `apps/core/api/src/modules/common/products/hsn-codes/hsn-codes.seed.ts`
- `apps/core/api/src/modules/common/products/hsn-codes/hsn-codes.service.ts`
- `apps/core/api/src/modules/common/products/hsn-codes/hsn-codes.types.ts`
- `apps/core/api/src/modules/common/products/hsn-codes/index.ts`
- `apps/core/web/src/modules/common/products/hsn-codes/hsn-codes.form.tsx`
- `apps/core/web/src/modules/common/products/hsn-codes/hsn-codes.hooks.ts`
- `apps/core/web/src/modules/common/products/hsn-codes/hsn-codes.list.tsx`
- `apps/core/web/src/modules/common/products/hsn-codes/hsn-codes.schema.ts`
- `apps/core/web/src/modules/common/products/hsn-codes/hsn-codes.services.ts`
- `apps/core/web/src/modules/common/products/hsn-codes/hsn-codes.types.ts`
- `apps/core/web/src/modules/common/products/hsn-codes/hsn-codes.workspace.tsx`
- `apps/core/web/src/modules/common/products/hsn-codes/index.ts`

## Explicit route declarations

- `${HSN_CODES_COLLECTION_PATH}/:id`
- `${HSN_CODES_COLLECTION_PATH}/:id/activate`
- `${HSN_CODES_COLLECTION_PATH}/:id/deactivate`
- `${HSN_CODES_COLLECTION_PATH}/:id/force`

## Tables created by this leaf

- `core_hsn_codes`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
