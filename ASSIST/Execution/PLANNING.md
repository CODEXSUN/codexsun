# Planning

## Current Batch

### Reference

`#27`

### Goal

Add the demo-data app, introduce shared query/state infrastructure, and finish the storefront admin/design-system sync so ecommerce editing and live frontend rendering stay aligned without violating app ownership boundaries.

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
- `apps/demo`
- `apps/ecommerce/shared`
- `apps/ecommerce/src/services`
- `apps/ecommerce/web/src/components`
- `apps/ecommerce/web/src/features`
- `apps/ecommerce/web/src/hooks`
- `apps/ecommerce/web/src/state`
- `apps/ecommerce/web/src/lib`
- `apps/ecommerce/web/src/pages`
- `apps/cxapp/web/src/query`
- `apps/cxapp/web/src/state`
- `apps/ui/src/components/ui`
- `apps/ui/src/components/ux`
- `apps/ui/src/registry/blocks`
- `apps/ui/src/registry/variants/editor`
- `tests/ecommerce`
- `tests/demo`
- `tests/api`
- `tests/framework`

### Canonical Decisions

- `ecommerce` owns storefront tone, content settings, public catalog presentation, and customer-commerce journeys.
- `ecommerce` also owns the home-slider designer and storefront section designers, while shared visual building blocks belong in `apps/ui`.
- the home-slider designer should support multiple isolated slide themes while the public hero keeps the same visual structure and motion.
- `core` remains the owner of shared products and shared product-related masters such as groups, categories, types, brands, colours, sizes, styles, units, HSN codes, and taxes.
- reused `core` product and common-master screens may render inside the ecommerce workspace, but the route base must stay under `/dashboard/apps/ecommerce/*` so the sidebar stays on ecommerce.
- public route tone should stay aligned across desktop and mobile, but mobile can use its own composition when desktop spacing does not scale cleanly.
- storefront settings saves must remain backward-compatible with earlier stored payloads and partial updates.
- `demo` owns demo-data installers and counts, but must create records through app-owned services and app-owned transactions rather than hidden direct table writes across the repo.
- TanStack Query is the shared server-state layer; Zustand is only for lightweight browser-side coordination state.

### Execution Plan

1. add the app-owned `demo` module, routes, schemas, installers, summary counts, and per-module install actions for sample business data
2. introduce TanStack Query provider and shared query keys, then migrate the most obvious server-state paths such as runtime settings, storefront shell, and demo polling
3. add lightweight Zustand stores only where browser-side coordination is needed for session and storefront shell readiness
4. improve storefront first paint and slow-network behavior with skeletons, better loading order, and lazy image handling
5. add a shared toast layer with runtime-controlled placement/tone and wire it into the main admin save/install paths
6. integrate shared Tiptap editor support and add docs coverage in the UI app
7. move storefront search and commerce card/grid surfaces into reusable shared UI blocks and docs registry entries
8. extend the storefront editors so featured and category sections have saved row counts, row counts to show, card designers, and live frontend sync
9. fix storefront shell sync gaps so admin saves refresh the public storefront consistently
10. tighten media-browser overflow so the form stays visible while asset grids and edit panels scroll in smaller spaces
11. record the batch in work log, task tracking, planning, ownership notes, architecture current-state notes, and changelog

### Validation Plan

- Run `npm.cmd run typecheck`
- Run `npx.cmd tsx --test tests/demo/services.test.ts tests/api/demo-routes.test.ts tests/framework/application/app-suite.test.ts`
- Run `npm.cmd run build`
- Verify the demo workspace can install module-scoped sample data and report live counts
- Verify runtime/app-settings, storefront shell, and demo job state refresh through TanStack Query without stale data
- Verify the featured and category editors save layout settings and update the live storefront after refresh
- Verify shared storefront blocks used by the editor and docs match the live storefront behavior and tone
- Verify media-browser forms stay visible while media results scroll on smaller screens

### Validation Status

- [x] `npm.cmd run typecheck`
- [x] `npx.cmd tsx --test tests/demo/services.test.ts tests/api/demo-routes.test.ts tests/framework/application/app-suite.test.ts`
- [x] `npm.cmd run build`
- [ ] full `npm run lint`
- [ ] full `npm run test`
- [ ] full Playwright suite

### Risks And Follow-Up

- the storefront still relies on shared `core` master-data quality for categories, products, and counts; poor seed quality will still surface in previews
- the demo installers intentionally stay app-owned and transactional, but deeper demo coverage for every future module will still need explicit per-module installers
- more storefront sections such as new arrivals and best sellers could still be made layout-configurable in a later pass if needed
