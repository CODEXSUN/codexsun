# Sites Client Portal Plan

This plan tracks the shared Sites portal, public client pages, content storage, SEO, verification, and future client work.

## Current scope

Focus on repository-owned code, shared UI, dashboard metrics, internal content
workflows, client page refinements, SEO behavior, accessibility, performance,
and automated route verification. Defer server settings, DNS, reverse proxy,
domain ingress, and production hosting administration until the codebase is
ready.

## Phase 1. Portal foundation

1. [x] Create the public `/clients` portal.
2. [x] Keep the public portal separate from the authenticated Sites workspace.
3. [x] Add reusable client data types and section types.
4. [x] Add shared templates for client pages and portfolio sections.
5. [x] Keep client-specific compositions under `apps/sites/web/src/Clients/`.
6. [x] Keep shared code under `apps/sites/web/src/shared/` and `apps/sites/web/src/templates/`.

## Phase 2. Dynamic client content

1. [x] Add SQLite storage for public client content.
2. [x] Add published client API routes.
3. [x] Add Codexsun content.
4. [x] Add DevXcrew content.
5. [x] Add Logicx Info Tech content.
6. [x] Add Skilloopz content.
7. [x] Preserve edited records when the store adds a missing default client.
8. [x] Add contact, location, social links, footer text, sections, and copyright fields.

## Phase 3. Client page delivery

1. [x] Port the Skilloopz source homepage and supplied assets.
2. [x] Add Skilloopz learning-path and placement-path pages.
3. [x] Add Skilloopz about and contact pages.
4. [x] Add a source-inspired Codexsun homepage.
5. [x] Add a source-inspired LogicX homepage.
6. [x] Keep generic templates available for client subpages.
7. [x] Add responsive layouts and accessible headings, links, and labels.

## Phase 4. SEO and discovery

1. [x] Add page titles, descriptions, keywords, canonical URLs, and structured data.
2. [x] Set the Skilloopz title to `Skilloopz | IT Training & Placement Assistance`.
3. [x] Set the Skilloopz description for IT training and placement assistance.
4. [x] Set the Skilloopz H1 to `Build Your Skills. Prepare for Your Career.`.
5. [x] Generate `sitemap.xml` during development and production builds.
6. [x] Generate `robots.txt` during development and production builds.
7. [x] Generate `ai.txt` and `llms.txt` for public client discovery.
8. [x] Exclude `/clients/test` from the sitemap and robots indexing.
9. [x] Add consent-gated Google Analytics configuration.
10. [ ] Add the real Google Search Console TXT verification token outside source control.
11. [ ] Submit the public sitemap in Google Search Console.

## Phase 5. Client test switch

1. [x] Add `VITE_SITES_TEST_CLIENT_NAME` to the local web environment.
2. [x] Render the selected client at `/clients/test`.
3. [x] Support a one-off query override at `/clients/test?client=<slug>`.
4. [x] Normalize environment and query client slugs.
5. [x] Verify Codexsun and LogicX through the test switch.

## Phase 6. Verification and release

1. [x] Run web typecheck.
2. [x] Run API typecheck.
3. [x] Run web lint.
4. [x] Run API tests.
5. [x] Build the web application.
6. [x] Verify the public API returns all clients.
7. [x] Verify the Skilloopz SEO title, description, and H1 in a browser.
8. [x] Verify Skilloopz learning-path in a browser.
9. [x] Verify sitemap and robots content.
10. [ ] Publish the final site after Search Console access is available.

## Phase 7. Future client delivery

1. [ ] Confirm the client name, slug, audience, services, and contact details.
2. [ ] Read the client source under `apps/temp/sites/<client>`.
3. [ ] Add the API content record.
4. [ ] Add the frontend fallback record.
5. [ ] Add client-specific pages under `src/Clients/<slug>/`.
6. [ ] Reuse shared sections and templates where the design allows it.
7. [ ] Add public routes to the sitemap.
8. [ ] Add client links to `ai.txt` and `llms.txt`.
9. [ ] Add SEO title, description, H1, structured data, contact, location, and social links.
10. [ ] Verify the normal route, test route, mobile layout, desktop layout, API response, build, and browser output.

## Phase 8. Multi-site operations

1. [x] Define one shared Sites control plane for multiple client slugs.
2. [x] Define local, staging, and production environment boundaries.
3. [x] Define local parallel-instance port and volume rules.
4. [x] Define production web, API, data, backup, and ingress ownership.
5. [x] Define service, client-route, and data monitoring checks.
6. [x] Define release order and failure handling.
7. [x] Record the operations model in `apps/sites/agent/operations.md`.
8. [ ] Add a published client route manifest.
9. [ ] Add route checks to `apps/sites/.container/sites-verify.sh`.
10. [ ] Add custom-domain mapping to the content model.
11. [ ] Add structured monitoring output and alert thresholds.
12. [ ] Add backup age and restore-test checks.

## Phase 9. Organizer workspace

1. [x] Add the `Sites Studio` organizer brand.
2. [x] Make the organizer brand configurable with `VITE_SITES_BRAND_NAME`.
3. [x] Show published client count and client inventory.
4. [x] Link each client card to its public site.
5. [x] Show API health and provider status.
6. [x] Refresh API health every 30 seconds.
7. [x] Refresh the public client feed every 60 seconds.
8. [x] Show production readiness checks.
9. [ ] Add route-level checks to the organizer.
10. [ ] Add backup age and restore status to the organizer.
11. [ ] Add domain mapping and deployment status to the organizer.

## Phase 10. Standalone site delivery

1. [x] Add a fixed-client standalone runtime mode.
2. [x] Add local ports 7001 through 7004 for the four current sites.
3. [x] Keep standalone hosts connected to the shared Sites Studio public API.
4. [x] Render standalone client pages at the domain root.
5. [x] Generate standalone robots and sitemap files from the site origin.
6. [deferred] Add production domain mapping records.
7. [ ] Add code-owned route and runtime checks without deployment administration.
8. [deferred] Publish Codexsun after DNS and production configuration.
