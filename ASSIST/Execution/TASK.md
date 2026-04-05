# Task

## Active Batch

### Reference

`#25`

### Title

`Unified auth surfaces and role-based landing`

### Scope Checklist

- [x] keep one browser login and backend session system under `apps/cxapp`
- [x] remove the separate ecommerce customer JWT and browser session flow
- [x] link ecommerce customer accounts to shared `cxapp` auth users instead of storing separate ecommerce passwords
- [x] route authenticated users by role: admin -> `/admin/dashboard`, customer -> `/profile`, desk user -> `/dashboard`
- [x] guard admin, desk, and customer portal routes so users are redirected back to their allowed surface
- [x] fix env precedence so process env overrides `.env` during Playwright and scripted runs
- [x] add browser e2e coverage for admin, operator, customer, and billing login paths
- [x] add a concise work log under `ASSIST/Documentation/WORKLOG.md`
- [x] update architecture, ownership, execution tracking, and changelog docs for the single-login model

### Validation Note

- [x] `npm.cmd run typecheck`
- [x] `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/core/auth-service.test.ts tests/framework/runtime/http-routes.test.ts`
- [x] `npx.cmd playwright test tests/e2e/auth-routing.spec.ts tests/e2e/billing.spec.ts`
- [ ] full `npm run lint`
- [ ] full `npm run test`
- [ ] full `npm run build`

## Next Batch

### Reference

`#26`

### Title

`Billing voucher operational forms and compliance reports`

### Scope Checklist

- [ ] connect voucher-type masters directly into the voucher entry workflow so operational posting uses the finalized billing master chain
- [ ] extend the new route-based voucher pages so purchase gets the same invoice-style item-table experience now used by sales
- [ ] expand statutory and operational billing reports beyond the current baseline support screens
- [ ] add broader UI and Playwright coverage for popup master CRUD and voucher entry flows
