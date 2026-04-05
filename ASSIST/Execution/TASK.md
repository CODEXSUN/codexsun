# Task

## Active Batch

### Reference

`#26`

### Title

`Ecommerce storefront tone, admin settings, and mobile hero polish`

### Scope Checklist

- [x] add a frontend target switch so home can resolve to `site`, `shop`, or `app`
- [x] normalize active suite surfaces around `/admin/dashboard`, `/dashboard`, and `/profile`
- [x] keep ecommerce product and common-master reuse inside the ecommerce workspace so the sidebar does not jump to `core`
- [x] connect ecommerce storefront settings to a real backend settings service with legacy-safe partial save handling
- [x] add an ecommerce-owned Home Slider designer with dedicated admin routing, multi-slide theme isolation, and backend persistence for hero theme settings
- [x] rebuild the storefront shell tone around the temp/reference pattern with a richer header, search, category rail, footer, cards, and hero slider
- [x] add a dedicated mobile hero slider layout with image-first ordering and mobile-sized text/actions
- [x] slim the Home Slider admin surface by removing workspace and page hero chrome from the editor route
- [x] refine the storefront hero image frame toward a softer glass-style shell instead of a hard outlined border
- [x] move storefront top-menu categories to backend-owned `All Items` plus backend-controlled top-menu visibility instead of a static frontend pill
- [x] support direct external image URLs anywhere the shared framework media picker is used, without removing uploads or media-library selection
- [x] split storefront top menu and category navigation into dedicated components, then add a sticky scrolled text-only category mode with centered spacing and compact motion styling
- [x] improve shared core common-module image cells so category image fields render as real thumbnails instead of raw storage paths
- [x] reduce the large frontend entry chunk by introducing route-level lazy loading and explicit Vite chunk splitting
- [x] update ASSIST tracking, ownership notes, changelog, and work log for the storefront batch

### Validation Note

- [x] `npm.cmd run typecheck`
- [x] `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/framework/runtime/http-routes.test.ts tests/framework/application/app-suite.test.ts`
- [x] `npm.cmd run build`
- [ ] full `npm run lint`
- [ ] full `npm run test`
- [ ] full Playwright suite

## Next Batch

### Reference

`#27`

### Title

`Billing voucher operational forms and compliance reports`

### Scope Checklist

- [ ] connect voucher-type masters directly into the voucher entry workflow so operational posting uses the finalized billing master chain
- [ ] extend the new route-based voucher pages so purchase gets the same invoice-style item-table experience now used by sales
- [ ] expand statutory and operational billing reports beyond the current baseline support screens
- [ ] add broader UI and Playwright coverage for popup master CRUD and voucher entry flows
