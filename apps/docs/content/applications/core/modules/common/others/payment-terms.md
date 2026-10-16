# Core: Common / Others / Payment Terms

This page records the `common/others/payment-terms` module in the Core owner. The application business context is: persisted organisation, contact, product and common reference masters.

## Workflow role

Core is the shared business master owner. Billing, CRM and Ecommerce reference its public contracts rather than copying or privately importing its entities.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/core/api/src/modules/common/others/payment-terms/index.ts`
- `apps/core/api/src/modules/common/others/payment-terms/payment-terms.migration.ts`
- `apps/core/api/src/modules/common/others/payment-terms/payment-terms.module.ts`
- `apps/core/api/src/modules/common/others/payment-terms/payment-terms.repository.ts`
- `apps/core/api/src/modules/common/others/payment-terms/payment-terms.routes.ts`
- `apps/core/api/src/modules/common/others/payment-terms/payment-terms.seed.ts`
- `apps/core/api/src/modules/common/others/payment-terms/payment-terms.service.ts`
- `apps/core/api/src/modules/common/others/payment-terms/payment-terms.types.ts`
- `apps/core/web/src/modules/common/others/payment-terms/index.ts`
- `apps/core/web/src/modules/common/others/payment-terms/payment-terms.form.tsx`
- `apps/core/web/src/modules/common/others/payment-terms/payment-terms.hooks.ts`
- `apps/core/web/src/modules/common/others/payment-terms/payment-terms.list.tsx`
- `apps/core/web/src/modules/common/others/payment-terms/payment-terms.schema.ts`
- `apps/core/web/src/modules/common/others/payment-terms/payment-terms.services.ts`
- `apps/core/web/src/modules/common/others/payment-terms/payment-terms.types.ts`
- `apps/core/web/src/modules/common/others/payment-terms/payment-terms.workspace.tsx`

## Explicit route declarations

- `${PAYMENT_TERMS_COLLECTION_PATH}/:id`
- `${PAYMENT_TERMS_COLLECTION_PATH}/:id/activate`
- `${PAYMENT_TERMS_COLLECTION_PATH}/:id/deactivate`
- `${PAYMENT_TERMS_COLLECTION_PATH}/:id/force`

## Tables created by this leaf

- `core_payment_terms`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
