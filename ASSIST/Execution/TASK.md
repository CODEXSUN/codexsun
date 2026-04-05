# Task

## Active Batch

### Reference

`#27`

### Title

`Demo app, shared state layer, storefront designers, and shared UI blocks`

### Scope Checklist

- [x] add the app-owned `demo` application with module-scoped demo-data installers, summary pages, counts, and protected internal API routes
- [x] add TanStack Query as the shared server-state layer and migrate runtime/app-settings, storefront shell, and demo polling to it
- [x] add Zustand as a lightweight client-state layer for session and storefront shell state without disturbing the broader codebase
- [x] improve storefront loading with skeletons, eager hero media, lazy catalog images, and faster first paint on slow networks
- [x] add a shared toast layer with two-line record-result messaging, runtime positioning/tone settings, and design-system docs coverage
- [x] integrate shared Tiptap editor support with icons and docs coverage in the UI design-system workspace
- [x] move storefront search, featured-card, and category-card surfaces into reusable shared UI blocks and surfaces
- [x] extend ecommerce storefront settings with saved featured and category row/layout designer settings, card design controls, and live frontend sync
- [x] tighten media-browser overflow behavior so forms stay visible and asset grids scroll cleanly inside smaller screens
- [x] update ASSIST tracking, ownership notes, architecture notes, changelog, and work log for the demo/state/storefront-designer batch

### Validation Note

- [x] `npm.cmd run typecheck`
- [x] `npx.cmd tsx --test tests/demo/services.test.ts tests/api/demo-routes.test.ts tests/framework/application/app-suite.test.ts`
- [x] `npm.cmd run build`
- [ ] full `npm run lint`
- [ ] full `npm run test`
- [ ] full Playwright suite

## Next Batch

### Reference

`#28`

### Title

`Billing voucher operational forms and compliance reports`

### Scope Checklist

- [ ] connect voucher-type masters directly into the voucher entry workflow so operational posting uses the finalized billing master chain
- [ ] extend the new route-based voucher pages so purchase gets the same invoice-style item-table experience now used by sales
- [ ] expand statutory and operational billing reports beyond the current baseline support screens
- [ ] add broader UI and Playwright coverage for popup master CRUD and voucher entry flows
