# Task

## Active Batch

- [ ] `#193` Create the dedicated `apps/stock` operational workspace and wire the stock engine end to end
  - [x] Phase 1: execution reset and stock-app scope confirmation
    - [x] 1.1 close the tenant-engine batch from active execution tracking
    - [x] 1.2 confirm `apps/stock` as the operational stock boundary while billing keeps document ownership
    - [x] 1.3 scope the batch to stock routes, workspace registration, and frontline stock modules
  - [x] Phase 2: stock app foundation
    - [x] 2.1 create `apps/stock` app manifest, workspace items, shared schemas, and database module
    - [x] 2.2 preserve the current `apps/billing` stock document services instead of moving them yet
    - [x] 2.3 keep inventory-engine and tenant-engine as reusable foundations under `framework/engines`
  - [x] Phase 3: stock service façade
    - [x] 3.1 add `apps/stock/src/services/stock-manager-service.ts`
    - [x] 3.2 wrap purchase receipts, goods inward, stock units, sticker batches, and sale allocations through the stock app boundary
    - [x] 3.3 expose inventory-engine diagnostics, transfers, reservations, availability, verification, and reconciliation from the same service layer
  - [x] Phase 4: stock internal API routes
    - [x] 4.1 add `apps/api/src/internal/stock-routes.ts`
    - [x] 4.2 expose list, show, create, update, post, transfer, reservation, verification, and reconciliation endpoints under `/stock/*`
    - [x] 4.3 register the stock route set into the internal API assembly
  - [x] Phase 5: runtime registration
    - [x] 5.1 register `stockAppManifest` into the framework app suite
    - [x] 5.2 register the stock database module into the database process registry
    - [x] 5.3 surface the stock app as a first-class desk application
  - [x] Phase 6: stock frontend workspace
    - [x] 6.1 add `apps/stock/web/src/workspace-sections.tsx`
    - [x] 6.2 implement list, show, and upsert flows for purchase receipts and goods inward
    - [x] 6.3 implement operational screens for stock units, barcode verification, sticker batches, sale allocations, movements, availability, reconciliation, transfers, reservations, and periodic verification
  - [x] Phase 7: cxapp desk and route integration
    - [x] 7.1 add stock-specific desk registry modules and menu groups
    - [x] 7.2 wire `FrameworkAppWorkspacePage` to render the stock workspace
    - [x] 7.3 add dedicated cxapp routes for stock purchase-receipt and goods-inward list/show/upsert pages
  - [ ] Phase 8: cleanup and hardening
    - [x] 8.1 fix stock-app relative imports and local module registration issues found during verification
    - [ ] 8.2 clean remaining stock-app type issues that are independent of the repo-wide `rootDir` constraint
    - [ ] 8.3 decide whether to add a dedicated stock alias/path mapping or keep explicit relative imports for the new app boundary
