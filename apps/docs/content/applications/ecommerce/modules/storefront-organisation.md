# Ecommerce: Storefront Organisation

The organisation singleton selects the tenant company and financial year used for storefront branding.
Staff edit it at `/app/ecommerce/organisation`. Core owns company and financial-year identity.
Ecommerce owns the selection, display-name override, logo reference, and activity records.

## Save and branding behavior

The service accepts only active companies and financial years returned by Core for the current tenant database.
It trims the display name, validates an uploaded logo reference, saves the settings, and invalidates the storefront read cache.
Branding prefers the display-name override, then the selected company legal name, company name, and finally `Store`.
An uploaded organisation logo takes precedence over the selected company's light and dark logos.
The public branding response also includes the company phone number.

## Ownership and access

The Platform host supplies signed tenant context, activation, and applicable authorization.
Request schemas validate fixed settings and upload payloads. Documentation does not grant access.
The logo-storage tests cover file validation, tenant paths, cross-tenant rejection, and traversal protection.
This singleton has no create/delete list lifecycle, background worker, or offline synchronization.

## Persistence and upgrades

`ecommerce_storefront_organisation` holds singleton settings.
`ecommerce_storefront_organisation_activity` holds the change history.
Company and financial-year foreign keys reference Core tables in the tenant database.
The branding upgrade adds display-name and logo-reference columns to existing tables.
Apply the owning tenant migrations before enabling the changed contracts on an existing database.
The repeatable seed uses singleton key 1 and preserves existing saved values.

## Source contracts

- `apps/ecommerce/api/src/modules/storefront-organisation/index.ts`
- `apps/ecommerce/api/src/modules/storefront-organisation/storefront-organisation.migration.ts`
- `apps/ecommerce/api/src/modules/storefront-organisation/storefront-organisation.module.ts`
- `apps/ecommerce/api/src/modules/storefront-organisation/storefront-organisation.repository.ts`
- `apps/ecommerce/api/src/modules/storefront-organisation/storefront-organisation.routes.ts`
- `apps/ecommerce/api/src/modules/storefront-organisation/storefront-organisation.seed.ts`
- `apps/ecommerce/api/src/modules/storefront-organisation/storefront-organisation.service.ts`
- `apps/ecommerce/api/src/modules/storefront-organisation/storefront-organisation.storage.test.ts`
- `apps/ecommerce/api/src/modules/storefront-organisation/storefront-organisation.storage.ts`
- `apps/ecommerce/api/src/modules/storefront-organisation/storefront-organisation.types.ts`
- `apps/ecommerce/web/src/modules/storefront-organisation/index.ts`
- `apps/ecommerce/web/src/modules/storefront-organisation/storefront-organisation.form.tsx`
- `apps/ecommerce/web/src/modules/storefront-organisation/storefront-organisation.hooks.ts`
- `apps/ecommerce/web/src/modules/storefront-organisation/storefront-organisation.schema.ts`
- `apps/ecommerce/web/src/modules/storefront-organisation/storefront-organisation.services.ts`
- `apps/ecommerce/web/src/modules/storefront-organisation/storefront-organisation.types.ts`
- `apps/ecommerce/web/src/modules/storefront-organisation/storefront-organisation.workspace.tsx`

## Verification

Run Ecommerce API and web typechecks, lint, module boundaries, and the organisation logo-storage tests.
Verify company/year rejection and saved branding through authenticated HTTP when a test tenant is available.
A passing build does not establish live tenant persistence or browser behavior.
