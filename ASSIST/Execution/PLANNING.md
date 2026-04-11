# Planning

## Active Batch

- Reference: `#116`
- Title: `Storefront homepage UX restoration`

## Scope

- Restore the public storefront home route so it renders the existing split home feature modules again.
- Keep the current shell split, technical-name boundaries, and shared storefront data flow intact.
- Add clear loading and error behavior so the homepage does not collapse to an empty shell while data is resolving or unavailable.
- Remove the hardcoded storefront browser title so document titles derive from the runtime company brand, with `/` using only the company name.

## Assumptions

- The latest storefront work intentionally isolated the shell for manual review and did not delete the underlying home sections.
- The existing home model and section modules remain the correct ownership boundary for homepage composition inside `apps/ecommerce`.
- No architecture or shared design-system default changes are required for this batch.

## Validation Plan

- Run `npm.cmd run typecheck`.
- Run one focused storefront e2e check that covers the homepage path if the local test environment is available.
- Run focused storefront metadata tests after the title formatter change.

## Validation Performed

- `npm.cmd run typecheck`
- `npx.cmd playwright test tests/e2e/storefront-mobile-matrix.spec.ts`
- `npx.cmd tsx --test tests/ecommerce/storefront-metadata.test.ts`

## Risks

- Homepage section spacing may regress when the hidden review placeholder is replaced with the live composition.
- Cached landing data and failed fetch states need to degrade without hiding all visible content.

## Residual Risk

- This batch restores the homepage route and mobile viewport coverage, but it does not yet add a homepage-specific regression test that asserts individual desktop section ordering beyond the existing storefront matrix.
- Storefront metadata now derives the browser title from the runtime brand, but the homepage meta description still uses the current seeded storefront copy rather than company-authored dynamic description fields.
