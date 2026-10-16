# Ecommerce: Catalog Data Source

This page records the `catalog-data-source` module in the Ecommerce owner. The application business context is: product enrichment, merchandising and storefront configuration.

## Workflow role

Ecommerce owns merchandising. Verify current source files for paid checkout/order capabilities; do not infer them from a store page.

Trace this module's concrete entry points below before changing its behavior. Its service is the authority for validation, lifecycle and dependency decisions; frontend controls cannot grant permissions.

## Source contracts

- `apps/ecommerce/api/src/modules/catalog-data-source/catalog-data-source.availability.ts`
- `apps/ecommerce/api/src/modules/catalog-data-source/catalog-data-source.control.ts`
- `apps/ecommerce/api/src/modules/catalog-data-source/catalog-data-source.frappe.ts`
- `apps/ecommerce/api/src/modules/catalog-data-source/catalog-data-source.migration.ts`
- `apps/ecommerce/api/src/modules/catalog-data-source/catalog-data-source.repository.ts`
- `apps/ecommerce/api/src/modules/catalog-data-source/catalog-data-source.routes.ts`
- `apps/ecommerce/api/src/modules/catalog-data-source/catalog-data-source.service.ts`
- `apps/ecommerce/api/src/modules/catalog-data-source/catalog-data-source.types.ts`
- `apps/ecommerce/api/src/modules/catalog-data-source/index.ts`
- `apps/ecommerce/web/src/modules/catalog-data-source/catalog-data-source.form.tsx`
- `apps/ecommerce/web/src/modules/catalog-data-source/catalog-data-source.hooks.ts`
- `apps/ecommerce/web/src/modules/catalog-data-source/catalog-data-source.list.tsx`
- `apps/ecommerce/web/src/modules/catalog-data-source/catalog-data-source.schema.ts`
- `apps/ecommerce/web/src/modules/catalog-data-source/catalog-data-source.services.ts`
- `apps/ecommerce/web/src/modules/catalog-data-source/catalog-data-source.types.ts`
- `apps/ecommerce/web/src/modules/catalog-data-source/catalog-data-source.workspace.tsx`
- `apps/ecommerce/web/src/modules/catalog-data-source/index.ts`
- `apps/ecommerce/web/src/modules/catalog-data-source/storefront-section-switch.tsx`

## Explicit route declarations

- `/ecommerce/settings/data-source`
- `/ecommerce/settings/data-source/frappe-items`
- `/ecommerce/settings/data-source/frappe-items/:itemCode`
- `/ecommerce/settings/data-source/sync/pull`
- `/ecommerce/settings/data-source/sync/push`
- `/ecommerce/settings/data-source/test`
- `/ecommerce/settings/data-source/visibility`

## Tables created by this leaf

- `ecommerce_catalog_items`
- `ecommerce_catalog_module_data_sources`
- `ecommerce_catalog_sync_runs`
- `ecommerce_ishop_catalogs`

## Permission declarations

No permission literal was detected. Check injected authorisation and app/host guards in the public composition contract.

## Request and change flow

```text
authenticated context → owning route schema → service decisions → repository/read contract
frontend gateway → owner query hooks → workspace/form/list → fixed API operation
```

Do not infer CRUD capabilities from file names. Review request/response schemas, parent lookups, transaction/audit writes, status policy and delete blockers in the listed source files. Applied migration checksums must not be rewritten.
