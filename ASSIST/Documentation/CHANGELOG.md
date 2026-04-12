# Changelog

## Version State

- Current package version: `0.0.1`
- Current release tag: `v-0.0.1`
- Reference format: `#<number>`

## v-0.0.1

### [#132] 2026-04-12 - Menu logo variant toggles and global-loader designer

- extended the shared storefront `menuDesigner` contract with per-surface `logoVariant` selection and a new `globalLoader` surface so menu logo treatment can independently use the light or dark brand asset without changing fresh defaults
- updated the menu editor with light-or-dark logo toggles on each surface and added a dedicated global-loader editor below the app-menu section so loader logo size and position can be tuned from the same workspace
- wired storefront top menu, storefront footer, the dashboard app sidebar, and the shared global loader to the selected runtime logo variant while preserving existing default behavior for untouched storefront settings
- replaced the ecommerce menu editor's static global-loader mock with the real shared loader component so operators now tune the same animated runtime surface, including draft brand-asset previews, directly from the editor
- changed each menu-surface logo-tone chooser to a switch-style control, aligned the menu and logo actions into one row, and made the main `Publish live` action run menu save, logo draft save, logo publish, and storefront publish as one sequence
- hard-centered the shared global-loader logo anchor so the default global loader logo now sits at the true center and offsets move predictably from that centered baseline
- hardened the ecommerce settings tests so legacy stored settings and revision snapshots hydrate the new `globalLoader` and `logoVariant` fields through defaults
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts`

### [#131] 2026-04-12 - Menu editor company-logo upload and live publish

- added primary-company branding API helpers to the ecommerce admin client so the menu editor can read companies, load the company brand draft, save the shared branding draft, and trigger the existing public SVG publish flow without duplicating backend logic
- extended the menu editor with a new `Logo source and publish` panel that mirrors the company-logo workflow for light logo, dark logo, and favicon uploads, keeps the company logo tab intact, and publishes the live public brand files directly from the ecommerce workspace
- wired the menu editor previews to use the newly selected brand SVG source immediately for preview surfaces while keeping the live runtime reload after publish so storefront and app chrome refresh against the published files
- added focused Playwright coverage for uploading and publishing the light logo directly from the menu editor
- validated the batch with `npm.cmd run typecheck` and `npx.cmd playwright test tests/e2e/menu-editor-logo-publish.spec.ts`

### [#130] 2026-04-12 - Menu editor per-field reset actions

- added icon-based reset actions inside the menu editor for hover color, area background color, logo background color, and the position offsets so operators can restore each control to the seeded default without manually retyping values
- wired those reset actions against `defaultStorefrontSettings.menuDesigner` per surface so future default changes remain the single source of truth for reset behavior
- corrected the menu-editor permission split while touching the screen so `Save menu designer` uses edit access and `Publish live` uses approval access
- validated the change with `npm.cmd run typecheck`

### [#129] 2026-04-12 - Menu editor live publish and fresh-default restoration

- added direct `Publish live` support to the standalone menu editor so approved operators can push menu-logo changes to the public storefront from the same designer screen instead of leaving that workflow
- restored the fresh menu-designer defaults to preserve the earlier storefront and app-menu appearance, removing the unintended forced framed-logo look for untouched data while keeping the new numeric designer available for deliberate customization
- removed the extra default frame borders around the storefront top-menu and footer logo wrappers so transparent menu-designer backgrounds render like the previous menu layout until a background is intentionally chosen for testing or customization
- validated the fix with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts`; the suite still logs the existing non-blocking SMTP auth warning during email-path tests, but all tests passed

### [#128] 2026-04-12 - Full-control menu logo-area designer

- replaced the first-pass storefront menu editor presets with a company-logo-tab-style numeric designer so each menu surface now stores direct frame width, frame height, logo width, logo height, X offset, Y offset, hover color, area background color, and logo background color
- rebuilt the `Menu Editor` admin screen around those numeric controls and a grid-backed preview surface so operators can tune awkward or non-standard client logos directly instead of being limited to coarse preset size or alignment options
- updated storefront top-menu desktop and mobile, storefront footer desktop and mobile, and the dashboard app sidebar to render the logo area from the new frame-and-offset settings instead of the removed position and size presets
- kept backward compatibility by merging stored menu-designer payloads through current defaults, so earlier saved preset-era menu settings hydrate cleanly into the new numeric logo-area model
- validated the refactor with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts`; the suite still logs the existing non-blocking SMTP auth warning during email-path tests, but all tests passed

### [#127] 2026-04-12 - Storefront revision compatibility for menu designer

- fixed the storefront designer workflow failure triggered by older revision snapshots that were saved before the new `menuDesigner` field existed
- hardened storefront revision reads so historical snapshots are merged through current storefront defaults before revision schema parsing, allowing workflow and history responses to remain backward compatible without rewriting stored revision rows
- extended the focused ecommerce service suite with a regression that seeds a legacy revision snapshot missing `menuDesigner` and verifies workflow reads hydrate the new menu-designer defaults correctly
- validated the fix with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts`; the suite still logs the existing non-blocking SMTP auth warning during email-path tests, but all tests passed

### [#126] 2026-04-12 - Storefront menu designer for logo presentation

- added a new standalone ecommerce `Menu Editor` workspace item and designer section that lets operators control logo position, logo size, and logo hover color for the storefront top menu, storefront footer, and dashboard app sidebar from one shared storefront-designer surface
- extended the storefront settings contract and seed defaults with a new `menuDesigner` slice so the new menu presentation controls persist through the existing draft, publish, rollback, and public-settings flows without introducing a separate storage model
- wired storefront top-menu desktop and mobile surfaces plus storefront footer desktop and mobile surfaces to consume the new menu-designer values, so header and footer logo alignment, size, and hover treatment now reflect the saved storefront designer configuration
- updated the shared dashboard sidebar logo block to read the storefront menu-designer settings through the existing workflow or public settings endpoints, so the app menu can follow the same light-logo sizing, alignment, and hover accent configuration without importing ecommerce UI into `apps/ui`
- extended the focused ecommerce service coverage so storefront settings merge and legacy hydration now verify the new `menuDesigner` defaults and persisted values
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts`; the service suite still logs the existing non-blocking SMTP auth failure during email-path exercises, but all tests passed

### [#125] 2026-04-12 - Company logo upload path verification

- refactored the company branding publish path to the requested root-public model where generated brand files are kept under `storage/branding/active`, publish backs up the previous live files into `storage/backups/branding`, and the live storefront-facing files are overwritten only in the repository root `public/` folder as `logo.svg`, `logo-dark.svg`, and `favicon.svg`
- restored runtime brand URLs to `/logo.svg`, `/logo-dark.svg`, and `/favicon.svg` with version query strings, and updated the framework static host to prefer repository-root `public/` files before built assets so storefront top menu, footer, and favicon all resolve the same live public branding source in the current runtime
- updated the app sidebar brand mark to always use the light logo variant and changed the logo chip styling to a light-mode surface so the app menu branding matches the requested light treatment
- kept compatibility for existing logo drafts and media references that still point at legacy `/storage/...` files under the previous web-root storage path, so publish continues to work while the live public output moves to the new canonical public-folder source
- added a dedicated Playwright spec for the real upload path and updated the publish-flow assertions so coverage now verifies storefront runtime uses the root public brand files after publish
- validated the batch with `npx.cmd tsx --test tests/cxapp/company-brand-assets-service.test.ts`, `npx.cmd playwright test tests/e2e/storefront-brand-publish.spec.ts`, `npx.cmd playwright test tests/e2e/company-logo-upload.spec.ts`, and `npm.cmd run typecheck`

### [#123] 2026-04-12 - Local container git-sync runtime mode defaults

- fixed the local container setup defaults so `GIT_SYNC_ENABLED=true` no longer boots the runtime in development mode where the entrypoint overlays stale image code onto the synced repository
- updated both shared and local setup scripts to default local git-sync runs to `APP_ENV=production`, keeping the runtime repository authoritative while preserving local port and URL behavior
- documented the local git-sync mode in the codexsun container usage guide so operators know the expected `GIT_SYNC_ENABLED=true` plus `APP_ENV=production` combination
- validated the batch with `bash -n .container/bash-sh/setup.sh` and `bash -n .container/bash-sh/setup-local.sh`

### [#122] 2026-04-12 - Companies branding data compatibility hardening

- fixed the Companies workspace load regression where malformed persisted `brandAssetDesigner` data could break company reads and surface the frontend `Unexpected token '<'` JSON parse error
- hardened company record normalization so legacy or invalid branding variants are sanitized per field, with safe fallback defaults for broken variant payloads, invalid colors, invalid modes, and out-of-range numeric values
- added a focused company-service regression test that seeds malformed company branding payloads directly into persistence and verifies company list and detail reads still succeed
- validated the batch with `npx.cmd tsx --test tests/cxapp/company-service.test.ts` and `npm.cmd run typecheck`

### [#121] 2026-04-12 - Storefront branding publish validation and SVG designer hardening

- hardened the company logo designer and publish path for real SVG workflows by adding UTF-16-safe SVG decoding, XML or metadata sanitization, extracted color-token editing, and token-vs-uniform color handling across the editor schema, UI, and publish service
- expanded focused company brand asset service coverage for UTF-16 SVG sources, sanitized wrapper-heavy SVG files, and token-mode color override publishing so the runtime file writer is exercised against more realistic branding assets
- added a targeted Playwright publish-flow spec that logs in through the company upsert logo designer, publishes storefront branding, and verifies the runtime brand-profile plus storefront top-menu, footer, and favicon asset paths consume the published public files
- validated the batch with `npx.cmd playwright test tests/e2e/storefront-brand-publish.spec.ts`

### [#120] 2026-04-12 - Logo designer draft usability

- moved the company logo designer onto its own temporary draft table and internal read or save routes so draft editing is no longer coupled to the company form save cycle
- fixed the logo-tab editor refresh path so width, height, color, and offset changes stay editable instead of being overwritten by stale memoized tab content
- added debounced autosave for existing companies, explicit draft-state feedback for `ready`, `unsaved`, `saving`, `saved`, and `error`, and kept manual `Save Draft` plus public publish on the same draft-save path
- added quick per-variant actions to reset editor values from the selected SVG source defaults and copy light-logo settings into dark, favicon, and company-logo variants
- validated the batch with `npm run typecheck` and `npx tsx --test tests/cxapp/company-brand-assets-service.test.ts tests/api/internal/company-brand-assets-routes.test.ts tests/framework/runtime/database-process.test.ts`

### [#118] 2026-04-11 - Storefront hero fit and footer-shell lock

- tightened the desktop storefront hero into a shorter, more screen-fitting composition, then rebalanced the content spacing and fixed the media frame to a vertically centered `610x560` image holder without changing the accepted mobile hero behavior
- restored the homepage footer and floating contact surfaces to the live storefront shell, then compacted the mobile footer into a grouped disclosure layout that saves space while keeping social icons and the copyright line in the final row
- aligned the mobile footer brand block closer to the desktop tone, added the rendered footer section marker as `section.storefront.footer`, and surfaced visible technical-name badges for the layout, header, and footer shells so footer shell and section names are both visible in review mode
- updated the shared floating contact launcher so the circular scroll-to-top action now lives inside the launcher stack and appears only when the contact launcher is open
- locked this storefront UX and UI version as the accepted baseline because the current layout fit is considered correct; future card additions should preserve this layout unless a change is explicitly required
- validated the batch with repeated `npm.cmd run typecheck` runs and `npx.cmd playwright test tests/e2e/storefront-mobile-matrix.spec.ts`

### [#117] 2026-04-11 - Storefront staged section reveal continuation

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

### [#116] 2026-04-11 - Storefront homepage UX restoration

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

### [#115] 2026-04-11 - ASSIST repo-state synchronization

- reconciled `ASSIST` guidance with the live repository by adding the current `crm` suite app and the `mobile` companion client where the docs previously still described the older app inventory
- corrected stale ASSIST references for shared UI source-of-truth paths, current `cxapp` auth or mailbox endpoints, available helper commands, and the testing stack now that Playwright, e2e flows, and broader service coverage exist in the repo
- confirmed the execution trackers return to `No active batch` after this docs-only sync so there is no incomplete tracked work left in `ASSIST/Execution`

### [#114] 2026-04-11 - Framework system update history stores failure reasons

- extended framework system-update history entries to persist the underlying failure reason for blocked, failed update, and failed reset runs instead of only the generic rollback message
- updated the admin System Update recent-activity UI to render the stored failure reason inline when present so operators can see the actual git, npm, or build error without checking server logs first
- validated the batch with `npx.cmd tsx --test tests/framework/system-update-service.test.ts`, `npm.cmd run typecheck`, and a live Docker runtime update check against the local `codexsun-app` container

### [#113] 2026-04-11 - Framework system update history shows both revision sides

- extended framework system-update history entries to resolve readable metadata for both the previous and current commits in each activity item
- updated the admin System Update recent-activity UI to render human-readable `From Commit` and `To Commit` blocks with commit message, date, tag, and version instead of only raw commit hashes
- validated the batch with `npx.cmd tsx --test tests/framework/system-update-service.test.ts` and `npm.cmd run typecheck`

### [#112] 2026-04-11 - Framework system update revision metadata in admin UI

- extended the framework system-update contract to expose current revision metadata, including applied commit summary, commit date, git tag, and package version for the active runtime commit
- enriched system-update history reads so recent update and reset activity can resolve commit metadata from stored commit hashes without changing the persisted log format
- updated the admin System Update screen to show the applied commit message, date, and tag or version under the current commit card and recent activity entries, with safe fallback text when a commit is not tagged
- validated the batch with `npx.cmd tsx --test tests/framework/system-update-service.test.ts` and `npm.cmd run typecheck`

### [#111] 2026-04-10 - Local git-sync runtime update alignment

- fixed development runtime settings so changing Git sync controls from Core Settings schedules a real container restart when the live runtime mode depends on entrypoint-only behavior
- fixed framework system-update resolution so live update status, preview, reset, and update actions inspect the active runtime Git worktree instead of the embedded image path when Git sync is enabled
- updated the container entrypoint so local Git-sync mode overlays the current image snapshot onto the runtime repository before rebuild, which keeps local browser testing aligned with the current workspace without requiring an immediate GitHub push
- validated the batch with focused runtime-settings and system-update tests, `npm run typecheck`, and `npm run build`; `npm run lint` and `npm run test` still report unrelated pre-existing repo failures including existing auth-fixture logins, workspace-shape drift, app-suite expectations, database-process ordering expectations, and broad eslint debt outside this batch

### [#110] 2026-04-10 - Storefront shell isolation review and top-menu polish

- kept the storefront shell split intact while adding an isolated shell-testing mode on the home route so top menu, category menu, and footer can be re-enabled one by one without deleting the underlying storefront sections or technical-name boundaries
- refined the mobile storefront top menu by moving search to its own full-width second row and adding a desktop-style account or login dropdown button beside the brand for faster manual shell review
- documented the concrete git-helper location in `ASSIST/README.md`, kept the underlying storefront section markers in place for later staged re-enable work, and validated the current shell pass with `npm.cmd run typecheck`

### [#109] 2026-04-10 - Storefront shell split and landing refactor sequence

- split the storefront-wide shell boundary into stable desktop and mobile switchers for layout, header, top menu, and footer while keeping public component entry names intact for callers
- extracted the storefront homepage into ecommerce-owned feature modules under `apps/ecommerce/web/src/features/storefront-home`, including a thin route entry, shared landing model, shell or section boundaries, and explicit developer-facing `data-technical-name` markers
- split the homepage hero into dedicated desktop and mobile implementations, centralized backend-designer-derived visibility decisions in the landing model, aligned storefront shell switching to tablet-safe breakpoints, and validated the batch with `npm.cmd run typecheck`, `npm.cmd run build`, `npx.cmd playwright test tests/e2e/storefront-mobile-matrix.spec.ts`, and `npm.cmd run test:e2e:storefront-smoke`; the smoke run still reports non-blocking SMTP authentication failures while order flows pass

### [#108] 2026-04-10 - ASSIST consolidation and startup workflow hardening

- consolidated `ASSIST` into a smaller active guidance set by removing stale database docs, completed execution archives, scratch planning files, and legacy worklog material
- added `ASSIST/README.md` as the future startup entrypoint and documented that agents must read the current `ASSIST` file set before starting development
- hardened the local workflow rules so meaningful work is planned in `ASSIST/Execution/PLANNING.md`, tracked in phased checklists in `ASSIST/Execution/TASK.md`, routed through the changelog and git-helper flow, and cleaned out of execution docs after completion

### [#107] 2026-04-09 - Billing workspace split and legacy billing or Frappe payload compatibility

- completed Phase `1.1` by splitting the billing workspace entry surface into app-owned section modules while preserving the public import path through `apps/billing/web/src/workspace-sections.tsx`
- hardened billing reporting reads and Frappe connector settings reads so older persisted payloads missing newer derived fields no longer break the billing reports workspace or Frappe settings, items, purchase receipts, and policy screens with `Invalid request payload`
- validated the batch with `npm.cmd run typecheck`, `npm.cmd run build`, `npx.cmd tsx --test tests/billing/reporting-service.test.ts`, and `npx.cmd tsx --test tests/frappe/services.test.ts`; the existing billing e2e outstanding-bill assertion mismatch remains outside the fixed payload-parse regression

### [#105] 2026-04-08 - ERP integration decision signoff

- completed Stage `8.5` by making the release-governance ERP mode explicit from the implemented repo state
- recorded the current decision as `transactional bridge enabled`, because paid ecommerce orders already push into ERPNext Sales Order and connector-owned fulfilment, invoice, return, and refund sync-back flows already write local ecommerce snapshots
- kept the decision bounded by the existing operational rules: storefront paid state commits locally first, ERP write failures fail closed, and transactional retries remain manual replay only after operator review

### [#103] 2026-04-08 - Security and operations checklist gate

- completed Stage `8.3` by defining one dedicated release-ops command and checklist for monitoring, backup, restore-drill, and security-review controls
- added `npm.cmd run test:release:security-ops` over the existing framework route checks plus the admin-shell framework operations e2e, then recorded the checklist scope in a dedicated planning artifact
- validated the gate with `npm.cmd run test:release:security-ops`; this closes repo-runtime operational checks while leaving production credential and destination verification for Stage `8.4`

### [#101] 2026-04-08 - Storefront smoke checklist gate

- completed Stage `8.1` by defining one dedicated storefront smoke command and checklist for the homepage-to-paid-order-to-tracking journey
- added `npm.cmd run test:e2e:storefront-smoke` over the existing ecommerce end-to-end specs covering buy flow, checkout, confirmation, tracking, accessibility labels, and mobile viewport sanity, then recorded the checklist scope in a dedicated planning artifact
- validated the gate with `npm.cmd run test:e2e:storefront-smoke`; the run passed while still surfacing non-blocking SMTP authentication failures and a Frappe Sales Order settings parse warning outside the storefront smoke path

### [#100] 2026-04-08 - Analytics and attribution model baseline

- completed Stage `7.2.3` by adding a persisted ecommerce-owned attribution snapshot on storefront orders plus a protected attribution-performance report for operators
- extended checkout and order contracts with optional source, medium, campaign, referrer, landing-path, and channel grouping data, normalized that snapshot safely for legacy orders, and exposed grouped channel or campaign reporting through an internal analytics route
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`; test runs still emit expected SMTP authentication warnings from the current mail configuration

### [#99] 2026-04-08 - RMA and customer-service workflow maturity

- completed Stage `7.2.2` by linking customer return or cancellation requests, support handling, and refund progression into one storefront RMA workflow
- extended ecommerce support-case and order-request contracts with linked ids, team ownership, richer `awaiting_return -> refund_pending -> completed` lifecycle state, and a unified RMA or customer-service report for operators
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`; test runs still emit expected SMTP authentication warnings from the current mail configuration

### [#98] 2026-04-08 - Multi-warehouse readiness baseline

- completed Stage `7.2.1` by adding an operator-facing multi-warehouse readiness report on top of the current aggregated-stock storefront model
- extended ecommerce reporting contracts with active product warehouse-spread and active reservation split-allocation visibility, then exposed the report through a protected internal ecommerce analytics route without changing customer-facing warehouse behavior
- validated the batch with `npm.cmd run typecheck`, `npx.cmd tsx --test tests/ecommerce/services.test.ts`, and `npx.cmd tsx --test --test-name-pattern "internal route registry includes" tests/api/internal/routes.test.ts`

### [#97] 2026-04-08 - Advanced commerce maturity baseline

- completed Stage `7.1.1` through `7.1.4` by adding ecommerce-owned recommendation and search-ranking improvements, deterministic segment pricing, lifecycle-marketing state, and merchandising-experiment readiness
- extended shared ecommerce catalog, customer, and order contracts with recommendation rails, customer commercial profiles, lifecycle-marketing state, merchandising automation reports, and auditable applied-promotion snapshots
- improved storefront catalog ranking and PDP recommendations, added internal advanced-commerce analytics routes, applied repeat-segment pricing during authenticated checkout, and validated the batch with `npm.cmd run typecheck`, `npx.cmd tsx --test tests/ecommerce/services.test.ts`, and `npx.cmd tsx --test --test-name-pattern "internal route registry includes" tests/api/internal/routes.test.ts`

### [#96] 2026-04-08 - ERP fulfilment and finance return sync baseline

- completed Stage `6.2.1` through `6.2.4` by adding connector-owned delivery-note, invoice, and return or refund sync-back flows plus a reconciliation queue and replay entrypoint
- extended ecommerce orders with local ERP delivery-note, invoice, and return link snapshots, updated shipment and refund lifecycle state from Frappe transaction sync records, and exposed replayable mismatch reporting through protected Frappe routes
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/frappe/services.test.ts`; a broader internal-route run still reports an unrelated existing billing year-end control failure

### [#95] 2026-04-08 - ERP sales-order mapping persistence baseline

- completed Stage `6.1.3` by persisting ERP Sales Order linkage on ecommerce orders instead of keeping the mapping only inside the Frappe connector store
- extended storefront order schema and legacy normalization with an `erpSalesOrderLink` snapshot, then wired the existing Sales Order push transport to save the connector sync result back onto the ecommerce order after checkout, webhook, and reconciliation-driven pushes
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/frappe/services.test.ts`; a broader combined regression run also exposed an unrelated existing billing route failure about missing financial-year year-end controls

### [#94] 2026-04-08 - ERPNext Sales Order approval and retry policy baseline

- completed Stage `6.1.2` by making the approval and retry guardrails for Sales Order push explicit as a Frappe-owned contract instead of leaving them as scattered architecture notes
- added a shared Sales Order push policy schema plus protected route that records auto-approval scope, duplicate guard behavior, and the rule that transactional ERP write retries are manual replay only after failure
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/frappe/services.test.ts tests/api/internal/routes.test.ts`

### [#93] 2026-04-08 - ERPNext Sales Order push baseline

- completed Stage `6.1.1` by adding a Frappe-owned Sales Order bridge for paid ecommerce orders
- added connector-local Sales Order sync records plus ERP request mapping from paid storefront orders, then wired checkout verification, webhook capture, and payment reconciliation transport paths to invoke the Frappe sync without blocking the local paid-order flow on ERP availability
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/frappe/services.test.ts tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### [#72] 2026-04-08 - Billing stock bridge and valuation baseline

- completed Stage `B10` by bridging posted billing vouchers into `core` stock movement for purchase receipts, sales-linked stock reduction, stock adjustments, and landed-cost capitalization
- added stock-aware billing voucher contracts, centralized inventory replay and synchronization logic, and a stock valuation report surfaced through the billing reporting workspace
- validated the batch with `npm run typecheck` and `npx.cmd tsx --test tests\\billing\\voucher-service.test.ts tests\\billing\\reporting-service.test.ts tests\\api\\internal\\routes.test.ts`

### [#92] 2026-04-08 - Storefront no-live-ERP runtime baseline

- completed Stage `5.3.3` by turning the no-live-ERP storefront runtime rule into executable test coverage
- extended ecommerce boundary tests so storefront runtime services cannot add direct network fetch calls, then added a forced-fetch-failure runtime test proving landing, catalog, product detail, and mock-checkout still work from persisted projected data when Razorpay is disabled
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/boundary.test.ts tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### [#91] 2026-04-08 - Ecommerce projected catalog read boundary baseline

- completed Stage `5.3.2` by introducing a narrow ecommerce-facing projected-product read-model service backed by persisted core product data
- moved catalog, order, customer, and storefront SEO consumers onto the local projected read-model path and added a boundary test that blocks direct Frappe imports plus ad hoc projected core-product reads from unrelated ecommerce services
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/boundary.test.ts tests/ecommerce/services.test.ts tests/api/internal/routes.test.ts`

### [#90] 2026-04-08 - Frappe item projection execution baseline

- completed Stage `5.3.1` by replacing the scaffold-only Frappe item sync placeholder with a real item-master projection path into `apps/core`
- projected approved Frappe item-master fields through the existing core product service, updated item sync logs and connector events with real create or update outcomes, and kept price, stock, and customer-commercial projection staged for later batches
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/frappe/boundary.test.ts tests/frappe/services.test.ts tests/api/internal/routes.test.ts`

### [#89] 2026-04-08 - Frappe orchestration boundary enforcement baseline

- completed Stage `5.2.5` by making the connector-boundary rule executable instead of leaving it as planning prose only
- added a repo boundary test that fails if non-Frappe, non-API app code imports `apps/frappe/src/services/*` directly, keeping connector orchestration inside `apps/frappe` while still allowing API transport wiring and tests
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/frappe/boundary.test.ts tests/frappe/services.test.ts tests/api/internal/routes.test.ts`

### [#88] 2026-04-08 - Frappe customer commercial profile contract baseline

- completed Stage `5.2.4` by defining the authoritative ERP customer-group and commercial-profile enrichment contract inside the Frappe boundary
- added a typed contract and protected route that records current identity, field-mapping, lifecycle, and out-of-scope rules for `frappe customer commercial snapshot -> ecommerce customer commercial profile` enrichment while preserving ecommerce ownership of auth, coupons, rewards, and checkout validation
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/frappe/services.test.ts tests/api/internal/routes.test.ts`

### [#87] 2026-04-08 - Frappe stock projection contract baseline

- completed Stage `5.2.3` by defining the authoritative ERP warehouse and stock snapshot to core storefront-availability projection contract inside the Frappe boundary
- added a typed contract and protected route that records current stock identity, field-mapping, lifecycle, and out-of-scope rules for `frappe stock snapshot -> core product stock` projection while preserving existing `quantity` and `reservedQuantity` storefront semantics
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/frappe/services.test.ts tests/api/internal/routes.test.ts`

### [#86] 2026-04-08 - Frappe price projection contract baseline

- completed Stage `5.2.2` by defining the authoritative ERP price-list snapshot to core commerce-pricing projection contract inside the Frappe boundary
- added a typed contract and protected route that records current price identity, field-mapping, lifecycle, and out-of-scope rules for `frappe item price snapshot -> core product price` projection while preserving existing `sellingPrice` and `mrp` storefront semantics
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/frappe/services.test.ts tests/api/internal/routes.test.ts`

### [#82] 2026-04-08 - Frappe connection hardening baseline

- completed Stage `5.1.1` by hardening Frappe connector settings reads, updates, and verification behavior for production-safe operator workflows
- masked saved connector secrets on read, preserved saved credentials across blank-field non-secret updates, and persisted last verification status only when the verified payload matched the saved connector settings
- updated the Frappe connection workspace to show saved-credential state and last verification status, then validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/frappe/services.test.ts tests/api/internal/routes.test.ts`

### [#83] 2026-04-08 - Frappe sync retry and failure policy baseline

- completed Stage `5.1.2` by defining an explicit production-safe retry, timeout, and failure policy for future Frappe connector sync execution
- added a shared sync-policy contract and protected route, derived the timeout budget from saved connector settings, and surfaced the retry or fail-closed rules in the Frappe overview workspace
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/frappe/services.test.ts tests/api/internal/routes.test.ts`

### [#84] 2026-04-08 - Frappe connector observability baseline

- completed Stage `5.1.3` by adding connector-specific monitoring, activity-log exception evidence, and an operator-facing observability report for current Frappe verification and sync flows
- extended the shared framework monitoring baseline with a dedicated `connector_sync` channel and threshold, added a Frappe observability service plus route, and surfaced connector health with recent exceptions in the Frappe overview workspace
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/frappe/services.test.ts tests/api/internal/routes.test.ts tests/framework/runtime/monitoring.test.ts tests/framework/runtime/logger.test.ts`

### [#85] 2026-04-08 - Frappe item projection contract baseline

- completed Stage `5.2.1` by defining the authoritative ERP item snapshot to core product projection contract inside the Frappe boundary
- added a typed contract and protected route that records the current identity, field-mapping, lifecycle, and out-of-scope rules for `frappe item snapshot -> core product` projection without yet implementing the write path
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/frappe/services.test.ts tests/api/internal/routes.test.ts`

### [#81] 2026-04-08 - Storefront performance standards baseline

- completed Stage `4.3.4` by codifying homepage rail and block performance rules into a shared storefront performance-standards layer instead of leaving them inline or docs-only
- moved homepage deferral, root-margin, reserved-height, and fallback rules onto a reusable standards map so future storefront rails can follow the same contract without reopening first-paint policy each time
- validated the batch with `npm.cmd run typecheck` and `npm.cmd run test:e2e:performance`

### [#80] 2026-04-08 - Storefront homepage deferral baseline

- completed Stage `4.3.3` by deferring heavy below-the-fold homepage merchandising sections behind intersection-aware rendering and lazy-loaded block imports
- kept the hero and announcement surfaces immediate while moving featured, category, coupon, gift, trending, brand-story, and campaign-trust sections onto deferred mounting so first render and scroll work stay narrower
- validated the batch with `npm.cmd run typecheck` and `npm.cmd run test:e2e:performance`

### [#79] 2026-04-08 - Storefront image delivery baseline

- completed Stage `4.3.2` by introducing a shared storefront image primitive and moving key storefront hero, category, product-card, and product-gallery surfaces onto explicit intrinsic sizing and consistent loading behavior
- kept hero imagery eager with high priority while preserving lazy loading for lower-priority card and gallery images, so the production-like performance gate continues to pass after the image-delivery changes
- validated the batch with `npm.cmd run typecheck` and `npm.cmd run test:e2e:performance`

### [#78] 2026-04-08 - Storefront performance budget baseline

- completed Stage `4.3.1` by adding a production-like Playwright performance budget gate for home, catalog, and product storefront routes
- introduced a dedicated performance test config, browser-side vitals capture helper, and package script so the storefront budget can run locally now and in CI once workflow wiring is added
- validated the batch with `npm.cmd run typecheck` and `npm.cmd run test:e2e:performance`

### [#77] 2026-04-08 - Storefront publishing approval baseline

- completed Stage `4.2.3` by separating storefront draft editing from live publish and rollback approval authority
- added a dedicated storefront approval permission, kept legacy storefront-manage as compatibility fallback, and enforced approval-only access on live publish or rollback routes while leaving draft save with designer-edit access
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/api/internal/routes.test.ts`

### [#76] 2026-04-08 - Storefront version history baseline

- completed Stage `4.2.2` by deriving storefront version history from immutable live revision snapshots for the full settings document and key content blocks
- exposed protected history reads through ecommerce internal routes and surfaced recent settings plus home-slider version entries inside the existing designer workspaces
- validated the batch with `npm.cmd run typecheck`, `npx.cmd tsx --test tests/ecommerce/services.test.ts`, and `npx.cmd tsx --test tests/api/internal/routes.test.ts`

### [#75] 2026-04-08 - Storefront publishing workflow baseline

- completed Stage `4.2.1` by moving storefront designer saves onto a draft settings record with explicit publish and rollback actions
- kept public storefront reads on the live settings document, exposed internal workflow state for draft-vs-live preview, and wired the main storefront settings workspace to publish or rollback from immutable live revisions
- validated the batch with `npm.cmd run typecheck`, `npx.cmd tsx --test tests/ecommerce/services.test.ts`, and `npx.cmd tsx --test tests/api/internal/routes.test.ts`

### [#71] 2026-04-08 - Storefront block governance validation baseline

- completed Stage `4.1.1` by adding a shared validation layer across the editable storefront block designers
- wired client-side validation and save blocking into the main homepage and merchandising block editors while keeping seeded defaults and live previews intact
- validated the batch with `npm.cmd run typecheck`

### [#72] 2026-04-08 - Storefront server-side payload validation baseline

- completed Stage `4.1.2` by enforcing shared server-side validation for editable storefront links and media references
- hardened the ecommerce catalog schemas so persisted storefront settings only accept root-relative or explicit safe-link formats, and media fields only accept root-relative or `http(s)` references
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts`

### [#73] 2026-04-08 - Storefront designer role permission baseline

- completed Stage `4.1.3` by splitting storefront designer visibility from storefront designer edit access in the ecommerce role model
- updated internal storefront routes and the main designer surfaces so read-only roles can inspect content while save actions remain limited to edit-capable roles, with legacy `ecommerce:storefront:manage` kept as compatibility fallback
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/api/internal/routes.test.ts`

### [#74] 2026-04-08 - Storefront live revision safety baseline

- completed Stage `4.1.4` by snapshotting the current live storefront settings into an immutable revision store before each live overwrite
- added bounded storefront revision retention and corrected storefront settings hydration so persisted timestamps survive reads, preventing live history from collapsing back to seed defaults
- validated the batch with `npm.cmd run typecheck` and `npx.cmd tsx --test tests/ecommerce/services.test.ts`

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

### [#73] 2026-04-08 - Billing controls and period-close governance

- completed billing Stage `B11` with maker-checker controls, finance roles and permissions, accounting dimensions, exception reporting, and finance KPIs
- completed billing Stage `B12` with month-end checklist, financial-year close workflow, opening-balance rollover policy, audit-trail review surface, and year-end adjustment plus carry-forward controls
- extended the billing close workspace, protected internal route surface, and targeted billing route or reporting tests so control-state review and period-close actions use the shared platform audit and runtime model

### [#74] 2026-04-08 - Billing split-table storage and query baseline

- completed Stage `T5.1` by adding item split tables for sales, purchase, receipt, payment, journal, and contra vouchers and syncing them from the billing voucher lifecycle
- completed Stage `T5.2` by adding bill reference, bill settlement, and overdue tracking tables with write rules for invoices, settlements, notes, and returns
- started Stage `T5.3` by adding a split-register query service and protected billing register route so register reads can target voucher-family tables without loading full voucher JSON payloads
- completed the `T5.3` sales, purchase, and settlement report cutover so GST registers and bill-control reporting read from split voucher and bill-engine tables
- completed `T5.4` split-table validation coverage for sync, reverse/delete lifecycle behavior, migration registration, and targeted runtime verification
- validated the batch with `npm run typecheck` and targeted billing service plus route tests
# 2026-04-08

- `#102` Completed Stage `8.2` by adding an explicit ecommerce admin operations release gate, a dedicated Playwright command, and a checklist artifact for storefront content, orders, payments, and support.
