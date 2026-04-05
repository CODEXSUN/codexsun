# Planning

## Current Batch

### Reference

`#26`

### Goal

Finish the ecommerce storefront shell so public shop, admin storefront settings, reused core masters, and mobile hero behavior all feel like one coherent commerce surface inside the current app boundaries.

### Scope

- `ASSIST/AI_RULES.md`
- `ASSIST/APP_OWNED_MDOULES.md`
- `ASSIST/Documentation/ARCHITECTURE.md`
- `ASSIST/Documentation/CHANGELOG.md`
- `ASSIST/Documentation/WORKLOG.md`
- `ASSIST/Execution/TASK.md`
- `apps/api/src/internal`
- `apps/cxapp/web/src/app-shell.tsx`
- `apps/cxapp/web/src/desk`
- `apps/cxapp/web/src/pages`
- `apps/ecommerce/shared`
- `apps/ecommerce/src/services`
- `apps/ecommerce/web/src/components`
- `apps/ecommerce/web/src/features`
- `apps/ecommerce/web/src/hooks`
- `apps/ecommerce/web/src/lib`
- `apps/ecommerce/web/src/pages`
- `tests/ecommerce`
- `tests/framework`

### Canonical Decisions

- `ecommerce` owns storefront tone, content settings, public catalog presentation, and customer-commerce journeys.
- `ecommerce` also owns the home-slider designer and its persisted hero theme settings; the slider should not depend on `core` or shared `ui` business config.
- the home-slider designer should support multiple isolated slide themes while the public hero keeps the same visual structure and motion.
- `core` remains the owner of shared products and shared product-related masters such as groups, categories, types, brands, colours, sizes, styles, units, HSN codes, and taxes.
- reused `core` product and common-master screens may render inside the ecommerce workspace, but the route base must stay under `/dashboard/apps/ecommerce/*` so the sidebar stays on ecommerce.
- public route tone should stay aligned across desktop and mobile, but mobile can use its own composition when desktop spacing does not scale cleanly.
- storefront settings saves must remain backward-compatible with earlier stored payloads and partial updates.

### Execution Plan

1. finish the storefront-facing admin and public route surfaces around the `site` / `shop` / `app` frontend switch and the `/admin/dashboard` + `/profile` route model
2. move ecommerce admin navigation to app-owned sections while reusing `core` product and shared master screens under ecommerce-owned routes
3. connect storefront settings editing to a real ecommerce-owned backend service and make partial saves safe against legacy stored payloads
4. add a dedicated ecommerce-owned Home Slider designer and route so hero theme settings can be edited without overloading the general storefront page
5. reshape the public storefront shell to the requested temp/reference tone with a richer top menu, search, category rail, hero slider, footer, and product cards
6. add a dedicated mobile hero slider layout instead of forcing the desktop frame to collapse awkwardly
7. evolve the home-slider designer from one global theme into a multi-slide list so each hero slot carries its own isolated theme payload
8. remove extra workspace and page-hero chrome from the home-slider admin route so the editor stays lean
9. push the storefront image frame toward a softer glass-style shell instead of a visible outline
10. split the main client bundle so the storefront and desk surfaces do not stay in one oversized entry chunk
11. record the storefront batch in work log, task tracking, planning, ownership notes, architecture current-state notes, and changelog

### Validation Plan

- Run `npm.cmd run typecheck`
- Run `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/framework/runtime/http-routes.test.ts tests/framework/application/app-suite.test.ts`
- Run `npm.cmd run build`
- Verify the ecommerce workspace retains its own sidebar while rendering reused `core` product and common-master screens
- Verify public storefront shell reads and saves ecommerce-owned settings without breaking legacy rows
- Verify the dedicated home-slider designer can load, save, and drive the live hero theme
- Verify the dedicated home-slider designer can load, save, and drive isolated themes per slide without changing the public hero layout
- Verify the storefront hero behaves acceptably on both desktop and mobile layouts

### Validation Status

- [x] `npm.cmd run typecheck`
- [x] `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/framework/runtime/http-routes.test.ts tests/framework/application/app-suite.test.ts`
- [x] `npm.cmd run build`
- [ ] full `npm run lint`
- [ ] full `npm run test`
- [ ] full Playwright suite

### Risks And Follow-Up

- the storefront hero was tuned against the current temp/reference target and may need another pass if the content mix or default images change materially
- ecommerce still depends on `core` master-data quality for top-menu categories and product display completeness
- the large async desk chunk is reduced but not aggressively split by feature yet; deeper desk-level chunking can still be done later if needed
