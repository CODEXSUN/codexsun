# Changelog

## Version State

- Current package version: `0.0.1`
- Current release tag: `v-0.0.1`
- Reference format: `#<number>`

## v-0.0.1

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
