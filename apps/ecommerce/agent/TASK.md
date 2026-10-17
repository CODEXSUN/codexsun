# Ecommerce tasks

## Responsibility

Staff catalog management, matching and publishing controls, and the public storefront.

Core owns shared product identity and Frappe owns connection credentials. Public routes return published tenant content only. A browser basket does not prove order, payment, or stock-reservation support.

Read [the component README](../README.md), [the plan](PLAN.md), and [the skills](SKILLS.md) before changing this owner.
These tasks define acceptance for a change. Unchecked items are not claims of missing production features.

## Change checklist

- [ ] Identify the affected Ecommerce source contracts and their public consumers.
- [ ] Confirm the requested behavior against the ownership constraints above.
- [ ] Record schema, permissions, stored-data, and compatibility effects before implementation.
- [ ] Keep validation, persistence, API responses, and relevant UI or adapters aligned.
- [ ] Verify the affected owner and its Platform or package consumers.
- [ ] Record exact checks and unresolved limitations. Update the existing plan only from evidence.

## Acceptance evidence

### Storefront section fit review, 17-10-2026

- Reviewed all 11 homepage sections live at desktop and mobile widths, plus narrow phone and tablet fit checks at 320 and 768 pixels.
- Reworked seasonal offers into separate image and text areas. Titles, descriptions, images, and action URLs come from the existing season feed; the company name and assurance proof points come from branding and Storefront Profile.
- Changed catalog images to contain the complete product, reserved space for badges, corrected promotion badge positions, and let promotion grids fill the available columns. Mobile catalog cards use two columns above 359 pixels.
- Removed hero text clamping and reserved space for the sample slide copy to reduce page movement. Reduced the floating assistant size and separated it from Back to top.
- Verified no failed loaded homepage images, cover-cropped images, horizontal page overflow, or clipped headings/paragraphs at the checked widths. A seasonal card opened the matching backend product page.
- Passed Ecommerce web typecheck/lint, storefront production build, and Ecommerce module boundaries. The existing build bundle-size warning remains.

### Populated storefront reference content, 17-10-2026

- Added reference records to the configured local CODEXSUN tenant through authenticated Core, Ecommerce, and Blog APIs. Existing products and branding were preserved.
- Verified public feeds for 10 products/sliders, 3 promotions/campaigns, 4 featured cards, 2 seasonal banners, and 4 brands. Uploaded product images and all 10 product detail feeds returned successfully.
- Enabled Blog at the user's request, ran managed tenant setup, assigned Blog management to the existing tenant admin role, and added 3 reference buying guides. The homepage displays these latest posts from the public Blog API.
- Fixed the product image service to accept the local URLs returned by its upload API. Regression tests cover uploaded URLs, traversal, unrelated paths, and executable protocols.
- Added storefront journal list/article routes using the published Blog package and retained all homepage sections on mobile. Local Blog routing uses the existing configured development storefront tenant fallback without changing production routing or activation checks.
- Passed Ecommerce API/web and Platform API typechecks, Ecommerce lint, storefront build, Ecommerce/Platform boundaries, add-on checks/tests, and dependency layout verification. The build retains its bundle-size warning.
- Browser verification confirmed all 11 sections on mobile, no horizontal page overflow or failed loaded homepage images on desktop/mobile, and a working public journal article with its saved paragraphs. The local API restarted during source changes; the storefront was restarted independently for the final checks.

### Storefront HTTP 431 and readiness, 16-10-2026

- Added the 64 KiB development header limit to both Ecommerce preflight and header-button startup.
- Readiness now checks server identity, shop HTML, branding, and catalog with the requesting browser cookies.
- Regression tests passed for failed shop/branding/catalog requests and HTTP 431 returning unhealthy status.
- Restarted the local Ecommerce server. Verified HTTP 200 for shop, branding, and catalog with a 30 KB Cookie header. The readiness service returned running for the same header.
- Passed runtime tests, development-stack contract tests, Ecommerce API/web type checks, lint, Ecommerce boundaries, and Ecommerce web build.
- Browser interaction was not directly inspected. The green indicator verifies HTTP readiness rather than full browser rendering.

### Grouped navigation and homepage section wiring, 16-10-2026

- Matched the requested reference menu with Catalog, Storefront UX, and Settings accordion groups.
- Kept existing Ecommerce URLs and Organisation settings. Added Ecommerce routes that compose Core categories, products, and brand workspaces.
- Added Campaign Events with its own page title and section visibility control. It edits the shared local promotion records used by the reference implementation.
- Compared the reference homepage section implementation. Its section order and components were already present locally.
- Removed homepage brand/campaign fallbacks that could reshow disabled sections.
- Passed Platform web type checking, Ecommerce and focused Platform frontend lint, both module boundary checks, Ecommerce web/storefront builds, and the Platform web build.
- Passed component documentation checks/tests and dependency layout verification. Builds retain bundle-size and dynamic-import warnings.
- Browser interaction was not verified in this change.

### Storefront organisation and branding, 16-10-2026

- Added `/app/ecommerce/organisation` with tenant-backed company/year selection, display name, and logo upload.
- Settings and activity records belong to Ecommerce. Core supplies active company/year lookups through a public contract.
- Applied the additive organisation and branding migrations to the configured local CODEXSUN tenant.
- Saved and reread the existing `codexsun` / `FY 2026-27` selection. Verified its activity row and rejection of unknown company/year references.
- Verified localhost resolves the configured tenant with demo seeding disabled. The live public API returned `codexsun` before the latest logo change.
- Logo storage test passed: valid image round-trip, expected tenant public path, cross-tenant rejection, invalid/oversized image rejection, and path traversal rejection.
- Latest Ecommerce API/web type checks, lint, and Ecommerce/Platform boundary checks passed.
- Latest Platform API type check is blocked by unrelated optional-field type errors in Billing sales/export-sales compliance workers and routes.
- Full authenticated HTTP and browser verification of the latest upload change remains blocked while the local Platform API is unavailable.

### Storefront header runtime control, 16-10-2026

- Added local storefront status and start controls to the Ecommerce app header.
- Verified two runtime tests: service identity detection and rejection of remote control requests.
- Verified a real development process: stopped, starting, running, and successful `/shop` response. Closed the test process afterward.
- Passed Ecommerce API and web type checks, Platform API and web type checks, and all three Ecommerce builds.
- Passed the Platform web build, Ecommerce lint, focused Platform frontend lint, and Ecommerce and Platform boundary checks.
- Passed component documentation checks and tests, and the root dependency layout check.
- Browser interaction and deployed tenant catalog readiness were not tested. Builds report bundle size warnings.
- No schema changes or database migration required. Start remains local development only and permission checked.

- `node tools/check-module-boundaries.mjs ecommerce`
- `npm run typecheck -w @codexsun/ecommerce-api`
- `npm run lint -w @codexsun/ecommerce-api`
- `npm run build -w @codexsun/ecommerce-api`
- `npm run typecheck -w @codexsun/ecommerce-storefront`
- `npm run lint -w @codexsun/ecommerce-storefront`
- `npm run build -w @codexsun/ecommerce-storefront`
- `npm run typecheck -w @codexsun/ecommerce-web`
- `npm run lint -w @codexsun/ecommerce-web`
- `npm run build -w @codexsun/ecommerce-web`

Use `npm run check:component-docs` for this documentation contract.
Run applicable tests before marking implementation work complete.
Do not treat documentation, a build, or a model response as proof of live persistence or deployment.
