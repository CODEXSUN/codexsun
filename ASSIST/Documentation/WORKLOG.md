# Work Log

## Done Till Here

### `#72` 2026-04-08

- completed billing Stage `B10`, including purchase-to-stock bridge, sales-linked stock reduction, stock adjustment workflow, landed-cost handling, and stock valuation reporting
- synchronized posted billing inventory documents into shared `core` product stock movement while keeping valuation and warehouse-position reporting inside billing
- validated the batch with `npm run typecheck` and `npx.cmd tsx --test tests/billing/voucher-service.test.ts tests/billing/reporting-service.test.ts tests/api/internal/routes.test.ts`

### `#81` 2026-04-08

- completed Stage `4.3.4` by moving storefront homepage rail deferral and fallback rules into a shared performance-standards layer
- kept the homepage implementation aligned to those standards and revalidated it against the production-like storefront performance gate
- validated the batch with `npm.cmd run typecheck` and `npm.cmd run test:e2e:performance`

### `#80` 2026-04-08

- completed Stage `4.3.3` by deferring heavy below-the-fold homepage sections behind an intersection-aware storefront wrapper and lazy-loaded block imports
- kept above-the-fold storefront hero and announcement behavior immediate while narrowing the initial homepage render path for featured, category, promo, and merchandising rails
- validated the batch with `npm.cmd run typecheck` and `npm.cmd run test:e2e:performance`

### `#79` 2026-04-08

- completed Stage `4.3.2` by normalizing storefront image delivery through a shared image component with explicit intrinsic dimensions and consistent fallback handling
- updated the hero, category menu, product cards, and product gallery to use the shared image path so eager and lazy loading behavior is clearer and more consistent across the main storefront surfaces
- validated the batch with `npm.cmd run typecheck` and `npm.cmd run test:e2e:performance`

### `#78` 2026-04-08

- completed Stage `4.3.1` by adding a production-like Playwright storefront performance budget gate across home, catalog, and product routes
- introduced a reusable vitals-capture helper and a dedicated package script so performance checks are runnable now and ready for later CI workflow wiring
- validated the batch with `npm.cmd run typecheck` and `npm.cmd run test:e2e:performance`

### `#77` 2026-04-08

- completed Stage `4.2.3` by making storefront publish and rollback operations approval-gated instead of inheriting directly from draft-edit access
- introduced a dedicated storefront approval permission, assigned it to ecommerce-admin authority, and updated designer messaging so draft-only roles are clearly separated from live publishing roles
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/api/internal/routes.test.ts`

### `#76` 2026-04-08

- completed Stage `4.2.2` by exposing derived storefront version history from immutable revision snapshots for the main settings document and key editor scopes
- added recent version visibility to the storefront settings and home-slider designer screens so operators can see current live state and prior saved versions without leaving the workspace
- validated the batch with `npm.cmd run typecheck`, `npx.cmd tsx --test tests/ecommerce/services.test.ts`, and `npx.cmd tsx --test tests/api/internal/routes.test.ts`

### `#75` 2026-04-08

- completed Stage `4.2.1` by separating storefront designer draft saves from the live storefront settings record and adding explicit publish plus rollback workflow endpoints
- updated the main storefront settings workspace to show draft-vs-live state, publish live changes, and rollback from immutable live revision snapshots
- validated the batch with `npm.cmd run typecheck`, `npx.cmd tsx --test tests/ecommerce/services.test.ts`, and `npx.cmd tsx --test tests/api/internal/routes.test.ts`

### `#74` 2026-04-08

- completed Stage `4.1.4` by adding automatic pre-save storefront settings revisions so direct-live designer saves no longer destroy rollback context
- fixed storefront settings timestamp hydration so persisted live settings keep their real `createdAt` and `updatedAt` values across reads and successive saves
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts`

### `#73` 2026-04-08

- completed Stage `4.1.3` by introducing explicit storefront designer view and edit permissions into the ecommerce role baseline
- enforced the split across internal ecommerce routes and the main storefront editor surfaces so read-only roles can review but not save designer changes
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/api/internal/routes.test.ts`

### `#72` 2026-04-08

- completed Stage `4.1.2` by adding shared server-side validation for editable storefront links and media references inside the ecommerce schema layer
- kept the existing client-side designer checks as the usability layer, while making persisted storefront settings reject unsafe or malformed bypass payloads
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts`

### `#71` 2026-04-08

- completed Stage `4.1.1` by adding a shared validation helper and validation summary card across the main editable storefront block designers
- blocked invalid saves for homepage and merchandising block editors while preserving the live preview and seeded-default behavior already in place
- validated the batch with `npm.cmd run typecheck`

### `#70` 2026-04-08

- completed Stage `3.3.4` by adding an ecommerce accounting-compatibility report for invoice and GST workflow review
- exposed the report through protected internal routes and the existing payments operations workspace so finance operators can see blocked, manual-review, and ready orders
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### `#69` 2026-04-08

- completed Stage `3.3.3` by adding a GST review snapshot to storefront orders and customer receipt output
- derived taxable value and GST components from product tax ids plus seller-state versus customer-state comparison, while preserving legacy-order storage compatibility
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### `#67` 2026-04-08

- completed billing Stage `B1` through Stage `B3` plus Stage `B4.1`, covering posting integrity, normalized voucher storage, immutable ledger entries, posted-entry-driven reporting, note documents, and the first general ledger report
- added first-class credit note and debit note workflows with source-document linkage, GST-aware adjustment treatment, and explicit note register and detail pages in the billing workspace
- validated the billing batch with `npm run typecheck` and `npx.cmd tsx --test tests/billing/voucher-service.test.ts tests/billing/reporting-service.test.ts tests/api/internal/routes.test.ts`

### `#68` 2026-04-08

- completed Stage `3.3.2` by adding storefront shipping zones with destination matching, surcharge and ETA adjustments, and derived COD eligibility rules
- wired checkout pricing and order creation to resolve and snapshot the matched zone alongside the selected delivery method, while keeping cart estimates generic before address selection
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### `#67` 2026-04-08

- completed Stage `3.3.1` by adding an ecommerce-owned shipping-method catalog to storefront settings with courier, SLA, ETA, and COD-eligibility metadata
- wired checkout pricing and order creation to the selected active method, and snapshotted the chosen delivery method onto persisted storefront orders for later operations review
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### `#66` 2026-04-08

- completed Stage `3.2.4` by documenting ERPNext price-list compatibility for a future ERP-owned storefront pricing model
- recorded that ERP item-price and price-list selection must complete inside `frappe` projection flow and persist normalized effective pricing into `core` before `ecommerce` reads it, while preserving current `sellingPrice`, `mrp`, and `basePrice` semantics
- validated the decision batch with architecture and planning consistency review across the current `core`, `ecommerce`, and `frappe` pricing boundaries

### `#65` 2026-04-08

- completed Stage `3.2.3` by defining the future promotion engine scope and phased rollout for the storefront commerce stack
- recorded the current Phase A baseline as `core` price authority plus ecommerce-owned customer coupons, kept campaign and coupon-banner and gift-corner and promo-copy surfaces presentation-only, and deferred rule-driven promotions and segmented pricing to later phases
- validated the decision batch with architecture, planning, and current pricing-coupon-merchandising code-path review across the `core`, `ecommerce`, and `frappe` boundaries

### `#64` 2026-04-08

- completed Stage `3.2.2` by adding checkout coupon validation, expiry handling, and usage constraints backed by ecommerce-owned customer portal coupon state
- extended customer and order contracts with coupon lifecycle metadata, enforced reserve, consume, and release behavior through checkout and payment flows, and added a signed-in checkout coupon input on the storefront page
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### `#63` 2026-04-08

- completed Stage `3.2.1` by deciding that `apps/core` remains the current authoritative source for storefront sell price and compare-at price
- aligned architecture and go-live planning so `apps/ecommerce` reads effective pricing from active `core` price rows using `sellingPrice` and `mrp`, with `basePrice` only as fallback when no active row exists
- validated the decision batch with architecture, planning, and storefront pricing code-path review across the current `core`, `ecommerce`, and `frappe` boundaries

### `#62` 2026-04-08

- completed Stage `3.1.4` by defining warehouse and stock visibility rules for the current storefront availability model
- recorded that storefront availability stays aggregated across active `core` stock rows, warehouse-level stock remains internal to operations, and store pickup still consumes the same shared sellable pool as delivery orders
- validated the batch with architecture, planning, pickup-flow, and storefront availability code-path review across the current `core` and `ecommerce` boundaries

### `#61` 2026-04-08

- completed Stage `3.1.3` by adding stock reservation when a new storefront order enters `payment_pending`
- extended storefront orders with explicit stock-reservation metadata, reserved `core` stock rows during checkout, and released those holds on pending-payment failure, admin cancellation, or expiry while rejecting late payment capture after release
- validated the batch with `npm.cmd run typecheck`, `npx.cmd tsx --test tests/ecommerce/services.test.ts`, and `npx.cmd tsx --test tests/api/internal/routes.test.ts`

### `#60` 2026-04-08

- completed Stage `3.1.2` by defining low-stock and oversell-prevention rules for the current storefront stock model
- recorded sellable quantity as active stock minus reserved quantity, set low stock to quantities `1` through `5`, treated `0` as out of stock, and kept cart and PDP stock indicators advisory until checkout revalidation
- documented that `payment_pending` still does not create a new stock hold, leaving reservation implementation for Stage `3.1.3`, then validated the batch with architecture, planning, and checkout code-path review

### `#59` 2026-04-08

- completed Stage `3.1.1` by deciding that `apps/core` remains the current authoritative source for sellable storefront stock
- aligned architecture and go-live planning so `apps/ecommerce` reads stock only from `core`, while future ERPNext stock must enter through `apps/frappe` snapshot sync projected into `core`
- validated the decision batch with architecture, planning, and runtime code-path consistency review across the current `core`, `ecommerce`, and `frappe` boundaries

### `#54` 2026-04-07

- completed Stage `2.3.4` by adding ecommerce customer lifecycle states, admin customer operations, and portal-access enforcement for blocked, deleted, and anonymized accounts
- added customer lifecycle contracts, ecommerce customer report and action routes, a dedicated storefront customer admin screen, and synced auth-session revocation and identity anonymization behavior
- validated the lifecycle slice with `npm run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### `#53` 2026-04-07

- completed Stage `2.3.3` by adding auth-user lockout state, failed-login tracking, stale admin-session timeout enforcement, and audit-log writes for login or session rejection events
- added cxapp auth migration `15-auth-hardening`, repository support for failed-login counters and forced session revocation, and auth-service enforcement for lockout, idle timeout, and disabled-account session rejection
- validated the hardening slice with `npm run typecheck` and `npx.cmd tsx --test tests/core/auth-service.test.ts tests/api/internal/routes.test.ts tests/framework/runtime/database-process.test.ts`

### `#51` 2026-04-07

- completed Stage `2.3.2` by adding permission-aware internal session enforcement and mapping ecommerce route groups to the new ecommerce permission keys
- updated ecommerce internal API routes so storefront editor, orders, support, payments, and communications operations now require the matching seeded permissions instead of broad actor-type-only access
- validated the enforcement baseline with `npm run typecheck` and `npx.cmd tsx --test tests/api/internal/routes.test.ts`

### `#50` 2026-04-07

- completed Stage `2.3.1` by defining the ecommerce operator roles in shared auth seed data without changing the current dashboard surface model
- added ecommerce-specific permission keys covering workspace, storefront, catalog, orders, support, payments, communications, and analytics as the baseline for later enforcement
- validated the role baseline with `npm run typecheck` and `npx.cmd tsx --test tests/api/internal/routes.test.ts`

### `#49` 2026-04-07

- completed Stage `2.2.5` by exposing customer-safe communication history from mailbox activity into the storefront portal
- added an authenticated external communications route, frontend API support, order-detail communication history, and a recent-communications block in the portal support area
- added targeted tests proving route exposure and customer ownership filtering for communication history
- validated the batch with `npm run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/framework/runtime/http-routes.test.ts`

### `#48` 2026-04-07

- completed Stage `2.2.2` by adding storefront order-linked return and cancellation requests with customer portal entry, admin review controls, and request queue visibility in ecommerce operations
- completed Stage `2.2.3` by adding direct customer support-case creation from the portal order-detail page, with automatic order linkage and same-page visibility of support cases for that order
- completed Stage `2.2.4` by adding reorder actions on portal order list and order detail pages, plus a bulk wishlist-to-cart utility routed through the shared storefront cart store
- validated the batch with `npm run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts tests/framework/runtime/http-routes.test.ts`

### `#47` 2026-04-07

- completed Stage `2.1.5` by adding storefront support cases with customer portal creation, admin queue visibility, order linkage, and status progression
- added ecommerce-owned support-case storage, external customer support-case routes, internal support queue and update routes, plus a dedicated ecommerce `Support` admin workspace screen
- completed Stage `2.2.1` by adding authenticated receipt downloads in the customer portal order list and full order detail view
- validated the batch with `npm run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts tests/framework/runtime/http-routes.test.ts`

### `#46` 2026-04-07

- completed Stage `2.1.4` by extending the ecommerce payments operations surface with a refund queue and refund-status controls
- added shared refund queue reporting, protected admin refund-status updates, and storefront admin client support for refund request and refund queue actions
- extracted a reusable admin order operations dialog so both the orders and payments screens open the same order detail and lifecycle controls
- validated the refund queue baseline with `npm run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### `#44` 2026-04-07

- completed Stage `2.1.2` by adding actionable admin order detail operations on top of the ecommerce order queue
- extended storefront orders with shipment metadata, added internal admin order-detail and order-action endpoints, and wired the admin queue with a detail dialog for cancel, fulfilment, shipment, delivery, and resend operations
- updated demo seeded orders for shipment compatibility and validated the batch with `npm run typecheck` plus `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### `#43` 2026-04-07

- completed Stage `2.1.1` by turning the ecommerce admin orders area into a real operations queue instead of a static lifecycle summary
- added a typed ecommerce orders report, derived queue buckets from live order status and payment state, and exposed the report through a protected internal ecommerce API route
- added a searchable, contained-tab admin queue for action-required, fulfilment, shipment, pickup, completed, and closed orders
- validated the order queue baseline with `npm run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### `#42` 2026-04-07

- completed Stage `1.6.5` by adding a fixed mobile device-matrix audit for the core storefront flows
- covered homepage, catalog, PDP, cart, checkout handoff, and tracking in one Playwright spec, with a shared assertion that rejects horizontal viewport overflow
- validated the responsive baseline with `npm run test:e2e -- tests/e2e/storefront-mobile-matrix.spec.ts`

### `#41` 2026-04-07

- completed Stage `1.6.4` by fixing the highest-impact storefront accessibility issues across homepage, catalog, PDP, cart, checkout, and tracking
- added a shared skip link in the storefront shell, improved explicit control names for hero-slider, PDP gallery, cart removal, and storefront search interactions, and tightened visible label wiring on the tracking form
- validated the accessibility pass with `npm run typecheck` and `npm run test:e2e -- tests/e2e/storefront-accessibility.spec.ts`

### `#40` 2026-04-07

- completed Stage `1.6.3` by extending the storefront metadata baseline into canonical-path helpers, canonical link tags, Open Graph tags, robots meta handling, and public crawl endpoints
- added runtime-backed `robots.txt` and `sitemap.xml` public routes that use framework frontend-domain settings, storefront target normalization, legal-page routes, and active product slugs
- validated the SEO crawl baseline with `npm run typecheck` and `npx.cmd tsx --test tests/framework/runtime/http-routes.test.ts tests/ecommerce/storefront-metadata.test.ts tests/ecommerce/storefront-seo-service.test.ts`

### `#39` 2026-04-07

- completed Stage `1.6.2` with a shared storefront route-metadata resolver plus a browser-side metadata controller hooked into router location changes
- covered root storefront routes and `/shop/*` storefront routes with the same title and description behavior, while restoring the previous document metadata outside storefront pages
- validated the metadata slice with `npm run typecheck` and `npx.cmd tsx --test tests/ecommerce/storefront-metadata.test.ts`

### `#38` 2026-04-07

- completed Stage `1.6.1` by adding backend-seeded storefront legal and trust pages for shipping, returns, privacy, terms, and contact
- exposed the legal-page data through a public ecommerce route, frontend API method, query key, storefront route helpers, and a reusable storefront legal-page surface under both root and `/shop/*`
- updated footer trade links so the new trust pages are discoverable from the live storefront immediately
- validated the slice with `npm run typecheck` and `npx.cmd tsx --test tests/framework/runtime/http-routes.test.ts tests/ecommerce/services.test.ts`
- initiated Stage `1.6.2` by recording the route-level metadata follow-up in planning for the next storefront production batch

### `#37` 2026-04-07

- completed the remaining Stage `1.2` reliability tasks by adding stable storefront order-confirmation and tracking coverage, formalizing the ecommerce order state machine, and enforcing idempotent duplicate-submit and payment-verify behavior
- updated storefront order storage normalization, payment verification flow, and order-detail status rendering so the storefront now uses explicit `created`, `payment_pending`, `paid`, `fulfilment_pending`, `shipped`, `delivered`, `cancelled`, and `refunded` states
- added grouped product specification payloads to the storefront PDP from live core product data and introduced a reusable accordion plus right-side specification drawer on the product page
- simplified the product specification drawer into a narrow key-value sheet, widened it slightly for comfort, pushed the floating contact button behind overlay surfaces, and removed the layout jump on drawer open or close with shared scrollbar-gutter handling
- validated the batch with `npm run typecheck`, `npx.cmd tsx --test tests/ecommerce/services.test.ts`, and `npm run test:e2e -- tests/e2e/storefront-checkout.spec.ts tests/e2e/storefront-order-flow.spec.ts`

### `#36` 2026-04-07

- added storefront pickup support through ecommerce-owned settings, checkout flow updates, order fields, order-detail display, and a dedicated pickup designer route in the ecommerce admin
- finished checkout address reliability work for guest and authenticated users with shared country/state/district/city/postal-code lookup selection and incomplete-address repair from checkout
- added explicit live payment recovery in checkout so Razorpay modal dismiss and verification failure can reopen or retry the same pending payment instead of creating duplicate orders
- added stable Playwright coverage for guest checkout, authenticated checkout, live modal close recovery, and live verification-failure retry, then marked `1.2.2` and `1.2.3` complete in `TASK.md`

### `#35` 2026-04-07

- completed Phase 1 Stage 1.1 of the ecommerce go-live schedule as a planning block
- added `ASSIST/Planning/phase-1-stage-1-1-release-baseline.md` with the freeze rule, production environment model, domain and SSL baseline, environment ownership, cutover checklist, ownership confirmation, and ordered P0 issue list
- updated `TASK.md` so Stage 1.1 is marked complete and linked to the new release-baseline document

### `#34` 2026-04-07

- replaced `ASSIST/Execution/TASK.md` with the full numbered execution schedule derived from `plan-9`
- organized the ecommerce go-live program into phase, stage, and checkbox order from stabilization through ERP bridge and final release gate
- updated ASSIST planning and documentation so the task sheet now acts as the working delivery schedule for future ecommerce batches

### `#33` 2026-04-07

- added and refined ecommerce storefront content blocks and designers for footer, floating contact, coupon banner, gift corner, trending, branding, and campaign or trust management, together with supporting shared UI block surfaces
- expanded ecommerce admin routing and side-menu coverage for the new storefront designers, and tightened storefront shell data caching or horizontal-rail behavior for better runtime scaling
- moved billing voucher entry further onto the shared inline editable grid path with product-driven lookup behavior and tighter operational table handling
- updated storefront e2e coverage to the current checkout, order success, and tracking flows while documenting the remaining stability gaps
- reviewed the current ecommerce storefront, checkout, admin, customer-portal, payment, and frappe connector boundaries against production go-live readiness
- defined a repo-specific ecommerce production blueprint covering storefront performance, backend commerce operations, user and role management, customer and admin portals, payments, inventory, shipping, tax, security, and observability
- mapped phased ERPNext support so `apps/frappe` remains the connector boundary while future projections and transactional bridge work can expand safely into `core` and `ecommerce`
- created `ASSIST/Planning/plan-9.md` as the execution-ready go-live plan for the next ecommerce release waves

### `#32` 2026-04-06

- connected storefront Razorpay checkout more directly, removed the extra test payment screen, and carried the required checkout metadata through ecommerce runtime config and services
- refined storefront UX across fixed header or category navigation, announcement overflow handling, promo CTA styling, mobile hero layout, CTA placement, and dock hover containment
- added framework mail pages, mailbox persistence wiring, and related auth or shell updates inside `cxapp`
- added supporting ecommerce shipping, storefront order, and admin workflow updates alongside container deployment asset changes under `.container/`
- updated ASSIST task tracking, planning, and changelog for the current batch

### `#22` 2026-04-04

- cleaned app ownership between `cxapp`, `framework`, and `core`
- moved auth, bootstrap, company, mailbox, and related suite state into `cxapp`
- reduced `core` to shared masters and reusable common modules

### `#23` 2026-04-04

- reset `ecommerce` to a scaffold-only boundary so it could be rebuilt cleanly

### `#24` 2026-04-04

- rebuilt `ecommerce` as a live storefront app on top of shared `core` products and contacts
- added landing, catalog, PDP, cart, checkout, tracking, registration, portal, orders, and Razorpay-ready checkout flows
- added ecommerce admin workspace sections and shared commerce UI primitives
- introduced frontend surface switching for `site`, `shop`, and `app`
- normalized public and admin route shapes such as `/admin/dashboard` and `/profile`

### `#25` 2026-04-05

- consolidated the platform to one login and session system owned by `cxapp`
- removed the separate ecommerce customer JWT and browser session flow
- linked ecommerce customer accounts to shared `cxapp` auth users
- routed login by role: admin -> `/admin/dashboard`, desk user -> `/dashboard`, customer -> `/profile`
- blocked customers from staying on desk routes and blocked desk users from staying on customer-only portal routes
- fixed env precedence so process env overrides `.env`, which makes isolated Playwright server ports reliable again
- added browser e2e coverage for admin, operator, customer, and billing login flows

### `#26` 2026-04-05

- added frontend home switching for `site`, `shop`, and `app`, then normalized public, admin, and customer route shapes around `/admin/dashboard`, `/dashboard`, and `/profile`
- rebuilt ecommerce admin navigation so products and shared product masters from `core` stay inside the ecommerce workspace instead of switching the sidebar to `core`
- connected ecommerce storefront settings to a real backend settings service and hardened partial saves against legacy rows and missing nested objects
- added a dedicated ecommerce-owned Home Slider designer, backend route, and persisted theme settings for hero gradients, buttons, navigation, and frame styling
- evolved the Home Slider admin into a multi-slide list so each storefront hero slot can keep its own isolated theme settings
- reshaped the storefront shell to the requested temp/reference tone with a richer top menu, search, category rail, footer, product cards, and multiple hero-slider iterations
- added a dedicated mobile hero slider with image-first ordering, top-mounted badge and chevrons, and mobile-sized typography and actions
- removed extra workspace and page hero chrome from the Home Slider route so the editor opens directly into the settings surface
- softened the storefront hero image frame toward a glass-like shell with blur and diffused spread instead of a hard border line
- split the main frontend entry into route-level chunks so production build no longer warns about the oversized initial bundle
- moved the storefront top category rail off a hardcoded frontend `All Products` item and onto backend-seeded `All Items` plus backend-controlled top-menu visibility
- extended the shared framework media picker so existing image fields can now use uploads, library assets, or direct external URLs from one flow
- improved shared core common-module image fields so list rows render a thumbnail preview and compact multi-line URL text instead of only the raw media path
- split storefront header concerns into dedicated top-menu and category-menu components, then added a centered sticky scrolled text-only category state with compact motion styling

### `#27` 2026-04-05

- added the app-owned `demo` application with protected internal routes, module-specific demo-data installers, live install progress, and summary/count pages for sample operational data
- introduced TanStack Query as the shared server-state layer and migrated storefront shell data, runtime app settings, branding, and demo installer polling onto it
- added Zustand only for lightweight shell/session and storefront coordination state without forcing a global reducer model across the repo
- improved storefront first paint with skeletons, eager hero media, lazy catalog/category/product images, and cleaner loading order on slower networks
- added a shared two-line toast system with runtime-configurable placement/tone, design-system docs coverage, and integration into admin save/install flows
- integrated a shared Tiptap editor with icon toolbar support and design-system docs coverage in the `ui` app
- moved storefront search, featured-card, and category-card surfaces into reusable shared `ui` blocks and shared UX components used by both docs and live ecommerce admin/front-end pages
- extended ecommerce storefront settings so featured and category sections have saved row counts, rows to show, card designers, toggles, and synced frontend rendering after save
- fixed storefront sync gaps so admin saves refresh the public storefront shell consistently, including announcement styling and featured/category layout updates
- tightened media-browser overflow so upload/filter controls remain visible while large media grids and edit dialogs scroll cleanly on smaller screens

### `#28` 2026-04-05

- added separate product bulk-edit actions for merchandising fields and product duplication with safe `-copy` naming without disturbing the existing single-product editor
- extended product, contact, and product-category list screens with richer operational filters for merchandising state, data completeness, and catalog placement
- refactored the framework media browser into animated tabs with contained preview layouts so forms stay visible while large image sets scroll inside the modal
- forward-hydrated new product summary fields such as `attributeCount` and `totalStockQuantity` across seed data, core product reads, and ecommerce storefront reads so older persisted rows no longer break requests
- stabilized the local backend host by fixing the startup crash caused by stale product seed payloads and re-verifying the framework health endpoint after restart
- fixed storefront runtime payload generation so `/public/v1/storefront/home` can render legacy products again without `400` schema failures

### `#29` 2026-04-06

- moved the customer portal to canonical `/customer/*` routes and isolated the customer shell from admin and desk navigation so customer users only see customer-safe surfaces
- rebuilt the customer profile page into customer-safe contact-style tabs for details, communication, addressing, and finance, while keeping shared lookups and customer-only field exposure
- refined the customer portal shell, sidebar, overview cards, and wishlist presentation to match the shared dashboard tone without leaking admin controls or app switching
- hardened widened customer/contact hydration paths so older stored records with missing nested arrays no longer break relogin or customer profile reads
- added shared storefront wishlist storage, synced guest wishlist intent after login, and connected the storefront home, catalog, product, and header surfaces to the same persisted customer-portal wishlist flow

- completed Stage `1.5.5` with framework-owned backup cadence controls, local backup retention under `storage/backups/database`, restore drill execution, and optional Google Drive upload setup
- completed Stage `1.5.7` with a framework security review ledger, OWASP-style checklist items, review evidence capture, and signoff history
- added dedicated admin pages and side-menu entries for `Data Backup` and `Security Review`, then validated them with typecheck, backend tests, and Playwright e2e

### `#31` 2026-04-06

- added a reusable shared inline editable table block under `apps/ui` with mixed in-cell editing for text, quantity, calendar date, state lookup, city lookup, notes, and publish toggles
- registered the editable grid as a new `table-12` design-system variant inside the shared docs catalog and component-variant metadata
- added a dedicated data block entry so the UI workspace side menu now exposes the editable table as a reusable block preview
- updated ASSIST task tracking, planning, and changelog for the new shared UI batch

### `#55` 2026-04-07

- completed Stage `2.3.5` by adding customer email verification state, storefront OTP registration flow, suspicious-login review state, and admin customer security review actions
- completed Stage `2.4.1` by adding daily payment summary CSV export to the ecommerce payments operations screen
- completed Stage `2.4.2` by adding failed-payment CSV export to the same payments operations screen
- validated the batch with `npm run typecheck` and targeted `tsx` tests for ecommerce services and internal routes

### `#56` 2026-04-08

- completed Stage `2.4.3` by adding refund and settlement-gap CSV exports to the ecommerce payments operations screen
- extended the shared ecommerce payment reporting contract, added protected internal export routes, and wired frontend API download helpers for both new reports
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### `#57` 2026-04-08

- completed Stage `2.4.4` by adding fulfilment-aging and refund-aging operational reports to the ecommerce payments operations screen
- extended the shared reporting contract with aging items and age-band summaries, exposed a protected internal aging-report route, and added frontend aging views for fulfilment and refund drill-down
- prevented active refund work from showing in both fulfillment and refund aging at the same time, then validated with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### `#58` 2026-04-08

- completed Stage `2.4.5` by adding ecommerce overview KPIs for conversion, AOV, order count, paid vs failed, fulfilment aging, and refund aging
- added an ecommerce-owned overview KPI report and protected internal route for analytics readers, then replaced the static overview cards with live dashboard metrics and operations drill-down links
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### `#73` 2026-04-08

- completed billing Stage `B11` with approval policy enforcement, finance roles, accounting dimensions, exception reporting, and dashboard KPIs
- completed billing Stage `B12` with month-end checklist, year-close workflow, opening-balance rollover, audit-trail review, and year-end control policy surfaces
- validated the billing controls batch with `npm run typecheck` and `npx.cmd tsx --test tests/billing/voucher-service.test.ts tests/billing/reporting-service.test.ts tests/api/internal/routes.test.ts`
