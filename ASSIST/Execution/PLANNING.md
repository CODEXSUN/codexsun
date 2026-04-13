# Planning

## Active Batch

- `#174` Introduce task-linked application versioning and surface the installed version in the app
  - Scope: replace the current static `0.0.1` release numbering with a task-linked semantic version pattern such as `1.0.174`, wire that version into the runtime app settings and admin shell, and make the git helper synchronize version files automatically.
  - Constraint: keep one consistent source of truth for installed version metadata, preserve machine-usable package semver, and avoid a workflow where changelog, package version, helper commit flow, and app footer drift apart.
  - Delivered fix:
    - added a shared framework `applicationVersion` contract plus CLI versioning helpers so installed version, footer label, and release tag all derive from the same task number
    - extended runtime app settings and the fallback snapshot with version metadata, then rendered that installed version in the admin sidebar footer for easy in-app verification
    - added `npm run version:sync` and automatic git-helper version synchronization so root and mobile package metadata, the shared runtime version file, and changelog version state update together before commit
    - migrated changelog entry labels to `v 1.0.<reference>` and aligned ASSIST versioning guidance with the new task-linked release pattern
  - Validation:
    - `npm run typecheck`
    - `npx tsx --test tests/cli/github-helper.test.ts tests/cli/versioning.test.ts`

- `#172` Make development runtime logs easier to read
  - Scope: improve local runtime console readability so startup, request, and warning logs are easy to scan during development without sacrificing structured production logging.
  - Constraint: keep production-like environments on JSON output for machine readability and preserve the existing runtime logger contract for downstream operational use.
  - Delivered fix:
    - added a development-specific runtime log formatter that emits concise human-readable lines instead of raw JSON blobs
    - preserved structured JSON output for staging and production-like environments so existing machine-readable logging behavior remains intact
    - added focused logger coverage for both development formatting and production JSON behavior
  - Validation:
    - `npm run typecheck`
    - `npx tsx --test tests/framework/runtime/logger.test.ts`

- `#171` Gate unsupported database backup scheduling and make the admin state explicit
  - Scope: stop the runtime from attempting scheduled database backups when backup execution is intentionally unsupported, and show that unsupported state clearly in the admin data-backup screen.
  - Constraint: keep the current route surface intact, avoid background failure noise during startup, and make manual backup or restore actions visibly unavailable rather than failing only after a click.
  - Delivered fix:
    - added explicit backup support metadata to the backup dashboard contract so the frontend can distinguish between disabled scheduling and unsupported backup implementation
    - gated the backup scheduler at runtime so unsupported deployments no longer attempt an immediate scheduled backup on boot and instead log one explicit unsupported warning
    - updated the data-backup screen to show the unsupported state, explain why backup execution is unavailable, and disable manual backup and restore actions
  - Validation:
    - `npm run typecheck`
    - `npx tsx --test tests/framework/database-backup-scheduler.test.ts`
  - Residual risk:
    - backup execution itself is still intentionally unimplemented for the MariaDB/PostgreSQL-only runtime, so a later batch is still needed to build a real backup and restore strategy rather than only gating the unsupported path

- `#170` Add media-manager controls to verify or recreate the public media symlink
  - Scope: give operators a direct admin control in the shared media manager to verify the runtime public media mount and recreate it when the symlink is missing or broken.
  - Constraint: reuse the existing framework media route surface and runtime storage helpers, keep the action narrowly scoped to the public media symlink, and make the UI explicit about whether the mount is healthy, missing, or misconfigured.
  - Delivered fix:
    - added shared framework media-symlink schemas plus authenticated internal `/internal/v1/framework/media-symlink` read and action routes for verifying or recreating the public mount
    - extended the runtime media storage helper with a non-destructive symlink inspection path that reports whether the mount is healthy, missing, or misconfigured before any operator action runs
    - added a compact status card to the media manager with `Verify` and `Add or Recreate` actions, alongside path details for the current mount and resolved target
  - Validation:
    - `npm run typecheck`
  - Residual risk:
    - this batch only adds operator controls around the symlink; it does not yet change the separate backup scheduler regression or broader update preflight issues identified in the startup review

- `#169` Remove SQLite and better-sqlite3 support from the application runtime
  - Scope: remove SQLite as a supported application runtime and remove the `better-sqlite3` dependency so the platform supports only MariaDB for primary transactional workloads and PostgreSQL for analytics workloads.
  - Constraint: keep the removal honest across config, runtime settings, database client construction, backup operations, and operator-facing docs; do not leave dead SQLite options exposed in the admin UI or runtime env contract.
  - Delivered fix:
    - removed `better-sqlite3` and its type package from the dependency graph and deleted the SQLite database-client branch from the framework runtime
    - removed SQLite and offline SQLite controls from the runtime settings contract and made server config fail fast when `DB_DRIVER=sqlite` or `OFFLINE_SUPPORT_ENABLED=true` are still present in runtime env
    - changed media-root derivation away from the SQLite file path so public media no longer depends on a SQLite-specific storage location
    - retired the SQLite-only backup and restore implementation by replacing it with an explicit unsupported-driver error for the remaining MariaDB/PostgreSQL-only runtime
    - updated focused framework tests to assert the new MariaDB-first runtime and the explicit rejection of removed SQLite modes
  - Validation:
    - `npm run typecheck`
    - `npx tsx --test tests/framework/runtime-settings-service.test.ts tests/framework/runtime/config.test.ts tests/framework/runtime/database.test.ts tests/cli/release-env-check.test.ts`
  - Residual risk:
    - many older integration and domain tests still construct SQLite temp runtimes explicitly; they still need broader migration if the full historical suite is to execute under the new MariaDB/PostgreSQL-only model

- `#168` Dedicated mail settings editor backed by runtime `.env`
  - Scope: add a dedicated framework mail settings surface that reads SMTP configuration from the active runtime `.env` file and allows operators to update it from the frontend through the backend.
  - Constraint: keep `.env` ownership and write semantics inside the existing framework runtime-settings path, avoid introducing a second ad hoc env writer, and ensure missing SMTP keys are created during save instead of requiring a pre-seeded `.env`.
  - Delivered fix:
    - added a framework-owned mail-settings schema and service around `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME`, `AUTH_OTP_DEBUG`, and `AUTH_OTP_EXPIRY_MINUTES`
    - exposed dedicated authenticated `GET` and `POST /internal/v1/cxapp/mail-settings` endpoints that delegate env persistence to the existing runtime-settings writer so missing SMTP keys are created in `.env` on save
    - added a dedicated frontend `Mail Settings` page under framework settings using the shared runtime-settings UI constrained to the notifications group plus a filtered `Developer Testing` tab for OTP debug and expiry controls
    - registered the new page in the framework settings launcher, desk route metadata, sidebar utility navigation, and fallback runtime app settings so it appears under `Mail` immediately after `Mail Service`
  - Validation:
    - `npm run typecheck`
    - focused internal route coverage for the new mail settings endpoint

- `#167` Text-editable pricing formula inputs in product upsert
  - Scope: make the pricing formula helper in the core product upsert pricing tab editable as free text for purchase price, selling percent, and MRP percent.
  - Constraint: keep the current calculation flow intact while shifting numeric parsing to calculate time so operators can type and edit values more freely.
  - Delivered fix:
    - changed the pricing formula draft state from numeric fields to string fields
    - changed purchase price, selling %, and MRP % from number inputs to text fields in the pricing tab
    - added parse-on-calculate validation so invalid non-numeric entries show a warning instead of updating pricing rows
  - Validation:
    - `npm run typecheck`

- `#166` Move product SEO fields into a dedicated upsert tab
  - Scope: separate the product SEO form fields from the storefront tab so operators can manage SEO in its own focused tab.
  - Constraint: keep the current SEO generation buttons and field behavior unchanged while changing only the tab placement.
  - Delivered fix:
    - removed the SEO section from the storefront tab content
    - added a dedicated `SEO` tab containing the existing SEO section card and generated-field actions
  - Validation:
    - `npm run typecheck`

- `#165` Map storefront department to product group lookup in product upsert
  - Scope: change the core product upsert storefront department field so it reuses the product-group master through autocomplete lookup and inline create-new support.
  - Constraint: keep the UX aligned with existing `ProductLookupField` behavior and avoid introducing a second storefront-specific master when product groups already exist.
  - Delivered fix:
    - widened the core storefront department contract from enum-only to text-backed nullable string
    - updated Frappe product projection to pass storefront department through as text instead of enum-gating it away
    - replaced the storefront `Department` select in the product upsert form with a `ProductLookupField` bound to `productGroups`, and synchronized the selected group into both product-group fields and storefront department text
  - Validation:
    - `npm run typecheck`
    - `npx tsx --test tests/core/product-service.test.ts`
    - `npx tsx --test --test-name-pattern "internal route registry includes the core common-module CRUD endpoints" tests/api/internal/routes.test.ts`

- `#164` Backend-driven SEO field generation for core product upsert
  - Scope: add backend-owned generation for the core product SEO title, description, and keywords so the product upsert form can populate those fields through a narrow internal API instead of browser-local rules.
  - Constraint: keep generation logic inside `apps/core`, expose it only through `apps/api`, and keep the UI refinement limited to the existing SEO fields in the core product upsert surface.
  - Delivered fix:
    - added shared SEO generation request and response schemas plus a core service helper for `metaTitle`, `metaDescription`, and `metaKeywords`
    - added protected `POST /internal/v1/core/products/generate-seo-field`
    - added small right-aligned icon buttons to the `Meta Title`, `Meta Description`, and `Meta Keywords` labels and wired them to the backend generator using current product form values
  - Validation:
    - `npm run typecheck`
    - `npx tsx --test tests/core/product-service.test.ts`
    - `npx tsx --test --test-name-pattern "internal route registry includes the core common-module CRUD endpoints" tests/api/internal/routes.test.ts`

- `#163` Backend-driven slug generation for core product upsert
  - Scope: add a core-owned slug generation endpoint so the product upsert UI can request the canonical slug from the backend instead of duplicating slugify rules in the browser.
  - Constraint: keep slug ownership inside `apps/core`, expose it through the internal API route layer, and keep the UI change narrow to the existing slug field in the core product upsert surface.
  - Delivered fix:
    - added shared core slug-generation request and response schemas plus a `generateProductSlug()` helper in `apps/core/src/services/product-service.ts`
    - added protected `POST /internal/v1/core/products/generate-slug` in `apps/api/src/internal/core-routes.ts`
    - widened the product field label contract so the slug field can render a small right-aligned icon button, then wired the core product upsert form to call the backend endpoint and fill the slug from the current product name
  - Validation:
    - `npm run typecheck`
    - `npx tsx --test tests/core/product-service.test.ts`
    - `npx tsx --test --test-name-pattern "internal route registry includes the core common-module CRUD endpoints" tests/api/internal/routes.test.ts`

- `#162` Convert Frappe item mapping compare surface into table-based field mapping
  - Scope: change the Frappe item-to-core mapping UI from the current side-by-side compare card into a table-oriented mapping board that matches the requested screenshot direction.
  - Constraint: keep the existing Frappe-owned mapping payload and save/sync workflow intact without introducing a new backend field-mapping persistence contract in this batch.
  - Delivered fix:
    - replaced the old compare card in `apps/frappe/web/src/workspace/item-mapping-compare-panel.tsx` with a table-based mapping card
    - added rows keyed by core database field, with `Frappe`, `Product mapping`, and `Action` dropdown columns
    - kept target-product selection, operator notes, direct value editors, flag toggles, preview, and save/sync actions below the table so the current mapping payload remains editable
  - Validation:
    - `npm run typecheck`

- `#161` Preserve prior web chunks during rebuilds to avoid stale dashboard lazy-import 404s
  - Scope: stop already-open dashboard sessions from failing lazy route imports after a web rebuild or live server git update replaces hashed frontend chunks.
  - Root cause: the frontend uses hashed lazy chunk filenames, but Vite is configured to clear the web output directory and the runtime system-update flow also clears the entire `build/` tree before rebuilding. Browsers holding the previous shell chunk can still request the old lazy filename after deploy, which then 404s because the file was deleted.
  - Delivered fix:
    - changed `vite.config.ts` to keep the web output directory intact during frontend builds so previous hashed chunks remain available beside the latest `index.html` and active assets
    - changed `apps/framework/src/runtime/system-update/system-update-service.ts` so runtime git-update cleanup clears only the server build output and cache directories instead of deleting the entire web build tree
    - preserved the current shell rebuild flow while removing the specific stale lazy-chunk deletion path that caused `Failed to fetch dynamically imported module` errors after deploy
  - Validation:
    - `npm run build`

- `#159` Frappe item-to-core-product sync and mapping workflow
  - Scope: implement live Frappe `Item` pull filters, a Frappe-owned item-to-core mapping table, a compare-and-map UX, and sync projection into canonical `apps/core` products with ecommerce-visible badge state stored on the core product record.
  - Constraint: keep orchestration, mapping persistence, and ERP query assembly inside `apps/frappe`; `apps/core` remains the owner of the product schema, and ecommerce continues reading badge state from the projected core product instead of a second connector-owned store.
  - Delivered workflow:
    - `POST /internal/v1/frappe/items/pull-live` now accepts an optional manual query string such as `disabled=0&item_group=Laptop`
    - `apps/frappe` now owns `frappe_item_product_mappings` plus mapping services and routes for reading and saving per-item core product projection defaults
    - item sync now projects through the saved mapping draft into `core/product`, preserving existing core-owned arrays and detail on updates instead of wiping them
    - the Frappe Item Manager now includes a default left/right compare surface for the selected ERP item and the resolved core product draft, with badge and department defaults visible before sync
  - Validation:
    - `npm run typecheck`
    - `npx tsx --test tests/frappe/services.test.ts`
    - `npx tsx --test --test-name-pattern "internal route registry includes the frappe connector endpoints" tests/api/internal/routes.test.ts`
    - `npm run build`

- `#160` Fix live-server git update rebuild missing TypeScript in production container
  - Scope: stop the production live-server git-update path from failing with `sh: 1: tsc: not found` when the runtime repository rebuild runs inside the container.
  - Root cause: plain `npm ci` was being run in production-like env during the image build, the runtime repo bootstrap in `.container/entrypoint.sh`, and the framework system-update install-and-build path. In that environment npm can omit devDependencies, which removes `typescript` and breaks `npm run typecheck` and `npm run build`.
  - Delivered fix:
    - changed `.container/Dockerfile` to use `npm ci --include=dev`
    - changed `.container/entrypoint.sh` runtime repo bootstrap to use `npm ci --include=dev`
    - changed framework `installAndBuild()` in `apps/framework/src/runtime/system-update/system-update-service.ts` to use `npm ci --include=dev`
  - Validation:
    - `bash -n .container/entrypoint.sh`
    - `npm run typecheck`
    - `npm run build`
