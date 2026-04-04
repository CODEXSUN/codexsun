# Task

## Active Batch

### Reference

`#21`

### Title

`Core shared master expansion and framework media manager`

### Scope Checklist

- [x] convert core common modules from the generic preview page into module-specific list pages in the billing `CommonList` tone
- [x] add popup upsert flows for shared core common modules with generic create and update handling
- [x] align the core sidebar so common masters appear under a grouped `Common` branch with subgroup lanes matching the requested layout
- [x] add the missing internal core common-module CRUD routes and focused coverage for the new service and route behavior
- [x] add shared active or inactive dropdown filters with clear-to-all behavior on common and master list pages that expose record status
- [x] align contact and company list, show, and upsert flows with the requested shared master UX patterns
- [x] add shared row action menus, lookup docs variants, and master-list docs references in the UI registry
- [x] map the primary company profile into shared shell branding, public footer, and company content surfaces
- [x] introduce a core-owned product domain with shared schema, service, API, and modular list or show or upsert frontend flow
- [x] align core product UX to the shared contact tone, including compact image cards, attributes, variants, and show-page media display
- [x] add a framework-owned shared media foundation with local storage, public media symlink, API routes, and runtime serving
- [x] add a global framework media manager route and sidebar entry, then connect reusable media picking and preview into company and product image fields
- [x] refine product and media UX with inline payload cleanup, five-up media browsing, equal-width card actions, order normalization from `1`, and compact show-page image presentation
- [x] keep ASSIST tracking and changelog aligned with the shipped core common-module workspace change

### Validation Note

- [x] `npx.cmd tsc --noEmit --pretty false`
- [x] `npx.cmd tsx --test tests/core/common-module-service.test.ts tests/api/internal/routes.test.ts`
- [x] `npx.cmd tsx --test tests/core/product-form-state.test.ts tests/core/product-service.test.ts`
- [x] `npx.cmd tsx --test tests/framework/media-service.test.ts tests/api/internal/routes.test.ts`
- [ ] full `npm run lint`
- [ ] full `npm run test`
- [ ] full `npm run build`

## Next Batch

### Reference

`#22`

### Title

`Billing voucher operational forms and compliance reports`

### Scope Checklist

- [ ] connect voucher-type masters directly into the voucher entry workflow so operational posting uses the finalized billing master chain
- [ ] extend the new route-based voucher pages so purchase gets the same invoice-style item-table experience now used by sales
- [ ] expand statutory and operational billing reports beyond the current baseline support screens
- [ ] add broader UI and Playwright coverage for popup master CRUD and voucher entry flows
