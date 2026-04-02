# Planning

## Current Batch

### Reference

`#20`

### Goal

Finalize the billing account master model and workspace UX so billing categories, ledgers, voucher groups, voucher types, voucher CRUD, and support guidance all align to one strict accounting structure.

### Scope

- `ASSIST/Execution`
- `ASSIST/Documentation/CHANGELOG.md`
- `apps/billing/src`
- `apps/billing/shared`
- `apps/billing/database`
- `apps/billing/web`
- `apps/api/src/internal`
- `apps/cxapp/web`
- `apps/ui/src/components/blocks`
- `tests/billing`
- `tests/api/internal`
- `tests/e2e`

### Canonical Decisions

- billing account masters should separate accounting structure from operational classification through `category -> ledger -> voucher type` and `voucher group -> voucher type`
- billing master CRUD should use shared list and popup patterns instead of one-off pages where the workflow is list-first
- billing commercial voucher modules should graduate from popup CRUD into route-based list and upsert pages once the operator flow becomes document-centric
- billing route labels and sidebar groups should resolve from the most specific workspace item so breadcrumbs stay page-specific
- lookup-style record selection should follow the temp ecommerce autocomplete interaction model when billing operators pick categories, ledgers, and voucher-group-linked masters
- support guidance for the finalized billing model should live inside the billing workspace, not as detached docs only

### Execution Plan

1. replace ledger-group storage and UI with billing categories and seed the default top-level accounting buckets
2. add billing voucher-group and voucher-type masters, then enforce the strict chain between category, ledger, and voucher type
3. convert billing master and voucher pages to the shared `CommonList` tone with popup upsert flows and grouped sidebar navigation
4. align billing lookups, breadcrumbs, support pages, and route metadata with the updated master model
5. add the first document-style sales invoice page with item-table entry while keeping double-entry and GST posting derived from the billing masters
6. move sales, purchase, payment, and receipt from popup voucher CRUD into route-based list and standalone upsert pages
7. fix compatibility issues against the existing local billing database, including mixed-shape stored records
8. run targeted typecheck and billing-focused tests, plus local runtime verification against the desktop database
9. update ASSIST execution and changelog records to reflect the completed billing batch

### Validation Plan

- Run `npx.cmd tsc --noEmit --pretty false`
- Run `npx.cmd tsx --test tests/billing/category-service.test.ts tests/billing/ledger-service.test.ts tests/billing/voucher-master-service.test.ts tests/billing/voucher-service.test.ts tests/billing/reporting-service.test.ts tests/api/internal/routes.test.ts`
- Verify billing service health against the local desktop database for categories, ledgers, voucher groups, voucher types, vouchers, and reports
- Run targeted Playwright coverage where selectors and server state remain current

### Validation Status

- [x] `npx.cmd tsc --noEmit --pretty false`
- [x] `npx.cmd tsx --test tests/billing/category-service.test.ts tests/billing/ledger-service.test.ts tests/billing/voucher-master-service.test.ts tests/billing/voucher-service.test.ts tests/billing/reporting-service.test.ts tests/api/internal/routes.test.ts`
- [x] `npx.cmd tsx --test tests/billing/voucher-service.test.ts`
- [x] local desktop database verification for billing categories, ledgers, voucher groups, voucher types, vouchers, and reports
- [ ] Playwright coverage remains partial because some existing browser selectors and reused server state were stale during the last runs
- [ ] full `npm run lint`
- [ ] full `npm run test`
- [ ] full `npm run build`

### Risks And Follow-Up

- older persisted billing voucher-type rows can still exist without the full newer field set, so compatibility parsing must remain tolerant until a cleanup migration normalizes them
- voucher posting and reporting now align to the finalized masters, but purchase still needs the same richer invoice-style item-table experience now introduced for sales
- browser-level verification still lags the current billing UI shape because the older Playwright selectors and reusable server state need cleanup
