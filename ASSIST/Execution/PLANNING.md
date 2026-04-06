# Planning

## Current Batch

### Reference

`#32`

### Goal

Consolidate the current repository batch into one tracked release slice covering storefront UX and payment flow polish, framework mail surfaces, shipping and order support updates, and deployment container wiring.

### Scope

- `ASSIST/Execution/TASK.md`
- `ASSIST/Execution/PLANNING.md`
- `ASSIST/Documentation/CHANGELOG.md`
- `ASSIST/Documentation/WORKLOG.md`
- `.container/*`
- `.dockerignore`
- `apps/cxapp/database/migration/*`
- `apps/cxapp/src/services/*`
- `apps/cxapp/web/src/pages/framework-mail-*.tsx`
- `apps/ecommerce/shared/*`
- `apps/ecommerce/src/services/*`
- `apps/ecommerce/web/src/components/*`
- `apps/ecommerce/web/src/features/storefront-admin/*`
- `apps/ecommerce/web/src/pages/*`
- `apps/framework/src/runtime/config/server-config.ts`
- `apps/ui/src/registry/magicui/dock.tsx`
- `apps/ui/src/design-system/*`

### Canonical Decisions

- storefront UX and payment behavior remain owned by `apps/ecommerce`, while framework runtime config changes stay limited to shared env and infrastructure plumbing
- framework mail pages and mailbox persistence stay inside `apps/cxapp` because auth-adjacent suite-facing workflows belong to the active product shell
- shared hover behavior for the mobile dock remains centralized in `apps/ui` so storefront and any other dock consumers inherit the same constrained interaction
- deployment container assets remain operational artifacts under `.container/` rather than being scattered across app folders

### Execution Plan

1. review the current dirty workspace and group the pending repository changes into one boundary-correct batch
2. finish storefront polish for sticky navigation, mobile hero layout, CTA alignment, announcement truncation, Razorpay checkout handoff, and dock hover containment
3. include the pending framework mail, shipping, order, container, and runtime wiring changes in the same tracked batch
4. update task tracking, planning, work log, and changelog with one shared reference number for the batch
5. validate with typecheck, then commit and push through the git helper

### Validation Plan

- Run `npm.cmd run typecheck`
- Verify the storefront renders with fixed navigation and corrected mobile hero interactions
- Verify Razorpay checkout opens directly from storefront checkout when enabled
- Verify framework mail pages and migrations compile in the active shell

### Validation Status

- [x] `npm.cmd run typecheck`
- [ ] `npm.cmd run build`
- [ ] storefront flows manually reviewed end-to-end
- [ ] framework mail surfaces manually reviewed
- [ ] full `npm run lint`
- [ ] full `npm run test`
- [ ] full Playwright suite

### Risks And Follow-Up

- this batch contains broad cross-app changes, so only typecheck has been re-run in this pass and deeper lint, test, build, or e2e regressions may still remain
- the fixed storefront header now relies on layout spacing values per breakpoint, so future header-height changes should update the shell offsets in the same batch
- container and customer deployment assets may still require environment-specific runtime verification outside the local development machine
