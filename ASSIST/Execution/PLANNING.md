# Planning

## Current Batch

### Reference

`#40`

### Goal

Complete Stage `1.6.3` by extending the storefront metadata baseline into canonical URLs, Open Graph tags, and crawl-discovery endpoints for `robots.txt` and `sitemap.xml`.

### Scope

- `ASSIST/Execution/TASK.md`
- `ASSIST/Execution/PLANNING.md`
- `apps/api/src/external/public-routes.ts`
- `apps/ecommerce/shared/index.ts`
- `apps/ecommerce/shared/storefront-seo.ts`
- `apps/ecommerce/src/services/storefront-seo-service.ts`
- `apps/ecommerce/web/src/components/storefront-route-metadata.tsx`
- `apps/ecommerce/web/src/lib/storefront-metadata.ts`
- `tests/ecommerce/storefront-metadata.test.ts`
- `tests/ecommerce/storefront-seo-service.test.ts`
- `tests/framework/runtime/http-routes.test.ts`

### Canonical Decisions

- canonical storefront URLs must normalize `/shop/*` aliases to the active storefront target instead of allowing duplicate crawl paths
- the storefront head controller must own canonical, Open Graph, and robots meta tags so future SEO changes can build on one metadata layer
- `robots.txt` and `sitemap.xml` should be served through public routes using runtime config and seeded catalog data rather than static placeholder files
- sitemap baseline should include canonical public discovery pages and active product detail routes, but exclude cart, checkout, account, and tracking surfaces

### Execution Plan

1. add a shared storefront SEO helper for canonical path normalization and absolute URL building
2. add an ecommerce SEO service for public origin resolution, robots generation, and sitemap generation
3. expose `robots.txt` and `sitemap.xml` through public routes with root legacy paths
4. extend the storefront metadata controller to set canonical, OG, and robots head tags
5. add targeted route, metadata, and sitemap tests
6. mark `1.6.3` complete in `TASK.md`

### Validation Plan

- run `npm run typecheck`
- run `npx.cmd tsx --test tests/framework/runtime/http-routes.test.ts tests/ecommerce/storefront-metadata.test.ts tests/ecommerce/storefront-seo-service.test.ts`
- confirm `robots.txt` and `sitemap.xml` register through public legacy paths
- confirm `1.6.3` is marked complete in `TASK.md`

### Validation Status

- [x] `npm run typecheck`
- [x] `npx.cmd tsx --test tests/framework/runtime/http-routes.test.ts tests/ecommerce/storefront-metadata.test.ts tests/ecommerce/storefront-seo-service.test.ts`
- [x] public legacy paths registered for `/robots.txt` and `/sitemap.xml`
- [x] `1.6.3` marked complete in `TASK.md`

### Risks And Follow-Up

- Open Graph values are currently route-level baseline values; product-specific SEO enrichment can be added later if PDP-level SEO fields become part of the storefront payload
- the static file under `public/robots.txt` still exists, but the public route now provides the crawl baseline at runtime and should be treated as authoritative
- `1.6.4` should now focus on accessibility behavior with these crawl and metadata changes left stable
