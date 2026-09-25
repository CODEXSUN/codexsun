# Sites Client Portal Task List

This task list records completed work, open work, and the next actions for the Sites client portal.

## Active scope

The active work is limited to codebase quality, shared UI, dashboard metrics,
internal content workflows, client site refinements, SEO, accessibility,
performance, and automated verification. Server settings, DNS, reverse proxy,
domain ingress, and production hosting remain deferred.

## Improvement execution plan

### Phase 1. Dashboard metrics and runtime observability

1. [x] Add runtime state, port, response time, and last-checked data.
2. [x] Add an active-runtime summary metric.
3. [x] Add runtime loading, stopped, starting, degraded, and failed states.
4. [x] Add root-route HTTP status and response-time details to each client card.
5. [x] Add retry actions and visible error explanations.

Acceptance: the dashboard shows useful current runtime data without opening a
terminal, and every state has a readable non-color status.

### Phase 2. Shared UI system

1. [x] Add compact and interactive variants used by the dashboard status surfaces.
2. [x] Add reusable runtime status, health summary, publish status, and route checklist blocks.
3. [x] Register every new block and variant in the UI design-system registry.
4. [ ] Add shared specimens and component tests.

Acceptance: Sites Studio owns no repeated base card, badge, metric, or state
surface that belongs in `@codexsun/ui`.

### Phase 3. Internal content workflow

1. [x] Add a client content editor screen at `/studio/content/:slug`.
2. [ ] Add section ordering, visibility, and validation.
3. [x] Add draft, preview, publish, and unpublish states.
4. [ ] Add SEO, contact, social, footer, and copyright editing.
5. [ ] Add revision history and rollback data contracts.

Acceptance: editors can change and preview a client site without editing source
files or directly modifying SQLite.

### Phase 4. Client page refinement

1. [x] Add shared route manifests for the common client pages.
2. [ ] Add reusable hero, feature, CTA, FAQ, team, and contact blocks.
3. [ ] Add client theme and layout variants.
4. [x] Add shared loading and not-found states for client routes.
5. [ ] Remove repeated hardcoded client links and route assumptions.

Acceptance: each client has a complete, reusable route composition with no
broken internal links.

### Phase 5. SEO and discovery quality

1. [ ] Generate metadata from published content records.
2. [ ] Add title, description, H1, canonical, and schema validation.
3. [ ] Add client-specific Open Graph image support.
4. [x] Add automated discovery-file checks.
5. [ ] Add broken-link and missing-metadata tests.

Acceptance: every published route has valid metadata and discovery output.

### Phase 6. Accessibility and responsive quality

1. [x] Add keyboard-friendly mobile navigation and visible focus entry.
2. [x] Validate icon-only action names and live status announcements.
3. [ ] Validate contrast, reduced motion, and screen-reader states.
4. [ ] Test 320px, 768px, 1024px, and desktop layouts.

Acceptance: all dashboard and public client flows remain usable across the
supported viewport and assistive interaction states.

### Phase 7. Performance

1. [x] Split client compositions by route.
2. [ ] Optimize image and video delivery.
3. [ ] Add public-content caching and request deduplication.
4. [x] Add stable vendor, shared UI, and client-page bundle boundaries.

Acceptance: the largest public client assets and route load metrics are tracked
and remain within agreed budgets.

### Phase 8. Automated verification

1. [x] Make the shared route manifest drive public route and discovery tests.
2. [ ] Test every client route and standalone runtime.
3. [ ] Test runtime start, live, stopped, and failure states.
4. [ ] Add accessibility and performance checks to the Sites test workflow.

Acceptance: one command verifies the published client matrix and reports
client-specific failures clearly.

### Phase 9. Preview and publishing logic

1. [ ] Add draft preview URLs.
2. [x] Add a visible content-change summary before publish.
3. [x] Add publish confirmation and revision audit records.
4. [x] Add public-content cache invalidation after publish.
5. [x] Add failed-save and failed-publish retry behavior.

Acceptance: publishing is explicit, reviewable, reversible, and traceable.

## Current execution

1. [x] Create this phased improvement task register.
2. [x] Start Phase 1 with runtime observability metrics.
3. [x] Replace port-only checks with HTTP runtime probes and explicit state values.
4. [x] Add runtime retry controls and dashboard error feedback.
5. [x] Start Phase 2 with shared workspace status blocks.
6. [x] Rewire Sites Studio runtime and readiness UI to shared blocks.
7. [x] Start Phase 3 with SQLite draft storage and authenticated editor APIs.
8. [x] Add the first content editor screen and explicit publish actions.
9. [x] Start Phase 4 with a shared client route manifest.
10. [x] Add public client loading, unavailable, and not-found states.
11. [x] Start Phase 5 by centralizing discovery-file generation.
12. [x] Add sitemap, robots, ai.txt, and llms.txt regression tests.
13. [x] Start Phase 6 with accessible responsive client navigation.
14. [x] Add live announcements for runtime status changes.
15. [x] Start Phase 7 with lazy client compositions and bundle boundaries.
16. [x] Confirm production output emits separate `client-pages` and `ui` chunks.
17. [x] Start Phase 8 with manifest-driven route matrix tests.
18. [x] Start Phase 9 with revision-backed publishing controls.

### Phase 3 verification

1. [x] Sites API typecheck and lint.
2. [x] Sites web typecheck and lint.
3. [x] Sites API tests: 4 passed, 1 MariaDB integration test skipped.
4. [x] Draft, publish, and unpublish behavior covered by SQLite store tests.
5. [ ] Section ordering, validation, revisions, and complete metadata editing remain open.

### Phase 4 verification

1. [x] Sites web typecheck.
2. [x] Sites web lint.
3. [x] Targeted route-manifest diff whitespace check.
4. [ ] Full browser route matrix remains open for the automated verification phase.

### Phase 5 verification

1. [x] Sites web discovery tests: 2 passed.
2. [x] Sites web typecheck.
3. [x] Sites web production build.
4. [x] Generated sitemap includes all 26 public portal routes.
5. [x] Standalone sitemap is restricted to the active client runtime.
6. [ ] Bundle-size warning remains assigned to Phase 7.

### Phase 6 verification

1. [x] Shared UI test suite: 58 passed, including live announcements and text status.
2. [x] Client navigation has keyboard-focusable mobile and desktop links.
3. [x] Active client routes expose `aria-current="page"`.
4. [ ] Full viewport and contrast audit remain open.

### Phase 7 verification

1. [x] Sites web typecheck and lint.
2. [x] Client-specific compositions use lazy route chunks.
3. [x] Vite build defines vendor, shared UI, and client-page chunk boundaries.
4. [ ] Image delivery, caching, and Core Web Vitals budgets remain open.
5. [ ] Vendor bundle remains above 500 kB and is tracked for further Phase 7 optimization.

### Phase 8 verification

1. [x] Sites web route/discovery tests: 4 passed.
2. [x] Sites API tests: 4 passed, 1 MariaDB integration test skipped.
3. [x] Route manifest rejects duplicate public paths.
4. [x] Standalone route paths are verified independently from portal paths.
5. [ ] Browser runtime matrix and failure-state tests remain open.

### Phase 9 verification

1. [x] Sites API tests: 4 passed, 1 MariaDB integration test skipped.
2. [x] Draft, publish, and unpublish revisions are persisted and tested.
3. [x] Editor shows changed content groups before publishing.
4. [x] Publish requires explicit confirmation and invalidates public content queries.
5. [ ] Draft preview URLs and rollback UI remain open.

### Phase 1 verification

1. [x] Sites API typecheck.
2. [x] Sites web typecheck.
3. [x] Sites API lint.
4. [x] Sites web lint.
5. [x] Sites API tests: 3 passed, 1 MariaDB integration test skipped because the test database was not available.
6. [x] Sites API build.
7. [x] Sites web build.
8. [x] Targeted diff whitespace check.
9. [ ] Web bundle-size warning remains for Phase 7 performance work.

### Phase 2 verification

1. [x] `@codexsun/ui` typecheck.
2. [x] `@codexsun/ui` lint.
3. [x] `@codexsun/ui` tests: 56 passed.
4. [x] Sites web typecheck.
5. [x] Targeted shared UI diff whitespace check.
6. [ ] Dedicated specimens and focused tests remain open.

## Completed tasks

1. [x] Create the public client portal at `/clients`.
2. [x] Add Codexsun, DevXcrew, Logicx Info Tech, and Skilloopz.
3. [x] Add SQLite-backed public content storage.
4. [x] Add published public content API routes.
5. [x] Add reusable shared client data, SEO, legal, analytics, and portal components.
6. [x] Add reusable client page and portfolio templates.
7. [x] Keep `src/Clients/` limited to client-specific compositions.
8. [x] Port the Skilloopz homepage source content and assets.
9. [x] Add the Skilloopz learning-path route.
10. [x] Add the Skilloopz placement-path route.
11. [x] Add source-inspired Codexsun and LogicX homepages.
12. [x] Add contact, location, social links, footer, and copyright content.
13. [x] Add environment client switching with `VITE_SITES_TEST_CLIENT_NAME`.
14. [x] Add `/clients/test` and query override support.
15. [x] Add page metadata, canonical URLs, structured data, Google Analytics configuration, `ai.txt`, and `llms.txt`.
16. [x] Add generated `sitemap.xml` and `robots.txt`.
17. [x] Set Skilloopz SEO title, description, supporting copy, and H1.
18. [x] Verify the public API, browser routes, sitemap, robots file, build, lint, typecheck, and API tests.

## Open release tasks

1. [ ] Get the production domain from the site owner.
2. [ ] Get the Google Search Console TXT token from the site owner.
3. [ ] Add the TXT record at the domain DNS provider.
4. [ ] Confirm DNS propagation.
5. [ ] Verify the domain in Google Search Console.
6. [ ] Submit `/sitemap.xml` in Google Search Console.
7. [ ] Confirm the sitemap status is Success.
8. [ ] Publish the final site.
9. [ ] Record the domain, verification date, sitemap status, and publisher in the release record.

## Next client task sequence

1. [ ] Read `apps/temp/sites/<client>` and record the source pages.
2. [ ] Confirm the client slug and public route list.
3. [ ] Add the client record to the SQLite seed defaults.
4. [ ] Add the matching frontend fallback data.
5. [ ] Add the client-specific page composition.
6. [ ] Copy only required source assets into the Sites public asset folder.
7. [ ] Add contact, location, social, footer, copyright, and SEO content.
8. [ ] Add the client routes to the sitemap.
9. [ ] Add the client to `ai.txt` and `llms.txt`.
10. [ ] Add the client slug to the test-switch validation list.
11. [ ] Run API tests and typechecks.
12. [ ] Run the production build.
13. [ ] Test the normal client route in a browser.
14. [ ] Test `/clients/test?client=<slug>` in a browser.
15. [ ] Check mobile and desktop layouts.
16. [ ] Record the result in `apps/sites/agent/note.md`.

## Current verification record

1. [x] Codexsun public page loads.
2. [x] LogicX public page loads.
3. [x] Skilloopz public page loads.
4. [x] Skilloopz learning-path page loads.
5. [x] Skilloopz H1 matches the requested text.
6. [x] Skilloopz title matches the requested text.
7. [x] Skilloopz description matches the requested text.
8. [x] Sitemap contains Skilloopz learning-path and placement-path.
9. [x] Robots file blocks `/clients/test`.
10. [ ] Google Search Console submission is waiting for owner access.

## Multi-site operations tasks

1. [x] Define the shared control-plane model.
2. [x] Define local parallel-instance rules.
3. [x] Define staging and production separation.
4. [x] Define service and client-route monitoring checks.
5. [x] Define release and rollback order.
6. [x] Add the operations record in `apps/sites/agent/operations.md`.
7. [ ] Add a route manifest for every published client.
8. [ ] Extend `sites-verify.sh` with client route checks.
9. [ ] Add domain-to-client mapping.
10. [ ] Add structured health output for monitoring tools.
11. [ ] Add backup age and restore verification.
12. [ ] Add staging environment examples.

## Organizer workspace tasks

1. [x] Build the authenticated multi-site organizer.
2. [x] Use `Sites Studio` as the default organizer brand.
3. [x] Add `VITE_SITES_BRAND_NAME` for domain-specific branding.
4. [x] Show published client inventory.
5. [x] Show API and content-feed status.
6. [x] Add public route links for each client.
7. [x] Add production readiness indicators.
8. [ ] Add route-level synthetic checks.
9. [ ] Add backup and restore status.
10. [ ] Add production domain and deployment status.

## Standalone runtime tasks

1. [x] Add the fixed-client runtime launcher.
2. [x] Add Codexsun, DevXcrew, Logicx, and Skilloopz local host ports.
3. [x] Connect each host to the Sites Studio public content API.
4. [x] Keep shared templates and client compositions reusable.
5. [x] Add standalone SEO discovery files.
6. [deferred] Configure production domains and ingress.
7. [ ] Add repository-owned route and runtime verification.
