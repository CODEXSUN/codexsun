# Ecommerce: workflow

## Supported sequence

1. Link product information to Core identities or the configured ERP/provider source.
2. Manage variants, images and the catalog data source.
3. Configure sliders, promotions, featured cards, season strips, announcements, trust/service sections and store profile.
4. Review active/published states and use the configured storefront delivery/composition.
5. Inspect matching/sync and owner audit before exposing a product.

## Failure and access handling

Authentication, tenant scope, app activation and owner permission checks apply at the owning API. Preserve validation errors, missing-parent responses, duplicate policy, inactive states and audit. A provider/source configuration can change the workflow; confirm its live owner contract.

## Developer change workflow

1. Read the app guide and the owning module page.
2. Trace route → service → repository and frontend gateway → hooks → workspace.
3. Change the owning entity and its public consumers together.
4. Add a new immutable migration step for an applied schema change.
5. Run boundary, TypeScript, lint, build and affected database/browser tests from the root.
6. Refresh reference facts when source contracts change.
