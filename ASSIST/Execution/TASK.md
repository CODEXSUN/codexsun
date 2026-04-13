# Task

## Active Batch

- [x] `#167` Text-editable pricing formula inputs in product upsert
  - [x] Phase 1: inspect the pricing formula card in the product upsert pricing tab
  - [x] Phase 2: change purchase price, selling %, and MRP % inputs to text-editable fields with parse-on-calculate validation
  - [x] Phase 3: validate with typecheck

- [x] `#166` Move product SEO fields into a dedicated upsert tab
  - [x] Phase 1: inspect the current product upsert tab layout and SEO section placement
  - [x] Phase 2: move SEO content from the storefront tab into a dedicated SEO tab while keeping existing field actions intact
  - [x] Phase 3: validate with typecheck and align changelog/docs

- [x] `#165` Map storefront department to product group lookup in product upsert
  - [x] Phase 1: inspect the current storefront department contract and product-group lookup path
  - [x] Phase 2: widen storefront department to text-backed mapping and replace the storefront field with autocomplete lookup plus inline create-new support
  - [x] Phase 3: validate with typecheck and focused core route or service coverage

- [x] `#164` Backend-driven SEO field generation for core product upsert
  - [x] Phase 1: inspect the current SEO field UI and extend the backend-owned text generation pattern
  - [x] Phase 2: add a backend SEO field generator route and wire icon actions into meta title, description, and keywords
  - [x] Phase 3: validate with typecheck and focused route/service coverage

- [x] `#163` Backend-driven slug generation for core product upsert
  - [x] Phase 1: inspect the current core product upsert slug field, core product service slugify logic, and internal route surface
  - [x] Phase 2: add a backend slug-generation endpoint and wire a compact slug icon action into the product upsert form label
  - [x] Phase 3: validate with typecheck and focused route/service coverage

- [x] `#162` Convert Frappe item mapping compare surface into table-based field mapping
  - [x] Phase 1: inspect the current compare-and-map panel and the requested table layout reference
  - [x] Phase 2: replace the side-by-side field form with a table showing core key, Frappe field, mapping field, and action dropdowns
  - [x] Phase 3: validate the refactor with typecheck

- [x] `#161` Preserve prior web chunks during rebuilds to avoid stale dashboard lazy-import 404s
  - [x] Phase 1: inspect the frontend build output, lazy page chunking, and runtime git-update cleanup path
  - [x] Phase 2: preserve prior hashed web assets across rebuilds while keeping the current shell entry updated
  - [x] Phase 3: validate the build output and confirm the stale-chunk mitigation path

- [x] `#159` Frappe item-to-core-product sync and mapping workflow
  - [x] Phase 1: inspect the current `apps/frappe` item pull flow, `apps/core` product contract, and any existing ecommerce product projection path
  - [x] Phase 2: add support for manual ERP item queries such as `item_group=Laptop` inside the Frappe app boundary
  - [x] Phase 3: project Frappe item data into `core/product` through a Frappe-owned mapping draft and keep ecommerce badge state on the canonical core product
  - [x] Phase 4: add a Frappe-to-core product mapping surface with left/right compare, default field mapping, and explicit default-value handling for mismatched schemas
  - [x] Phase 5: validate the implementation with typecheck, focused Frappe service tests, a Frappe route-registry check, and a full build

- [x] `#160` Fix live-server git update rebuild missing TypeScript in production container
  - [x] Phase 1: inspect the container image build, runtime repository bootstrap, and framework git-update rebuild path
  - [x] Phase 2: force build-time dependency install to include devDependencies so `typescript` and `tsc` exist during live rebuilds
  - [x] Phase 3: validate the shell entrypoint, typecheck, and full build after the dependency-install change
