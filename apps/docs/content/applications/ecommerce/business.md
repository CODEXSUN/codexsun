# Ecommerce: core business and ownership

Product enrichment, merchandising and storefront configuration.

## Ownership boundary

Ecommerce owns merchandising. Verify current source files for paid checkout/order capabilities; do not infer them from a store page.

## Inputs and outputs

- Link product information to Core identities or the configured ERP/provider source.
- Manage variants, images and the catalog data source.
- Configure sliders, promotions, featured cards, season strips, announcements, trust/service sections and store profile.
- Review active/published states and use the configured storefront delivery/composition.
- Inspect matching/sync and owner audit before exposing a product.

## Extension rules

Keep new entities, validation, routes, migrations, permissions and UI inside `apps/ecommerce` or the external owner contract. Use public lookups for parent identities. Register app/tenant scope through Platform composition; never copy parent private implementations.

## Data and authority

Repository pages describe code. Tenant metadata and overrides are isolated to the signed tenant database. Developer prose is evidence for review, not authority to run database or external actions. Confirm the installed version, source provider and current permissions before relying on a business result.
