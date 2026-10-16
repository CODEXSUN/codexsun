# Ecommerce: Catalog Matching

This page records the `catalog-matching` module in the Ecommerce owner. The application business context is: product enrichment, merchandising and storefront configuration.

## Workflow role

Ecommerce owns merchandising. Verify current source files for paid checkout/order capabilities; do not infer them from a store page.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/ecommerce/api/src/modules/catalog-matching/catalog-matching.domain.ts`
- `apps/ecommerce/api/src/modules/catalog-matching/catalog-matching.migration.ts`
- `apps/ecommerce/api/src/modules/catalog-matching/catalog-matching.module.ts`
- `apps/ecommerce/api/src/modules/catalog-matching/catalog-matching.outbox.ts`
- `apps/ecommerce/api/src/modules/catalog-matching/catalog-matching.repository.ts`
- `apps/ecommerce/api/src/modules/catalog-matching/catalog-matching.routes.ts`
- `apps/ecommerce/api/src/modules/catalog-matching/catalog-matching.seed.ts`
- `apps/ecommerce/api/src/modules/catalog-matching/catalog-matching.service.ts`
- `apps/ecommerce/api/src/modules/catalog-matching/catalog-matching.types.ts`
- `apps/ecommerce/api/src/modules/catalog-matching/catalog-matching.worker.ts`
- `apps/ecommerce/api/src/modules/catalog-matching/index.ts`

## Explicit route declarations

No fixed URL literal was found in this leaf. Check its public registration/composition exports for inherited or generated routes.

## Tables created by this leaf

- `ecommerce_catalog_match_outbox`
- `ecommerce_catalog_match_requests`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
