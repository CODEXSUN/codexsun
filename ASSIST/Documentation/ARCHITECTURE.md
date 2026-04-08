# Architecture

## Purpose

This file is the single source of truth for Codexsun platform architecture.

If another ASSIST file conflicts with this file, this file wins.

## Platform Goal

Codexsun is a reusable ERP and business software platform that should support:

1. billing-only products
2. commerce-led products
3. ERP-style combined suites
4. connector-led deployments
5. future desktop and offline clients

## App Roots

Current app roots under `apps/`:

1. `framework`
2. `cxapp`
3. `core`
4. `api`
5. `site`
6. `ui`
7. `billing`
8. `ecommerce`
9. `demo`
10. `task`
11. `frappe`
12. `tally`
13. `cli`

## Standard App Shape

Every app must keep the same baseline shape:

```text
apps/<app>/
  src/
  web/
  database/
    migration/
    seeder/
  helper/
  shared/
```

Rules:

1. `src` is the backend and composition surface
2. `web` is the frontend surface
3. `database/migration` is for app-owned migration files or tracked placeholders
4. `database/seeder` is for app-owned seeders or tracked placeholders
5. `helper` is for app-local helper exports
6. `shared` is for app-local shared contracts and workspace metadata

## Ownership Model

### Framework

`apps/framework` owns:

1. DI and composition
2. environment config
3. database runtime and driver switching
4. HTTP host and route assembly
5. reusable platform contracts
6. app suite registration
7. machine-readable workspace and host baseline metadata
8. reusable auth/runtime primitives such as hashing, JWT signing, SMTP transport, and request parsing

Framework must remain business-agnostic.

### CxApp

`apps/cxapp` is the main suite-facing application.

CxApp owns:

1. the active frontend entry app
2. the active server entry wrapper
3. the suite-facing shell and layouts
4. the routed auth pages and shell handoff
5. the operator-facing interface for composed apps
6. browser-side auth session persistence for the active suite shell
7. app-owned auth, sessions, roles, permissions, mailbox, bootstrap, company profile, and runtime app settings for the active suite shell

Framework remains underneath CxApp as the reusable runtime.

### Core

`apps/core` owns shared business foundations such as:

1. contacts
2. products
3. shared common modules and master data
4. reusable ERP-common contracts for shared master records

Inventory authority rule:

1. `apps/core` is the current authoritative source for sellable storefront stock
2. `apps/ecommerce` must read storefront availability from `core` stock rows and reserved quantities
3. `apps/frappe` may project ERPNext stock into `core`, but storefront runtime and checkout must not depend on live ERP responses
4. sellable quantity is `sum(active stock quantity - reservedQuantity)` and must never drop below zero in storefront reads
5. low-stock state begins at sellable quantity `1` to `5`; sellable quantity `0` is out of stock
6. cart and PDP quantities are advisory only until checkout confirms stock again and creates the reservation hold
7. checkout creates a reservation hold when a new order enters `payment_pending`, and that hold stays attached to the order until cancellation, pending-payment failure, or expiry
8. pending-payment reservation expiry follows the current `15` minute checkout-reuse window, and late payment capture must be rejected once the hold has been released
9. storefront availability is currently aggregated across all active product stock rows; warehouse-level stock remains internal and is not exposed directly on customer-facing storefront surfaces
10. store pickup currently uses the same shared sellable pool as delivery orders, so no pickup-only warehouse promise should be implied until warehouse-aware allocation exists
11. current multi-warehouse readiness is operator-facing only: ecommerce may report warehouse spread and split-allocation posture from persisted stock rows and active reservations, but storefront runtime still must not expose warehouse choice or split-shipment promises
12. current reservation allocation is first-fit across active stock rows, so readiness reporting may show split allocations even while the customer-facing storefront remains warehouse-agnostic

Pricing authority rule:

1. `apps/core` is the current authoritative source for storefront sell price and compare-at price
2. `apps/ecommerce` must resolve effective pricing from active `core` product price rows using `sellingPrice` and `mrp`, with `basePrice` only as fallback when no active price row exists
3. `apps/frappe` may later project ERPNext item prices or price lists into `core`, but storefront runtime and checkout must not depend on live ERP pricing responses
4. if ERPNext price lists become the upstream source, price-list selection and normalization must complete before data is projected into `core`, not during live storefront requests
5. ERP compatibility must preserve current storefront semantics where `sellingPrice` is the effective transaction price and `mrp` is the compare-at display price

Coupon rule:

1. customer coupon ownership and lifecycle are currently owned by `apps/ecommerce` customer portal state
2. checkout may apply only signed-in customer coupons validated by ecommerce-owned status, expiry, minimum-order, and usage rules
3. informational storefront coupon-banner content does not itself authorize checkout discounts

Promotion rule:

1. current transactional promotion behavior is limited to ecommerce-owned customer coupons layered on top of `core` price authority
2. current storefront campaign, coupon-banner, gift-corner, and promo-copy surfaces are merchandising presentation, not the authoritative pricing engine
3. the current advanced-commerce baseline now includes ecommerce-owned customer commercial segments, deterministic segment pricing, and lifecycle-derived promotion cues, all resolved from persisted local customer and order state
4. checkout must persist any segment-driven discount as an explicit local applied-promotion snapshot on the order so later finance, support, and ERP flows can audit what commercial logic ran
5. future richer rule-driven promotion logic must still be introduced in phased ecommerce-owned layers with explicit stacking, audit, and checkout determinism rather than ad hoc price overrides

Advanced commerce rule:

1. storefront search ranking may use deterministic local scoring over projected catalog fields plus ecommerce merchandising flags, but must remain explainable and must not require live third-party ranking services
2. storefront recommendations may use projected catalog affinity, wishlist hints, order history, and merchandising flags, but must remain bounded to persisted local data and in-stock-aware ranking
3. customer lifecycle marketing state is ecommerce-owned and currently derived from local portal preferences, wishlist activity, and paid-order history
4. lifecycle marketing support currently means derived next-campaign cues, automation flags, and segment-aware promotion readiness; it does not yet imply a full external campaign-execution platform
5. merchandising automation and experimentation support currently live as operator-facing readiness, candidate, and hypothesis reporting inside ecommerce analytics surfaces before full traffic allocation or statistical experiment engines exist

Shipping rule:

1. `apps/ecommerce` owns the current storefront shipping-method catalog as part of storefront settings
2. each delivery method must carry explicit fallback shipping charge, fallback handling charge, courier label, SLA summary, ETA range, and COD eligibility
3. checkout may select only active configured delivery methods, while store pickup remains a separate fulfilment path controlled by pickup-location settings
4. order creation must snapshot the selected delivery method onto the order so later settings edits do not rewrite historical courier or ETA expectations
5. current legacy `freeShippingThreshold`, `defaultShippingAmount`, and `defaultHandlingAmount` fields remain compatibility mirrors of the default delivery method until later zone-based shipping logic replaces them
6. shipping zones are also ecommerce-owned storefront settings records and may match by country, state, and pincode prefix to add surcharges, ETA days, free-shipping threshold overrides, and COD eligibility on top of the selected method
7. checkout resolves the active zone only after a delivery address is known; cart-level shipping remains a generic estimate before that point
8. COD eligibility is currently a derived storefront rule only; a real COD payment-state workflow is still deferred and must not be implied as live operational support yet

Tax review rule:

1. storefront order tax review is currently owned by `apps/ecommerce` and snapshotted at order-creation time onto the persisted storefront order
2. tax-rate lookup currently reads the product `taxId` projected through `apps/core` product records and common-module tax master data, with temporary compatibility for legacy seeded aliases
3. the current storefront GST review treats item selling totals as tax-inclusive values and derives taxable value plus GST components for later operational review
4. GST regime is currently selected from seller-state versus billing-state comparison, using `cgst + sgst` for intra-state review and `igst` for inter-state review
5. shipping and handling charge tax treatment is not yet modeled explicitly in storefront runtime and must be decided in accounting-compatibility work before invoices become the authoritative tax document
6. current billing sales invoice posting supports one GST rate per voucher, so storefront orders carrying multiple GST rates must stay in manual-review accounting flow until billing supports multi-rate posting or document splitting
7. storefront refund state is not itself the accounting reversal document; billing credit-note workflow remains the authoritative accounting treatment for refunded storefront orders

RMA and customer-service rule:

1. storefront return and cancellation handling stays inside `apps/ecommerce` and extends the existing order-request plus support-case stores instead of creating a separate reverse-logistics data silo
2. every customer-created return or cancellation request must open or link one support case so support, operations, and finance can work from a shared customer-service thread
3. customer-facing order requests must progress through explicit operational states where relevant: `requested`, `in_review`, `awaiting_return`, `refund_pending`, `completed`, or `rejected`
4. cancellation requests may move directly into `refund_pending` or `completed` depending on whether the order was prepaid, but return requests should not imply refund completion until the reverse-flow review advances them
5. unified operator visibility for advanced operations should be derived from order requests, support cases, current refund state, and ERP return-sync context rather than from disconnected queue fragments

Analytics and attribution rule:

1. current deeper storefront attribution remains owned by `apps/ecommerce` and is derived from persisted checkout or order snapshots, not from live third-party analytics calls during storefront runtime
2. attribution capture is optional on checkout payloads and may store source, medium, campaign, content, term, referrer, landing-path, session key, and a normalized channel grouping on the storefront order
3. orders without attribution remain valid and should be grouped explicitly as `direct` or `unknown` in operator reporting instead of being discarded
4. operator analytics may aggregate performance by channel, source, medium, and campaign from stored storefront orders, but this stage does not imply complete session analytics, ad spend ingest, or multi-touch attribution

Storefront smoke gate rule:

1. the public storefront release gate for homepage through paid order and tracking should run as one explicit command rather than a loose collection of e2e files
2. the smoke command must cover homepage, catalog, product detail, cart, checkout, paid-order confirmation, and tracking, plus basic accessibility labels and mobile viewport sanity on the same path
3. non-blocking downstream warnings such as mail-delivery failures or deferred ERP push issues should be recorded separately, but they do not fail the storefront smoke gate unless the buy-to-track journey itself breaks

Storefront designer governance rule:

1. editable storefront content blocks must keep explicit enable or disable control, editable content fields, live preview, and seeded safe defaults
2. where a block depends on media or links, the designer surface must validate those fields before save and block invalid submissions client-side
3. client-side validation is a usability baseline only; schema parsing on the ecommerce backend remains the final authority for persisted storefront settings
4. persisted storefront links may only use root-relative paths, anchors, or explicit `http`, `https`, `mailto`, or `tel` URLs
5. persisted storefront media references may only use root-relative asset paths or explicit `http` or `https` URLs
6. storefront designer access is role-scoped: read-only visibility and edit rights are separate permissions, and only edit-capable roles may save designer changes
7. legacy `ecommerce:storefront:manage` remains a compatibility fallback while the new read-vs-edit storefront role split is introduced
8. direct-live storefront saves must create immutable pre-change revision snapshots so the previous live state is never destroyed without recovery context
9. storefront designer saves now land in a shared draft settings record; public storefront runtime continues reading only the live settings record until an explicit publish action promotes the draft
10. rollback must restore live storefront content only from immutable live revision snapshots, and publish or rollback clears the active draft workspace
11. storefront version history is derived from the live revision snapshots plus the current live document, and block-level history should suppress entries where that block did not actually change
12. storefront production approval is role-gated: draft edit access and live publish or rollback approval are separate permissions, with approval authority required before any draft changes can affect the public storefront
13. storefront performance budgets must be measured against a production-like built frontend surface, not the development server, and budget checks should cover at least homepage, catalog, and product detail routes
14. storefront image delivery should flow through shared image primitives with explicit intrinsic dimensions and consistent eager-vs-lazy policy on the main storefront surfaces before adding more image-heavy blocks
15. heavy below-the-fold homepage merchandising rails should mount lazily behind intersection-aware storefront wrappers so they do not expand the first-render path unnecessarily
16. future homepage rails and blocks must declare their deferral, root-margin, reserved-height, and fallback behavior through shared storefront performance standards instead of ad hoc inline decisions

### API

`apps/api` owns route definitions only.

Rules:

1. internal routes live under `apps/api/src/internal`
2. external routes live under `apps/api/src/external`
3. transport ownership stays here; domain logic does not
4. auth routes follow the same split: public login and recovery flows stay external, admin and operator auth management stays internal

### Site

`apps/site` owns static and public presentation surfaces.

### UI

`apps/ui` owns the shared design system.

UI owns:

1. shared CSS and tokens
2. reusable primitives
3. reusable layout blocks
4. neutral UX building blocks
5. shared desk shell presentation
6. shared auth layout presentation
7. design-system docs presentation and catalog components

UI does not own app-specific business workflows.

### Billing

`apps/billing` owns accounting, inventory, vouchers, and reporting flows.

### Ecommerce

`apps/ecommerce` is the standalone commerce boundary.

Ecommerce owns:

1. catalog
2. storefront
3. checkout
4. customer commerce flows
5. payments and order tracking
6. customer accounts, profile, portal pages, and order history linked to the shared `cxapp` auth session

### Task

`apps/task` owns workspaces, tasks, and team workflow flows.

### Demo

`apps/demo` owns demo-data installation, sample business data generation, demo workspace summaries, and preview administration for sales/demo environments.

### Frappe

`apps/frappe` owns ERPNext-specific settings, snapshot storage, connector contracts, and sync orchestration.

ERPNext stock integration rule:

1. `apps/frappe` remains a connector and sync boundary, not the direct runtime stock authority for storefront requests
2. future ERPNext stock flow must follow `frappe -> core -> ecommerce`
3. saved Frappe connector credentials must stay app-owned and masked on read; admin clients may update non-secret settings without resubmitting existing secrets
4. saved Frappe verification state belongs to the connector settings record and must reset when base URL, site, credentials, or timeout change
5. verification may use the currently saved credentials when the operator leaves secret inputs blank, but only verification runs against the saved connector payload should persist back onto the saved settings record
6. future live connector syncs may auto-retry only idempotent ERP reads and local snapshot-refresh writes, with bounded attempts and backoff derived from the saved connector timeout budget
7. downstream projection or transactional connector writes must fail closed after the first failed attempt and require operator-visible manual replay until explicit idempotency contracts exist
8. Frappe connector observability must write into the shared framework monitoring and activity-log surfaces using a dedicated `connector_sync` monitoring operation, not by overloading checkout or webhook channels
9. current Frappe verification and sync flows must emit both monitoring status and activity-log evidence so operators can review recent connector exceptions from the Frappe workspace without losing the shared framework alerting baseline
10. ERPNext item-master projection must follow `frappe item snapshot -> frappe projection decision -> core product write`, with `itemCode` as the upstream identity anchor and `core` remaining the authoritative persisted product master
11. the current item-master projection contract may project item identity, name, description, brand text, item-group text, HSN/tax reference candidate, disabled-state inversion, and variant capability flag, while price, stock, media, and real variant synthesis remain separate later-stage projections
12. ERPNext price projection must follow `frappe item price snapshot -> frappe price-list normalization decision -> core product price write`, preserving current storefront semantics where `sellingPrice` is the effective transaction price, `mrp` is the compare-at display price, and `basePrice` remains fallback only when no active projected or local price row exists
13. ERPNext stock projection must follow `frappe stock snapshot -> frappe warehouse normalization decision -> core product stock write`, preserving current storefront semantics where sellable quantity remains `sum(active quantity - reservedQuantity)` and ecommerce checkout holds stay authoritative for active reservations until explicit reconciliation rules exist
14. ERPNext customer-group and sales-profile projection must follow `frappe customer commercial snapshot -> frappe normalization decision -> ecommerce commercial-profile enrichment`, and must stay enrichment-only until later segmented pricing or entitlement work explicitly consumes those fields without replacing ecommerce-owned auth, coupons, or portal state
15. connector orchestration code must stay inside `apps/frappe`; other product apps may consume only shared Frappe contracts or API routes, while direct imports of `apps/frappe/src/services/*` are limited to API transport wiring and tests
16. the first live projection path is the item-master flow inside `apps/frappe`, where Frappe item snapshots now project into `apps/core` product records through the existing core product service while preserving the staged boundary that price, stock, and customer-commercial projection remain separate later executions
17. ecommerce must consume projected ERP-backed catalog data through narrow local read-model services that read persisted `core` products, rather than importing Frappe internals or scattering direct projected-data access across unrelated services
18. storefront runtime paths for landing, catalog, product detail, SEO, and mock-checkout must remain operable without live ERP or Frappe network access; direct runtime network fetches belong only to dedicated payment-provider integrations, not projected catalog consumption
19. paid storefront orders may trigger ERPNext Sales Order push only after the ecommerce paid state is committed locally, and the actual connector write plus idempotent local sync-record handling must stay inside `apps/frappe` even when checkout verification, webhook capture, or reconciliation routes are the transport entry points
20. ERPNext Sales Order push failures must not roll back or block the local paid storefront order; the connector should fail closed into a persisted Frappe-side sync record and shared connector observability so later approval or replay tooling can recover the bridge safely
21. Sales Order push approval mode is split into two phases: the first push for a newly committed paid storefront order is auto-approved, while any retry after a transactional ERP write failure becomes manual replay only and requires operator review of connector readiness plus the recorded failure cause
22. duplicate protection is part of the approval rule, not just an implementation detail: a storefront order already synced with the same provider payment id must be treated as an approved prior push and must not create a second ERP Sales Order on webhook or reconciliation re-entry
23. ecommerce orders should persist a local ERP Sales Order link snapshot derived from the Frappe sync result so later commerce-side operations can resolve `order id -> ERP Sales Order id` without querying connector internals directly; legacy orders without that field must continue restoring safely as `null`
24. fulfilment, invoice, and return or refund sync-back must follow the same connector-owned pattern: `apps/frappe` stores the latest ERP delivery-note, invoice, and return snapshots, then applies those results onto ecommerce orders as local ERP link snapshots plus lifecycle updates without requiring live ERP reads during storefront or admin runtime
25. reconciliation and replay for ERP transaction sync-back should derive from persisted connector records and ecommerce order snapshots only; replay may reapply the latest stored connector record or rerun the existing Sales Order push path, but it must not silently create fresh live-ERP side effects outside the explicit connector boundary
26. current release governance treats ERP integration as `transactional bridge enabled`, because the repo already contains live paid-order Sales Order push and transaction sync-back flows; this is still a bounded bridge, not a claim that ERP is the only runtime authority for storefront pricing, stock, auth, or customer lifecycle state

### Tally

`apps/tally` owns Tally-specific integration contracts and connector logic.

### CLI

`apps/cli` owns operational commands, diagnostics, and release helpers when those helpers actually exist in the repository.

Current helper surface:

1. interactive GitHub commit and push helper: `npm run github`
2. built server-side GitHub helper: `npm run github:server`
3. database prepare command: `npm run db:prepare`
4. database migrate command: `npm run db:migrate`
5. database seed command: `npm run db:seed`

## Runtime Model

Current active runtime:

1. frontend entry: `apps/cxapp/web/src/main.tsx`
2. frontend shell: `apps/cxapp/web/src/app-shell.tsx`
3. server entry wrapper: `apps/cxapp/src/server/index.ts`
4. reusable host: `apps/framework/src/server/index.ts`
5. DI and suite composition: `apps/framework/src/di` and `apps/framework/src/application`
6. config runtime: `apps/framework/src/runtime/config`
7. database runtime: `apps/framework/src/runtime/database`
8. HTTP runtime: `apps/framework/src/runtime/http`

Current framework route surfaces:

1. health: `/health`
2. internal app registry: `/internal/apps`
3. internal workspace baseline: `/internal/baseline`
4. external app registry: `/api/apps`
5. external auth surface: `/api/v1/auth/*`
6. protected cxapp auth and mailbox surfaces: `/internal/v1/cxapp/auth/*` and `/internal/v1/cxapp/mailbox/*`
7. protected cxapp setup and company surfaces: `/internal/v1/cxapp/bootstrap`, `/internal/v1/cxapp/company*`, and `/internal/v1/cxapp/runtime-settings`
8. public storefront surfaces: `/public/v1/storefront/*`
9. external storefront customer and checkout surfaces: `/api/v1/storefront/*`

## App Suite Model

Framework composes the suite through manifests.

Current registered suite surfaces:

1. framework
2. cxapp
3. core
4. api
5. ui
6. site
7. billing
8. ecommerce
9. task
10. demo
11. frappe
12. tally
13. cli

Every manifest carries workspace metadata so framework and CxApp can inspect app roots without filesystem guessing.

## Database Model

Current database direction:

1. MariaDB is the primary live transactional database
2. SQLite is the offline and desktop option
3. PostgreSQL is reserved for optional analytics workloads

Rules:

1. framework owns the live runtime driver switching
2. framework owns migration and seeder execution, ledger tracking, and registry composition
3. each app owns its individual migration files under `database/migration` and individual seeder files under `database/seeder`
4. app database modules should be exposed through server-side entry points such as `apps/<app>/src/database-module.ts`
5. stock, accounting, tax, and audit-sensitive writes must stay explicit and traceable

## Build Model

Rules:

1. all build artifacts live under the shared root `build/`
2. app builds go to `build/app/<app>/<target>`
3. future module builds go to `build/module/<module>/<target>`

Current active outputs:

1. web build: `build/app/cxapp/web`
2. server build: `build/app/cxapp/server`

## Testing Model

Current automated tests live under the root `tests/` folder.

Active coverage today includes:

1. app suite registration
2. workspace structure normalization
3. runtime config loading
4. runtime database switching
5. workspace baseline assembly and route exposure
6. database execution workflow for app-owned migrations and seeders
7. auth lifecycle flows such as seeded login, OTP registration, password reset, recovery, and session revocation
8. Frappe connector flows such as settings save, item sync, purchase receipt sync, and route registration
9. ecommerce storefront flows such as catalog reads from `core`, customer registration, checkout, payment verification, portal orders, order tracking, and role-based auth landing
10. demo-data install routes, installers, and workspace summary flows

## Current State

Implemented now:

1. framework-first DI and runtime composition
2. active CxApp frontend and server wrappers
3. normalized app folder shape across all apps
4. manifest-level suite registration with workspace metadata
5. internal and external API route split
6. MariaDB / SQLite / PostgreSQL runtime switching
7. shared desk shell and grouped app navigation from `apps/ui`
8. shared auth layouts and auth page presentation through `apps/ui`
9. shared design-system docs and routeable component catalog in the `ui` app
10. app-owned `cxapp`, `core`, `billing`, `ecommerce`, and `frappe` migrations and seeders executed through the framework runtime and CLI helper
11. `cxapp`, `core`, `billing`, `ecommerce`, and `frappe` services reading seeded database tables instead of bypassing the database with in-memory seed arrays
12. app-owned `cxapp` auth, session, OTP, role, permission, mailbox, bootstrap, company, and app-settings storage with external and internal API surfaces
13. active `cxapp` auth pages using the live auth API and persisted browser sessions instead of placeholder-only local state
14. app-owned `frappe` connector settings, todo snapshots, item snapshots, purchase receipt snapshots, internal routes, and desk workspace sections
15. one `cxapp` login session that routes admins to `/admin/dashboard`, desk users to `/dashboard`, and customers to `/profile`
16. app-owned `ecommerce` storefront settings, dedicated home-slider designer, storefront admin editing, catalog reads from `core` products and shared product masters, customer registration linked to `core` contacts, customer accounts linked to `cxapp` auth users, orders, checkout, Razorpay-ready payments, public tracking, and customer portal pages
17. app-owned `demo` install profiles, module-specific demo data installers, progress tracking, and demo workspace counts for customer, supplier, product, category, and order data seeding
18. TanStack Query as the shared server-state layer for runtime settings, storefront shell data, and demo installer polling, with Zustand used only for lightweight session and storefront shell client state
19. shared storefront editor and docs surfaces in `apps/ui` such as reusable search, featured-card, category-card, rich-text editor, and toast blocks that are consumed by both the storefront and design-system docs
20. root tests that validate suite registration, workspace structure, framework runtime behavior, database process execution, auth lifecycle behavior, ecommerce service flows, demo installer flows, and Frappe connector behavior

Still future work:

1. real domain modules inside each standalone app
2. richer relational schemas and write flows beyond the current module-payload baseline
3. richer connector execution flows such as webhooks, job queues, and deeper bidirectional reconciliation
4. auth hardening such as refresh-token rotation, MFA, rate limiting, richer admin UX, and deeper audit flows
5. promotions, segmented pricing, recommendations, lifecycle marketing, inventory reservation, shipment carriers, and post-order commerce workflows inside `apps/ecommerce`
6. Electron desktop runtime

## Boundary Rules

1. framework must not own billing, commerce, or task business logic
2. core must stay shared and reusable
3. ui must stay shared and presentation-focused
4. api must stay route-focused
5. connectors must stay isolated in their app boundaries
6. CxApp may orchestrate apps, but it must not erase app ownership boundaries
7. framework may host reusable auth primitives, but auth domain rules, tables, mailbox records, bootstrap state, and company records stay app-owned in `cxapp`
8. `ecommerce` must not create a second browser auth store or JWT/session system; customer portal access must resolve through the shared `cxapp` auth session
- Final release governance now uses two explicit ecommerce e2e gates before broader signoff:
- Final release governance now uses three explicit repo-level gates before environment signoff:
  - `npm.cmd run test:e2e:storefront-smoke` for the public homepage-to-paid-order-to-tracking journey
  - `npm.cmd run test:e2e:ecommerce-admin-ops` for storefront content, orders, payments, and support operator surfaces
  - `npm.cmd run test:release:security-ops` for monitoring, backup, restore-drill, and security-review checks
9. final ERP release signoff must choose explicitly between `deferred`, `master-sync only`, or `transactional bridge enabled`; the current repo state is the third option, with fail-closed connector writes and manual replay after transactional failure
