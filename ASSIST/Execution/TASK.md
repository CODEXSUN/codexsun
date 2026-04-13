# Task

## Active Batch

- [ ] `#159` Plan Frappe item-to-core-product sync and mapping workflow
  - [ ] Phase 1: inspect the current `apps/frappe` item pull flow, `apps/core` product contract, and any existing ecommerce product projection path
  - [ ] Phase 2: define support for manual ERP item queries such as `item_group=Laptop` and decide where filtered pull inputs belong in the Frappe app boundary
  - [ ] Phase 3: define the sync action that projects Frappe item data into `core/product` and then updates ecommerce product state and badges from that canonical product record
  - [ ] Phase 4: design a Frappe-to-core product mapping surface with left/right compare, default field mapping, and explicit fallback or default-value handling for mismatched schemas
  - [ ] Phase 5: record validation expectations, open questions, and implementation order before code changes start
