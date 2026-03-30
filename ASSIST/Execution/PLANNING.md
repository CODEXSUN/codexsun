# Planning

## Current Batch

### Reference

`#13`

### Goal

Take the imported `core` and `ecommerce` source slices, adapt them to current app ownership, and expose a real backend-fed go-live baseline through the live `cxapp` desk without absorbing the foreign temp runtime.

### Scope

- `ASSIST/Execution`
- `ASSIST/Documentation/CHANGELOG.md`
- `apps/core/shared`
- `apps/core/src`
- `apps/core/web`
- `apps/ecommerce/shared`
- `apps/ecommerce/src`
- `apps/ecommerce/web`
- `apps/api/src`
- `apps/framework/src/runtime/http`
- `apps/cxapp/web/src`
- `vite.config.ts`

### Canonical Decisions

- imported temp code must be split by current ownership, not copied by old folder names
- `apps/core` should take shared masters, shared setup metadata, reusable shared contracts, and its own app-native services
- `apps/ecommerce` should take catalog, storefront, order, customer, and pricing contracts under its own boundary even if temp grouped some source elsewhere
- imported temp API code cannot be copied because it targets a different runtime; app-native services must be rewritten against the current framework and api boundary
- the current HTTP route model must be extended once, centrally, so app routes can read request context without adding one-off hacks
- the live `cxapp` desk remains the active operator-facing shell, so imported app sections should be surfaced there first
- the shared design system stays in `apps/ui`; app-specific workspace structure belongs inside the app boundaries and desk wiring
- until app-owned migrations land, backend data should stay seed-backed and clearly represented as such rather than pretending to be database-complete

### Execution Plan

1. audit `temp/core` and `temp/ecommerce` against the current repository boundaries
2. copy the first shared-contract slice from `temp/core/shared` into `apps/core/shared`
3. add app-native `core` services and internal routes for bootstrap, companies, contacts, and common modules
4. move the ecommerce shared-contract slice into `apps/ecommerce/shared`
5. add app-native `ecommerce` services and routes for catalog, storefront, orders, customers, and pricing settings
6. adapt the shared desk to render app-owned `core` and `ecommerce` workspace sections with backend-fed data
7. update ASSIST task, planning, and changelog entries for this batch
8. validate typecheck, lint, test, and build

### Validation Plan

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run test`
- Run `npm run build`

### Validation Status

- [x] `npm run typecheck`
- [x] `npm run lint` (same existing imported table warnings only)
- [x] `npm run build`
- [ ] `npm run test` (`tests/framework/runtime/config.test.ts` still fails against local `.env` host values)

### Risks And Follow-Up

- the current `core` and `ecommerce` backend slices are seed-backed rather than database-backed, so create and update flows remain out of scope for this batch
- `temp/ecommerce/web` is much larger than the current app boundary can absorb safely in one move, so the broader marketing, portal, and designer surfaces still need staged adoption
- imported temp API code still targets a different runtime layout and must not be copied into framework or api blindly
- the existing framework config test is environment-sensitive and still needs isolation from local `.env` state
