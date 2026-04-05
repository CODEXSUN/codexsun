# Planning

## Current Batch

### Reference

`#25`

### Goal

Collapse the platform to one `cxapp` login and session system, then route each authenticated user to the correct surface based on role without breaking ecommerce portal behavior or desk workflows.

### Scope

- `ASSIST/AI_RULES.md`
- `ASSIST/APP_OWNED_MDOULES.md`
- `ASSIST/Documentation/ARCHITECTURE.md`
- `ASSIST/Documentation/CHANGELOG.md`
- `ASSIST/Documentation/WORKLOG.md`
- `ASSIST/Execution/TASK.md`
- `apps/framework/src/runtime/config`
- `apps/cxapp/src/services`
- `apps/cxapp/web/src/app-shell.tsx`
- `apps/cxapp/web/src/auth`
- `apps/cxapp/web/src/pages`
- `apps/api/src/external`
- `apps/ecommerce/database`
- `apps/ecommerce/shared`
- `apps/ecommerce/src/services`
- `apps/ecommerce/web/src/auth`
- `apps/ecommerce/web/src/components`
- `apps/ecommerce/web/src/lib`
- `apps/ecommerce/web/src/pages`
- `tests/core`
- `tests/ecommerce`
- `tests/e2e`

### Canonical Decisions

- `cxapp` owns the only browser login store and backend auth/session system.
- `ecommerce` may own customer accounts and customer profile data, but it must not mint a second JWT or persist a second browser auth session.
- ecommerce customer accounts should link to shared `cxapp` auth users rather than storing separate ecommerce passwords.
- route access must be role-driven:
  admin -> `/admin/dashboard`
  customer -> `/profile`
  desk user -> `/dashboard`
- Playwright and scripted runs must rely on process env overriding `.env` so test ports remain isolated and deterministic.

### Execution Plan

1. add shared auth-surface helpers so role-to-surface decisions live in one place
2. refactor ecommerce customer services to use `cxapp` auth users and sessions instead of ecommerce-owned JWT sessions
3. move customer portal frontend auth to the shared `cxapp` session while keeping ecommerce-owned customer profile APIs
4. guard admin, desk, and customer routes with the shared role-to-surface rules
5. fix env precedence in framework config resolution so test env values beat `.env`
6. add targeted service coverage and browser e2e coverage for role-based login landings and route protection
7. record the batch in work log, task tracking, planning, architecture, ownership notes, and changelog

### Validation Plan

- Run `npm.cmd run typecheck`
- Run `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/core/auth-service.test.ts tests/framework/runtime/http-routes.test.ts`
- Run `npx.cmd playwright test tests/e2e/auth-routing.spec.ts tests/e2e/billing.spec.ts`
- Verify admin, operator, and customer logins land on the expected surface
- Verify customers cannot stay on desk routes and desk users cannot stay on customer-only portal routes

### Validation Status

- [x] `npm.cmd run typecheck`
- [x] `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/core/auth-service.test.ts tests/framework/runtime/http-routes.test.ts`
- [x] `npx.cmd playwright test tests/e2e/auth-routing.spec.ts tests/e2e/billing.spec.ts`
- [ ] full `npm run lint`
- [ ] full `npm run test`
- [ ] full `npm run build`

### Risks And Follow-Up

- legacy databases may still contain the old `ecommerce_customer_sessions` JSON store from earlier builds; it is now obsolete and no longer used by runtime code
- customer registration still remains an ecommerce-owned flow, but it now provisions a linked `cxapp` auth user before first login
- if you want a stricter public-entry model next, the remaining alias routes like `/profile/login` can be reduced further to hard redirects or removed entirely after compatibility is no longer needed
