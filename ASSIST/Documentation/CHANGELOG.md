# Changelog

## Version State

- Current package version: `0.0.1`
- Current release tag: `v-0.0.1`
- Reference format: `#<number>`

## v-0.0.1

### [#72] 2026-04-08 - Billing stock bridge and valuation baseline

- completed Stage `B10` by bridging posted billing vouchers into `core` stock movement for purchase receipts, sales-linked stock reduction, stock adjustments, and landed-cost capitalization
- added stock-aware billing voucher contracts, centralized inventory replay and synchronization logic, and a stock valuation report surfaced through the billing reporting workspace
- validated the batch with `npm run typecheck` and `npx.cmd tsx --test tests\\billing\\voucher-service.test.ts tests\\billing\\reporting-service.test.ts tests\\api\\internal\\routes.test.ts`

### [#70] 2026-04-08 - Ecommerce accounting compatibility verification baseline

- completed Stage `3.3.4` by adding an ecommerce accounting-compatibility report for invoice and GST workflow review
- exposed a protected internal report route and payments-workspace view that flags blocked lifecycle cases, mixed-rate GST orders, refund credit-note follow-up, and unmapped shipping or handling tax treatment
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### [#69] 2026-04-08 - GST review and receipt tax breakdown baseline

- completed Stage `3.3.3` by adding a stored GST review snapshot for each storefront order
- extended storefront orders and receipt generation with taxable-value and GST-component breakdown derived from product tax ids plus seller-state versus customer-state comparison
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### [#67] 2026-04-08 - Billing posting model and notes baseline

- completed Stages `B1`, `B2`, `B3`, and `B4.1` for `apps/billing` by hardening voucher lifecycle controls, normalizing voucher header and line storage, adding immutable posted ledger entries, and rebuilding accounting reports from posted entries with traceability
- implemented first-class credit note and debit note documents with source-voucher linkage, GST-aware note posting treatment, and explicit note register and detail routes in the billing workspace
- added the general ledger report, updated billing planning and task tracking, and validated the batch with `npm run typecheck` plus `npx.cmd tsx --test tests\\billing\\voucher-service.test.ts tests\\billing\\reporting-service.test.ts tests\\api\\internal\\routes.test.ts`

### [#68] 2026-04-08 - Zone shipping and COD eligibility baseline

- completed Stage `3.3.2` by adding ecommerce-owned shipping zones with country, state, and pincode-prefix matching plus surcharge, ETA, free-shipping threshold override, and COD-eligibility rules
- extended checkout and order creation so delivery quotes resolve from shipping method plus matched zone, and created orders snapshot both the selected shipping method and resolved zone
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### [#67] 2026-04-08 - Shipping methods and ETA model

- completed Stage `3.3.1` by adding persisted storefront shipping methods with courier, SLA, ETA, and COD-eligibility metadata
- extended storefront settings and order contracts so checkout selects active delivery methods, charge calculation uses the chosen method fallback, and created orders snapshot the selected delivery promise
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### [#66] 2026-04-08 - ERP price-list compatibility baseline

- completed Stage `3.2.4` by documenting price-list compatibility with ERPNext if ERP becomes storefront pricing source of truth
- recorded that ERP item-price and price-list selection must resolve through `frappe` projection into normalized `core` pricing fields before `ecommerce` reads them, while preserving current `sellingPrice`, `mrp`, and `basePrice` semantics
- validated the batch with architecture and planning consistency review across the current `core`, `ecommerce`, and `frappe` pricing boundaries

### [#65] 2026-04-08 - Promotion engine scope baseline

- completed Stage `3.2.3` by defining the future promotion engine scope and phased rollout around the current live pricing, coupon, and merchandising surfaces
- recorded Phase A as the current baseline of `core` price authority plus ecommerce-owned customer coupons, kept current campaign or coupon-banner or gift-corner surfaces presentation-only, and scoped later rule-driven promotions and segmented pricing into later phases
- validated the batch with architecture, planning, and current pricing-coupon-merchandising code-path review across the `core`, `ecommerce`, and `frappe` boundaries

### [#64] 2026-04-08 - Coupon validation and usage constraints baseline

- completed Stage `3.2.2` by adding real checkout coupon validation, expiry handling, and usage constraints backed by ecommerce-owned customer portal coupon state
- extended customer and order contracts with coupon lifecycle metadata, enforced `active -> reserved -> used` coupon handling through checkout and payment flows, and added a storefront checkout coupon input for signed-in customers
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### [#63] 2026-04-08 - Pricing authority decision baseline

- completed Stage `3.2.1` by recording `apps/core` as the current authoritative source for storefront sell price and compare-at price
- aligned architecture and go-live planning so `apps/ecommerce` resolves effective pricing from active `core` price rows using `sellingPrice` and `mrp`, with `basePrice` only as fallback when no active row exists
- validated the batch with architecture, planning, and storefront pricing code-path review across the current `core`, `ecommerce`, and `frappe` boundaries

### [#62] 2026-04-08 - Warehouse visibility rules baseline

- completed Stage `3.1.4` by defining warehouse and stock visibility rules for storefront availability
- recorded that storefront availability stays aggregated across active `core` stock rows, warehouse-level stock remains internal to operations, and store pickup still uses the same shared sellable pool as delivery orders
- validated the batch with architecture, planning, pickup-flow, and storefront availability code-path review across the current `core` and `ecommerce` boundaries

### [#61] 2026-04-08 - Stock reservation lifecycle baseline

- completed Stage `3.1.3` by adding storefront stock reservation at checkout for orders entering `payment_pending`
- extended the storefront order contract with explicit stock-row reservation metadata, applied reservation and release logic against `core` product stock rows, and added expiry, cancellation, failed-payment, and late-capture guards around the reservation lifecycle
- validated the batch with `npm.cmd run typecheck`, `npx.cmd tsx --test tests/ecommerce/services.test.ts`, and `npx.cmd tsx --test tests/api/internal/routes.test.ts`

### [#60] 2026-04-08 - Low-stock and oversell rules baseline

- completed Stage `3.1.2` by defining the storefront low-stock threshold and oversell-prevention rules against the existing `core` stock model
- recorded sellable quantity as `active quantity - reservedQuantity`, set low stock to quantities `1` through `5`, treated `0` as out of stock, and kept cart and PDP stock indicators advisory until checkout revalidation
- documented the current boundary that `payment_pending` does not yet create a new stock hold, so reservation behavior remains the explicit follow-up in Stage `3.1.3`, then validated the batch with architecture, planning, and checkout code-path review

### [#59] 2026-04-08 - Inventory authority decision baseline

- completed Stage `3.1.1` by recording `apps/core` as the current authoritative source for sellable storefront stock
- aligned architecture and go-live planning so `apps/ecommerce` continues reading stock only from `core`, while future ERPNext stock must flow through `apps/frappe` snapshots projected into `core`
- validated the batch with architecture, planning, and code-path consistency review across the current `core`, `ecommerce`, and `frappe` boundaries

### [#58] 2026-04-08 - Ecommerce overview KPI dashboard

- completed Stage `2.4.5` by adding ecommerce overview KPIs for conversion, AOV, order count, paid vs failed, fulfilment aging, and refund aging
- exposed a protected internal overview-report route for ecommerce analytics readers and replaced the static ecommerce overview cards with live KPI-backed dashboard content plus drill-down links into payments, orders, and support
- kept conversion and aging values aligned to the existing ecommerce order and operational-aging reports, then validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### [#57] 2026-04-08 - Ecommerce fulfilment and refund aging reports

- completed Stage `2.4.4` by adding fulfilment-aging and refund-aging operational reporting derived from the existing ecommerce order and refund queues
- exposed a protected internal aging-report route, shared aging-report schemas, and storefront admin client support so finance operators can review aging bands and order-level drill-down from the payments operations screen
- kept active refund work from duplicating into fulfilment aging, then validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### [#56] 2026-04-08 - Ecommerce refund and settlement-gap exports

- completed Stage `2.4.3` by adding refund and settlement-gap CSV exports from the existing ecommerce payments operations surface
- exposed protected internal export routes, shared document schemas, and storefront admin client helpers so finance operators can download refund-queue and settlement-visibility data without leaving the payments screen
- kept the reporting slice aligned to the existing live Razorpay settlement queue and refund queue models, then validated it with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### [#54] 2026-04-07 - Ecommerce customer lifecycle controls

- completed Stage `2.3.4` by adding ecommerce-owned customer lifecycle states for `active`, `blocked`, `deleted`, and `anonymized`, with synchronized auth-session revocation and identity anonymization handling
- added protected admin customer report and lifecycle-action routes, a dedicated ecommerce customer operations screen, and a new ecommerce customer-management permission in the auth seed set
- validated the batch with `npm run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### [#53] 2026-04-07 - Auth session hardening baseline

- completed Stage `2.3.3` by adding auth-user failed-login counters, temporary lockout windows, stale admin-session timeout enforcement, and audit-log coverage for login or session rejection events
- added the cxapp auth-hardening migration, repository support for failed-login state and forced session revocation, and auth-service checks for lockout, idle timeout, disabled-account rejection, and auth activity logging
- validated the batch with `npm run typecheck` and `npx.cmd tsx --test tests/core/auth-service.test.ts tests/api/internal/routes.test.ts tests/framework/runtime/database-process.test.ts`

### [#51] 2026-04-07 - Ecommerce permission enforcement baseline

- completed Stage `2.3.2` by enforcing ecommerce route permissions through the shared internal-session guard instead of relying only on actor type checks
- mapped ecommerce storefront designer, orders, support, payments, and communications routes to the seeded ecommerce permission keys so operator roles now control real route access
- added an internal route test proving a support agent can access the support queue but is blocked from order operations without the required permission
- validated the batch with `npm run typecheck` and `npx.cmd tsx --test tests/api/internal/routes.test.ts`

### [#50] 2026-04-07 - Ecommerce operator role baseline

- completed Stage `2.3.1` by defining the ecommerce operator role set in shared auth seed data, using the existing Super Admin baseline plus seeded ecommerce admin, catalog manager, order manager, support agent, finance operator, and analyst roles
- added dedicated ecommerce permission definitions for workspace, storefront, catalog, orders, support, payments, communications, and analytics so later route enforcement has stable permission keys to target
- extended the auth-route validation to assert the new ecommerce roles and permissions are exposed through the existing internal RBAC APIs
- validated the batch with `npm run typecheck` and `npx.cmd tsx --test tests/api/internal/routes.test.ts`

### [#49] 2026-04-07 - Customer portal communication history

- completed Stage `2.2.5` by exposing customer-safe storefront communication history through a new authenticated portal route backed by the existing mailbox ledger
- added communication history visibility on portal order detail and support surfaces so customers can review order confirmation and related customer-facing mail activity without admin resend controls
- added ownership-filtered service coverage for customer communication history plus external route registration validation
- validated the batch with `npm run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/framework/runtime/http-routes.test.ts`

### [#48] 2026-04-07 - Customer portal reorder and wishlist cart utilities

- completed Stage `2.2.2` by adding customer return and cancellation request workflows with portal request creation, admin review queue actions, and order-linked request visibility
- completed Stage `2.2.3` by adding direct support-case entry from customer order detail so portal support requests can be opened with the order number and order context already linked
- completed Stage `2.2.4` by adding repeat-order utilities on portal order list and order detail surfaces, plus a bulk wishlist-to-cart action using the shared storefront cart store
- validated the batch with `npm run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts tests/framework/runtime/http-routes.test.ts`

### [#47] 2026-04-07 - Ecommerce support queue and portal receipt downloads

- completed Stage `2.1.5` by adding an ecommerce-owned customer support queue linked to customers and orders, with portal case creation, admin queue actions, and shared support-case contracts
- added support-case json-store persistence, authenticated customer support-case routes, protected internal support queue and update routes, and a dedicated ecommerce admin `Support` workspace screen
- completed Stage `2.2.1` by adding authenticated customer receipt downloads from portal order list and order detail surfaces through a new storefront order-receipt route and receipt document generator

### [#46] 2026-04-07 - Ecommerce refund queue baseline

- completed Stage `2.1.4` by extending the payments operations surface with a refund queue and admin refund-status progression
- added refund queue items and refund summary counters to the ecommerce payments report, exposed a protected refund-status update route, and wired frontend client support for refund request and refund queue actions
- extracted a shared admin order operations dialog reused by both orders and payments, then added full-refund request entry from order detail plus queued, processing, and rejected refund actions in the payments screen

### [#45] 2026-04-07 - Storefront desktop width standardization

- standardized the main storefront desktop rails to `max-w-[96rem]` across homepage, catalog, PDP, cart, checkout, category rail, and customer portal layout so large screens use a consistent 1536px content width
- widened the homepage hero internals with larger media framing, broader copy allowance, and decorative fill layers so added desktop space reads as intentional storefront design instead of empty gutters
- updated shared design-system storefront preview blocks to use the requested responsive width behavior without changing live commerce grid density rules outside preview mode
- validated the batch with `npm run typecheck` and `npm run build`

### [#44] 2026-04-07 - Ecommerce admin order actions baseline

- completed Stage `2.1.2` by adding admin order detail operations for cancel, fulfilment progression, shipment tracking, delivery completion, and order-confirmation resend
- extended the shared ecommerce order contract with shipment details and admin action payloads, added protected internal order-detail and order-action routes, and wired the frontend admin orders queue with a detail dialog for lifecycle operations
- updated demo seed compatibility for shipment metadata and validated the batch with `npm run typecheck` plus targeted ecommerce service and internal route tests

### [#43] 2026-04-07 - Ecommerce admin order queue baseline

- completed Stage `2.1.1` by replacing the ecommerce orders placeholder with a real admin order queue backed by a typed internal report
- added shared order-queue schemas, report bucketing in the ecommerce order service, a protected `GET /internal/v1/ecommerce/orders/report` route, and a frontend API method for admin order operations
- added a searchable, tabbed orders workspace surface covering action-required, fulfilment, shipment, pickup, completed, and closed queues, then validated the slice with `npm run typecheck` and targeted service or route tests

### [#42] 2026-04-07 - Storefront mobile matrix baseline

- completed Stage `1.6.5` by adding a fixed device-matrix storefront audit for homepage, catalog, PDP, cart, checkout, and tracking
- added a shared viewport-overflow assertion in the new Playwright mobile matrix spec and aligned the cart assertion to stable shopper controls instead of brittle heading copy
- validated the responsive baseline with `npm run test:e2e -- tests/e2e/storefront-mobile-matrix.spec.ts` and marked `1.6.5` complete in `TASK.md`

### [#41] 2026-04-07 - Storefront accessibility baseline

- completed Stage `1.6.4` with a storefront accessibility pass covering keyboard bypass, control naming, and form labeling across homepage, catalog, PDP, cart, checkout, and tracking
- added a shared skip-to-content link in the storefront shell, improved hero-slider and PDP control labels, and tightened tracking and storefront search field accessibility
- added a focused Playwright storefront accessibility smoke test and marked `1.6.4` complete in `TASK.md`

### [#40] 2026-04-07 - Storefront SEO crawl baseline

- completed Stage `1.6.3` by adding shared storefront canonical-path helpers, browser-side canonical and Open Graph tags, and robots meta handling on top of the storefront route metadata layer
- added runtime-backed public `robots.txt` and `sitemap.xml` routes so crawl policy and sitemap discovery now come from framework config, storefront target rules, and active seeded catalog data
- added targeted tests for storefront metadata resolution, sitemap generation, robots generation, and public route registration, then marked `1.6.3` complete in `TASK.md`

### [#39] 2026-04-07 - Storefront route metadata baseline

- completed Stage `1.6.2` by adding a shared storefront route-metadata map and browser-side metadata controller instead of page-by-page title handling
- normalized metadata resolution for both root storefront routes and `/shop/*` storefront routes, then restored the existing document title and description outside storefront pages
- added targeted tests for storefront metadata resolution and title formatting, and marked `1.6.2` complete in `TASK.md`

### [#38] 2026-04-07 - Storefront legal pages baseline

- completed Stage `1.6.1` by adding backend-owned storefront legal and trust pages for shipping, returns, privacy, terms, and contact, backed by seeded ecommerce settings instead of hardcoded frontend copy
- exposed a new public storefront legal-page payload, wired frontend query and route support, and added a reusable storefront legal-page surface for both root and `/shop/*` route shapes
- repointed storefront footer trade links to the new trust pages and added targeted route-registration and ecommerce service tests for the legal-page slice
- marked `1.6.1` complete in `TASK.md` and initiated Stage `1.6.2` metadata planning for the next storefront production task

### [#37] 2026-04-07 - Stage 1.2 completion and PDP specification drawer

- completed the remaining Phase 1 Stage 1.2 ecommerce reliability tasks by adding stable order-confirmation and tracking coverage, formalizing the storefront order state machine, and enforcing idempotent checkout or payment verification behavior
- updated storefront order storage, payment verification, duplicate-submit handling, and customer-facing order status surfaces so retries no longer duplicate pending orders or replay successful payment capture
- added grouped product specification data to the storefront PDP response and built a new accordion-driven specification surface with a right-side product details drawer sourced from live core product data
- refined the specification drawer into a narrow, simpler key-value sheet, fixed its interaction with the floating contact button, and prevented page shift on open or close by stabilizing scrollbar gutter in the shared UI CSS
- marked `1.2.4`, `1.2.5`, and `1.2.6` complete in `TASK.md`

### [#36] 2026-04-07 - Pickup support and checkout payment recovery

- added storefront pickup support across ecommerce settings, checkout, order contracts, order detail rendering, and admin routing, including a standalone pickup designer under the ecommerce side menu
- completed authenticated and guest checkout reliability updates with shared lookup-driven address capture, incomplete-address repair, and stable cart-to-checkout auth coverage
- hardened live Razorpay recovery in checkout so dismiss and verify-failure paths reuse the same pending payment session instead of creating duplicate orders
- added deterministic storefront checkout e2e coverage for live modal close, verification failure, and retry recovery flows, then marked `1.2.2` and `1.2.3` complete in `TASK.md`

### [#35] 2026-04-07 - Phase 1 Stage 1.1 release baseline

- completed Phase 1 Stage 1.1 of the ecommerce go-live schedule as a planning and release-governance batch
- added `ASSIST/Planning/phase-1-stage-1-1-release-baseline.md` covering the freeze rule, production target environment, domain and SSL baseline, environment ownership, release cutover checklist, ownership confirmation, and ordered P0 issue list
- updated `ASSIST/Execution/TASK.md` so the Stage 1.1 checklist is marked complete and linked to the new baseline document

### [#34] 2026-04-07 - Plan 9 execution schedule in task sheet

- replaced `ASSIST/Execution/TASK.md` with the full numbered execution schedule derived from `plan-9`
- organized the ecommerce go-live program into ordered phases, stages, and checkbox tasks from stabilization through ERP bridge and final release gate
- updated the ASSIST planning and work-log files so the task sheet now serves as the working execution schedule for future ecommerce delivery batches

### [#33] 2026-04-07 - Storefront content expansion, billing grid updates, and ecommerce go-live planning

- added and refined ecommerce storefront content systems including reusable shared UI blocks and dedicated designers for footer, floating contact, coupon banner, gift corner, trending, branding, and campaign or trust surfaces
- expanded ecommerce admin routing and menu coverage for the new storefront designer pages, while tightening storefront shell data caching, horizontal rail behavior, and related frontend structure for smoother scaling
- moved billing voucher entry further toward the shared inline editable grid model with tighter product lookup behavior and operational table refinements
- updated storefront e2e expectations to the current checkout, order-confirmation, and tracking UI, while documenting the remaining guest-address and mailbox-template gaps
- reviewed the current ecommerce app against go-live readiness across storefront, checkout, customer portal, admin control surfaces, backend operations, payment flow, and connector boundaries
- documented a repo-specific production blueprint covering storefront performance and SEO, backend commerce management, user and role controls, customer/admin portal maturity, payment and finance operations, inventory and shipping governance, security, observability, and phased ERPNext support
- added `ASSIST/Planning/plan-9.md` as the execution-ready ecommerce go-live plan for the next release waves

### [#32] 2026-04-06 - Storefront UX polish, framework mail, and deployment wiring

- connected live storefront payment flow details for Razorpay checkout, removed the extra test-only payment screen, and carried richer checkout metadata through ecommerce order and payment services
- tightened storefront UX across announcement, header, category navigation, hero slider, CTA styling, mobile dock hover behavior, and customer-facing cart, catalog, checkout, account, and tracking surfaces
- added framework mail migration, service, route, and page wiring in `cxapp` together with related mailbox schema and repository updates
- added ecommerce shipping and storefront-order support wiring, plus related admin and runtime service updates for the commerce app
- updated container and customer deployment assets under `.container/`, runtime config samples, and related shell or docs wiring to support the current local and client packaging flow
- updated ASSIST task tracking, planning, and work log for the cross-app batch

### [#31] 2026-04-06 - Inline editable table design-system block and docs wiring

- added a reusable shared inline editable table block in `apps/ui` with mixed in-cell editing for text, numeric quantity, delivery date calendar, dependent state and city lookups, multiline notes, publish toggle, and row actions
- registered the new editable grid as `table-12` inside the governed table catalog so it is available in the shared design-system docs alongside existing table variants
- added a dedicated data block registry entry for the editable table so the UI workspace side menu exposes it as a reusable block preview instead of leaving it as a hidden one-off demo
- updated ASSIST task tracking, planning, and work log to record the shared UI batch under the new reference

### [#30] 2026-04-06 - Responsive storefront polish, fixed dashboards, and container setup

- expanded ecommerce storefront controls so featured, new-arrivals, and best-seller lanes share backend-configured card density, tighter equal-height cards, and synchronized frontend rendering
- refined storefront interaction behavior across featured, category, catalog, and product flows with corrected scroll targeting, safer hero-slider sizing, tighter mobile slider stages, and a full-width responsive mobile dock
- added richer storefront product-card behaviors including compact action placement, inline savings and stock badges, wishlist and share affordances, and more consistent responsive menu behavior
- fixed shared sidebar shell behavior so dashboard and customer left navigation stays viewport-fixed with an internally scrolling menu area and a footer pinned to the bottom
- added container and client deployment assets under `.container/` for local and customer-specific runtime packaging, compose configuration, and setup documentation

### [#29] 2026-04-06 - Customer portal isolation, storefront persistence, and commerce UX refinement

- moved the customer surface onto canonical `/customer/*` routes, isolated it from admin and desk shells, and tightened auth redirect handling so customer users never see application menus or workspace switching
- rebuilt the customer profile page into customer-safe contact-style tabs with shared communication, addressing, and finance flows while keeping admin-only contact fields out of the portal
- refined the customer portal shell, sidebar, overview panels, and wishlist presentation to use a more theme-oriented dashboard tone without leaking admin UI patterns
- hardened legacy customer and contact hydration so widened nested arrays such as emails, phones, bank accounts, and GST details do not break re-login or profile reads on older stored data
- added shared storefront wishlist persistence that keeps guest wishlist intent locally, auto-syncs it into the ecommerce customer-portal database after login, and reflects the saved wishlist consistently in the storefront header, home, catalog, product, and portal views

### [#28] 2026-04-05 - Core product operations, media tabs, and storefront runtime stabilization

- added shared core product bulk-edit support for merchandising fields plus product duplication with safe `-copy` naming, exposed through new internal routes and list-level UI actions without disturbing the existing product upsert flow
- extended core product, contact, and product-category list screens with richer operational filters for category, brand, storefront placement, content presence, stock presence, promo state, contact completeness, and category-display flags
- refactored the framework media browser into animated tabs with separate browse, upload, folders, and external-URL surfaces while keeping preview layouts and long media result sets contained within the screen
- forward-hydrated the new `attributeCount` and `totalStockQuantity` product summary fields across core seed data, core product reads, and ecommerce storefront reads so older stored rows no longer fail schema parsing
- stabilized runtime startup by fixing the seed payload crash that had taken down the backend host, then verified the framework health endpoint after restart
- fixed the storefront landing payload so `/public/v1/storefront/home` can render legacy products again instead of returning `400` for missing summary fields

### [#27] 2026-04-05 - Demo app, shared state layer, storefront designers, and shared UI blocks

- added the app-owned `demo` application with protected internal API routes, module-scoped demo-data installers, transactional install jobs, progress reporting, and demo summary/count workspace pages
- introduced TanStack Query as the shared server-state layer, then migrated runtime app settings, runtime brand data, storefront shell data, and demo installer polling to query-backed refresh and invalidation
- added lightweight Zustand stores only for session and storefront shell coordination, avoiding broader client-state churn while improving initial shell readiness
- improved storefront first paint and slow-network behavior with skeletons, more deliberate loading order, eager hero media, and lazy catalog/category/product image handling
- added a shared two-line toast system with colorful result tones, runtime placement and tone settings, design-system docs coverage, and integration into the main admin save/install flows
- integrated a shared Tiptap editor with icon toolbar support and docs coverage inside the shared UI app
- extracted storefront search, featured-card, and category-card surfaces into reusable shared `ui` blocks and UX components so ecommerce admin previews, docs, and live storefront pages render from the same shared visual surfaces
- extended ecommerce storefront settings with saved featured and category layout controls, rows-to-show controls, single-card designers, color/toggle options, and frontend sync after save
- fixed storefront sync gaps by making admin saves refresh the public storefront shell and by aligning announcement, featured, and category rendering with the saved backend settings
- tightened framework media browser overflow behavior so forms remain visible while large media grids and edit dialogs scroll cleanly on constrained screens

### [#26] 2026-04-05 - Ecommerce storefront tone, admin settings, and mobile hero polish

- added a frontend target switch so the home surface can resolve to `site`, `shop`, or `app`, then normalized the active suite route tone around `/admin/dashboard`, `/dashboard`, and `/profile`
- rebuilt ecommerce admin navigation so reused `core` product and shared master screens render under ecommerce-owned routes without switching the sidebar away from the ecommerce app
- connected ecommerce storefront settings to a real ecommerce-owned backend service, added admin editing UI, and hardened legacy-row plus partial-save handling for nested storefront settings payloads
- added a dedicated ecommerce-owned Home Slider designer and backend route so hero gradients, CTA labels, navigation tone, and image-frame styling can be edited without leaving the ecommerce admin boundary
- evolved the Home Slider designer into a multi-slide admin list so each hero slot now carries its own isolated theme payload while the public slider layout stays unchanged
- reshaped the public storefront shell to the requested temp/reference tone with a richer header, search, category rail, footer, product cards, and a heavily tuned hero slider
- added a dedicated mobile hero slider layout with image-first ordering, top-mounted badge and navigation, and smaller mobile-sized text and actions instead of forcing the desktop layout to collapse
- removed the extra workspace and page-hero chrome from the Home Slider admin route so the designer opens directly into the lean ecommerce editing surface
- softened the storefront hero image frame into a more glass-like shell by replacing the harder outer border feel with blur, translucent fill, and diffused highlights
- moved the storefront top category rail to backend-owned category records by seeding `All Items`, removing the static frontend pill, and routing the seeded all-items entry to the unfiltered catalog
- extended the shared framework media browser and picker so every existing media-required form can now choose uploads, library assets, or direct external image URLs
- improved shared core common-module image list rendering to show real thumbnail previews plus compact multi-line storage URLs instead of plain raw paths
- split the storefront top menu and category navigation into dedicated components and added a centered sticky text-only category state for the scrolled header
- reduced the oversized client entry chunk by introducing route-level lazy loading and explicit Vite chunk splitting, which removes the production build warning for the main entry bundle

### [#25] 2026-04-05 - Unified auth surfaces and role-based landing

- consolidated the platform to one login and session system owned by `apps/cxapp`, removing the separate ecommerce customer JWT and browser session flow
- linked ecommerce customer accounts to shared `cxapp` auth users so ecommerce keeps customer profile ownership without duplicating password storage or auth sessions
- routed authenticated users by role from the shared login flow: admins land on `/admin/dashboard`, desk users land on `/dashboard`, and customers land on `/profile`
- guarded admin, desk, and customer portal routes so users are redirected back to their allowed surface instead of staying on the wrong workspace
- updated ecommerce frontend auth to consume the shared `cxapp` session while still reading ecommerce-owned customer profile, order, and checkout APIs
- fixed framework env resolution so process env overrides `.env`, which restores isolated Playwright port wiring and other scripted runtime overrides
- added browser e2e coverage for admin, operator, customer, and billing login flows plus targeted service and route regression coverage

### [#24] 2026-04-04 - Ecommerce storefront rebuild on core masters

- rebuilt `apps/ecommerce` as a live standalone storefront app with app-owned migrations, seeders, schemas, settings, customer accounts, customer sessions, orders, and payment-state handling
- restored public storefront and external customer-commerce APIs through `apps/api`, including landing, catalog, PDP, registration, login, checkout, Razorpay config, payment verification, order tracking, and customer portal routes
- wired ecommerce to shared `core` products and contacts so shared masters stay inside `core` while commerce-specific flows remain inside `ecommerce`
- added storefront landing, catalog, product, cart, checkout, order-tracking, registration, login, account, and order-detail pages under `apps/ecommerce/web`
- introduced neutral commerce presentation components in `apps/ui` for product cards, pricing, order-status badges, and quantity control without moving business logic out of the ecommerce app
- added focused ecommerce service and runtime coverage for storefront reads, customer registration, checkout, payment verification, route registration, and suite composition

### [#23] 2026-04-04 - Ecommerce scaffold reset for clean rebuild

- reset `apps/ecommerce` back to a scaffold-only app boundary by removing live commerce services, schemas, migrations, seeders, table registration, and custom workspace sections while keeping the app registered in the suite
- removed internal ecommerce API route registration and replaced the old public storefront catalog route with a stable scaffold placeholder response under `apps/api`
- moved the shared core product seed baseline off the old ecommerce seed dependency so `core` keeps its own product bootstrap data
- updated the dashboard and workspace composition so ecommerce now renders as a preview shell instead of live catalog, storefront, order, customer, and settings sections
- made the Frappe connector degrade cleanly while ecommerce is scaffolded by blocking item sync into the removed commerce module and keeping purchase receipt sync local to the connector

### [#22] 2026-04-04 - CxApp and core app-owned boundary cleanup

- moved auth, auth-option, bootstrap, company, mailbox, and related persistence ownership from `apps/core` into app-owned `apps/cxapp` services, repositories, migrations, seeders, shared contracts, and database registration
- trimmed `apps/core` back to shared master-data ownership so contacts, products, and common reusable masters remain in `core` while suite auth and company records leave the app
- split internal route ownership so `apps/api` now exposes moved auth, mailbox, bootstrap, company, and runtime-setting surfaces under `/internal/v1/cxapp/*`
- moved public route definitions out of `apps/framework` into `apps/api/src/external/public-routes.ts` so framework stays runtime-only and route transport stays app-owned in `api`
- updated frontend and shared consumers to read moved company and auth contracts from `@cxapp/shared`, including runtime branding and admin-facing auth flows
- registered the new `cxapp` database module in the framework runtime and updated focused tests for database execution, internal route wiring, and auth-service ownership

### [#21] 2026-04-04 - Core shared master expansion and framework admin control center

- replaced the generic core common-module preview screen with module-specific list pages in the shared `CommonList` tone
- added generic internal core common-module create, update, and delete support over the physical shared master tables
- introduced popup upsert flows for core common modules, including lookup-based reference selection for dependent masters such as state, city, pincode, and warehouse records
- reorganized the core desk navigation so shared masters live under a grouped `Common` branch with requested subgroup lanes aligned to the billing-style workspace pattern
- hid the oversized workspace hero on list-first core common-module screens so the resulting layout matches the requested operational list presentation
- added shared `All records`, `Active only`, and `Inactive only` dropdown filters with clear-to-all behavior on status-aware common and billing master lists
- aligned company and contact list, show, and upsert flows with the shared master tone, including row-action menus, destructive dialogs, runtime loading polish, and modular temp-style forms
- added shared UI registry references for row action menus, searchable lookup fields, and common master list pages so the applied patterns now exist in the design-system docs
- introduced primary-company branding fields and content fields, then projected the selected company into the dashboard shell, public topbar or footer brand surfaces, and public brand-profile route output
- added a core-owned shared product domain with schema, service, migrations, seeders, internal API routes, and contact-style list, show, and upsert pages inside the active shell
- expanded product UX with richer attributes, variants, compact media cards, cleaner pricing labels, payload cleanup, and show-page media rendering aligned to the shared form tone
- added a framework-owned shared media foundation with local binary storage, public web-root symlink exposure, internal and public media routes, and focused framework media tests
- introduced a global framework media manager route and sidebar entry, then connected reusable media selection and preview into company logos, product galleries, and variant images
- refined product and media UX with placeholder-row cleanup on save, five-up media browsing, compact equal-width card actions, product-image ordering that starts at `1`, and show-page image cards that match the form tone
- moved company administration and runtime control pages into the shell-level framework navigation, then simplified the sidebar grouping and icon treatment to match the quieter operational core tone
- turned core settings into a real grouped runtime settings editor that reads and writes `.env` values from the frontend, supports restart, and can generate a fresh JWT secret
- added a framework-owned system-update surface with git fetch or hard reset, build, rollback, restart, preflight checks, and persisted operator activity history
- added shell-level user, role, and permission administration with list, show, and upsert flows, plus RBAC linkage backed by the app-owned auth tables and pivot records
- introduced a database-backed auth option catalog and startup settings snapshot so actor type, permission scope, action, app, and resource options are no longer hardcoded in the frontend admin forms

### [#20] 2026-04-02 - Billing account master alignment and support docs

- replaced billing ledger groups with app-owned billing categories, seeded top-level accounting buckets, and mapped billing ledgers to the new category structure
- added billing voucher-group and voucher-type masters, then enforced the strict `category -> ledger -> voucher type` chain alongside `voucher group -> voucher type` classification
- converted billing category, ledger, voucher-group, voucher-type, and voucher-register screens to shared `CommonList`-style popup CRUD flows with autocomplete-based master selection
- reorganized billing sidebar groups, page titles, and workspace support navigation so billing matches the shared UI navigation tone while keeping page-specific breadcrumbs
- added billing support guidance for using categories, ledgers, voucher groups, and voucher types together, and expanded targeted billing service and route coverage for the new model
- added a real sales invoice workflow with persisted item rows, voucher-type-ledger alignment, and GST/double-entry totals derived from the invoice table
- moved sales, purchase, payment, and receipt from popup voucher dialogs into route-based master-list pages with dedicated standalone upsert screens under the billing app shell

### [#19] 2026-03-31 - Physical common module tables

- copied the temp common-module table inventory into the real `core` database contract as 25 explicit shared table names
- added a new app-owned `core` migration that creates one physical table per common module while leaving the legacy JSON-store migration IDs intact for compatibility
- added a new app-owned `core` seeder that populates the physical common tables with shared sample master records used by the current suite
- switched the `core` common-module service from generic JSON-store reads to source-controlled metadata plus direct physical-table queries
- updated the database-process regression test to cover the new migration and seeded common table presence

### [#18] 2026-03-30 - Theme-oriented UI surfaces and loader polish

- expanded the shared UI token layer so primary, secondary, accent, muted, sidebar, chart, preview, auth, and code surfaces respond consistently across light and dark themes
- replaced hardcoded shell and docs gradients with shared theme surface classes across the `ui` workspace, docs pages, auth layouts, previews, and the `cxapp` public shell
- aligned shared slider, separator, and auth block preview surfaces with theme-aware background tokens instead of fixed white fills
- updated the global loader concern so its main center circle and rotating rings derive from active theme tokens rather than separate hardcoded light and dark color paths
- mirrored the active theme surface utilities into the secondary UI stylesheet so future imports do not drift from the current theme system behavior

### [#17] 2026-03-30 - Local database bootstrap and auth hardening

- switched the checked-in local bootstrap to SQLite so the backend host, migrations, seeders, and frontend auth flow start without requiring a local MariaDB instance
- replaced the default seeded admin login with the requested first user `Sundar <sundar@sundar.com>` using password `Kalarani1@@` and explicit super-admin access
- hardened auth user normalization so configured `SUPER_ADMIN_EMAILS` still elevate trusted operators even if the stored row is not flagged
- added faster connection timeouts for MariaDB and PostgreSQL client pools so unavailable network databases fail more clearly during startup
- expanded regression coverage for seeded super-admin bootstrap, seeded login, and normalized super-admin env parsing

### [#16] 2026-03-30 - App-owned frappe connector baseline and ecommerce sync adoption

- moved the temp-derived ERPNext connector contracts into app-owned `apps/frappe/shared`, including settings, todo, item, purchase receipt, and sync-log schemas plus workspace metadata
- added app-owned `frappe` migrations, seeders, seed data, and database-module registration so the connector persists its own settings and snapshot tables through the shared framework database runtime
- implemented `frappe` services for settings save and verification, todo snapshot management, item snapshot management, purchase receipt management, and ecommerce sync orchestration
- exposed protected internal `frappe` routes through `apps/api` and registered them in the shared internal route assembly
- added a narrow app-owned ecommerce product admin write path so Frappe item sync can create and update products without moving product ownership into the connector app
- adapted the connector UI into the shared desk through `apps/frappe/web` and `apps/cxapp/web`, with overview, connection, todo, item, and purchase receipt workspace sections
- added connector coverage for route registration, database registration, settings save, item sync, and purchase receipt sync

### [#37] 2026-04-07 - Framework backup and security review operations

- added framework-owned database backup and security review contracts, persistence tables, scheduler wiring, and protected internal operations routes
- added dedicated framework admin pages for `Data Backup` and `Security Review` with tabbed controls, restore drill actions, runtime-setting-backed backup automation, and OWASP-style checklist evidence capture
- registered both pages in the framework settings routes, sidebar navigation, desk metadata, runtime fallback catalog, and admin e2e coverage

### [#15] 2026-03-30 - App-owned auth, sessions, mailbox, and cxapp auth flows

- added reusable framework auth primitives for JSON request parsing, runtime config access, application error handling, password hashing, JWT signing, and SMTP delivery without moving auth business ownership into framework
- created app-owned `core` auth and mailbox schemas, migrations, and seeders for users, roles, permissions, sessions, OTP verifications, mailbox templates, and outbound message logs
- implemented `core` repositories and services for login, registration OTP, password reset, account recovery, bearer-session validation, mailbox template management, and message delivery/history
- exposed external auth routes and protected internal auth/mailbox routes through `apps/api`, then applied bearer-auth protection to the existing internal `core` and `ecommerce` workspace data routes
- connected `cxapp` auth pages and browser session persistence to the live auth API so login, request-access registration, forgot-password, recovery, and logout are end-to-end instead of local-only UI placeholders
- fixed framework env resolution so test-specific environment values win over local `.env` overrides and validation is stable across machines
- added auth lifecycle coverage that verifies seeded login, OTP registration, password reset, account recovery, customer-role OTP handling, and session revocation against the real database-backed services

### [#14] 2026-03-30 - App-owned core and ecommerce database migrations and seeders

- added a framework-owned migration and seeder execution runtime that discovers app-owned database modules and records applied work in system ledger tables
- created individual `core` migration files and individual `core` seeder files under `apps/core/database/*` for bootstrap, companies, contacts, and common modules
- created individual `ecommerce` migration files and individual `ecommerce` seeder files under `apps/ecommerce/database/*` for pricing settings, products, storefront, orders, and customers
- added server-side app database module entry points and a CLI database helper so the registered migrations and seeders are reachable through one consistent workflow
- switched `core` and `ecommerce` services and routes from direct in-memory seed reads to seeded database reads
- prepared registered migrations and seeders on framework server startup so live routes and workspace pages read migrated and seeded data
- added runtime tests that verify registry order, migration execution, seeder execution, and DB-backed service reads for the current `core` and `ecommerce` baseline

### [#13] 2026-03-30 - Core backend wiring and ecommerce go-live seed baseline

- audited the imported `temp/core` and `temp/ecommerce` trees against the current app ownership boundaries before copying anything
- moved the first shared-contract slice from `temp/core` into `apps/core/shared` as app-owned workspace metadata, shared module definitions, and shared Zod schemas
- extended the current HTTP route context once so app-native route handlers can read request data and runtime resources without importing the foreign temp runtime
- added app-native `core` backend services and internal routes for bootstrap, companies, contacts, and common module registries
- moved the ecommerce shared contracts into `apps/ecommerce/shared` and added app-native services for catalog, storefront, orders, customers, and pricing settings
- adapted both `core` and `ecommerce` workspace sections to the current `/dashboard/apps/<app>/*` route structure and rendered them inside the shared `cxapp` desk
- exposed a public storefront catalog route and updated local dev proxying so the live workspace can preview public commerce data through the current server
- kept the current go-live baseline honest by using explicit seed-backed backend data until app-owned database migrations and write flows land

### [#12] 2026-03-30 - UI docs catalog expansion and imported component registry

- imported the copied UI component demo set from `temp` into `apps/ui` as a docs-owned registry
- added missing shared UI primitives plus lightweight Next compatibility shims required by the imported demos
- expanded the docs catalog, overview cards, and side navigation to surface the imported component groups
- added a templates section to the docs workspace so component docs and template metadata now live in one UI app surface
- added a source-controlled design-system governance layer for project default component names, default variants, reusable blocks, and application build-readiness coverage
- extracted project component defaults into a dedicated design-system defaults file and pointed AI workflow guidance at that source of truth
- moved the imported variant source out of docs-owned paths into a reusable `component-registry` feature so future projects can consume the same structure without docs coupling
- renamed the imported registry ownership to `variants`, added a reusable `blocks` channel, and seeded it with login page block variants
- updated validation and lint scope so the imported docs registry can coexist with the existing shared system

### [#11] 2026-03-29 - CLI GitHub helper baseline

- added a dedicated interactive GitHub helper under `apps/cli` for commit, pull-rebase, and push flow
- exposed the helper through `npm run github` and `npm run github:server`
- added helper tests for git status parsing, ahead/behind parsing, and push-target selection
- updated ASSIST docs so CLI operational guidance matches the live repository

### [#10] 2026-03-29 - ASSIST reconciliation and framework baseline layers

- reconciled ASSIST docs with the live `apps/` tree, current commands, and active shared UI state
- removed stale references to non-existent `githelper`, `version:bump`, and `Test/` workflows
- documented the current `cxapp` auth shell and `ui` design-system docs surface
- added a framework-owned machine-readable workspace and host baseline and exposed it through the internal API boundary
- started `Plan-4` with ordered framework database foundation sections and matching platform migration-section metadata
- implemented the first `Plan-5` HTTP slice with route manifest helpers, canonical `v1` internal and external routes, a public bootstrap route, and legacy path compatibility

### [#9] 2026-03-29 - CxApp isolated workspace baseline

- promoted `apps/cxapp` into the active frontend and server wrapper while keeping framework reusable underneath
- normalized every app to `src`, `web`, `database`, `helper`, and `shared`
- added workspace metadata to manifests and root tests for structure validation
- constrained the active shared UI package to the real design-system surface

### [#8] 2026-03-29 - Framework-first suite scaffolds and API split

- made `apps/framework` the active reusable runtime and composition root
- added DI-based app registration, app-suite manifests, and internal/external API route partitioning
- scaffolded standalone app roots for `core`, `api`, `site`, `billing`, `ecommerce`, `task`, `frappe`, `tally`, and `cli`
- expanded the framework runtime for MariaDB-first configuration, optional offline SQLite, and future analytics PostgreSQL

### [#1] 2026-03-29 - Repository initialization

- initialized the repository and the first ASSIST documentation baseline

### [#55] 2026-04-07 - Customer verification and payment reporting exports

- completed ecommerce customer email verification with OTP-gated storefront registration, verified-email state, and suspicious-login review handling in the admin customer operations surface
- extended auth OTP registration to support customer actor flows without duplicating the existing verification system
- added finance-facing ecommerce payment exports for daily payment summary and failed-payment reporting, both downloadable from the existing admin payments operations screen
- added backend CSV export routes, typed document contracts, and targeted service plus route coverage for the new reporting and customer-security flows
