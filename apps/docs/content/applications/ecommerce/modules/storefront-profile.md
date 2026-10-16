# Ecommerce: Storefront Profile

This page records the `storefront-profile` module in the Ecommerce owner. The application business context is: product enrichment, merchandising and storefront configuration.

## Workflow role

Ecommerce owns merchandising. Verify current source files for paid checkout/order capabilities; do not infer them from a store page.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/ecommerce/api/src/modules/storefront-profile/index.ts`
- `apps/ecommerce/api/src/modules/storefront-profile/storefront-profile.migration.ts`
- `apps/ecommerce/api/src/modules/storefront-profile/storefront-profile.module.ts`
- `apps/ecommerce/api/src/modules/storefront-profile/storefront-profile.repository.ts`
- `apps/ecommerce/api/src/modules/storefront-profile/storefront-profile.routes.ts`
- `apps/ecommerce/api/src/modules/storefront-profile/storefront-profile.seed.ts`
- `apps/ecommerce/api/src/modules/storefront-profile/storefront-profile.service.ts`
- `apps/ecommerce/api/src/modules/storefront-profile/storefront-profile.types.ts`
- `apps/ecommerce/web/src/modules/storefront-profile/index.ts`
- `apps/ecommerce/web/src/modules/storefront-profile/storefront-profile.form.tsx`
- `apps/ecommerce/web/src/modules/storefront-profile/storefront-profile.hooks.ts`
- `apps/ecommerce/web/src/modules/storefront-profile/storefront-profile.payment-methods.tsx`
- `apps/ecommerce/web/src/modules/storefront-profile/storefront-profile.schema.ts`
- `apps/ecommerce/web/src/modules/storefront-profile/storefront-profile.services.ts`
- `apps/ecommerce/web/src/modules/storefront-profile/storefront-profile.types.ts`
- `apps/ecommerce/web/src/modules/storefront-profile/storefront-profile.workspace.tsx`

## Explicit route declarations

- `/ecommerce/storefront/profile`
- `/storefront/profile`

## Tables created by this leaf

- `ecommerce_storefront_profiles`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
