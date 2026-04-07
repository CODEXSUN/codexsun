# Planning

## Current Batch

### Reference

`#33`

### Goal

Consolidate the current storefront and billing implementation work into one tracked batch, then add the repo-specific ecommerce go-live blueprint so future batches can execute production readiness in a clear order.

### Scope

- `ASSIST/Execution/TASK.md`
- `ASSIST/Execution/PLANNING.md`
- `ASSIST/Documentation/CHANGELOG.md`
- `ASSIST/Documentation/WORKLOG.md`
- `ASSIST/Planning/plan-9.md`
- `apps/ecommerce/shared/*`
- `apps/ecommerce/src/services/*`
- `apps/ecommerce/web/src/components/*`
- `apps/ecommerce/web/src/features/storefront-admin/*`
- `apps/ecommerce/web/src/pages/*`
- `apps/ui/src/components/blocks/*`
- `apps/billing/web/src/workspace-sections.tsx`
- `apps/api/src/internal/ecommerce-routes.ts`
- `apps/cxapp/web/src/desk/desk-registry.ts`
- `apps/cxapp/database/migration/08-mailbox-archive.ts`
- `apps/cxapp/web/src/features/framework-media/media-picker-field.tsx`
- `playwright.config.ts`
- `tests/e2e/storefront-*.spec.ts`

### Canonical Decisions

- ecommerce go-live planning stays anchored to the current app ownership model instead of creating a second operating model outside the repo
- `apps/ecommerce` remains the commerce boundary, `apps/cxapp` remains the only auth and admin shell boundary, `apps/core` remains the shared master-data boundary, and `apps/frappe` remains the ERPNext connector boundary
- ERPNext support should enter production through phased sync and projection contracts, not by making storefront runtime depend directly on ERP requests
- shared storefront blocks and rails should continue moving into `apps/ui/src/components/blocks` so new content sections do not create one-off page markup in `apps/ecommerce`
- the batch should separate P0 go-live blockers from later maturity work so implementation batches can be sequenced cleanly

### Execution Plan

1. land the current storefront block, designer, footer, floating-contact, campaign, branding, and shared UI block work in one boundary-correct batch
2. land the current billing voucher inline-grid work and related operational entry refinements
3. tighten storefront shell loading behavior and update checkout or order-flow e2e coverage to the current UI
4. review the ecommerce, customer, admin, payment, and frappe connector surfaces against production go-live expectations
5. define industrial-standard requirements for storefront, backend operations, user management, customer portal, admin portal, payments, shipping, inventory, security, and observability
6. map ERPNext or Frappe support into clear ownership and rollout phases that fit the repo boundaries
7. write the new `plan-9.md` blueprint in `ASSIST/Planning`
8. update task tracking, planning, work log, and changelog with one shared reference number for the batch

### Validation Plan

- run `npm.cmd run typecheck`
- confirm the new storefront designers and shared blocks stay inside the current ecommerce or ui ownership boundaries
- confirm the blueprint matches the current architecture and project overview documents
- confirm the blueprint separates immediate go-live blockers from later scale work
- document the remaining e2e and mailbox-template gaps

### Validation Status

- [x] `npm.cmd run typecheck`
- [x] architecture and project overview reviewed
- [x] `ASSIST/Planning/plan-9.md` created
- [ ] full storefront e2e stability re-verified
- [ ] build, lint, and full test suite not re-run in this batch

### Risks And Follow-Up

- this batch combines storefront, billing, e2e, and planning changes, so the final commit is broader than a docs-only planning slice
- current ecommerce still has live blockers such as incomplete e2e stability and missing mailbox templates for storefront notifications
- ERPNext support remains partial until dedicated sync and transaction bridges are implemented in later batches
