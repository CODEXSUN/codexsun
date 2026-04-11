# Planning

## Active Batch

- Reference: `#116`
- Title: `Storefront homepage UX restoration`

## Scope

- Restore the public storefront home route so it renders the existing split home feature modules again.
- Keep the current shell split, technical-name boundaries, and shared storefront data flow intact.
- Add clear loading and error behavior so the homepage does not collapse to an empty shell while data is resolving or unavailable.
- Remove the hardcoded storefront browser title so document titles derive from the runtime company brand, with `/` using only the company name.
- Start a staged storefront shell review mode by temporarily hiding the homepage hero slider while keeping the remaining sections visible for responsive fixes.
- Remove the remaining hardcoded app-shell title fallback so dashboard tabs also resolve from the runtime company brand.

## Assumptions

- The latest storefront work intentionally isolated the shell for manual review and did not delete the underlying home sections.
- The existing home model and section modules remain the correct ownership boundary for homepage composition inside `apps/ecommerce`.
- No architecture or shared design-system default changes are required for this batch.

## Validation Plan

- Run `npm.cmd run typecheck`.
- Run one focused storefront e2e check that covers the homepage path if the local test environment is available.
- Run focused storefront metadata tests after the title formatter change.
- Re-run the storefront mobile matrix after the hero is hidden so the homepage assertions follow the visible non-hero sections.
- Run a focused dashboard title formatter test after the shared shell title change.

## Validation Performed

- `npm.cmd run typecheck`
- `npx.cmd playwright test tests/e2e/storefront-mobile-matrix.spec.ts`
- `npx.cmd tsx --test tests/ecommerce/storefront-metadata.test.ts`
- `npx.cmd tsx --test tests/ui/dashboard-metadata.test.ts`

## Risks

- Homepage section spacing may regress when the hidden review placeholder is replaced with the live composition.
- Cached landing data and failed fetch states need to degrade without hiding all visible content.

## Residual Risk

- This batch restores the homepage route and mobile viewport coverage, but it does not yet add a homepage-specific regression test that asserts individual desktop section ordering beyond the existing storefront matrix.
- Storefront metadata now derives the browser title from the runtime brand, but the homepage meta description still uses the current seeded storefront copy rather than company-authored dynamic description fields.
- The hero slider is now intentionally suppressed through a shell-level review override, so the next storefront pass should either replace that hero with a responsive version or remove the temporary override once the remaining sections are stabilized.
- Dashboard titles now derive from the runtime brand when the shared admin shell is mounted, but unauthenticated routes such as login still fall back to the generic root HTML title until a broader public-shell metadata pass is added.
