# Planning

## Current Batch

### Reference

`#38`

### Goal

Complete Stage `1.6.1` by adding backend-owned storefront legal and trust pages for shipping, returns, privacy, terms, and contact, then begin Stage `1.6.2` route-metadata review.

### Scope

- `ASSIST/Execution/TASK.md`
- `ASSIST/Execution/PLANNING.md`
- `apps/ecommerce/shared/schemas/catalog.ts`
- `apps/ecommerce/src/data/storefront-seed.ts`
- `apps/ecommerce/src/services/storefront-settings-service.ts`
- `apps/ecommerce/src/services/catalog-service.ts`
- `apps/api/src/external/public-routes.ts`
- `apps/ecommerce/web/src/api/storefront-api.ts`
- `apps/ecommerce/web/src/lib/storefront-routes.ts`
- `apps/ecommerce/web/src/pages/storefront-legal-page.tsx`
- `apps/cxapp/web/src/app-shell.tsx`
- `apps/cxapp/web/src/query/query-keys.ts`
- `tests/framework/runtime/http-routes.test.ts`
- `tests/ecommerce/services.test.ts`

### Canonical Decisions

- legal and trust pages remain ecommerce-owned storefront content, not static site-only copy
- page content must be seeded from backend settings so the later storefront-designer phase can build on the same contract
- public consumption uses a single generic legal-page endpoint and a single reusable storefront page component to avoid five diverging implementations
- footer trade links should point to the real storefront trust pages immediately so the new surfaces are discoverable
- the next stage starts from route metadata on top of these concrete storefront routes instead of inventing metadata for pages that do not yet exist

### Execution Plan

1. extend the ecommerce storefront settings schema with typed legal-page content
2. seed production-safe default content and repoint footer links to those storefront routes
3. expose a public legal-page payload from ecommerce services and public routes
4. wire frontend API, query keys, storefront routes, and a reusable legal-page surface
5. register both root and `/shop/*` storefront routes
6. add targeted service and route-registration tests
7. mark `1.6.1` complete in `TASK.md`
8. initiate `1.6.2` by reviewing current storefront route registration and metadata entry points

### Validation Plan

- run `npm run typecheck`
- run `npx.cmd tsx --test tests/framework/runtime/http-routes.test.ts tests/ecommerce/services.test.ts`
- confirm footer links and storefront routes resolve to the new page set
- confirm `1.6.1` is marked complete in `TASK.md`

### Validation Status

- [x] `npm run typecheck`
- [x] `npx.cmd tsx --test tests/framework/runtime/http-routes.test.ts tests/ecommerce/services.test.ts`
- [x] storefront footer links now target the new trust pages
- [x] `1.6.1` marked complete in `TASK.md`
- [ ] `1.6.2` route-level metadata implementation started

### Risks And Follow-Up

- there is still no dedicated storefront designer for these legal pages; that should be handled in a later storefront-management stage rather than mixed into the production-minimum route slice
- test runs still emit local SMTP authentication noise from the current mailbox configuration, but the targeted legal-page and route tests pass
- `1.6.2` should now focus on one shared metadata mechanism for storefront routes so canonical tags, OG, and crawl directives in `1.6.3` can reuse it instead of duplicating page-level constants
