# Planning

## Active Batch

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
