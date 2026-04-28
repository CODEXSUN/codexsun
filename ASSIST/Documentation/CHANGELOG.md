# Changelog

## Version State

- Current package version: `1.0.284`
- Current release tag: `v-1.0.284`
- Reference format: changelog labels use `v 1.0.<number>`, task refs use `#<number>`, and release tags use `v-1.0.<number>`

## v-1.0.284

### [v 1.0.284] 2026-04-28 - Add tenant-aware bundle registry and visibility matrix

- completed the first live tenant-aware visibility layer with industry bundles for garments, offset, upvc, garment ecommerce, computer-store ecommerce, and accounts-audit
- added real client overlays under `clients/*` for `default`, `techmedia`, `tirupurdirect`, `thetirupurtextiles`, `studiopress`, `upvcprime`, and `auditdesk`
- made the tenant visibility registry industry-aware so client overlays are filtered by compatible industry and fall back safely to `default` when needed
- refined the framework tenancy admin pages into a `Bundle Registry` and `Visibility Matrix`, including client-overlay-aware recalculation of visible apps and module groups
- connected the controls into the cxapp and shared sidebar with a dedicated `Tenancy Control` group plus `Bundle Registry` and `Visibility Matrix` menu items
- aligned framework route titles, auth-option resource labels, and support docs with the live bundle-registry and visibility-matrix terminology
- updated architecture, project overview, workspace visibility docs, and execution tracking to reflect that cxapp now filters desk apps and sidebar groups from resolved tenant visibility
- validated the batch with `npx.cmd tsc --noEmit --pretty false` and focused ESLint for the changed tenancy files using the existing local `app-shell.tsx` `@typescript-eslint/no-explicit-any` exception

## v-1.0.273

### [v 1.0.273] 2026-04-27 - Add persisted stock Delivery Notes

- added a persisted Delivery Note workflow in the stock app with `billing_delivery_notes` JSON-store migration, shared schemas, service wrappers, and internal stock API routes for list, show, create, and update
- changed the stock Delivery Note page from a UI-only form into a Purchase Receipt-style list with search, status filters, pagination, clickable note numbers, action menu, print, show, edit, new, and save flows
- added Delivery Note show and edit routes under `/dashboard/apps/stock/delivery-note`, including `/new`, `/:deliveryNoteId`, and `/:deliveryNoteId/edit`
- added barcode scan and manual product/barcode selection for Delivery Note items, restricted delivery mode to accepted live stock, and added warning messages for unknown or unaccepted barcode scans
- added Delivery Note print/save-and-print output with customer, warehouse, delivery/return mode, item rows, quantities, totals, and remarks
- polished Delivery Note UX by removing the Stock hero card, formatting list dates as `dd-MM-yyyy`, cleaning customer labels without the `contact:` prefix, redirecting save back to the list, and replacing Clear/Go back with a single Cancel action
- updated the stock sidebar with an Outward group containing Delivery Note and kept the group visible even when it has one item
- continued Goods Rejections polish by removing the intro/helper cards, tightening copy, improving filter summary badges, removing the redundant status column, moving Reason after Notes, shortening warehouse labels, adding pagination, and swapping Stock Ledger above Goods Rejections in the Inward menu
- validated the batch with `npx.cmd tsc --noEmit --pretty false` and focused ESLint for the changed stock, cxapp, API, schema, migration, and service files; existing local lint overrides were used only for pre-existing `react-hooks/set-state-in-effect` and `app-shell` `no-explicit-any` findings

## v-1.0.250

### [v 1.0.250] 2026-04-27 - Add goods rejection type lookup and light stock status badges

- changed stock purchase receipt and stock workspace status badges to use a consistent light-tone treatment across receipt status, generated barcode status, goods inward status, posting status, sales allocation, transfers, reservations, challan, verification, and live audit scan surfaces
- added `stockRejectionTypes` as a Core common module with seeded `Rejected`, `DOA`, and `Warranty` records plus standard common-module navigation and metadata
- replaced the Goods Rejections fixed rejection-type dropdown with a searchable creatable lookup backed by Core common modules, so operators can create a new rejection type when no matching record exists
- widened the stock acceptance `rejectionReason` contract from fixed enum values to a non-empty lookup-backed string while keeping the actual stock-unit lifecycle status as `rejected`
- added a Rejection Types table to the Goods Rejections page so configured rejection classifications are visible beside the rejected goods register
- validated the UI and contract changes with `npx.cmd tsc --noEmit --pretty false` and focused ESLint; a focused billing rejection test run was attempted but blocked by local MariaDB access denied for user `''@'localhost'`, while `tests/stock/purchase-receipt-live-flow.test.ts` passed in the same run

## v-1.0.239

### [v 1.0.239] 2026-04-27 - Fix first-load dashboard and web brand logo fallback

- added a shared runtime startup brand profile and browser cache helpers so first-render branding no longer starts from a null state
- changed the cxapp runtime brand query to hydrate from the shared startup brand, persist successful company-brand fetches, and fall back to cached/default brand data when the network response is not ready yet
- removed the dashboard sidebar fallback to the framework manifest brand so the app side menu and web-facing menu branding both resolve through the same runtime brand source
- validated the branding fix with `npx.cmd tsc --noEmit --pretty false` and focused ESLint on the changed branding files

## v-1.0.236

### [v 1.0.236] 2026-04-26 - Move root framework content under apps/framework

- moved the remaining top-level `framework/` content into the canonical `apps/framework/` app boundary after destination overwrite checks and file-hash verification
- removed the now-empty root `framework/` directory
- updated inventory-engine, tenant-engine, and industry manifest imports to resolve through `apps/framework`
- changed TypeScript project includes from root `framework/**/*.ts` to `apps/framework/**/*.ts`
- updated moved rollout-guide paths and assistant workspace guidance so root `framework/` is no longer treated as an expected migration directory
- validated the move with old-path reference checks and focused ESLint for the moved framework import consumers

## v-1.0.235

### [v 1.0.235] 2026-04-26 - Move root cxapp content under apps/cxapp

- moved the remaining top-level `cxapp/` folders and README into the canonical `apps/cxapp/` app boundary without overwriting existing app folders
- removed the now-empty root `cxapp/` directory
- updated the moved orchestration mapper relative import for its new path
- updated assistant workspace guidance so it no longer treats top-level `cxapp/` as an expected migration directory
- validated the move with old-path reference checks and focused ESLint for the moved mapper

## v-1.0.234

### [v 1.0.234] 2026-04-26 - Attach storefront quantity only to confirmed live stock

- removed the stock seeder that copied core product `stockItems` into `stock_live_balances`, so live stock is no longer bootstrapped from product master stock fields
- stopped core and ecommerce product projections from deriving product stock totals from product stock rows or variant stock quantities
- scrubbed core product upsert output so product master saves do not persist submitted stock item or stock movement rows as stock authority
- updated storefront multi-warehouse readiness to read stock live balances through the stock service instead of `product.stockItems`
- kept the final stock flow as `purchase receipt -> stock entry/barcode preparation -> acceptance verification -> stock ledger/live stock`, with storefront quantity attached to confirmed live stock
- replaced the stale SQLite-backed stock seeder test with structural stock-flow coverage; focused tests and ESLint passed, while full DB-backed integration still requires a configured MariaDB/PostgreSQL test database because SQLite runtime support has been removed

## v-1.0.230

### [v 1.0.230] 2026-04-25 - Add clean database fresh reset command

- added a guarded `db:fresh` command path that drops current application database objects and reruns the registered migration and seeder flow for clean local or operator-managed installs
- implemented the fresh-reset runtime support inside the framework database process layer for the active MariaDB and PostgreSQL driver paths instead of scattering ad hoc reset scripts
- extended the CLI database helper and root package scripts so operators can run the clean-install database reset through one explicit command surface
- updated setup and architecture documentation to include the new `db:fresh` command alongside the existing `db:prepare`, `db:migrate`, and `db:seed` workflow
- added focused CLI coverage for destructive confirmation behavior and unknown-command usage output
- validated the slice with `npx.cmd tsx --test tests/cli/database-helper.test.ts` and focused ESLint for the database helper, fresh runtime, and test file; global typecheck remains blocked by unrelated pre-existing billing workspace type errors

## v-1.0.229

### [v 1.0.229] 2026-04-25 - Continue storefront live merchandising and theme designer

- refactored storefront home, product, catalog, cart, checkout, legal, tracking, footer, header, category menu, and customer portal surfaces toward full-width layouts with `px-20` desktop gutters and responsive smaller-screen padding
- removed visible inner horizontal scrollbars from lower-home rails while preserving touch and button-based horizontal navigation
- hardened the gift-corner-to-footer scroll path by keeping deferred wrappers width-clamped, switching the affected wrappers to horizontal clipping, and tightening coupon, gift, discovery, visual-strip, trending, and brand-story lower-home blocks so they no longer widen the page while scrolling
- added visible storefront technical-name badges and data markers to gift corner, coupon banner, discovery board, visual strip, trending, brand stories, and campaign trust surfaces for exact screenshot-based issue targeting
- tightened product-card height and spacing across featured, new arrivals, and best sellers, aligning card image sizing and reducing excess bottom whitespace while keeping the product imagery and typography stable
- refined the coupon banner by reducing its height, tightening internal spacing, removing the decorative end cutout circles, and shortening helper text into a more concise promo line
- wired discovery-board and visual-strip merchandising to live core product flags, added those flags and display-order fields to core product editing and bulk edit, and invalidated storefront shell data after product saves so checked products appear in the public storefront
- changed discovery-board placement so order `1-4` fills the first board, `5-8` fills the second, `0` is ignored, and empty ordered slots remain empty instead of duplicating the same product across all image tiles
- removed designer fallback artwork from the public discovery-board live-product path and kept live checked products visible even when their own product image is missing by using configured board or strip artwork only as the controlled section fallback
- made discovery-board image tiles use product/catalog links directly and removed the card-level tilt/lift behavior from the main card wrapper
- replaced the placeholder Brand Stories admin panel with a live editor for enabled state, section copy, links, media-library images, pasted image URLs, and pasted raw SVG converted into image data URLs
- allowed storefront media references to accept image data URLs including SVG, filtered Brand Stories rendering to configured image/SVG cards only, enlarged the brand-story logo cards, and aligned the brand-story colors with the storefront warm theme
- added a new ecommerce Store Front side-menu entry named `Theme Designer` at `/dashboard/apps/ecommerce/theme-designer` for changing page background, section background, shared card background, muted card background, card border, shadow color, and shadow strength from one form
- applied Theme Designer variables through the public storefront layout and shared card surfaces, including product cards, featured cards, category cards, discovery board, visual strip, brand stories, and campaign trust cards
- validated the follow-up storefront work with focused ESLint runs and repeated `npx.cmd vite build`

### [v 1.0.229] 2026-04-23 - Finalize storefront home merchandising and overflow hardening

- added standalone ecommerce-admin-backed `Discovery Board` and `Visual Strip` home sections with shared storefront schema, seed, API, workspace, and renderer wiring
- converted the storefront brand-showcase area into a marquee-based brand slider using a shared marquee utility and shared CSS animation support
- tightened the storefront home runtime with smaller first-render work, lighter above-the-fold behavior, updated featured defaults, hero and lane tuning, and medium/mobile layout fixes across the storefront home surface
- standardized storefront home section framing around a shared container-width frame and narrowed the coupon-banner and gift-corner decorative layers so below-fold sections stay inside the storefront width
- hardened the remaining gift-area scroll path by switching storefront shell guards to `overflow-x-hidden`, delaying rail and marquee mount timing, and adding marquee containment at the component and root levels
- validated the storefront slice with repeated `npx vite build`; global `npm run typecheck` remains blocked by unrelated existing billing type errors

## v-1.0.228

### [v 1.0.228] 2026-04-23 - Add discovery board and visual strip storefront sections

- added shared ecommerce storefront schemas, default seed content, and settings-service support for `discoveryBoard` and `visualStrip`
- added dedicated ecommerce admin API endpoints, sidebar entries, workspace routes, validation, and standalone designer screens for both new sections
- added shared UI blocks for a four-card image collage board and a compact image rail, then mounted both sections on the public storefront home page with deferred loading
- converted the storefront brand-showcase rail into a marquee-based brand slider and added a shared marquee UI utility plus keyframes in the shared CSS theme layer
- moved the shared storefront home frame to a Tailwind `container` width and clipped the coupon-banner and gift-corner decorative layers so below-fold sections stay inside the page width while mounting on scroll
- validated the storefront slice with `npx vite build`; global `npm run typecheck` remains blocked by unrelated existing billing type errors

## v-1.0.223

### [v 1.0.223] 2026-04-23 - Queue manual full-load storefront verification

- added `#223` in `ASSIST/Execution/TASK.md` for manual full-load storefront verification across homepage, catalog, PDP, cart, checkout, tracking, late-render checks, and local email expectation confirmation

## v-1.0.222

### [v 1.0.222] 2026-04-23 - Start public storefront first-render strategy

- fixed `apps/ecommerce/web/src/features/storefront-home/shells/storefront-home-page-shell.tsx` so the homepage no longer force-enables every storefront section during normal public render
- added defer rules for desktop `new arrivals` and `best sellers` rails in `apps/ecommerce/web/src/components/storefront-performance-standards.tsx` and `storefront-home-product-lane-section-desktop.tsx` so the homepage first render carries less below-the-fold product-card work
- split app-only runtime providers into `apps/cxapp/web/src/app-runtime-providers.tsx` and stopped wrapping the shop surface with those providers during first public storefront render
- revalidated the first-render slice with `npm run typecheck`, `npm run build`, and `npm run test:e2e:performance`

## v-1.0.221

### [v 1.0.221] 2026-04-22 - Restore storefront smoke runtime and seeded live stock

- fixed `playwright.config.ts` so storefront smoke runs start the intended backend command after `db:prepare`, use dedicated local test ports, and stop reusing stale local servers
- added `apps/stock/database/seeder/01-live-stock-from-core-products.ts` so active core product stock items are projected into `stock_live_balances` during database prepare, making seeded storefront products buyable in smoke runs
- added `tests/stock/live-stock-seeder.test.ts` to validate the new stock seeder directly against a deterministic seeded core product record
- revalidated the storefront slice with `npm run test:e2e:storefront-smoke`, `npx tsx --test tests/stock/live-stock-seeder.test.ts`, and `npm run typecheck`

### [v 1.0.207] 2026-04-21 - Add root-level standalone cxmedia storage and CDN service

- added `cxmedia/` as a root-level standalone service with its own config, JWT admin auth, rate limiting, multipart upload handling, S3-compatible storage adapter, and standalone HTTP server
- implemented standalone media routes for admin login, authenticated origin reads, multipart upload, prefix-based listing, deletion, signed upload and download URLs, public `/f/*` delivery, private `/p/*` delivery, and Thumbor-oriented resize and crop redirect paths
- added a standalone file-manager UI served directly from `cxmedia/public` for login, upload, prefix browsing, URL copy, signed-link generation, and delete actions
- added self-host deployment assets for Garage, Thumbor, and NGINX-based CDN proxy delivery under `cxmedia/deploy`
- updated repository docs so `cxmedia/` is documented as a root-level standalone service outside the framework-composed suite
- validated the standalone service with `npm run typecheck:cxmedia` and `npm run build:cxmedia`

## v-1.0.194

### [v 1.0.194] 2026-04-21 - Split stock workspace helpers into stock-owned frontend modules

- split the oversized stock workspace helper surface into `apps/stock/web/src/workspace/stock-workspace-types.ts`, `stock-workspace-api.tsx`, and `stock-workspace-helpers.tsx`, leaving `stock-workspace-shared.tsx` as a compatibility barrel instead of the primary implementation file
- updated `apps/stock/web/src/workspace/stock-purchase-receipt-sections.tsx` and `stock-workspace-support-sections.tsx` to consume stock-owned workspace modules and stock app shared types rather than importing stock UI domain types from `@billing/shared`
- expanded `apps/stock/shared/schemas.ts` to re-export the stock operation types required by the stock web layer so the app can consume its own shared contract surface cleanly
- revalidated the stock cleanup slice with `cmd /c npm run typecheck` and `cmd /c npm run build`

### [v 1.0.194] 2026-04-20 - Fix mail settings save payload coercion

- fixed `apps/framework/shared/mail-settings.ts` so the mail settings save contract accepts form-style transport values by coercing string and number-like inputs to strings and common boolean strings to booleans
- restored compatibility for admin saves of `SMTP_SECURE` and `AUTH_OTP_DEBUG`, preventing the mail settings page from failing with `Invalid request payload` before the runtime `.env` save logic runs

### [v 1.0.194] 2026-04-20 - Harden Frappe workspace reads against invalid connector state and legacy observability rows

- fixed the Frappe settings read path so invalid `FRAPPE_*` env configuration returns a readable connector snapshot with `isConfigured=false` instead of crashing the workspace with a raw internal server error
- updated Frappe item and ToDo live-connection helpers to check stored connector readiness before re-reading the strict runtime env config, keeping disabled or invalid connector state on the expected guarded path
- hardened framework activity-log and monitoring readers to skip malformed legacy rows rather than failing the entire Frappe observability response
- changed the default Frappe overview page to use partial-result loading so one failed backend panel no longer collapses the whole workspace into a single `Internal server error` card

## v-1.0.193

### [v 1.0.193] 2026-04-20 - Fix stale System Update preview after remote fetch

- fixed `apps/framework/src/runtime/system-update/system-update-service.ts` so `Check for Updates` resolves a fresh runtime git status after `git fetch --prune` before deciding whether pending commits exist
- changed the incoming commit preview range to use the refreshed post-fetch current and remote commit state, preventing false `No new commits found` results when the runtime repo started from stale branch metadata

### [v 1.0.193] 2026-04-20 - Record techmedia cloud clean-install build failure from stale server code

- logged that the reported `techmedia_in` cloud clean-install failed during Docker `npm run build` because the server is still building an older repository state
- recorded that the failing server code is missing the already-fixed duplicate export correction in `apps/ecommerce/shared/index.ts` and the shared `Button` `cloneElement` typing correction in `apps/ui/src/components/ui/button.tsx`
- documented the required verification path on the server before rerunning setup: inspect `git status`, recent commits, and the live file contents to confirm the server has pulled the corrected repository state

## v-1.0.192

### [v 1.0.192] 2026-04-20 - Fix local Docker system-update runtime git sync startup

- fixed `.container/entrypoint.sh` so runtime git-sync startup values such as `GIT_SYNC_ENABLED`, branch, repository URL, and build/install flags read the persisted runtime `.env` before stale Docker compose env defaults, allowing `Save & Restart` and local client setup to activate runtime git sync without rewriting compose files
- enabled the existing local image snapshot overlay for development/local runtime git-sync boots so the cloned runtime repository keeps Git metadata for System Update while rebuilding from the current image workspace snapshot instead of stale remote `main`
- live-tested the corrected local Docker path by rebuilding `codexsun-app:v1`, rerunning `GIT_SYNC_ENABLED=true ./.container/clients/codexsun/setup.sh`, and verifying `http://127.0.0.1:4000/health` returned `status: ok` with `APP_ENV=development`, `GIT_SYNC_ENABLED=true`, and a bootstrapped `/opt/codexsun/runtime/repository`

### [v 1.0.192] 2026-04-20 - Fix storefront campaign designer CTA color sync

- centered the campaign-card eyebrow in the shared campaign block and tightened the secondary CTA fallback palette so washed-out near-white values resolve to a warmer base-matched tone
- moved campaign button-color normalization into shared ecommerce code, then applied it across backend settings reads, campaign save responses, admin designer state, and the storefront campaign card renderer so all layers resolve the same campaign design values
- fixed the actual render-path bug in `apps/ui/src/components/ui/button.tsx` by forwarding `style` and other passthrough props in the shared `Button` `asChild` branch, allowing designer-backed CTA colors to reach the child `Link` element that renders the storefront campaign buttons

### [v 1.0.192] 2026-04-19 - Normalize multi-client Docker deployment and clean-install tooling

- normalized all client compose files under `.container/clients/*` to the same runtime environment baseline and added complete deployment folders for `dealodeal_com`, `lifeshoppy_com`, `horseclub_in`, `aaranerp_com`, `spotmynumber_com`, and `thetirupurtextiles_com`
- renamed the Tirupur client deployment folder from `tirupur_direct` to `tirupurdirect_com`, updated the client inventory and cleanup references, and normalized the Tirupur database naming to `tirupurdirect_com_db`
- changed container bootstrap DB wiring so compose consumes the setup-selected client database instead of a hardcoded `DB_NAME`, fixing both local and cloud bootstrap mismatches for clients such as `codexsun`, `tirupurdirect_com`, and `techmedia_in`
- added one-by-one cloud clean-install tooling through `.container/bash-sh/cloud-clean-install-clients.sh`, added clean-install command sections to every client `USAGE.md`, and refactored `.container/bash-sh/clean.sh` to discover and clean all registered clients from `.container/client-list.md`
- validated every client compose file with `docker compose config`, then revalidated live local and cloud deployments with healthy startup for `codexsun`, `tirupurdirect_com`, and `techmedia_in`

### [v 1.0.192] 2026-04-19 - Reconcile .env and .env.sample ordering and key coverage

- reordered `.env` and `.env.sample` into the same section structure for application, frontend, security, operations, billing, container startup, and Frappe settings
- added the missing shared keys in both directions so `.env` and `.env.sample` now expose the same environment-variable set without gaps
- aligned newer runtime and deployment settings including scheduled git update flags, operator and secret-owner metadata, backup verification fields, webhook and billing integration placeholders, and ecommerce pricing percentage controls

### [v 1.0.192] 2026-04-19 - Start stock app ownership extraction without breaking deployment

- moved the canonical stock operation contracts into `apps/stock/shared/schemas/stock-operations.ts` and turned the billing schema file into a compatibility re-export so stock-owned code can import from its own app boundary first
- moved canonical stock operation table names into `apps/stock/database/table-names.ts`, then updated billing to consume those names instead of owning duplicate literals
- added a stock-owned lifecycle service entrypoint at `apps/stock/src/services/stock-lifecycle-service.ts` and switched stock-side service orchestration and live-stock migration reads to the stock-owned contract and table-name modules
- revalidated the deployment path after the extraction slice by running `cmd /c npm run typecheck` and `cmd /c npm run build` successfully

### [v 1.0.192] 2026-04-19 - Fix container compose build path for stock framework imports

- fixed the compose image build failure from `apps/stock/shared/schemas.ts` not resolving `framework/engines/inventory-engine/contracts/index.ts` inside Docker
- updated [.container/Dockerfile](/E:/Workspace/codexsun/.container/Dockerfile) to copy the missing `framework/` tree into the build context before `npm run build`
- revalidated the real container path with `docker compose -f .container/clients/codexsun/docker-compose.yml build`, `docker compose -f .container/database/mariadb.yml up -d`, and `docker compose -f .container/clients/codexsun/docker-compose.yml up -d`
- confirmed the remaining stock TypeScript errors from the user log are not active in the current local workspace: `cmd /c npm run typecheck` passes, and the runtime clone only reintroduces them because it resets to `origin/main`

### [v 1.0.192] 2026-04-19 - Fix stock cloud build failures and harden stock print flows

- fixed the stock app TypeScript and build blockers that were breaking cloud container deployment, including broken stock shared import paths, missing stock UI type imports, invalid purchase-receipt supplier lookup usage, the barcode-designer preview stock-unit shape, and the billing goods-inward purchase receipt number check
- updated the TypeScript project configuration so `framework/engines/*` imports participate correctly in the server build path, allowing `cmd /c npm run typecheck` and `cmd /c npm run build` to pass end to end
- kept the new stock print flows for purchase receipt, stock entry, and consolidated stock ledger on the hidden-iframe print path so browser popup blocking does not break operator printing

### [v 1.0.192] 2026-04-19 - Expand stock operations with ledger, verification, reporting, and print flows

- added a dedicated stock ledger workspace page with grouped product summary, warehouse filtering, drill-down detail, consolidated print output, and product-name resolution from the product master instead of raw stock-unit ids
- reworked periodic verification into a live-stock barcode audit flow with product summary, random scan confirmation, scan-to-next row movement inside the audit table, and session-level batch-save staging
- removed the stock-side sticker-batches concept from the stock workspace and simplified the stock menu and route wiring around stock entry, stock ledger, verification, and print flows
- added stock-facing report and print surfaces for purchase receipt, stock entry, consolidated stock ledger, purchase receipt challan, stock entry verification, and today verified-duty output using hidden-iframe browser print handling

### [v 1.0.192] 2026-04-16 - Remove SQLite runtime configuration from startup paths

- removed SQLite and offline database fields from the active server runtime config contract so the backend only accepts MariaDB or PostgreSQL driver values
- removed SQLite environment defaults from container setup and Playwright startup configs, keeping MariaDB as the default startup database
- updated runtime settings, desk metadata, and architecture docs so operators no longer see SQLite as a supported or planned runtime database option
- repaired the live `codexsun-app` runtime volume from stale SQLite values to MariaDB values, rebuilt `codexsun-app:v1`, recreated the container, and verified `/health` reports `database.primaryDriver` as `mariadb`

### [v 1.0.192] 2026-04-16 - Add dedicated stock app workspace over inventory and tenant engines

- created a first-class `apps/stock` app boundary with shared schemas, workspace items, stock manager services, and internal `/stock/*` routes for purchase receipts, goods inward, stock units, barcode verification, sticker batches, sale allocations, movements, availability, reconciliation, transfers, reservations, and verification
- registered the stock app into the framework suite and cxapp desk, then added dedicated stock workspace routes for purchase receipt and goods inward list, show, and upsert flows
- kept billing as the current document owner while wiring the stock app operationally over the existing billing stock lifecycle services plus inventory-engine and tenant-engine runtime reads and writes
- reworked stock-facing purchase receipt item tables to follow the sales invoice item-table format with Product, Description, Qty, Rate, Amount, and derived quantity/subtotal summary tiles
- reworked goods inward item entry into the same inline item-table pattern, preserving accepted, rejected, damaged, manufacturer barcode, manufacturer serial, and note capture
- added inline core-product autocomplete lookup selection to purchase receipt item tables, carrying selected product id, product name, and product cost into the receipt line while keeping raw product ids out of the visible cell
- removed visible description placeholders from inline item tables and constrained long description values to truncate inside the cell
- filtered the boilerplate `Expected inward quantity.` note out of inline item description displays
- simplified purchase receipt rate cells by removing the visible unit sub-field while preserving line units in saved payloads
- tightened inline item table rows with reduced padding, compact row actions, and shorter in-cell controls

## v-1.0.191

### [v 1.0.191] 2026-04-15 - Rename CRM cold-call menu label to Call Logs

- renamed the CRM workspace side-menu item from `Cold Calls` to `Call Logs` while preserving the existing `cold-calls` route id and URL
- aligned nearby CRM page copy so operators are directed to `Call Logs` for first-contact registration

## v-1.0.190

### [v 1.0.190] 2026-04-15 - CRM scoring and owner leaderboard

- added a CRM-owned deterministic scoreboard service that ranks leads by local pipeline status, interaction count, follow-up work, overdue reminders, and completed tasks
- exposed `GET /internal/v1/crm/scoreboard` with focused service and internal route coverage for lead scoring and owner leaderboard output
- added a CRM Scoreboard workspace page with local lead, engagement, risk, and owner-output metrics without implying predictive AI or external marketing integrations

## v-1.0.189

### [v 1.0.189] 2026-04-15 - CRM customer 360 board

- added a CRM-owned customer 360 read model that aggregates lead profile, interaction history, follow-up tasks, reminders, assignment history, audit evidence, and relationship metrics from persisted CRM records
- exposed `GET /internal/v1/crm/customer-360` and added focused service plus internal route coverage for the response
- added a Customer 360 workspace item and CRM-owned page with a technical-name badge, keeping the slice lead-centric until richer account and contact stores are added

## v-1.0.188

### [v 1.0.188] 2026-04-14 - Rename ecommerce goods inward to stock entry and align it with purchase receipt

- renamed the ecommerce stock page label from `Goods Inward` to `Stock Entry` while keeping the existing route id stable for backward compatibility
- rebuilt the stock-entry form to use the same document-style shell and voucher-style subtable pattern as purchase receipts
- aligned stock-entry queue, posting, and sticker-generation wording so the receiving flow reads consistently across the ecommerce stock workspace

## v-1.0.187

### [v 1.0.187] 2026-04-14 - Split ecommerce stock operations into dedicated submenu pages

- split the ecommerce stock workspace into dedicated stock pages for overview, purchase receipts, goods inward, barcode generation, and outward issue while reusing the existing stock runtime surface
- changed the ecommerce side menu so `Stock Operations` now appears as a grouped stock submenu instead of one flat stock entry
- updated the ecommerce workspace routing and shell behavior so the dedicated stock pages open with the same clean app-style layout as the other ecommerce operator pages

## v-1.0.186

### [v 1.0.186] 2026-04-13 - Ecommerce stock operations frontend and separate stock side-menu entry

- added a dedicated ecommerce stock operations workspace section with overview, purchase receipt, goods inward, stock-unit and sticker preview, and scan-to-sale tabs backed by the new billing stock lifecycle routes
- wired the ecommerce workspace to create purchase receipts and goods inward records, post verified inward stock, generate `25 x 50 mm` sticker batches, verify barcode scans, and issue scanned stock into the sales flow
- added `Stock Operations` as its own ecommerce workspace item and separate stock side-menu group so operators can reach the flow directly from the ecommerce app shell

## v-1.0.185

### [v 1.0.185] 2026-04-13 - Stock-unit lifecycle from verified inward to scan-based sales issue

- extended the billing stock foundation with stock-unit, barcode-alias, sticker-print-batch, and sales-allocation contracts plus JSON-store tables and migrations
- added a backend stock lifecycle service that posts verified goods inward records into stock units, updates aggregate `core` warehouse stock, recalculates purchase receipt received quantities, resolves barcode scans, generates `25 x 50 mm` sticker payloads with company contact details, and records scan-based sales issue allocations
- exposed the new billing stock lifecycle routes for inward posting, stock-unit reads, barcode resolution, sticker batch creation, and sales-allocation listing or creation, and aligned the architecture docs with the new runtime coverage

## v-1.0.184

### [v 1.0.184] 2026-04-13 - Purchase receipt and goods inward stock foundation

- added billing-owned purchase receipt and goods inward contracts, JSON-store tables, services, and internal routes as the first runtime stock-foundation step
- kept inward records non-sellable in this batch by leaving `core` stock untouched even when a goods inward record reaches `verified`
- added focused tests covering the new document lifecycle and route registry, and aligned architecture docs with the new stock-foundation reality

## v-1.0.183

### [v 1.0.183] 2026-04-13 - Stock, warehouse, barcode, and delivery operating blueprint

- added a dedicated stock-operations blueprint covering purchase receipt, goods inward verification, batch or serial identity, barcode mapping, sticker printing, scan verification, warehouse putaway, sales issue, and delivery traceability
- added a shared planning contract for stock workflow stages, identity modes, barcode-source modes, and the first `25 mm x 50 mm` inventory sticker layout
- aligned the architecture and project overview docs so the future inward-to-delivery flow is documented against the current `core`, `billing`, `frappe`, `ecommerce`, and company-data ownership split

## v-1.0.182

### [v 1.0.182] 2026-04-13 - Permission matrix, feature-flag policy, and visibility-ledger design for modular workspace resolution

- added dedicated planning documents for the future permission matrix, feature-flag resolution policy, and visibility-ledger design that will sit underneath the modular workspace system
- added shared TypeScript planning contracts for workspace permissions, feature-flag resolution, and visibility-ledger records so future runtime work has typed architecture guidance
- aligned the modular ERP blueprint, manifest spec, workspace visibility matrix, architecture overview, and project overview to reference the new permission and support-debug layers

## v-1.0.181

### [v 1.0.181] 2026-04-13 - Workspace visibility matrix and deterministic resolution rules

- added a dedicated workspace visibility matrix covering tenant mode, client overlays, industry packs, workspace profiles, and Codexsun control-plane users
- added a shared planning contract for workspace visibility inputs and decisions so future runtime implementation has typed architecture guidance
- documented deterministic visibility precedence from platform defaults through industry, client, role, and feature-flag layers
- linked the workspace matrix back into the modular ERP blueprint and module-manifest specification

### [v 1.0.180] 2026-04-13 - Module manifest specification and first current-to-target inventory

- added the future module-manifest specification covering manifest types, dependency rules, workspace contributions, feature flags, route contributions, settings declarations, and coexistence with the current `AppManifest`
- added the first current-to-target module inventory mapping today’s apps toward future engines, shared packages, standalone apps, industry packs, client overlays, and orchestration roles
- added a shared TypeScript `ModuleManifest` contract plus planning examples for one industry-pack and one client-overlay so future migration work has typed starting points
- linked the manifest spec and module inventory from the main modular ERP blueprint and architecture docs

### [v 1.0.179] 2026-04-13 - Modular ERP blueprint for engines, apps, industries, clients, and workspace orchestration

- added a dedicated modular ERP blueprint covering the future target structure for engines, shared packages, standalone apps, industry packs, client overlays, and Codexsun-operated orchestration
- documented the target dependency rules, communication boundaries, manifest model, workspace-resolution strategy, feature enablement model, open-source split, and phased migration path
- updated the core architecture and project overview docs so the future plugin-first direction is visible from the main ASSIST architecture entry points

### [v 1.0.178] 2026-04-13 - Keep startup failures reachable with a database warning page

- changed framework startup failure handling so the HTTP host stays online when startup preparation fails instead of immediately shutting down and leaving only reverse-proxy connection errors
- added a clear startup-failure message mapper and browser-facing warning page that explains when the configured database is unavailable or misconfigured
- updated auth and storefront frontend request wrappers so login and storefront surfaces show the startup failure explanation instead of only `Request failed with status 503`
- preserved structured `/health` and API startup-failure responses so monitoring still receives `startup_failed` JSON instead of misleading HTML
- validated the batch with `npm run typecheck` and `npx tsx --test tests/framework/runtime/server-startup.test.ts tests/cxapp/web/http-error.test.ts`

### [v 1.0.177] 2026-04-13 - Add explicit confirmation gates for destructive Docker cleanup

- changed the shared Docker setup flow so `CLEAN_INSTALL=true` now also requires `CONFIRM_CLEAN_INSTALL=YES` before volumes and stack teardown can run
- preserved the existing database-drop opt-in and documented it more clearly so database removal still requires `DROP_DATABASES=true` plus `CONFIRM_DROP_DATABASES=YES`
- changed the shared cleanup script to refuse destructive cleanup unless `CONFIRM_DESTRUCTIVE_CLEAN=YES` is supplied, preventing accidental volume and Docker resource removal

### [v 1.0.176] 2026-04-13 - Add Docker native build prerequisites

- added `build-essential` and `python3` to the shared Docker image package layer so native Node dependency installs have the standard compiler and Python prerequisites available during image builds

### [v 1.0.175] 2026-04-13 - Immutable Docker deployment guidance instead of live git-sync rebuilds

- replaced the Docker cloud guidance to recommend immutable image deployment, where the built app ships inside the image and only the image changes during updates
- clarified the common production split between image, runtime `.env`, persistent media volume, and external MariaDB so env and storage are treated as normal persistent infrastructure rather than as update blockers
- updated setup and install docs to discourage runtime `git pull`, `npm ci`, and `npm run build` inside live Ubuntu containers, and documented the simpler pull-restart-healthcheck-rollback sequence instead

### [v 1.0.174] 2026-04-13 - Task-linked application versioning and admin footer display

- introduced a shared application version contract derived from the active task number so installed version `1.0.174`, changelog label `v 1.0.174`, and release tag `v-1.0.174` stay aligned
- extended runtime app settings with application version metadata and surfaced the installed version in the admin sidebar footer so operators can review the running version from inside the application
- added version synchronization wiring in the CLI through `npm run version:sync` and automatic git-helper sync before commit, updating root and mobile package metadata plus the changelog version state together
- updated ASSIST guidance and release discipline docs to require task-linked versioning instead of the old static `0.0.1` flow

### [v 1.0.173] 2026-04-13 - Tighten storefront header and align wrapped category labels

- reduced storefront top-menu height on desktop and mobile plus tightened the desktop category bar spacing for a more compact storefront header
- updated the desktop category menu layout so category items align from the top even when the label wraps onto two lines
- validated the batch with `npm run typecheck`

### [v 1.0.172] 2026-04-13 - Make development runtime logs easier to read

- changed the runtime logger to emit concise human-readable lines in development instead of raw JSON blobs, making startup, request, and warning output easier to scan locally
- preserved structured JSON logging for production-like environments so operational log consumers still receive machine-readable records
- added focused runtime logger coverage for both development formatting and production JSON behavior
- validated the batch with `npm run typecheck` and `npx tsx --test tests/framework/runtime/logger.test.ts`

### [v 1.0.171] 2026-04-13 - Gate unsupported database backup scheduling and clarify admin state

- added explicit backup support metadata to the database-backup dashboard contract so the admin UI can distinguish between disabled scheduling and an unsupported backup runtime
- changed the runtime backup scheduler to no-op when backup execution is unsupported, preventing the previous immediate scheduled-backup failure from firing on every startup
- updated the data-backup admin screen to show the unsupported backup state and disable manual backup, restore drill, and live restore actions with a clear operator message
- validated the batch with `npm run typecheck` and `npx tsx --test tests/framework/database-backup-scheduler.test.ts`

### [v 1.0.170] 2026-04-13 - Media manager controls for public media symlink verify and recreate

- added shared media symlink status and action schemas plus authenticated internal routes for reading the current public media mount state and triggering a verify or recreate action from the admin UI
- extended the runtime media storage helper with an inspection path that reports whether the `/storage` mount is healthy, missing, or misconfigured, including the current mount and resolved target paths
- added a `Public Media Symlink` status card to the media manager with `Verify` and `Add or Recreate` actions so operators can repair the mount without leaving the media screen
- validated the batch with `npm run typecheck`

### [v 1.0.169] 2026-04-13 - Remove SQLite and better-sqlite3 runtime support

- removed `better-sqlite3` and `@types/better-sqlite3` from the application dependency graph and deleted the SQLite-backed database client branch from the framework runtime
- removed SQLite and offline SQLite controls from the runtime settings surface so operators now see only MariaDB and PostgreSQL in the managed database contract
- changed server config to reject `DB_DRIVER=sqlite` and `OFFLINE_SUPPORT_ENABLED=true`, making the runtime fail fast instead of booting a no-longer-supported SQLite path
- changed framework media-root derivation to use the shared runtime storage root instead of the SQLite file path
- replaced the previous SQLite-only backup or restore implementation with an explicit unsupported-runtime error for the remaining MariaDB/PostgreSQL-only runtime
- updated focused framework config, runtime-settings, database, and release-env tests around the new supported database surface
- validated the batch with `npm run typecheck` and `npx tsx --test tests/framework/runtime-settings-service.test.ts tests/framework/runtime/config.test.ts tests/framework/runtime/database.test.ts tests/cli/release-env-check.test.ts`

### [v 1.0.168] 2026-04-13 - Dedicated mail settings editor backed by runtime .env

- added a framework-owned mail settings contract and service for `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME`, `AUTH_OTP_DEBUG`, and `AUTH_OTP_EXPIRY_MINUTES`, with save behavior delegated to the existing runtime settings writer so missing mail keys are created in the managed `.env` output
- exposed authenticated `GET` and `POST /internal/v1/cxapp/mail-settings` routes for the admin frontend instead of requiring operators to edit the full runtime settings payload for SMTP changes
- added a dedicated `Mail Settings` admin page at `/dashboard/settings/mail-settings`, including a filtered `Developer Testing` tab for OTP debug and expiry controls, and registered it in the settings launcher, desk metadata, fallback resource catalog, and the sidebar `Mail` group directly after `Mail Service`
- validated the batch with `npm run typecheck` and focused internal route coverage for the new mail settings endpoint

### [v 1.0.167] 2026-04-13 - Text-editable pricing formula inputs in product upsert

- changed the `Apply Pricing` helper in the core product upsert pricing tab so `Purchase Price`, `Selling %`, and `MRP %` are editable text fields instead of browser number inputs
- moved numeric parsing to calculate time and added a validation warning when any of the three values is not numeric before recalculating pricing rows
- kept the existing `Calculate` action updating all relevant product and variant pricing fields once the entered values parse successfully
- validated the batch with `npm run typecheck`

### [v 1.0.166] 2026-04-13 - Dedicated SEO tab in product upsert

- moved the product SEO form card out of the `Storefront` tab and into a new dedicated `SEO` tab in `apps/core/web/src/features/product/product-upsert-section.tsx`
- kept the existing backend-driven SEO field generator buttons and field behavior unchanged while narrowing the storefront tab back to storefront-specific controls only
- validated the batch with `npm run typecheck`

### [v 1.0.165] 2026-04-13 - Storefront department mapped to product group lookup

- widened the core storefront department contract from enum-only values to text-backed values so the field can reflect product-group master data
- updated the Frappe item-to-core product projection path to preserve storefront department text instead of dropping any non-enum value
- replaced the core product upsert storefront `Department` select with the shared product-group autocomplete lookup and inline create-new flow, and synchronized that selection into `productGroupId`, `productGroupName`, and storefront department text together
- validated the batch with `npm run typecheck`, `npx tsx --test tests/core/product-service.test.ts`, and `npx tsx --test --test-name-pattern "internal route registry includes the core common-module CRUD endpoints" tests/api/internal/routes.test.ts`

### [v 1.0.164] 2026-04-13 - Backend-driven core product SEO field generator

- added shared core SEO generation request and response schemas plus a `generateProductSeoField()` helper so meta title, description, and keywords are generated from backend-owned rules
- exposed `POST /internal/v1/core/products/generate-seo-field` through the internal core route surface for authenticated product workflows
- refined the core product upsert SEO section so `Meta Title`, `Meta Description`, and `Meta Keywords` each render a small right-aligned icon button that requests the generated value from the backend and fills the field
- validated the batch with `npm run typecheck`, `npx tsx --test tests/core/product-service.test.ts`, and `npx tsx --test --test-name-pattern "internal route registry includes the core common-module CRUD endpoints" tests/api/internal/routes.test.ts`

### [v 1.0.163] 2026-04-13 - Backend-driven core product slug generator

- added shared core product slug-generation request and response schemas plus a `generateProductSlug()` helper in `apps/core/src/services/product-service.ts` so slug rules stay backend-owned
- exposed `POST /internal/v1/core/products/generate-slug` through `apps/api/src/internal/core-routes.ts` for authenticated admin and staff product workflows
- refined the core product upsert slug field so its label now supports a small right-aligned icon button that requests the slug from the backend using the current product name and fills the slug input automatically
- validated the batch with `npm run typecheck`, `npx tsx --test tests/core/product-service.test.ts`, and `npx tsx --test --test-name-pattern "internal route registry includes the core common-module CRUD endpoints" tests/api/internal/routes.test.ts`

### [v 1.0.162] 2026-04-13 - Table-based Frappe item field mapping

- replaced the old Frappe item compare card with a table-oriented mapping panel in `apps/frappe/web/src/workspace/item-mapping-compare-panel.tsx`
- the new surface shows the core database key on the left and adds `Frappe`, `Product mapping`, and `Action` dropdown columns so operators can drive mapping from a row-based table instead of the earlier side-by-side form layout
- kept the existing target-product selector, notes, editable field values, flag toggles, preview, and save/sync controls below the table so the current Frappe-owned mapping payload still works without backend contract changes
- validated the batch with `npm run typecheck`

### [v 1.0.161] 2026-04-13 - Preserve prior web chunks across rebuilds

- changed `vite.config.ts` so frontend builds no longer clear `build/app/cxapp/web`, preserving previous hashed lazy chunks alongside the current `index.html` and latest asset set
- changed `apps/framework/src/runtime/system-update/system-update-service.ts` so runtime git-update cleanup no longer deletes the entire web build tree before `npm run build`, while still clearing the server build output and cache directories
- removed the live-deploy failure mode where an already-open dashboard shell could request an older lazy chunk such as `framework-remote-server-key-generator-page-*.js` after deploy and receive a 404 because the file had been deleted during rebuild
- validated the batch with `npm run build`

### [v 1.0.160] 2026-04-13 - Fix live-server git update rebuild missing TypeScript

- fixed the production container rebuild path so image build, runtime repository bootstrap, and framework one-way git update now install dependencies with `npm ci --include=dev` instead of plain `npm ci`
- removed the live-server update failure where the running container rebuilt the runtime repository without devDependencies and then failed immediately at `npm run typecheck` with `sh: 1: tsc: not found`
- updated `.container/Dockerfile`, `.container/entrypoint.sh`, and `apps/framework/src/runtime/system-update/system-update-service.ts` so all build-capable server paths install `typescript` and the rest of the build toolchain consistently
- validated the batch with `bash -n .container/entrypoint.sh`, `npm run typecheck`, and `npm run build`

### [v 1.0.159] 2026-04-13 - Frappe item mapping and core product sync workflow

- added a Frappe-owned `frappe_item_product_mappings` store plus mapping services and internal routes so each ERP item can carry its own core-product projection defaults, target product selection, badge defaults, and operator notes without moving ownership into `apps/core`
- extended live Frappe item pull to accept an optional manual ERP query string such as `disabled=0&item_group=Laptop`, and surfaced that filter input in the Frappe Item Manager so operators can pull narrowed ERP item sets on demand
- changed Frappe item sync to project through the saved mapping draft into canonical `core/product` records, preserving existing core-owned arrays and detail on update while writing ecommerce-facing badge state to the core product storefront payload
- rebuilt the Frappe Item Manager around a compare-and-map workflow: the selected ERP item appears on the left, the resolved core product draft appears on the right, and operators can save mapping defaults before syncing to core
- validated the batch with `npm run typecheck`, `npx tsx --test tests/frappe/services.test.ts`, `npx tsx --test --test-name-pattern "internal route registry includes the frappe connector endpoints" tests/api/internal/routes.test.ts`, and `npm run build`

### [v 1.0.158] 2026-04-13 - ASSIST README guidance refresh

- reloaded `ASSIST/README.md` and recorded the ASSIST guidance refresh in the active execution tracking docs so the current working context stays explicit

### [v 1.0.157] 2026-04-13 - Remote one-way git control API and CLI

- added a framework-owned remote control contract and service for one-way git update orchestration, including a dirty-worktree safety guard that blocks update unless `overrideDirty=true` is explicitly supplied
- exposed `POST /api/v1/framework/server-control/git-update` as a shared-secret protected external endpoint on each remote server and `POST /internal/v1/framework/remote-server/git-update?id=...` as the super-admin proxy route for saved live-server targets
- added `apps/cli/src/remote-server-control-helper.ts` plus `npm run remote:status` and `npm run remote:update` so operators can call remote status and one-way git update directly from CLI using server URL and monitor secret
- validated the batch with `npm run typecheck`, `npx tsx --test tests/framework/remote-server-control-service.test.ts tests/api/external/framework-server-status-routes.test.ts`, and `npx tsx --test --test-name-pattern "internal route registry includes the core common-module CRUD endpoints" tests/api/internal/routes.test.ts`

### [v 1.0.156] 2026-04-13 - Live server version and git metadata

- extended the remote live-server snapshot contract with `appVersion`, `gitStatus`, `latestUpdateMessage`, and `latestUpdateTimestamp`, all derived from the remote runtime's existing framework system-update status
- updated the live-server detail page to show the remote app version, git clean or dirty state, latest update message, and latest update time alongside the existing branch and remote-update state
- validated the batch with `npm run typecheck` and `npx tsx --test tests/framework/remote-server-status-service.test.ts`

### [v 1.0.155] 2026-04-13 - Runtime env-backed remote key generator

- changed the framework remote key generator so `POST /internal/v1/framework/remote-server-secret/generate` now generates a new server monitor secret, saves it into runtime `.env` through the existing env-backed settings service, and returns the saved runtime settings snapshot
- updated the `Generate Server Key` page to load the current `SERVER_MONITOR_SHARED_SECRET` from `/internal/v1/cxapp/runtime-settings`, regenerate it into `.env`, and display the saved env value with an explicit `Refresh from .env` action
- kept `.env` as the single source of truth for the local runtime monitor secret so the frontend value and saved runtime contract stay aligned
- validated the batch with `npm run typecheck`, `npx tsx --test tests/framework/runtime-settings-service.test.ts`, and `npx tsx --test --test-name-pattern "internal route registry includes the core common-module CRUD endpoints" tests/api/internal/routes.test.ts`

### [v 1.0.154] 2026-04-13 - Separate live-server key generator and pasted remote secret flow

- changed the live-server create, edit, and detail flow so monitored targets now save only a pasted remote `SERVER_MONITOR_SHARED_SECRET` value instead of generating target secrets directly inside the monitor UI
- added a dedicated super-admin framework page at `/dashboard/live-server-key-generator` plus a matching `Server / Client` sidebar item to generate and copy a remote monitor key without automatically saving it to any target
- added `POST /internal/v1/framework/remote-server-secret/generate` for one-time key generation and extended remote-server target creation so an optional pasted monitor secret can be saved at create time
- validated the batch with `npm run typecheck`, `npx tsx --test tests/framework/remote-server-status-service.test.ts`, and `npx tsx --test --test-name-pattern "internal route registry includes the core common-module CRUD endpoints" tests/api/internal/routes.test.ts`

### [v 1.0.153] 2026-04-13 - Live server edit and one-time secret flows

- added shared live-server dialogs so super admins can edit saved server targets, paste a per-server `SERVER_MONITOR_SHARED_SECRET` manually, and keep server metadata updates inside the existing framework remote-server boundary
- changed live-server secret generation and regeneration to a one-time reveal flow with copy support on both the list and detail pages, so the generated secret is shown only immediately after creation and is not exposed on normal target reads later
- added `Edit Server` actions to the live-server list and detail view while preserving isolated per-target secret comparison and confirmation behavior for multi-server monitoring
- updated the focused remote-server service test to assert against the one-time generated secret response and validated the batch with `npm run typecheck` and `npx tsx --test tests/framework/remote-server-status-service.test.ts`

### [v 1.0.151] 2026-04-12 - Hosted app status API, CLI, and dashboard operations page

- added a framework-owned hosted-app operations service that reads Docker-managed client app metadata from `.container/clients`, inspects live container state, probes each app's `/health` endpoint, and exposes a clean software update action that reuses framework update behavior
- exposed `GET /internal/v1/framework/hosted-apps` and `POST /internal/v1/framework/hosted-apps/update-clean`, plus a matching CLI helper at `apps/cli/src/hosted-app-helper.ts` with `npm run hosted:status` and `npm run hosted:update-clean`
- added a new admin dashboard page at `/dashboard/hosted-apps` with live app status cards, per-app server status table, refresh action, clean software update action, settings launcher entry, and framework permission metadata
- validated the batch with `npm run typecheck`, `npx tsx --test tests/framework/hosted-apps-service.test.ts`, focused internal route coverage, and `npm run build`

### [v 1.0.150] 2026-04-12 - Docker startup health-wait extension for heavier clients

- extended the shared Docker setup health wait from the previous fixed `120 x 2s` loop to a configurable default of `300 x 2s`, giving slower clients such as `codexsun` and `techmedia_in` more time to finish startup migrations and seeders before the setup script declares failure
- updated the readiness probe to detect runtime `startup_failed` health responses and stop early on real startup errors instead of only timing out
- validated the change with `bash -n .container/bash-sh/setup.sh`

### [v 1.0.149] 2026-04-12 - Local Docker setup script portability fix

- added a repository `.gitattributes` rule to keep shell scripts and the container entrypoint checked out with LF line endings instead of CRLF
- normalized `.container/bash-sh/setup.sh`, `.container/bash-sh/setup-local.sh`, and `.container/entrypoint.sh` so Bash-based local Docker installs no longer fail on syntax errors caused by Windows line endings
- validated the fix with `bash -n` on the shared setup scripts plus `docker compose ... config` for both `.container/clients/codexsun/docker-compose.yml` and `.container/clients/techmedia_in/docker-compose.yml`

### [v 1.0.148] 2026-04-12 - ERPNext Item pull field-permission fix

- fixed the live Frappe item pull query to stop requesting `default_warehouse` from ERPNext `Item`, because the current production ERPNext site rejects that field as not permitted in `/api/resource/Item`
- preserved local `defaultWarehouse` values by continuing to reuse the existing snapshot value or the saved Frappe env default when ERPNext does not return a warehouse field
- validated the fix with `npm run typecheck`, `npx tsx --test tests/frappe/services.test.ts`, and a live read-only ERPNext `Item` request using the current `.env` connector contract

### [v 1.0.147] 2026-04-12 - Cloud runtime git-root detection fix

- fixed framework runtime system-update git-root resolution so git-sync deployments search the current working directory, ancestor directories, and runtime repository candidates for the real `.git` root instead of assuming one fixed layout
- removed the cloud deploy failure mode where the running app could repeatedly invoke `git` from `/opt/codexsun` or another non-repository directory after the entrypoint cloned the runtime repository into `/opt/codexsun/runtime/repository`
- confirmed the Docker build and entrypoint clone path were already healthy, so no Dockerfile change was needed for this fix
- validated the batch with `npm run typecheck` and `npm run build`

### [v 1.0.146] 2026-04-12 - Live ERPNext item pull into Frappe products

- added a Frappe-owned live pull service that reads ERPNext `Item` records through the verified env-backed connector and stores them in the app-owned `frappe_products` snapshot table
- exposed `POST /internal/v1/frappe/items/pull-live` and wired a `Pull ERP` action into the Frappe product manager so all ERP items can be imported into the local system without browser-side Frappe access
- preserved existing core-product linkage metadata when pulled ERP items match local snapshots by `itemCode`
- validated the batch with `npm run typecheck`, `npx tsx --test tests/frappe/services.test.ts`, `npx tsx --test tests/framework/runtime/database-process.test.ts`, and a focused route-registry assertion for `POST /internal/v1/frappe/items/pull-live`

### [v 1.0.145] 2026-04-12 - Remove inactive Zetro wiring and sanitize ERPNext ToDo HTML

- removed the inactive `zetro` app from active app-suite registration, internal route aggregation, desk navigation, workspace routing, database-module registration, the package script, and the dedicated route test so production builds no longer import files that are not present in this workspace
- sanitized ERPNext ToDo descriptions at the Frappe connector boundary so Quill HTML such as `<div class="ql-editor read-mode"><p>...</p></div>` is stored and displayed as plain text in local snapshots
- validated the batch with `npm run typecheck`, `npx tsx --test tests/framework/runtime/database-process.test.ts`, and `npm run build`

### [v 1.0.144] 2026-04-12 - Frappe product manager alignment

- added a dedicated `frappe_products` app-owned snapshot table and seeder for Frappe product records while preserving `frappe_items` as a legacy read fallback
- changed Frappe item/product snapshot writes to persist through `frappe_products`, keeping product sync orchestration inside `apps/frappe`
- refactored the Frappe Item Manager into the same compact `MasterList` table, same-height toolbar actions, inline sync status text, ERP status dot, row selection, pagination, and popup create/edit flow used by the ToDo workspace
- added selected product sync and all-filtered product sync actions for projecting Frappe product snapshots into core products
- validated the batch with `npx tsx --test tests/frappe/services.test.ts` and `npx tsx --test tests/framework/runtime/database-process.test.ts`

### [v 1.0.143] 2026-04-12 - Frappe ToDo ERP status header

- removed the generic Frappe workspace hero card so the ToDo workspace no longer shows the connector intro block above the operational table
- added a compact green or red ERP connection status dot beside the `ToDos` header, backed by the existing internal Frappe settings status
- widened the shared `MasterList` title contract to accept a renderable header node so app-owned sections can add compact status indicators without adding extra cards
- validated the batch with `npm run typecheck`; `git diff --check` reported only line-ending warnings

### [v 1.0.142] 2026-04-12 - Compact Frappe ToDo toolbar status

- moved Frappe ToDo sync result messages under the toolbar as compact right-aligned helper text
- removed the separate sync-result status card so selected push, live sync, delete, and verify feedback no longer creates an extra card above the table
- reduced the ToDo master-list header copy from a hero-style description to compact record-count context
- validated the batch with `npm run typecheck`

### [v 1.0.141] 2026-04-12 - Frappe ToDo sync verification status

- added a read-only Frappe ToDo verification service that compares app-owned local snapshots with live ERPNext ToDo records using the connector's existing matching and payload-equality rules
- exposed `POST /internal/v1/frappe/todos/verify-sync` and a frontend API helper so the browser can request verification only through the internal API boundary
- added a `Sync` table column with `Synced`, `Not synced`, `Changed`, and pre-verification `Verify` states
- added a same-height `Verify` toolbar button that reports synced, not-synced, and changed record counts without mutating either local snapshots or ERPNext
- validated the batch with `npm run typecheck`, `npx tsx --test tests/frappe/services.test.ts`, and a focused route-registry assertion for `POST /internal/v1/frappe/todos/verify-sync`

### [v 1.0.140] 2026-04-12 - Selected Frappe ToDo actions

- removed the extra Frappe ToDo section card and metric cards so the workspace starts directly at the operational ToDo list with less vertical whitespace
- moved refresh, selected push, live sync, selected delete, and create into one same-height icon toolbar with distinct action colors
- added ToDo table multi-select through the shared `MasterList` row-selection path
- extended live sync payloads with optional `todoIds` so the `Push` toolbar action syncs only the selected local ToDo snapshots
- added local selected-delete support for Frappe ToDo snapshots through `DELETE /internal/v1/frappe/todos` without deleting ERPNext records
- validated the batch with `npm run typecheck`, `npx tsx --test tests/frappe/services.test.ts`, and a direct internal-route registry assertion covering `DELETE /internal/v1/frappe/todos`

### [v 1.0.139] 2026-04-12 - ERPNext User dropdowns for Frappe ToDo

- added an app-owned ERPNext `User` reference fetch for Frappe ToDo so `allocated_to` and `assigned_by` can display full names and be selected from live ERPNext users without direct browser access to Frappe
- enriched ToDo snapshots with `allocatedToFullName` from linked ERPNext users while preserving `assignedByFullName` from the ToDo document or linked User record
- replaced manual allocated-to and assigned-by inputs with searchable user dropdowns in the Frappe ToDo popup, filtering out disabled users from selectable options
- hid reference type, reference name, role, and sender from the current ToDo upsert form while preserving those ERPNext fields in synced snapshots for a later advanced toggle
- trimmed ToDo descriptions on create and update, and validated the batch with `npm run typecheck`, `npx tsx --test tests/frappe/services.test.ts`, `npx tsx --test tests/framework/runtime/database-process.test.ts`, and a live read-only ERPNext User lookup

### [v 1.0.138] 2026-04-12 - ERPNext-aligned Frappe ToDo fields

- inspected the live ERPNext `ToDo` DocType through the env-backed Frappe connector and confirmed the active field pattern for status, priority, color, due date, assignee, description, reference, role, assigned-by, sender, and assignment-rule fields
- expanded the shared Frappe ToDo schema, upsert payload, seeds, and live sync mapping so app snapshots preserve ERPNext ToDo fields instead of dropping them during pull or push
- updated the Frappe ToDo popup dialog and operational data grid to expose the ERPNext field groups from the live form while retaining the shared core-style `MasterList` table pattern
- validated the batch with `npm run typecheck` and `npx tsx --test tests/frappe/services.test.ts`

### [v 1.0.137] 2026-04-12 - Frappe ToDo workspace data-grid polish

- replaced the Frappe ToDo side-panel create and edit form with a controlled popup dialog so record editing no longer competes with the list layout
- switched the Frappe ToDo list to the shared `MasterList` data-grid block used by core operational screens, adding sortable columns, pagination, searchable filters, technical names, and a denser production-style table surface
- moved `Live Sync` and `Create ToDo` into the list header while keeping `Refresh` at the outer Frappe section level
- validated the UI refactor with `npm run typecheck`

### [v 1.0.136] 2026-04-12 - Live Frappe ToDo sync

- added a strict Frappe-owned ToDo live sync flow that requires the current `.env` connector config to be enabled, configured, and verified before talking to ERPNext
- implemented bidirectional ToDo sync through `apps/frappe`, pulling ERPNext `ToDo` resources into the local snapshot store and pushing local snapshots back to ERPNext through the shared Frappe connection factory
- made repeated ToDo sync idempotent by matching existing ERPNext ToDos before POST, skipping unchanged remote writes, and re-reading ERPNext after push so the app snapshot count matches the Frappe record count after every sync
- exposed `POST /internal/v1/frappe/todos/sync-live` and a frontend API helper so the browser talks only to the internal API instead of reading `.env` or calling ERPNext directly
- added a super-admin `Live Sync` action to the Frappe ToDo workspace with pushed, pulled, and failed counts after completion
- validated the batch with `npm run typecheck`, `npx tsx --test tests/frappe/services.test.ts`, and a direct internal-route registry assertion covering `POST /internal/v1/frappe/todos/sync-live`

### [v 1.0.135] 2026-04-12 - Editable Frappe env contract

- changed the Frappe connector settings surface from read-only status to an editable env contract so the connector workspace can save only `FRAPPE_*` keys back into `.env` without touching unrelated runtime settings
- fixed the Frappe env loader to read from `.env` only instead of letting `process.env` override the file, which keeps the saved connector contract as the actual single source of truth and allows the edited values to apply immediately to Frappe verification flows
- added a Frappe-only settings save payload and internal `PATCH /internal/v1/frappe/settings` route, with app-owned save orchestration in `apps/frappe` and route-level activity logging for the connector workspace update action
- reworked the Frappe connection screen into an editable two-card env form for base URL, site name, API credentials, timeout, enabled flag, and projection defaults, while keeping live verification on the same screen and preventing direct browser access to `.env`
- validated the batch with `npm run typecheck`, `npx tsx --test tests/frappe/services.test.ts`, and a direct internal-route registry assertion covering `GET/PATCH /internal/v1/frappe/settings` and `POST /internal/v1/frappe/settings/verify`

### [v 1.0.134] 2026-04-12 - Strict env-only Frappe live connection

- replaced the Frappe connector's database-backed settings authority with a strict `.env` contract, added `apps/frappe/src/config/frappe.ts`, and enforced fail-fast parsing for required ERP URL, site, credentials, timeout, and projection defaults without fallback values
- added a shared Frappe connection factory in `apps/frappe/src/services/connection.ts` and rewired backend verification plus Sales Order push flows to use that single live client with token auth, timeout enforcement, and optional site headers owned inside `apps/frappe`
- reduced persisted Frappe settings storage to config-keyed verification state only, removed writable connector config updates from the internal API surface, and updated observability logging so handshake outcomes write latency and failure details into monitoring plus activity history
- reworked the Frappe admin connection workspace into a read-only status and verify surface backed by `/internal/v1/frappe/settings` and `/internal/v1/frappe/settings/verify`, and added a frontend service layer so the browser never reads `.env` directly
- updated Frappe seeds, schemas, policies, and focused tests for the env-only contract, then validated the batch with `npm run typecheck`, `npx tsx --test tests/frappe/services.test.ts tests/framework/runtime/database-process.test.ts`, and a live `verifyFrappeSettings` handshake using the repository `.env`
- confirmed the live ERP handshake succeeded against `https://erp.thetirupurtextiles.com` for site `thetirupurtextiles`, authenticating `sundar@sundar.com` in `497 ms` with the result persisted to the current verification state

### [v 1.0.133] 2026-04-12 - Frappe app documentation baseline

- added `ASSIST/FRAPPE.md` as a code-backed app detail guide for the current `apps/frappe` boundary, covering manifest ownership, shared contracts, persistence layout, service responsibilities, internal routes, workspace sections, and cross-app trigger points
- documented the connector's live transactional bridge scope, including paid-order Sales Order push, ERP delivery or invoice or return sync-back, shared observability logging, and the current split between implemented behavior and contract-only later projection baselines
- recorded the current Frappe-specific limitations that are visible in code today, including local-only snapshot CRUD for todos, items, and purchase receipts, lazy-created transaction-sync tables outside the registered migration list, receipt payload decoration that strips product-link display fields, and workspace gaps versus the broader internal route surface
- replaced the stale execution batch tracking with a new `#133` ASSIST documentation batch aligned to the current Frappe source inspection
- validated the batch by checking the new documentation against `apps/frappe`, `apps/api/src/internal/frappe-routes.ts`, ecommerce Sales Order trigger wiring, and `tests/frappe/*`

### [v 1.0.132] 2026-04-12 - Menu logo variant toggles and global-loader designer

- extended the shared storefront `menuDesigner` contract with per-surface `logoVariant` selection and a new `globalLoader` surface so menu logo treatment can independently use the light or dark brand asset without changing fresh defaults
- updated the menu editor with light-or-dark logo toggles on each surface and added a dedicated global-loader editor below the app-menu section so loader logo size and position can be tuned from the same workspace
- wired storefront top menu, storefront footer, the dashboard app sidebar, and the shared global loader to the selected runtime logo variant while preserving existing default behavior for untouched storefront settings
- replaced the ecommerce menu editor's static global-loader mock with the real shared loader component so operators now tune the same animated runtime surface, including draft brand-asset previews, directly from the editor
- changed each menu-surface logo-tone chooser to a switch-style control, aligned the menu and logo actions into one row, and made the main `Publish live` action run menu save, logo draft save, logo publish, and storefront publish as one sequence
- hard-centered the shared global-loader logo anchor so the default global loader logo now sits at the true center and offsets move predictably from that centered baseline
- normalized the current live `public/logo.svg` canvas by removing the off-center wrapper SVG so the light logo artwork itself now renders centered inside the global loader
- hardened the ecommerce settings tests so legacy stored settings and revision snapshots hydrate the new `globalLoader` and `logoVariant` fields through defaults
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts`

### [v 1.0.131] 2026-04-12 - Menu editor company-logo upload and live publish

- added primary-company branding API helpers to the ecommerce admin client so the menu editor can read companies, load the company brand draft, save the shared branding draft, and trigger the existing public SVG publish flow without duplicating backend logic
- extended the menu editor with a new `Logo source and publish` panel that mirrors the company-logo workflow for light logo, dark logo, and favicon uploads, keeps the company logo tab intact, and publishes the live public brand files directly from the ecommerce workspace
- wired the menu editor previews to use the newly selected brand SVG source immediately for preview surfaces while keeping the live runtime reload after publish so storefront and app chrome refresh against the published files
- added focused Playwright coverage for uploading and publishing the light logo directly from the menu editor
- validated the batch with `npm.cmd run typecheck` and `npx.cmd playwright test tests/e2e/menu-editor-logo-publish.spec.ts`

### [v 1.0.130] 2026-04-12 - Menu editor per-field reset actions

- added icon-based reset actions inside the menu editor for hover color, area background color, logo background color, and the position offsets so operators can restore each control to the seeded default without manually retyping values
- wired those reset actions against `defaultStorefrontSettings.menuDesigner` per surface so future default changes remain the single source of truth for reset behavior
- corrected the menu-editor permission split while touching the screen so `Save menu designer` uses edit access and `Publish live` uses approval access
- validated the change with `npm.cmd run typecheck`

### [v 1.0.129] 2026-04-12 - Menu editor live publish and fresh-default restoration

- added direct `Publish live` support to the standalone menu editor so approved operators can push menu-logo changes to the public storefront from the same designer screen instead of leaving that workflow
- restored the fresh menu-designer defaults to preserve the earlier storefront and app-menu appearance, removing the unintended forced framed-logo look for untouched data while keeping the new numeric designer available for deliberate customization
- removed the extra default frame borders around the storefront top-menu and footer logo wrappers so transparent menu-designer backgrounds render like the previous menu layout until a background is intentionally chosen for testing or customization
- validated the fix with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts`; the suite still logs the existing non-blocking SMTP auth warning during email-path tests, but all tests passed

### [v 1.0.128] 2026-04-12 - Full-control menu logo-area designer

- replaced the first-pass storefront menu editor presets with a company-logo-tab-style numeric designer so each menu surface now stores direct frame width, frame height, logo width, logo height, X offset, Y offset, hover color, area background color, and logo background color
- rebuilt the `Menu Editor` admin screen around those numeric controls and a grid-backed preview surface so operators can tune awkward or non-standard client logos directly instead of being limited to coarse preset size or alignment options
- updated storefront top-menu desktop and mobile, storefront footer desktop and mobile, and the dashboard app sidebar to render the logo area from the new frame-and-offset settings instead of the removed position and size presets
- kept backward compatibility by merging stored menu-designer payloads through current defaults, so earlier saved preset-era menu settings hydrate cleanly into the new numeric logo-area model
- validated the refactor with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts`; the suite still logs the existing non-blocking SMTP auth warning during email-path tests, but all tests passed

### [v 1.0.127] 2026-04-12 - Storefront revision compatibility for menu designer

- fixed the storefront designer workflow failure triggered by older revision snapshots that were saved before the new `menuDesigner` field existed
- hardened storefront revision reads so historical snapshots are merged through current storefront defaults before revision schema parsing, allowing workflow and history responses to remain backward compatible without rewriting stored revision rows
- extended the focused ecommerce service suite with a regression that seeds a legacy revision snapshot missing `menuDesigner` and verifies workflow reads hydrate the new menu-designer defaults correctly
- validated the fix with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts`; the suite still logs the existing non-blocking SMTP auth warning during email-path tests, but all tests passed

### [v 1.0.126] 2026-04-12 - Storefront menu designer for logo presentation

- added a new standalone ecommerce `Menu Editor` workspace item and designer section that lets operators control logo position, logo size, and logo hover color for the storefront top menu, storefront footer, and dashboard app sidebar from one shared storefront-designer surface
- extended the storefront settings contract and seed defaults with a new `menuDesigner` slice so the new menu presentation controls persist through the existing draft, publish, rollback, and public-settings flows without introducing a separate storage model
- wired storefront top-menu desktop and mobile surfaces plus storefront footer desktop and mobile surfaces to consume the new menu-designer values, so header and footer logo alignment, size, and hover treatment now reflect the saved storefront designer configuration
- updated the shared dashboard sidebar logo block to read the storefront menu-designer settings through the existing workflow or public settings endpoints, so the app menu can follow the same light-logo sizing, alignment, and hover accent configuration without importing ecommerce UI into `apps/ui`
- extended the focused ecommerce service coverage so storefront settings merge and legacy hydration now verify the new `menuDesigner` defaults and persisted values
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts`; the service suite still logs the existing non-blocking SMTP auth failure during email-path exercises, but all tests passed

### [v 1.0.125] 2026-04-12 - Company logo upload path verification

- refactored the company branding publish path to the requested root-public model where generated brand files are kept under `storage/branding/active`, publish backs up the previous live files into `storage/backups/branding`, and the live storefront-facing files are overwritten only in the repository root `public/` folder as `logo.svg`, `logo-dark.svg`, and `favicon.svg`
- restored runtime brand URLs to `/logo.svg`, `/logo-dark.svg`, and `/favicon.svg` with version query strings, and updated the framework static host to prefer repository-root `public/` files before built assets so storefront top menu, footer, and favicon all resolve the same live public branding source in the current runtime
- updated the app sidebar brand mark to always use the light logo variant and changed the logo chip styling to a light-mode surface so the app menu branding matches the requested light treatment
- kept compatibility for existing logo drafts and media references that still point at legacy `/storage/...` files under the previous web-root storage path, so publish continues to work while the live public output moves to the new canonical public-folder source
- added a dedicated Playwright spec for the real upload path and updated the publish-flow assertions so coverage now verifies storefront runtime uses the root public brand files after publish
- validated the batch with `npx.cmd tsx --test tests/cxapp/company-brand-assets-service.test.ts`, `npx.cmd playwright test tests/e2e/storefront-brand-publish.spec.ts`, `npx.cmd playwright test tests/e2e/company-logo-upload.spec.ts`, and `npm.cmd run typecheck`

### [v 1.0.123] 2026-04-12 - Local container git-sync runtime mode defaults

- fixed the local container setup defaults so `GIT_SYNC_ENABLED=true` no longer boots the runtime in development mode where the entrypoint overlays stale image code onto the synced repository
- updated both shared and local setup scripts to default local git-sync runs to `APP_ENV=production`, keeping the runtime repository authoritative while preserving local port and URL behavior
- documented the local git-sync mode in the codexsun container usage guide so operators know the expected `GIT_SYNC_ENABLED=true` plus `APP_ENV=production` combination
- validated the batch with `bash -n .container/bash-sh/setup.sh` and `bash -n .container/bash-sh/setup-local.sh`

### [v 1.0.122] 2026-04-12 - Companies branding data compatibility hardening

- fixed the Companies workspace load regression where malformed persisted `brandAssetDesigner` data could break company reads and surface the frontend `Unexpected token '<'` JSON parse error
- hardened company record normalization so legacy or invalid branding variants are sanitized per field, with safe fallback defaults for broken variant payloads, invalid colors, invalid modes, and out-of-range numeric values
- added a focused company-service regression test that seeds malformed company branding payloads directly into persistence and verifies company list and detail reads still succeed
- validated the batch with `npx.cmd tsx --test tests/cxapp/company-service.test.ts` and `npm.cmd run typecheck`

### [v 1.0.121] 2026-04-12 - Storefront branding publish validation and SVG designer hardening

- hardened the company logo designer and publish path for real SVG workflows by adding UTF-16-safe SVG decoding, XML or metadata sanitization, extracted color-token editing, and token-vs-uniform color handling across the editor schema, UI, and publish service
- expanded focused company brand asset service coverage for UTF-16 SVG sources, sanitized wrapper-heavy SVG files, and token-mode color override publishing so the runtime file writer is exercised against more realistic branding assets
- added a targeted Playwright publish-flow spec that logs in through the company upsert logo designer, publishes storefront branding, and verifies the runtime brand-profile plus storefront top-menu, footer, and favicon asset paths consume the published public files
- validated the batch with `npx.cmd playwright test tests/e2e/storefront-brand-publish.spec.ts`

### [v 1.0.120] 2026-04-12 - Logo designer draft usability

- moved the company logo designer onto its own temporary draft table and internal read or save routes so draft editing is no longer coupled to the company form save cycle
- fixed the logo-tab editor refresh path so width, height, color, and offset changes stay editable instead of being overwritten by stale memoized tab content
- added debounced autosave for existing companies, explicit draft-state feedback for `ready`, `unsaved`, `saving`, `saved`, and `error`, and kept manual `Save Draft` plus public publish on the same draft-save path
- added quick per-variant actions to reset editor values from the selected SVG source defaults and copy light-logo settings into dark, favicon, and company-logo variants
- validated the batch with `npm run typecheck` and `npx tsx --test tests/cxapp/company-brand-assets-service.test.ts tests/api/internal/company-brand-assets-routes.test.ts tests/framework/runtime/database-process.test.ts`

### [v 1.0.118] 2026-04-11 - Storefront hero fit and footer-shell lock

- tightened the desktop storefront hero into a shorter, more screen-fitting composition, then rebalanced the content spacing and fixed the media frame to a vertically centered `610x560` image holder without changing the accepted mobile hero behavior
- restored the homepage footer and floating contact surfaces to the live storefront shell, then compacted the mobile footer into a grouped disclosure layout that saves space while keeping social icons and the copyright line in the final row
- aligned the mobile footer brand block closer to the desktop tone, added the rendered footer section marker as `section.storefront.footer`, and surfaced visible technical-name badges for the layout, header, and footer shells so footer shell and section names are both visible in review mode
- updated the shared floating contact launcher so the circular scroll-to-top action now lives inside the launcher stack and appears only when the contact launcher is open
- locked this storefront UX and UI version as the accepted baseline because the current layout fit is considered correct; future card additions should preserve this layout unless a change is explicitly required
- validated the batch with repeated `npm.cmd run typecheck` runs and `npx.cmd playwright test tests/e2e/storefront-mobile-matrix.spec.ts`

### [v 1.0.117] 2026-04-11 - Storefront staged section reveal continuation

- re-enabled the next hidden homepage block in sequence for staged storefront review by bringing `section.storefront.home.coupon-banner` back into the review surface while keeping later homepage sections hidden
- continued the staged reveal by bringing `section.storefront.home.new-arrivals` back into the review surface while still leaving the later homepage blocks hidden
- continued the staged reveal further by bringing `section.storefront.home.best-sellers` back into the review surface while still leaving the later homepage blocks hidden
- continued the staged reveal further by bringing `section.storefront.home.gift-corner` back into the review surface while still leaving the later homepage blocks hidden
- continued the staged reveal further by bringing `section.storefront.home.trending` back into the review surface while still leaving the later homepage blocks hidden
- split the storefront trending section into dedicated desktop and mobile implementations, with mobile now using a contained horizontal swipe rail so the section stays inside the viewport and reveals remaining cards by scroll or touch gesture
- softened the mobile trending edge fades and changed the desktop trending rail to show paired chevrons with disabled states when overflow exists, so narrow desktop widths now keep left and right rail controls discoverable
- continued the staged reveal further by bringing `section.storefront.home.brand-stories` back into the review surface while still leaving the final later homepage block hidden
- split the storefront brand-stories section into dedicated desktop and mobile implementations, with mobile now using a contained horizontal rail so scrolling into the section no longer expands the page width
- re-enabled the final hidden homepage block by bringing `section.storefront.home.campaign-trust` back into the review surface and gave it a dedicated mobile storefront wrapper instead of reusing the deferred desktop path
- widened the desktop homepage section gaps and locked the current fully visible storefront homepage composition as the accepted baseline for the next design-polish passes
- validated the reveal with `npm.cmd run typecheck` and `npx.cmd playwright test tests/e2e/storefront-mobile-matrix.spec.ts`

### [v 1.0.116] 2026-04-11 - Storefront homepage UX restoration

- restored the public storefront homepage route by reconnecting the split `storefront-home` shell, model, and section view modules instead of leaving the route in hidden shell-review mode
- brought back the original homepage content rhythm with the standard `max-w-[96rem]` landing container and explicit skeleton loading sections so the route no longer renders as an empty shell while storefront data is loading
- removed the hardcoded storefront browser title by deriving document titles from the runtime company brand, with the `/` storefront route now resolving to the company name only
- started a staged storefront section-review mode by hiding the homepage hero slider in the home shell override while keeping the remaining sections and loading states visible for mobile-by-mobile layout fixes
- removed the remaining hardcoded main-shell browser title fallback by adding dashboard title formatting from the active shell location plus runtime company brand, and by changing the root HTML title to a neutral application fallback
- continued the staged storefront mobile review by suppressing `section.storefront.home.announcement` on the mobile shell only while leaving the desktop announcement section unchanged
- tightened the storefront homepage review mode so only `section.storefront.home.featured` and `section.storefront.home.announcement` remain visible, while the homepage shell is reduced to the top menu and category menu with the footer hidden
- added a developer-facing technical name marker for the storefront category rail as `shell.storefront.category-menu`
- stabilized the mobile announcement strip by switching it to a bounded two-line layout with fixed minimum height, so changing announcement copy length no longer reflows the surrounding homepage shell
- re-enabled the homepage hero slider inside the staged review shell while keeping the tighter visibility rules for the remaining homepage sections unchanged
- fixed the hero no-image path by rendering a dedicated full-width placeholder media surface, so slider items without images keep the same mobile frame width as image-backed items
- fixed the hero failed-image path by bypassing the generic storefront image fallback inside hero media, so broken remote image URLs now use the same fixed-width hero placeholder instead of a narrower generic SVG
- simplified the mobile hero further by removing the image entirely on mobile and replacing it with one centered fixed `400x320` holder shared by all slides, while also removing mobile slide animation for the holder and content
- removed the leaking desktop hero divider and media-frame border chrome that stayed visible between slide transitions, so the slider no longer shows stray vertical or rounded border lines beside the media area
- tightened `section.storefront.home.hero` to a viewport-capped height on both mobile and desktop by scaling the internal media and content blocks from available screen height instead of leaving the hero at its previous taller fixed dimensions
- restored mobile hero images and slide transitions inside the existing fixed holder, while keeping the frame overflow-hidden so image dimensions no longer stretch the mobile slider layout
- re-enabled the next homepage section in sequence for staged review by bringing `section.storefront.home.categories` back into the review surface while keeping the later homepage blocks hidden
- fixed the categories cards for mobile by letting the grid and card body shrink properly, clamping long text, and stacking the action button on narrow widths so `section.storefront.home.categories` no longer pushes the page horizontally
- removed the categories first-load mobile layout glitch by giving the block a dedicated mobile section implementation instead of reusing the deferred desktop path that only settled after the user scrolled to the section
- tightened the mobile featured cards by moving `section.storefront.home.featured` to a dedicated mobile section path that uses the denser card variant without changing the desktop featured layout
- added visible homepage error handling for failed landing fetches while preserving the live shell split and validated the path with `npm.cmd run typecheck`, `npx.cmd playwright test tests/e2e/storefront-mobile-matrix.spec.ts`, and `npx.cmd tsx --test tests/ecommerce/storefront-metadata.test.ts`

### [v 1.0.115] 2026-04-11 - ASSIST repo-state synchronization

- reconciled `ASSIST` guidance with the live repository by adding the current `crm` suite app and the `mobile` companion client where the docs previously still described the older app inventory
- corrected stale ASSIST references for shared UI source-of-truth paths, current `cxapp` auth or mailbox endpoints, available helper commands, and the testing stack now that Playwright, e2e flows, and broader service coverage exist in the repo
- confirmed the execution trackers return to `No active batch` after this docs-only sync so there is no incomplete tracked work left in `ASSIST/Execution`

### [v 1.0.114] 2026-04-11 - Framework system update history stores failure reasons

- extended framework system-update history entries to persist the underlying failure reason for blocked, failed update, and failed reset runs instead of only the generic rollback message
- updated the admin System Update recent-activity UI to render the stored failure reason inline when present so operators can see the actual git, npm, or build error without checking server logs first
- validated the batch with `npx.cmd tsx --test tests/framework/system-update-service.test.ts`, `npm.cmd run typecheck`, and a live Docker runtime update check against the local `codexsun-app` container

### [v 1.0.113] 2026-04-11 - Framework system update history shows both revision sides

- extended framework system-update history entries to resolve readable metadata for both the previous and current commits in each activity item
- updated the admin System Update recent-activity UI to render human-readable `From Commit` and `To Commit` blocks with commit message, date, tag, and version instead of only raw commit hashes
- validated the batch with `npx.cmd tsx --test tests/framework/system-update-service.test.ts` and `npm.cmd run typecheck`

### [v 1.0.112] 2026-04-11 - Framework system update revision metadata in admin UI

- extended the framework system-update contract to expose current revision metadata, including applied commit summary, commit date, git tag, and package version for the active runtime commit
- enriched system-update history reads so recent update and reset activity can resolve commit metadata from stored commit hashes without changing the persisted log format
- updated the admin System Update screen to show the applied commit message, date, and tag or version under the current commit card and recent activity entries, with safe fallback text when a commit is not tagged
- validated the batch with `npx.cmd tsx --test tests/framework/system-update-service.test.ts` and `npm.cmd run typecheck`

### [v 1.0.111] 2026-04-10 - Local git-sync runtime update alignment

- fixed development runtime settings so changing Git sync controls from Core Settings schedules a real container restart when the live runtime mode depends on entrypoint-only behavior
- fixed framework system-update resolution so live update status, preview, reset, and update actions inspect the active runtime Git worktree instead of the embedded image path when Git sync is enabled
- updated the container entrypoint so local Git-sync mode overlays the current image snapshot onto the runtime repository before rebuild, which keeps local browser testing aligned with the current workspace without requiring an immediate GitHub push
- validated the batch with focused runtime-settings and system-update tests, `npm run typecheck`, and `npm run build`; `npm run lint` and `npm run test` still report unrelated pre-existing repo failures including existing auth-fixture logins, workspace-shape drift, app-suite expectations, database-process ordering expectations, and broad eslint debt outside this batch

### [v 1.0.110] 2026-04-10 - Storefront shell isolation review and top-menu polish

- kept the storefront shell split intact while adding an isolated shell-testing mode on the home route so top menu, category menu, and footer can be re-enabled one by one without deleting the underlying storefront sections or technical-name boundaries
- refined the mobile storefront top menu by moving search to its own full-width second row and adding a desktop-style account or login dropdown button beside the brand for faster manual shell review
- documented the concrete git-helper location in `ASSIST/README.md`, kept the underlying storefront section markers in place for later staged re-enable work, and validated the current shell pass with `npm.cmd run typecheck`

### [v 1.0.109] 2026-04-10 - Storefront shell split and landing refactor sequence

- split the storefront-wide shell boundary into stable desktop and mobile switchers for layout, header, top menu, and footer while keeping public component entry names intact for callers
- extracted the storefront homepage into ecommerce-owned feature modules under `apps/ecommerce/web/src/features/storefront-home`, including a thin route entry, shared landing model, shell or section boundaries, and explicit developer-facing `data-technical-name` markers
- split the homepage hero into dedicated desktop and mobile implementations, centralized backend-designer-derived visibility decisions in the landing model, aligned storefront shell switching to tablet-safe breakpoints, and validated the batch with `npm.cmd run typecheck`, `npm.cmd run build`, `npx.cmd playwright test tests/e2e/storefront-mobile-matrix.spec.ts`, and `npm.cmd run test:e2e:storefront-smoke`; the smoke run still reports non-blocking SMTP authentication failures while order flows pass

### [v 1.0.108] 2026-04-10 - ASSIST consolidation and startup workflow hardening

- consolidated `ASSIST` into a smaller active guidance set by removing stale database docs, completed execution archives, scratch planning files, and legacy worklog material
- added `ASSIST/README.md` as the future startup entrypoint and documented that agents must read the current `ASSIST` file set before starting development
- hardened the local workflow rules so meaningful work is planned in `ASSIST/Execution/PLANNING.md`, tracked in phased checklists in `ASSIST/Execution/TASK.md`, routed through the changelog and git-helper flow, and cleaned out of execution docs after completion

### [v 1.0.107] 2026-04-09 - Billing workspace split and legacy billing or Frappe payload compatibility

- completed Phase `1.1` by splitting the billing workspace entry surface into app-owned section modules while preserving the public import path through `apps/billing/web/src/workspace-sections.tsx`
- hardened billing reporting reads and Frappe connector settings reads so older persisted payloads missing newer derived fields no longer break the billing reports workspace or Frappe settings, items, purchase receipts, and policy screens with `Invalid request payload`
- validated the batch with `npm.cmd run typecheck`, `npm.cmd run build`, `npx.cmd tsx --test tests/billing/reporting-service.test.ts`, and `npx.cmd tsx --test tests/frappe/services.test.ts`; the existing billing e2e outstanding-bill assertion mismatch remains outside the fixed payload-parse regression

### [v 1.0.105] 2026-04-08 - ERP integration decision signoff

- completed Stage `8.5` by making the release-governance ERP mode explicit from the implemented repo state
- recorded the current decision as `transactional bridge enabled`, because paid ecommerce orders already push into ERPNext Sales Order and connector-owned fulfilment, invoice, return, and refund sync-back flows already write local ecommerce snapshots
- kept the decision bounded by the existing operational rules: storefront paid state commits locally first, ERP write failures fail closed, and transactional retries remain manual replay only after operator review

### [v 1.0.103] 2026-04-08 - Security and operations checklist gate

- completed Stage `8.3` by defining one dedicated release-ops command and checklist for monitoring, backup, restore-drill, and security-review controls
- added `npm.cmd run test:release:security-ops` over the existing framework route checks plus the admin-shell framework operations e2e, then recorded the checklist scope in a dedicated planning artifact
- validated the gate with `npm.cmd run test:release:security-ops`; this closes repo-runtime operational checks while leaving production credential and destination verification for Stage `8.4`

### [v 1.0.101] 2026-04-08 - Storefront smoke checklist gate

- completed Stage `8.1` by defining one dedicated storefront smoke command and checklist for the homepage-to-paid-order-to-tracking journey
- added `npm.cmd run test:e2e:storefront-smoke` over the existing ecommerce end-to-end specs covering buy flow, checkout, confirmation, tracking, accessibility labels, and mobile viewport sanity, then recorded the checklist scope in a dedicated planning artifact
- validated the gate with `npm.cmd run test:e2e:storefront-smoke`; the run passed while still surfacing non-blocking SMTP authentication failures and a Frappe Sales Order settings parse warning outside the storefront smoke path

### [v 1.0.100] 2026-04-08 - Analytics and attribution model baseline

- completed Stage `7.2.3` by adding a persisted ecommerce-owned attribution snapshot on storefront orders plus a protected attribution-performance report for operators
- extended checkout and order contracts with optional source, medium, campaign, referrer, landing-path, and channel grouping data, normalized that snapshot safely for legacy orders, and exposed grouped channel or campaign reporting through an internal analytics route
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`; test runs still emit expected SMTP authentication warnings from the current mail configuration

### [v 1.0.99] 2026-04-08 - RMA and customer-service workflow maturity

- completed Stage `7.2.2` by linking customer return or cancellation requests, support handling, and refund progression into one storefront RMA workflow
- extended ecommerce support-case and order-request contracts with linked ids, team ownership, richer `awaiting_return -> refund_pending -> completed` lifecycle state, and a unified RMA or customer-service report for operators
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`; test runs still emit expected SMTP authentication warnings from the current mail configuration

### [v 1.0.98] 2026-04-08 - Multi-warehouse readiness baseline

- completed Stage `7.2.1` by adding an operator-facing multi-warehouse readiness report on top of the current aggregated-stock storefront model
- extended ecommerce reporting contracts with active product warehouse-spread and active reservation split-allocation visibility, then exposed the report through a protected internal ecommerce analytics route without changing customer-facing warehouse behavior
- validated the batch with `npm.cmd run typecheck`, `npx.cmd tsx --test tests/ecommerce/services.test.ts`, and `npx.cmd tsx --test --test-name-pattern "internal route registry includes" tests/api/internal/routes.test.ts`

### [v 1.0.97] 2026-04-08 - Advanced commerce maturity baseline

- completed Stage `7.1.1` through `7.1.4` by adding ecommerce-owned recommendation and search-ranking improvements, deterministic segment pricing, lifecycle-marketing state, and merchandising-experiment readiness
- extended shared ecommerce catalog, customer, and order contracts with recommendation rails, customer commercial profiles, lifecycle-marketing state, merchandising automation reports, and auditable applied-promotion snapshots
- improved storefront catalog ranking and PDP recommendations, added internal advanced-commerce analytics routes, applied repeat-segment pricing during authenticated checkout, and validated the batch with `npm.cmd run typecheck`, `npx.cmd tsx --test tests/ecommerce/services.test.ts`, and `npx.cmd tsx --test --test-name-pattern "internal route registry includes" tests/api/internal/routes.test.ts`

### [v 1.0.96] 2026-04-08 - ERP fulfilment and finance return sync baseline

- completed Stage `6.2.1` through `6.2.4` by adding connector-owned delivery-note, invoice, and return or refund sync-back flows plus a reconciliation queue and replay entrypoint
- extended ecommerce orders with local ERP delivery-note, invoice, and return link snapshots, updated shipment and refund lifecycle state from Frappe transaction sync records, and exposed replayable mismatch reporting through protected Frappe routes
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/frappe/services.test.ts`; a broader internal-route run still reports an unrelated existing billing year-end control failure

### [v 1.0.95] 2026-04-08 - ERP sales-order mapping persistence baseline

- completed Stage `6.1.3` by persisting ERP Sales Order linkage on ecommerce orders instead of keeping the mapping only inside the Frappe connector store
- extended storefront order schema and legacy normalization with an `erpSalesOrderLink` snapshot, then wired the existing Sales Order push transport to save the connector sync result back onto the ecommerce order after checkout, webhook, and reconciliation-driven pushes
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/frappe/services.test.ts`; a broader combined regression run also exposed an unrelated existing billing route failure about missing financial-year year-end controls

### [v 1.0.94] 2026-04-08 - ERPNext Sales Order approval and retry policy baseline

- completed Stage `6.1.2` by making the approval and retry guardrails for Sales Order push explicit as a Frappe-owned contract instead of leaving them as scattered architecture notes
- added a shared Sales Order push policy schema plus protected route that records auto-approval scope, duplicate guard behavior, and the rule that transactional ERP write retries are manual replay only after failure
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/frappe/services.test.ts tests/api/internal/routes.test.ts`

### [v 1.0.93] 2026-04-08 - ERPNext Sales Order push baseline

- completed Stage `6.1.1` by adding a Frappe-owned Sales Order bridge for paid ecommerce orders
- added connector-local Sales Order sync records plus ERP request mapping from paid storefront orders, then wired checkout verification, webhook capture, and payment reconciliation transport paths to invoke the Frappe sync without blocking the local paid-order flow on ERP availability
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/frappe/services.test.ts tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### [v 1.0.72] 2026-04-08 - Billing stock bridge and valuation baseline

- completed Stage `B10` by bridging posted billing vouchers into `core` stock movement for purchase receipts, sales-linked stock reduction, stock adjustments, and landed-cost capitalization
- added stock-aware billing voucher contracts, centralized inventory replay and synchronization logic, and a stock valuation report surfaced through the billing reporting workspace
- validated the batch with `npm run typecheck` and `npx.cmd tsx --test tests\\billing\\voucher-service.test.ts tests\\billing\\reporting-service.test.ts tests\\api\\internal\\routes.test.ts`

### [v 1.0.92] 2026-04-08 - Storefront no-live-ERP runtime baseline

- completed Stage `5.3.3` by turning the no-live-ERP storefront runtime rule into executable test coverage
- extended ecommerce boundary tests so storefront runtime services cannot add direct network fetch calls, then added a forced-fetch-failure runtime test proving landing, catalog, product detail, and mock-checkout still work from persisted projected data when Razorpay is disabled
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/boundary.test.ts tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### [v 1.0.91] 2026-04-08 - Ecommerce projected catalog read boundary baseline

- completed Stage `5.3.2` by introducing a narrow ecommerce-facing projected-product read-model service backed by persisted core product data
- moved catalog, order, customer, and storefront SEO consumers onto the local projected read-model path and added a boundary test that blocks direct Frappe imports plus ad hoc projected core-product reads from unrelated ecommerce services
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/boundary.test.ts tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### [v 1.0.90] 2026-04-08 - Frappe item projection execution baseline

- completed Stage `5.3.1` by replacing the scaffold-only Frappe item sync placeholder with a real item-master projection path into `apps/core`
- projected approved Frappe item-master fields through the existing core product service, updated item sync logs and connector events with real create or update outcomes, and kept price, stock, and customer-commercial projection staged for later batches
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/frappe/boundary.test.ts tests/frappe/services.test.ts tests/api/internal/routes.test.ts`

### [v 1.0.89] 2026-04-08 - Frappe orchestration boundary enforcement baseline

- completed Stage `5.2.5` by making the connector-boundary rule executable instead of leaving it as planning prose only
- added a repo boundary test that fails if non-Frappe, non-API app code imports `apps/frappe/src/services/*` directly, keeping connector orchestration inside `apps/frappe` while still allowing API transport wiring and tests
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/frappe/boundary.test.ts tests/frappe/services.test.ts tests/api/internal/routes.test.ts`

### [v 1.0.88] 2026-04-08 - Frappe customer commercial profile contract baseline

- completed Stage `5.2.4` by defining the authoritative ERP customer-group and commercial-profile enrichment contract inside the Frappe boundary
- added a typed contract and protected route that records current identity, field-mapping, lifecycle, and out-of-scope rules for `frappe customer commercial snapshot -> ecommerce customer commercial profile` enrichment while preserving ecommerce ownership of auth, coupons, rewards, and checkout validation
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/frappe/services.test.ts tests/api/internal/routes.test.ts`

### [v 1.0.87] 2026-04-08 - Frappe stock projection contract baseline

- completed Stage `5.2.3` by defining the authoritative ERP warehouse and stock snapshot to core storefront-availability projection contract inside the Frappe boundary
- added a typed contract and protected route that records current stock identity, field-mapping, lifecycle, and out-of-scope rules for `frappe stock snapshot -> core product stock` projection while preserving existing `quantity` and `reservedQuantity` storefront semantics
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/frappe/services.test.ts tests/api/internal/routes.test.ts`

### [v 1.0.86] 2026-04-08 - Frappe price projection contract baseline

- completed Stage `5.2.2` by defining the authoritative ERP price-list snapshot to core commerce-pricing projection contract inside the Frappe boundary
- added a typed contract and protected route that records current price identity, field-mapping, lifecycle, and out-of-scope rules for `frappe item price snapshot -> core product price` projection while preserving existing `sellingPrice` and `mrp` storefront semantics
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/frappe/services.test.ts tests/api/internal/routes.test.ts`

### [v 1.0.82] 2026-04-08 - Frappe connection hardening baseline

- completed Stage `5.1.1` by hardening Frappe connector settings reads, updates, and verification behavior for production-safe operator workflows
- masked saved connector secrets on read, preserved saved credentials across blank-field non-secret updates, and persisted last verification status only when the verified payload matched the saved connector settings
- updated the Frappe connection workspace to show saved-credential state and last verification status, then validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/frappe/services.test.ts tests/api/internal/routes.test.ts`

### [v 1.0.83] 2026-04-08 - Frappe sync retry and failure policy baseline

- completed Stage `5.1.2` by defining an explicit production-safe retry, timeout, and failure policy for future Frappe connector sync execution
- added a shared sync-policy contract and protected route, derived the timeout budget from saved connector settings, and surfaced the retry or fail-closed rules in the Frappe overview workspace
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/frappe/services.test.ts tests/api/internal/routes.test.ts`

### [v 1.0.84] 2026-04-08 - Frappe connector observability baseline

- completed Stage `5.1.3` by adding connector-specific monitoring, activity-log exception evidence, and an operator-facing observability report for current Frappe verification and sync flows
- extended the shared framework monitoring baseline with a dedicated `connector_sync` channel and threshold, added a Frappe observability service plus route, and surfaced connector health with recent exceptions in the Frappe overview workspace
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/frappe/services.test.ts tests/api/internal/routes.test.ts tests/framework/runtime/monitoring.test.ts tests/framework/runtime/logger.test.ts`

### [v 1.0.85] 2026-04-08 - Frappe item projection contract baseline

- completed Stage `5.2.1` by defining the authoritative ERP item snapshot to core product projection contract inside the Frappe boundary
- added a typed contract and protected route that records the current identity, field-mapping, lifecycle, and out-of-scope rules for `frappe item snapshot -> core product` projection without yet implementing the write path
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/frappe/services.test.ts tests/api/internal/routes.test.ts`

### [v 1.0.81] 2026-04-08 - Storefront performance standards baseline

- completed Stage `4.3.4` by codifying homepage rail and block performance rules into a shared storefront performance-standards layer instead of leaving them inline or docs-only
- moved homepage deferral, root-margin, reserved-height, and fallback rules onto a reusable standards map so future storefront rails can follow the same contract without reopening first-paint policy each time
- validated the batch with `npm.cmd run typecheck` and `npm.cmd run test:e2e:performance`

### [v 1.0.80] 2026-04-08 - Storefront homepage deferral baseline

- completed Stage `4.3.3` by deferring heavy below-the-fold homepage merchandising sections behind intersection-aware rendering and lazy-loaded block imports
- kept the hero and announcement surfaces immediate while moving featured, category, coupon, gift, trending, brand-story, and campaign-trust sections onto deferred mounting so first render and scroll work stay narrower
- validated the batch with `npm.cmd run typecheck` and `npm.cmd run test:e2e:performance`

### [v 1.0.79] 2026-04-08 - Storefront image delivery baseline

- completed Stage `4.3.2` by introducing a shared storefront image primitive and moving key storefront hero, category, product-card, and product-gallery surfaces onto explicit intrinsic sizing and consistent loading behavior
- kept hero imagery eager with high priority while preserving lazy loading for lower-priority card and gallery images, so the production-like performance gate continues to pass after the image-delivery changes
- validated the batch with `npm.cmd run typecheck` and `npm.cmd run test:e2e:performance`

### [v 1.0.78] 2026-04-08 - Storefront performance budget baseline

- completed Stage `4.3.1` by adding a production-like Playwright performance budget gate for home, catalog, and product storefront routes
- introduced a dedicated performance test config, browser-side vitals capture helper, and package script so the storefront budget can run locally now and in CI once workflow wiring is added
- validated the batch with `npm.cmd run typecheck` and `npm.cmd run test:e2e:performance`

### [v 1.0.77] 2026-04-08 - Storefront publishing approval baseline

- completed Stage `4.2.3` by separating storefront draft editing from live publish and rollback approval authority
- added a dedicated storefront approval permission, kept legacy storefront-manage as compatibility fallback, and enforced approval-only access on live publish or rollback routes while leaving draft save with designer-edit access
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/api/internal/routes.test.ts`

### [v 1.0.76] 2026-04-08 - Storefront version history baseline

- completed Stage `4.2.2` by deriving storefront version history from immutable live revision snapshots for the full settings document and key content blocks
- exposed protected history reads through ecommerce internal routes and surfaced recent settings plus home-slider version entries inside the existing designer workspaces
- validated the batch with `npm.cmd run typecheck`, `npx.cmd tsx --test tests/ecommerce/services.test.ts`, and `npx.cmd tsx --test tests/api/internal/routes.test.ts`

### [v 1.0.75] 2026-04-08 - Storefront publishing workflow baseline

- completed Stage `4.2.1` by moving storefront designer saves onto a draft settings record with explicit publish and rollback actions
- kept public storefront reads on the live settings document, exposed internal workflow state for draft-vs-live preview, and wired the main storefront settings workspace to publish or rollback from immutable live revisions
- validated the batch with `npm.cmd run typecheck`, `npx.cmd tsx --test tests/ecommerce/services.test.ts`, and `npx.cmd tsx --test tests/api/internal/routes.test.ts`

### [v 1.0.71] 2026-04-08 - Storefront block governance validation baseline

- completed Stage `4.1.1` by adding a shared validation layer across the editable storefront block designers
- wired client-side validation and save blocking into the main homepage and merchandising block editors while keeping seeded defaults and live previews intact
- validated the batch with `npm.cmd run typecheck`

### [v 1.0.72] 2026-04-08 - Storefront server-side payload validation baseline

- completed Stage `4.1.2` by enforcing shared server-side validation for editable storefront links and media references
- hardened the ecommerce catalog schemas so persisted storefront settings only accept root-relative or explicit safe-link formats, and media fields only accept root-relative or `http(s)` references
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts`

### [v 1.0.73] 2026-04-08 - Storefront designer role permission baseline

- completed Stage `4.1.3` by splitting storefront designer visibility from storefront designer edit access in the ecommerce role model
- updated internal storefront routes and the main designer surfaces so read-only roles can inspect content while save actions remain limited to edit-capable roles, with legacy `ecommerce:storefront:manage` kept as compatibility fallback
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/api/internal/routes.test.ts`

### [v 1.0.74] 2026-04-08 - Storefront live revision safety baseline

- completed Stage `4.1.4` by snapshotting the current live storefront settings into an immutable revision store before each live overwrite
- added bounded storefront revision retention and corrected storefront settings hydration so persisted timestamps survive reads, preventing live history from collapsing back to seed defaults
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts`

### [v 1.0.70] 2026-04-08 - Ecommerce accounting compatibility verification baseline

- completed Stage `3.3.4` by adding an ecommerce accounting-compatibility report for invoice and GST workflow review
- exposed a protected internal report route and payments-workspace view that flags blocked lifecycle cases, mixed-rate GST orders, refund credit-note follow-up, and unmapped shipping or handling tax treatment
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### [v 1.0.69] 2026-04-08 - GST review and receipt tax breakdown baseline

- completed Stage `3.3.3` by adding a stored GST review snapshot for each storefront order
- extended storefront orders and receipt generation with taxable-value and GST-component breakdown derived from product tax ids plus seller-state versus customer-state comparison
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### [v 1.0.67] 2026-04-08 - Billing posting model and notes baseline

- completed Stages `B1`, `B2`, `B3`, and `B4.1` for `apps/billing` by hardening voucher lifecycle controls, normalizing voucher header and line storage, adding immutable posted ledger entries, and rebuilding accounting reports from posted entries with traceability
- implemented first-class credit note and debit note documents with source-voucher linkage, GST-aware note posting treatment, and explicit note register and detail routes in the billing workspace
- added the general ledger report, updated billing planning and task tracking, and validated the batch with `npm run typecheck` plus `npx.cmd tsx --test tests\\billing\\voucher-service.test.ts tests\\billing\\reporting-service.test.ts tests\\api\\internal\\routes.test.ts`

### [v 1.0.68] 2026-04-08 - Zone shipping and COD eligibility baseline

- completed Stage `3.3.2` by adding ecommerce-owned shipping zones with country, state, and pincode-prefix matching plus surcharge, ETA, free-shipping threshold override, and COD-eligibility rules
- extended checkout and order creation so delivery quotes resolve from shipping method plus matched zone, and created orders snapshot both the selected shipping method and resolved zone
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### [v 1.0.67] 2026-04-08 - Shipping methods and ETA model

- completed Stage `3.3.1` by adding persisted storefront shipping methods with courier, SLA, ETA, and COD-eligibility metadata
- extended storefront settings and order contracts so checkout selects active delivery methods, charge calculation uses the chosen method fallback, and created orders snapshot the selected delivery promise
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### [v 1.0.66] 2026-04-08 - ERP price-list compatibility baseline

- completed Stage `3.2.4` by documenting price-list compatibility with ERPNext if ERP becomes storefront pricing source of truth
- recorded that ERP item-price and price-list selection must resolve through `frappe` projection into normalized `core` pricing fields before `ecommerce` reads them, while preserving current `sellingPrice`, `mrp`, and `basePrice` semantics
- validated the batch with architecture and planning consistency review across the current `core`, `ecommerce`, and `frappe` pricing boundaries

### [v 1.0.65] 2026-04-08 - Promotion engine scope baseline

- completed Stage `3.2.3` by defining the future promotion engine scope and phased rollout around the current live pricing, coupon, and merchandising surfaces
- recorded Phase A as the current baseline of `core` price authority plus ecommerce-owned customer coupons, kept current campaign or coupon-banner or gift-corner surfaces presentation-only, and scoped later rule-driven promotions and segmented pricing into later phases
- validated the batch with architecture, planning, and current pricing-coupon-merchandising code-path review across the `core`, `ecommerce`, and `frappe` boundaries

### [v 1.0.64] 2026-04-08 - Coupon validation and usage constraints baseline

- completed Stage `3.2.2` by adding real checkout coupon validation, expiry handling, and usage constraints backed by ecommerce-owned customer portal coupon state
- extended customer and order contracts with coupon lifecycle metadata, enforced `active -> reserved -> used` coupon handling through checkout and payment flows, and added a storefront checkout coupon input for signed-in customers
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### [v 1.0.63] 2026-04-08 - Pricing authority decision baseline

- completed Stage `3.2.1` by recording `apps/core` as the current authoritative source for storefront sell price and compare-at price
- aligned architecture and go-live planning so `apps/ecommerce` resolves effective pricing from active `core` price rows using `sellingPrice` and `mrp`, with `basePrice` only as fallback when no active row exists
- validated the batch with architecture, planning, and storefront pricing code-path review across the current `core`, `ecommerce`, and `frappe` boundaries

### [v 1.0.62] 2026-04-08 - Warehouse visibility rules baseline

- completed Stage `3.1.4` by defining warehouse and stock visibility rules for storefront availability
- recorded that storefront availability stays aggregated across active `core` stock rows, warehouse-level stock remains internal to operations, and store pickup still uses the same shared sellable pool as delivery orders
- validated the batch with architecture, planning, pickup-flow, and storefront availability code-path review across the current `core` and `ecommerce` boundaries

### [v 1.0.61] 2026-04-08 - Stock reservation lifecycle baseline

- completed Stage `3.1.3` by adding storefront stock reservation at checkout for orders entering `payment_pending`
- extended the storefront order contract with explicit stock-row reservation metadata, applied reservation and release logic against `core` product stock rows, and added expiry, cancellation, failed-payment, and late-capture guards around the reservation lifecycle
- validated the batch with `npm.cmd run typecheck`, `npx.cmd tsx --test tests/ecommerce/services.test.ts`, and `npx.cmd tsx --test tests/api/internal/routes.test.ts`

### [v 1.0.60] 2026-04-08 - Low-stock and oversell rules baseline

- completed Stage `3.1.2` by defining the storefront low-stock threshold and oversell-prevention rules against the existing `core` stock model
- recorded sellable quantity as `active quantity - reservedQuantity`, set low stock to quantities `1` through `5`, treated `0` as out of stock, and kept cart and PDP stock indicators advisory until checkout revalidation
- documented the current boundary that `payment_pending` does not yet create a new stock hold, so reservation behavior remains the explicit follow-up in Stage `3.1.3`, then validated the batch with architecture, planning, and checkout code-path review

### [v 1.0.59] 2026-04-08 - Inventory authority decision baseline

- completed Stage `3.1.1` by recording `apps/core` as the current authoritative source for sellable storefront stock
- aligned architecture and go-live planning so `apps/ecommerce` continues reading stock only from `core`, while future ERPNext stock must flow through `apps/frappe` snapshots projected into `core`
- validated the batch with architecture, planning, and code-path consistency review across the current `core`, `ecommerce`, and `frappe` boundaries

### [v 1.0.58] 2026-04-08 - Ecommerce overview KPI dashboard

- completed Stage `2.4.5` by adding ecommerce overview KPIs for conversion, AOV, order count, paid vs failed, fulfilment aging, and refund aging
- exposed a protected internal overview-report route for ecommerce analytics readers and replaced the static ecommerce overview cards with live KPI-backed dashboard content plus drill-down links into payments, orders, and support
- kept conversion and aging values aligned to the existing ecommerce order and operational-aging reports, then validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### [v 1.0.57] 2026-04-08 - Ecommerce fulfilment and refund aging reports

- completed Stage `2.4.4` by adding fulfilment-aging and refund-aging operational reporting derived from the existing ecommerce order and refund queues
- exposed a protected internal aging-report route, shared aging-report schemas, and storefront admin client support so finance operators can review aging bands and order-level drill-down from the payments operations screen
- kept active refund work from duplicating into fulfilment aging, then validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### [v 1.0.56] 2026-04-08 - Ecommerce refund and settlement-gap exports

- completed Stage `2.4.3` by adding refund and settlement-gap CSV exports from the existing ecommerce payments operations surface
- exposed protected internal export routes, shared document schemas, and storefront admin client helpers so finance operators can download refund-queue and settlement-visibility data without leaving the payments screen
- kept the reporting slice aligned to the existing live Razorpay settlement queue and refund queue models, then validated it with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### [v 1.0.54] 2026-04-07 - Ecommerce customer lifecycle controls

- completed Stage `2.3.4` by adding ecommerce-owned customer lifecycle states for `active`, `blocked`, `deleted`, and `anonymized`, with synchronized auth-session revocation and identity anonymization handling
- added protected admin customer report and lifecycle-action routes, a dedicated ecommerce customer operations screen, and a new ecommerce customer-management permission in the auth seed set
- validated the batch with `npm run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### [v 1.0.53] 2026-04-07 - Auth session hardening baseline

- completed Stage `2.3.3` by adding auth-user failed-login counters, temporary lockout windows, stale admin-session timeout enforcement, and audit-log coverage for login or session rejection events
- added the cxapp auth-hardening migration, repository support for failed-login state and forced session revocation, and auth-service checks for lockout, idle timeout, disabled-account rejection, and auth activity logging
- validated the batch with `npm run typecheck` and `npx.cmd tsx --test tests/core/auth-service.test.ts tests/api/internal/routes.test.ts tests/framework/runtime/database-process.test.ts`

### [v 1.0.51] 2026-04-07 - Ecommerce permission enforcement baseline

- completed Stage `2.3.2` by enforcing ecommerce route permissions through the shared internal-session guard instead of relying only on actor type checks
- mapped ecommerce storefront designer, orders, support, payments, and communications routes to the seeded ecommerce permission keys so operator roles now control real route access
- added an internal route test proving a support agent can access the support queue but is blocked from order operations without the required permission
- validated the batch with `npm run typecheck` and `npx.cmd tsx --test tests/api/internal/routes.test.ts`

### [v 1.0.50] 2026-04-07 - Ecommerce operator role baseline

- completed Stage `2.3.1` by defining the ecommerce operator role set in shared auth seed data, using the existing Super Admin baseline plus seeded ecommerce admin, catalog manager, order manager, support agent, finance operator, and analyst roles
- added dedicated ecommerce permission definitions for workspace, storefront, catalog, orders, support, payments, communications, and analytics so later route enforcement has stable permission keys to target
- extended the auth-route validation to assert the new ecommerce roles and permissions are exposed through the existing internal RBAC APIs
- validated the batch with `npm run typecheck` and `npx.cmd tsx --test tests/api/internal/routes.test.ts`

### [v 1.0.49] 2026-04-07 - Customer portal communication history

- completed Stage `2.2.5` by exposing customer-safe storefront communication history through a new authenticated portal route backed by the existing mailbox ledger
- added communication history visibility on portal order detail and support surfaces so customers can review order confirmation and related customer-facing mail activity without admin resend controls
- added ownership-filtered service coverage for customer communication history plus external route registration validation
- validated the batch with `npm run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/framework/runtime/http-routes.test.ts`

### [v 1.0.48] 2026-04-07 - Customer portal reorder and wishlist cart utilities

- completed Stage `2.2.2` by adding customer return and cancellation request workflows with portal request creation, admin review queue actions, and order-linked request visibility
- completed Stage `2.2.3` by adding direct support-case entry from customer order detail so portal support requests can be opened with the order number and order context already linked
- completed Stage `2.2.4` by adding repeat-order utilities on portal order list and order detail surfaces, plus a bulk wishlist-to-cart action using the shared storefront cart store
- validated the batch with `npm run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts tests/framework/runtime/http-routes.test.ts`

### [v 1.0.47] 2026-04-07 - Ecommerce support queue and portal receipt downloads

- completed Stage `2.1.5` by adding an ecommerce-owned customer support queue linked to customers and orders, with portal case creation, admin queue actions, and shared support-case contracts
- added support-case json-store persistence, authenticated customer support-case routes, protected internal support queue and update routes, and a dedicated ecommerce admin `Support` workspace screen
- completed Stage `2.2.1` by adding authenticated customer receipt downloads from portal order list and order detail surfaces through a new storefront order-receipt route and receipt document generator

### [v 1.0.46] 2026-04-07 - Ecommerce refund queue baseline

- completed Stage `2.1.4` by extending the payments operations surface with a refund queue and admin refund-status progression
- added refund queue items and refund summary counters to the ecommerce payments report, exposed a protected refund-status update route, and wired frontend client support for refund request and refund queue actions
- extracted a shared admin order operations dialog reused by both orders and payments, then added full-refund request entry from order detail plus queued, processing, and rejected refund actions in the payments screen

### [v 1.0.45] 2026-04-07 - Storefront desktop width standardization

- standardized the main storefront desktop rails to `max-w-[96rem]` across homepage, catalog, PDP, cart, checkout, category rail, and customer portal layout so large screens use a consistent 1536px content width
- widened the homepage hero internals with larger media framing, broader copy allowance, and decorative fill layers so added desktop space reads as intentional storefront design instead of empty gutters
- updated shared design-system storefront preview blocks to use the requested responsive width behavior without changing live commerce grid density rules outside preview mode
- validated the batch with `npm run typecheck` and `npm run build`

### [v 1.0.44] 2026-04-07 - Ecommerce admin order actions baseline

- completed Stage `2.1.2` by adding admin order detail operations for cancel, fulfilment progression, shipment tracking, delivery completion, and order-confirmation resend
- extended the shared ecommerce order contract with shipment details and admin action payloads, added protected internal order-detail and order-action routes, and wired the frontend admin orders queue with a detail dialog for lifecycle operations
- updated demo seed compatibility for shipment metadata and validated the batch with `npm run typecheck` plus targeted ecommerce service and internal route tests

### [v 1.0.43] 2026-04-07 - Ecommerce admin order queue baseline

- completed Stage `2.1.1` by replacing the ecommerce orders placeholder with a real admin order queue backed by a typed internal report
- added shared order-queue schemas, report bucketing in the ecommerce order service, a protected `GET /internal/v1/ecommerce/orders/report` route, and a frontend API method for admin order operations
- added a searchable, tabbed orders workspace surface covering action-required, fulfilment, shipment, pickup, completed, and closed queues, then validated the slice with `npm run typecheck` and targeted service or route tests

### [v 1.0.42] 2026-04-07 - Storefront mobile matrix baseline

- completed Stage `1.6.5` by adding a fixed device-matrix storefront audit for homepage, catalog, PDP, cart, checkout, and tracking
- added a shared viewport-overflow assertion in the new Playwright mobile matrix spec and aligned the cart assertion to stable shopper controls instead of brittle heading copy
- validated the responsive baseline with `npm run test:e2e -- tests/e2e/storefront-mobile-matrix.spec.ts` and marked `1.6.5` complete in `TASK.md`

### [v 1.0.41] 2026-04-07 - Storefront accessibility baseline

- completed Stage `1.6.4` with a storefront accessibility pass covering keyboard bypass, control naming, and form labeling across homepage, catalog, PDP, cart, checkout, and tracking
- added a shared skip-to-content link in the storefront shell, improved hero-slider and PDP control labels, and tightened tracking and storefront search field accessibility
- added a focused Playwright storefront accessibility smoke test and marked `1.6.4` complete in `TASK.md`

### [v 1.0.40] 2026-04-07 - Storefront SEO crawl baseline

- completed Stage `1.6.3` by adding shared storefront canonical-path helpers, browser-side canonical and Open Graph tags, and robots meta handling on top of the storefront route metadata layer
- added runtime-backed public `robots.txt` and `sitemap.xml` routes so crawl policy and sitemap discovery now come from framework config, storefront target rules, and active seeded catalog data
- added targeted tests for storefront metadata resolution, sitemap generation, robots generation, and public route registration, then marked `1.6.3` complete in `TASK.md`

### [v 1.0.39] 2026-04-07 - Storefront route metadata baseline

- completed Stage `1.6.2` by adding a shared storefront route-metadata map and browser-side metadata controller instead of page-by-page title handling
- normalized metadata resolution for both root storefront routes and `/shop/*` storefront routes, then restored the existing document title and description outside storefront pages
- added targeted tests for storefront metadata resolution and title formatting, and marked `1.6.2` complete in `TASK.md`

### [v 1.0.38] 2026-04-07 - Storefront legal pages baseline

- completed Stage `1.6.1` by adding backend-owned storefront legal and trust pages for shipping, returns, privacy, terms, and contact, backed by seeded ecommerce settings instead of hardcoded frontend copy
- exposed a new public storefront legal-page payload, wired frontend query and route support, and added a reusable storefront legal-page surface for both root and `/shop/*` route shapes
- repointed storefront footer trade links to the new trust pages and added targeted route-registration and ecommerce service tests for the legal-page slice
- marked `1.6.1` complete in `TASK.md` and initiated Stage `1.6.2` metadata planning for the next storefront production task

### [v 1.0.37] 2026-04-07 - Stage 1.2 completion and PDP specification drawer

- completed the remaining Phase 1 Stage 1.2 ecommerce reliability tasks by adding stable order-confirmation and tracking coverage, formalizing the storefront order state machine, and enforcing idempotent checkout or payment verification behavior
- updated storefront order storage, payment verification, duplicate-submit handling, and customer-facing order status surfaces so retries no longer duplicate pending orders or replay successful payment capture
- added grouped product specification data to the storefront PDP response and built a new accordion-driven specification surface with a right-side product details drawer sourced from live core product data
- refined the specification drawer into a narrow, simpler key-value sheet, fixed its interaction with the floating contact button, and prevented page shift on open or close by stabilizing scrollbar gutter in the shared UI CSS
- marked `1.2.4`, `1.2.5`, and `1.2.6` complete in `TASK.md`

### [v 1.0.36] 2026-04-07 - Pickup support and checkout payment recovery

- added storefront pickup support across ecommerce settings, checkout, order contracts, order detail rendering, and admin routing, including a standalone pickup designer under the ecommerce side menu
- completed authenticated and guest checkout reliability updates with shared lookup-driven address capture, incomplete-address repair, and stable cart-to-checkout auth coverage
- hardened live Razorpay recovery in checkout so dismiss and verify-failure paths reuse the same pending payment session instead of creating duplicate orders
- added deterministic storefront checkout e2e coverage for live modal close, verification failure, and retry recovery flows, then marked `1.2.2` and `1.2.3` complete in `TASK.md`

### [v 1.0.35] 2026-04-07 - Phase 1 Stage 1.1 release baseline

- completed Phase 1 Stage 1.1 of the ecommerce go-live schedule as a planning and release-governance batch
- added `ASSIST/Planning/phase-1-stage-1-1-release-baseline.md` covering the freeze rule, production target environment, domain and SSL baseline, environment ownership, release cutover checklist, ownership confirmation, and ordered P0 issue list
- updated `ASSIST/Execution/TASK.md` so the Stage 1.1 checklist is marked complete and linked to the new baseline document

### [v 1.0.34] 2026-04-07 - Plan 9 execution schedule in task sheet

- replaced `ASSIST/Execution/TASK.md` with the full numbered execution schedule derived from `plan-9`
- organized the ecommerce go-live program into ordered phases, stages, and checkbox tasks from stabilization through ERP bridge and final release gate
- updated the ASSIST planning and work-log files so the task sheet now serves as the working execution schedule for future ecommerce delivery batches

### [v 1.0.33] 2026-04-07 - Storefront content expansion, billing grid updates, and ecommerce go-live planning

- added and refined ecommerce storefront content systems including reusable shared UI blocks and dedicated designers for footer, floating contact, coupon banner, gift corner, trending, branding, and campaign or trust surfaces
- expanded ecommerce admin routing and menu coverage for the new storefront designer pages, while tightening storefront shell data caching, horizontal rail behavior, and related frontend structure for smoother scaling
- moved billing voucher entry further toward the shared inline editable grid model with tighter product lookup behavior and operational table refinements
- updated storefront e2e expectations to the current checkout, order-confirmation, and tracking UI, while documenting the remaining guest-address and mailbox-template gaps
- reviewed the current ecommerce app against go-live readiness across storefront, checkout, customer portal, admin control surfaces, backend operations, payment flow, and connector boundaries
- documented a repo-specific production blueprint covering storefront performance and SEO, backend commerce management, user and role controls, customer/admin portal maturity, payment and finance operations, inventory and shipping governance, security, observability, and phased ERPNext support
- added `ASSIST/Planning/plan-9.md` as the execution-ready ecommerce go-live plan for the next release waves

### [v 1.0.32] 2026-04-06 - Storefront UX polish, framework mail, and deployment wiring

- connected live storefront payment flow details for Razorpay checkout, removed the extra test-only payment screen, and carried richer checkout metadata through ecommerce order and payment services
- tightened storefront UX across announcement, header, category navigation, hero slider, CTA styling, mobile dock hover behavior, and customer-facing cart, catalog, checkout, account, and tracking surfaces
- added framework mail migration, service, route, and page wiring in `cxapp` together with related mailbox schema and repository updates
- added ecommerce shipping and storefront-order support wiring, plus related admin and runtime service updates for the commerce app
- updated container and customer deployment assets under `.container/`, runtime config samples, and related shell or docs wiring to support the current local and client packaging flow
- updated ASSIST task tracking, planning, and work log for the cross-app batch

### [v 1.0.31] 2026-04-06 - Inline editable table design-system block and docs wiring

- added a reusable shared inline editable table block in `apps/ui` with mixed in-cell editing for text, numeric quantity, delivery date calendar, dependent state and city lookups, multiline notes, publish toggle, and row actions
- registered the new editable grid as `table-12` inside the governed table catalog so it is available in the shared design-system docs alongside existing table variants
- added a dedicated data block registry entry for the editable table so the UI workspace side menu exposes it as a reusable block preview instead of leaving it as a hidden one-off demo
- updated ASSIST task tracking, planning, and work log to record the shared UI batch under the new reference

### [v 1.0.30] 2026-04-06 - Responsive storefront polish, fixed dashboards, and container setup

- expanded ecommerce storefront controls so featured, new-arrivals, and best-seller lanes share backend-configured card density, tighter equal-height cards, and synchronized frontend rendering
- refined storefront interaction behavior across featured, category, catalog, and product flows with corrected scroll targeting, safer hero-slider sizing, tighter mobile slider stages, and a full-width responsive mobile dock
- added richer storefront product-card behaviors including compact action placement, inline savings and stock badges, wishlist and share affordances, and more consistent responsive menu behavior
- fixed shared sidebar shell behavior so dashboard and customer left navigation stays viewport-fixed with an internally scrolling menu area and a footer pinned to the bottom
- added container and client deployment assets under `.container/` for local and customer-specific runtime packaging, compose configuration, and setup documentation

### [v 1.0.29] 2026-04-06 - Customer portal isolation, storefront persistence, and commerce UX refinement

- moved the customer surface onto canonical `/customer/*` routes, isolated it from admin and desk shells, and tightened auth redirect handling so customer users never see application menus or workspace switching
- rebuilt the customer profile page into customer-safe contact-style tabs with shared communication, addressing, and finance flows while keeping admin-only contact fields out of the portal
- refined the customer portal shell, sidebar, overview panels, and wishlist presentation to use a more theme-oriented dashboard tone without leaking admin UI patterns
- hardened legacy customer and contact hydration so widened nested arrays such as emails, phones, bank accounts, and GST details do not break re-login or profile reads on older stored data
- added shared storefront wishlist persistence that keeps guest wishlist intent locally, auto-syncs it into the ecommerce customer-portal database after login, and reflects the saved wishlist consistently in the storefront header, home, catalog, product, and portal views

### [v 1.0.28] 2026-04-05 - Core product operations, media tabs, and storefront runtime stabilization

- added shared core product bulk-edit support for merchandising fields plus product duplication with safe `-copy` naming, exposed through new internal routes and list-level UI actions without disturbing the existing product upsert flow
- extended core product, contact, and product-category list screens with richer operational filters for category, brand, storefront placement, content presence, stock presence, promo state, contact completeness, and category-display flags
- refactored the framework media browser into animated tabs with separate browse, upload, folders, and external-URL surfaces while keeping preview layouts and long media result sets contained within the screen
- forward-hydrated the new `attributeCount` and `totalStockQuantity` product summary fields across core seed data, core product reads, and ecommerce storefront reads so older stored rows no longer fail schema parsing
- stabilized runtime startup by fixing the seed payload crash that had taken down the backend host, then verified the framework health endpoint after restart
- fixed the storefront landing payload so `/public/v1/storefront/home` can render legacy products again instead of returning `400` for missing summary fields

### [v 1.0.27] 2026-04-05 - Demo app, shared state layer, storefront designers, and shared UI blocks

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

### [v 1.0.26] 2026-04-05 - Ecommerce storefront tone, admin settings, and mobile hero polish

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

### [v 1.0.25] 2026-04-05 - Unified auth surfaces and role-based landing

- consolidated the platform to one login and session system owned by `apps/cxapp`, removing the separate ecommerce customer JWT and browser session flow
- linked ecommerce customer accounts to shared `cxapp` auth users so ecommerce keeps customer profile ownership without duplicating password storage or auth sessions
- routed authenticated users by role from the shared login flow: admins land on `/admin/dashboard`, desk users land on `/dashboard`, and customers land on `/profile`
- guarded admin, desk, and customer portal routes so users are redirected back to their allowed surface instead of staying on the wrong workspace
- updated ecommerce frontend auth to consume the shared `cxapp` session while still reading ecommerce-owned customer profile, order, and checkout APIs
- fixed framework env resolution so process env overrides `.env`, which restores isolated Playwright port wiring and other scripted runtime overrides
- added browser e2e coverage for admin, operator, customer, and billing login flows plus targeted service and route regression coverage

### [v 1.0.24] 2026-04-04 - Ecommerce storefront rebuild on core masters

- rebuilt `apps/ecommerce` as a live standalone storefront app with app-owned migrations, seeders, schemas, settings, customer accounts, customer sessions, orders, and payment-state handling
- restored public storefront and external customer-commerce APIs through `apps/api`, including landing, catalog, PDP, registration, login, checkout, Razorpay config, payment verification, order tracking, and customer portal routes
- wired ecommerce to shared `core` products and contacts so shared masters stay inside `core` while commerce-specific flows remain inside `ecommerce`
- added storefront landing, catalog, product, cart, checkout, order-tracking, registration, login, account, and order-detail pages under `apps/ecommerce/web`
- introduced neutral commerce presentation components in `apps/ui` for product cards, pricing, order-status badges, and quantity control without moving business logic out of the ecommerce app
- added focused ecommerce service and runtime coverage for storefront reads, customer registration, checkout, payment verification, route registration, and suite composition

### [v 1.0.23] 2026-04-04 - Ecommerce scaffold reset for clean rebuild

- reset `apps/ecommerce` back to a scaffold-only app boundary by removing live commerce services, schemas, migrations, seeders, table registration, and custom workspace sections while keeping the app registered in the suite
- removed internal ecommerce API route registration and replaced the old public storefront catalog route with a stable scaffold placeholder response under `apps/api`
- moved the shared core product seed baseline off the old ecommerce seed dependency so `core` keeps its own product bootstrap data
- updated the dashboard and workspace composition so ecommerce now renders as a preview shell instead of live catalog, storefront, order, customer, and settings sections
- made the Frappe connector degrade cleanly while ecommerce is scaffolded by blocking item sync into the removed commerce module and keeping purchase receipt sync local to the connector

### [v 1.0.22] 2026-04-04 - CxApp and core app-owned boundary cleanup

- moved auth, auth-option, bootstrap, company, mailbox, and related persistence ownership from `apps/core` into app-owned `apps/cxapp` services, repositories, migrations, seeders, shared contracts, and database registration
- trimmed `apps/core` back to shared master-data ownership so contacts, products, and common reusable masters remain in `core` while suite auth and company records leave the app
- split internal route ownership so `apps/api` now exposes moved auth, mailbox, bootstrap, company, and runtime-setting surfaces under `/internal/v1/cxapp/*`
- moved public route definitions out of `apps/framework` into `apps/api/src/external/public-routes.ts` so framework stays runtime-only and route transport stays app-owned in `api`
- updated frontend and shared consumers to read moved company and auth contracts from `@cxapp/shared`, including runtime branding and admin-facing auth flows
- registered the new `cxapp` database module in the framework runtime and updated focused tests for database execution, internal route wiring, and auth-service ownership

### [v 1.0.21] 2026-04-04 - Core shared master expansion and framework admin control center

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

### [v 1.0.20] 2026-04-02 - Billing account master alignment and support docs

- replaced billing ledger groups with app-owned billing categories, seeded top-level accounting buckets, and mapped billing ledgers to the new category structure
- added billing voucher-group and voucher-type masters, then enforced the strict `category -> ledger -> voucher type` chain alongside `voucher group -> voucher type` classification
- converted billing category, ledger, voucher-group, voucher-type, and voucher-register screens to shared `CommonList`-style popup CRUD flows with autocomplete-based master selection
- reorganized billing sidebar groups, page titles, and workspace support navigation so billing matches the shared UI navigation tone while keeping page-specific breadcrumbs
- added billing support guidance for using categories, ledgers, voucher groups, and voucher types together, and expanded targeted billing service and route coverage for the new model
- added a real sales invoice workflow with persisted item rows, voucher-type-ledger alignment, and GST/double-entry totals derived from the invoice table
- moved sales, purchase, payment, and receipt from popup voucher dialogs into route-based master-list pages with dedicated standalone upsert screens under the billing app shell

### [v 1.0.19] 2026-03-31 - Physical common module tables

- copied the temp common-module table inventory into the real `core` database contract as 25 explicit shared table names
- added a new app-owned `core` migration that creates one physical table per common module while leaving the legacy JSON-store migration IDs intact for compatibility
- added a new app-owned `core` seeder that populates the physical common tables with shared sample master records used by the current suite
- switched the `core` common-module service from generic JSON-store reads to source-controlled metadata plus direct physical-table queries
- updated the database-process regression test to cover the new migration and seeded common table presence

### [v 1.0.18] 2026-03-30 - Theme-oriented UI surfaces and loader polish

- expanded the shared UI token layer so primary, secondary, accent, muted, sidebar, chart, preview, auth, and code surfaces respond consistently across light and dark themes
- replaced hardcoded shell and docs gradients with shared theme surface classes across the `ui` workspace, docs pages, auth layouts, previews, and the `cxapp` public shell
- aligned shared slider, separator, and auth block preview surfaces with theme-aware background tokens instead of fixed white fills
- updated the global loader concern so its main center circle and rotating rings derive from active theme tokens rather than separate hardcoded light and dark color paths
- mirrored the active theme surface utilities into the secondary UI stylesheet so future imports do not drift from the current theme system behavior

### [v 1.0.17] 2026-03-30 - Local database bootstrap and auth hardening

- switched the checked-in local bootstrap to SQLite so the backend host, migrations, seeders, and frontend auth flow start without requiring a local MariaDB instance
- replaced the default seeded admin login with the requested first user `Sundar <sundar@sundar.com>` using password `Kalarani1@@` and explicit super-admin access
- hardened auth user normalization so configured `SUPER_ADMIN_EMAILS` still elevate trusted operators even if the stored row is not flagged
- added faster connection timeouts for MariaDB and PostgreSQL client pools so unavailable network databases fail more clearly during startup
- expanded regression coverage for seeded super-admin bootstrap, seeded login, and normalized super-admin env parsing

### [v 1.0.16] 2026-03-30 - App-owned frappe connector baseline and ecommerce sync adoption

- moved the temp-derived ERPNext connector contracts into app-owned `apps/frappe/shared`, including settings, todo, item, purchase receipt, and sync-log schemas plus workspace metadata
- added app-owned `frappe` migrations, seeders, seed data, and database-module registration so the connector persists its own settings and snapshot tables through the shared framework database runtime
- implemented `frappe` services for settings save and verification, todo snapshot management, item snapshot management, purchase receipt management, and ecommerce sync orchestration
- exposed protected internal `frappe` routes through `apps/api` and registered them in the shared internal route assembly
- added a narrow app-owned ecommerce product admin write path so Frappe item sync can create and update products without moving product ownership into the connector app
- adapted the connector UI into the shared desk through `apps/frappe/web` and `apps/cxapp/web`, with overview, connection, todo, item, and purchase receipt workspace sections
- added connector coverage for route registration, database registration, settings save, item sync, and purchase receipt sync

### [v 1.0.37] 2026-04-07 - Framework backup and security review operations

- added framework-owned database backup and security review contracts, persistence tables, scheduler wiring, and protected internal operations routes
- added dedicated framework admin pages for `Data Backup` and `Security Review` with tabbed controls, restore drill actions, runtime-setting-backed backup automation, and OWASP-style checklist evidence capture
- registered both pages in the framework settings routes, sidebar navigation, desk metadata, runtime fallback catalog, and admin e2e coverage

### [v 1.0.15] 2026-03-30 - App-owned auth, sessions, mailbox, and cxapp auth flows

- added reusable framework auth primitives for JSON request parsing, runtime config access, application error handling, password hashing, JWT signing, and SMTP delivery without moving auth business ownership into framework
- created app-owned `core` auth and mailbox schemas, migrations, and seeders for users, roles, permissions, sessions, OTP verifications, mailbox templates, and outbound message logs
- implemented `core` repositories and services for login, registration OTP, password reset, account recovery, bearer-session validation, mailbox template management, and message delivery/history
- exposed external auth routes and protected internal auth/mailbox routes through `apps/api`, then applied bearer-auth protection to the existing internal `core` and `ecommerce` workspace data routes
- connected `cxapp` auth pages and browser session persistence to the live auth API so login, request-access registration, forgot-password, recovery, and logout are end-to-end instead of local-only UI placeholders
- fixed framework env resolution so test-specific environment values win over local `.env` overrides and validation is stable across machines
- added auth lifecycle coverage that verifies seeded login, OTP registration, password reset, account recovery, customer-role OTP handling, and session revocation against the real database-backed services

### [v 1.0.14] 2026-03-30 - App-owned core and ecommerce database migrations and seeders

- added a framework-owned migration and seeder execution runtime that discovers app-owned database modules and records applied work in system ledger tables
- created individual `core` migration files and individual `core` seeder files under `apps/core/database/*` for bootstrap, companies, contacts, and common modules
- created individual `ecommerce` migration files and individual `ecommerce` seeder files under `apps/ecommerce/database/*` for pricing settings, products, storefront, orders, and customers
- added server-side app database module entry points and a CLI database helper so the registered migrations and seeders are reachable through one consistent workflow
- switched `core` and `ecommerce` services and routes from direct in-memory seed reads to seeded database reads
- prepared registered migrations and seeders on framework server startup so live routes and workspace pages read migrated and seeded data
- added runtime tests that verify registry order, migration execution, seeder execution, and DB-backed service reads for the current `core` and `ecommerce` baseline

### [v 1.0.13] 2026-03-30 - Core backend wiring and ecommerce go-live seed baseline

### [v 1.0.152] 2026-04-13 - Sidebar app-menu hover border cleanup

- removed the hover-only border color treatment from the shared dashboard app-menu header logo frame
- kept the existing sidebar hover text and background behavior unchanged so the visual cleanup stays narrowly scoped
- validated the shared UI change with `npm run typecheck`

- audited the imported `temp/core` and `temp/ecommerce` trees against the current app ownership boundaries before copying anything
- moved the first shared-contract slice from `temp/core` into `apps/core/shared` as app-owned workspace metadata, shared module definitions, and shared Zod schemas
- extended the current HTTP route context once so app-native route handlers can read request data and runtime resources without importing the foreign temp runtime
- added app-native `core` backend services and internal routes for bootstrap, companies, contacts, and common module registries
- moved the ecommerce shared contracts into `apps/ecommerce/shared` and added app-native services for catalog, storefront, orders, customers, and pricing settings
- adapted both `core` and `ecommerce` workspace sections to the current `/dashboard/apps/<app>/*` route structure and rendered them inside the shared `cxapp` desk
- exposed a public storefront catalog route and updated local dev proxying so the live workspace can preview public commerce data through the current server
- kept the current go-live baseline honest by using explicit seed-backed backend data until app-owned database migrations and write flows land

### [v 1.0.12] 2026-03-30 - UI docs catalog expansion and imported component registry

- imported the copied UI component demo set from `temp` into `apps/ui` as a docs-owned registry
- added missing shared UI primitives plus lightweight Next compatibility shims required by the imported demos
- expanded the docs catalog, overview cards, and side navigation to surface the imported component groups
- added a templates section to the docs workspace so component docs and template metadata now live in one UI app surface
- added a source-controlled design-system governance layer for project default component names, default variants, reusable blocks, and application build-readiness coverage
- extracted project component defaults into a dedicated design-system defaults file and pointed AI workflow guidance at that source of truth
- moved the imported variant source out of docs-owned paths into a reusable `component-registry` feature so future projects can consume the same structure without docs coupling
- renamed the imported registry ownership to `variants`, added a reusable `blocks` channel, and seeded it with login page block variants
- updated validation and lint scope so the imported docs registry can coexist with the existing shared system

### [v 1.0.11] 2026-03-29 - CLI GitHub helper baseline

- added a dedicated interactive GitHub helper under `apps/cli` for commit, pull-rebase, and push flow
- exposed the helper through `npm run github` and `npm run github:server`
- added helper tests for git status parsing, ahead/behind parsing, and push-target selection
- updated ASSIST docs so CLI operational guidance matches the live repository

### [v 1.0.10] 2026-03-29 - ASSIST reconciliation and framework baseline layers

- reconciled ASSIST docs with the live `apps/` tree, current commands, and active shared UI state
- removed stale references to non-existent `githelper`, `version:bump`, and `Test/` workflows
- documented the current `cxapp` auth shell and `ui` design-system docs surface
- added a framework-owned machine-readable workspace and host baseline and exposed it through the internal API boundary
- started `Plan-4` with ordered framework database foundation sections and matching platform migration-section metadata
- implemented the first `Plan-5` HTTP slice with route manifest helpers, canonical `v1` internal and external routes, a public bootstrap route, and legacy path compatibility

### [v 1.0.9] 2026-03-29 - CxApp isolated workspace baseline

- promoted `apps/cxapp` into the active frontend and server wrapper while keeping framework reusable underneath
- normalized every app to `src`, `web`, `database`, `helper`, and `shared`
- added workspace metadata to manifests and root tests for structure validation
- constrained the active shared UI package to the real design-system surface

### [v 1.0.8] 2026-03-29 - Framework-first suite scaffolds and API split

- made `apps/framework` the active reusable runtime and composition root
- added DI-based app registration, app-suite manifests, and internal/external API route partitioning
- scaffolded standalone app roots for `core`, `api`, `site`, `billing`, `ecommerce`, `task`, `frappe`, `tally`, and `cli`
- expanded the framework runtime for MariaDB-first configuration, optional offline SQLite, and future analytics PostgreSQL

### [v 1.0.1] 2026-03-29 - Repository initialization

- initialized the repository and the first ASSIST documentation baseline

### [v 1.0.55] 2026-04-07 - Customer verification and payment reporting exports

- completed ecommerce customer email verification with OTP-gated storefront registration, verified-email state, and suspicious-login review handling in the admin customer operations surface
- extended auth OTP registration to support customer actor flows without duplicating the existing verification system
- added finance-facing ecommerce payment exports for daily payment summary and failed-payment reporting, both downloadable from the existing admin payments operations screen
- added backend CSV export routes, typed document contracts, and targeted service plus route coverage for the new reporting and customer-security flows

### [v 1.0.73] 2026-04-08 - Billing controls and period-close governance

- completed billing Stage `B11` with maker-checker controls, finance roles and permissions, accounting dimensions, exception reporting, and finance KPIs
- completed billing Stage `B12` with month-end checklist, financial-year close workflow, opening-balance rollover policy, audit-trail review surface, and year-end adjustment plus carry-forward controls
- extended the billing close workspace, protected internal route surface, and targeted billing route or reporting tests so control-state review and period-close actions use the shared platform audit and runtime model

### [v 1.0.74] 2026-04-08 - Billing split-table storage and query baseline

- completed Stage `T5.1` by adding item split tables for sales, purchase, receipt, payment, journal, and contra vouchers and syncing them from the billing voucher lifecycle
- completed Stage `T5.2` by adding bill reference, bill settlement, and overdue tracking tables with write rules for invoices, settlements, notes, and returns
- started Stage `T5.3` by adding a split-register query service and protected billing register route so register reads can target voucher-family tables without loading full voucher JSON payloads
- completed the `T5.3` sales, purchase, and settlement report cutover so GST registers and bill-control reporting read from split voucher and bill-engine tables
- completed `T5.4` split-table validation coverage for sync, reverse/delete lifecycle behavior, migration registration, and targeted runtime verification
- validated the batch with `npm run typecheck` and targeted billing service plus route tests
# 2026-04-08

- `#102` Completed Stage `8.2` by adding an explicit ecommerce admin operations release gate, a dedicated Playwright command, and a checklist artifact for storefront content, orders, payments, and support.

