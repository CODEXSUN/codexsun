# Planning

## Current Batch

### Reference

`#29`

### Goal

Finish the customer-facing commerce surface by isolating the customer portal from admin tooling, moving customer routes to `/customer/*`, persisting wishlist actions through the ecommerce portal store, and aligning the customer portal UX with the shared contact and dashboard tone.

### Scope

- `ASSIST/Documentation/CHANGELOG.md`
- `ASSIST/Documentation/WORKLOG.md`
- `ASSIST/Execution/TASK.md`
- `ASSIST/Execution/PLANNING.md`
- `apps/core/src/services/contact-service.ts`
- `apps/cxapp/web/src/app-shell.tsx`
- `apps/cxapp/web/src/auth/auth-surface.ts`
- `apps/ecommerce/web/src/components/customer-portal-layout.tsx`
- `apps/ecommerce/web/src/components/storefront-product-card.tsx`
- `apps/ecommerce/web/src/components/storefront-top-menu.tsx`
- `apps/ecommerce/web/src/features/customer-portal/customer-profile-section.tsx`
- `apps/ecommerce/web/src/hooks/use-storefront-customer-portal.ts`
- `apps/ecommerce/web/src/lib/storefront-routes.ts`
- `apps/ecommerce/web/src/lib/storefront-wishlist-storage.ts`
- `apps/ecommerce/web/src/pages/storefront-account-page.tsx`
- `apps/ecommerce/web/src/pages/storefront-catalog-page.tsx`
- `apps/ecommerce/web/src/pages/storefront-home-page.tsx`
- `apps/ecommerce/web/src/pages/storefront-product-page.tsx`

### Canonical Decisions

- `cxapp` remains the single auth and routing owner, while the ecommerce app owns customer-portal data and customer-safe profile behavior
- customer routes should read as a dedicated customer surface, so `/customer/*` replaces `/profile/*` as the canonical customer route base
- customer-facing profile editing should reuse the proven core contact tab tone and lookup flow, but only expose customer-safe fields
- storefront wishlist interactions should save through the ecommerce customer portal store when authenticated and carry guest intent forward after login instead of discarding it
- legacy stored contact and product payloads must keep being hydrated forward so widened customer and storefront schemas do not force destructive data resets

### Execution Plan

1. isolate the customer portal routes, shell, and redirect rules from admin and desk surfaces
2. rebuild the customer profile page into customer-safe contact-style tabs with shared lookup-backed sections
3. refine the customer portal sidebar, overview cards, wishlist layout, and themed shell surfaces for the customer-only experience
4. harden widened customer/contact hydration paths so relogin and profile reads survive older stored records
5. add shared storefront wishlist storage plus authenticated auto-sync into the customer portal database
6. align the storefront header, catalog, home, and product pages to the shared persisted wishlist flow
7. record the batch in task tracking, planning, work log, and changelog

### Validation Plan

- Run `npm.cmd run typecheck`
- Verify the customer route base resolves under `/customer/*`
- Verify customer profile and portal pages compile against the new customer-safe tabs and lookups
- Verify storefront wishlist toggles compile against the shared guest-to-portal persistence flow

### Validation Status

- [x] `npm.cmd run typecheck`
- [x] customer route and wishlist wiring compiled cleanly
- [ ] full `npm run lint`
- [ ] full `npm run test`
- [ ] full `npm run build`
- [ ] full Playwright suite

### Risks And Follow-Up

- guest wishlist carry-forward is now persisted and synced centrally, but a later pass could add explicit success toasts and compare-list behavior on top of the same store
- the customer portal now mirrors the contact UX much more closely, but future customer-only tabs still need the same discipline to avoid leaking admin-only contact fields
- the repo now has both customer-safe and admin-safe route shells; future auth changes should keep using the same explicit role-surface boundaries instead of broad shared wrappers
