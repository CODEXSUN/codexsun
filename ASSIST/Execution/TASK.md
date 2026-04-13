# Task

## Active Batch

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
