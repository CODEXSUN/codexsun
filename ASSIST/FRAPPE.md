# Frappe

## Purpose

This file is the current app-detail guide for `apps/frappe`.

Use it to understand what the Frappe connector actually owns today, what it persists locally, how it reaches other apps, and which ERP-facing contracts are still staged documentation or policy rather than fully executed sync.

If this file conflicts with `ASSIST/Documentation/ARCHITECTURE.md`, architecture wins and this file must be updated.

## Ownership Summary

`apps/frappe` is the ERPNext connector boundary.

It owns today:

1. connector settings and verification state
2. app-owned ToDo, item, purchase-receipt, and item-sync-log snapshots
3. Sales Order push records for paid ecommerce orders
4. delivery-note, invoice, and return or refund sync-back records for ecommerce orders
5. connector retry-policy, push-policy, observability, and projection-contract read models
6. Frappe-specific workspace metadata and web workspace sections

It does not own today:

1. shared product authority, which remains in `apps/core`
2. storefront runtime, checkout, customer auth, and order authority, which remain in `apps/ecommerce` and `apps/cxapp`
3. route transport ownership, which remains in `apps/api`
4. framework monitoring or activity-log infrastructure, which remains in `apps/framework`

## Current App Shape

`apps/frappe` follows the standard suite app shape:

1. `src/`
   - manifest, database registration, seed data, and connector services
2. `web/`
   - desk workspace sections and internal API client
3. `database/migration/`
   - registered JSON-store table setup for the seeded connector baseline
4. `database/seeder/`
   - seeded settings, todos, items, receipts, and item sync logs
5. `helper/`
   - local helper export surface
6. `shared/`
   - workspace metadata plus all Frappe Zod contracts and types

## Persistence Model

### Registered Database Module

`apps/frappe/src/database-module.ts` registers the app database module at order `30` with the framework migration and seeder runtime.

### Registered Tables

The current registered migration or seeder list covers:

1. `frappe_settings`
2. `frappe_todos`
3. `frappe_items`
4. `frappe_purchase_receipts`
5. `frappe_item_product_sync_logs`

These are the only Frappe tables currently in `apps/frappe/database/migration/index.ts` and `apps/frappe/database/seeder/index.ts`.

### Declared But Not Registered In Migrations

`apps/frappe/database/table-names.ts` also declares:

1. `frappe_sales_order_syncs`
2. `frappe_delivery_note_syncs`
3. `frappe_invoice_syncs`
4. `frappe_return_syncs`

Those stores are used by live services, but they are not part of the registered migration list yet. They rely on the JSON-store helper path that ensures the table exists when the service first reads or writes it.

That means transaction-sync persistence is live, but still less explicit than the seeded baseline tables.

## Shared Contract Surface

`apps/frappe/shared/schemas/frappe.ts` is the connector contract hub. It currently defines:

1. settings and verification payloads or responses
2. sync retry policy and sales-order push policy responses
3. connector observability report responses
4. item, price, stock, and customer-commercial projection contract responses
5. ToDo, item, item-sync-log, and purchase-receipt snapshot models
6. Sales Order, delivery-note, invoice, return, reconciliation-queue, and replay models

The important split is:

1. snapshot contracts and transaction-sync contracts back live services today
2. price, stock, and customer-commercial projection contracts are currently explicit policy documents, not executed sync implementations

## Service Surface

### Access And Store Helpers

`src/services/access.ts` enforces two roles:

1. `assertFrappeViewer` for `admin` or `staff`
2. `assertSuperAdmin` for secret-bearing writes and replay actions

`src/services/store.ts` is the JSON-store helper used by every connector service.

### Settings

`src/services/settings-service.ts` owns:

1. reading masked connector settings for super admin only
2. saving connector settings while preserving existing secrets when blank inputs are submitted
3. resetting saved verification state when base URL, site, credentials, or timeout change
4. verifying against `GET /api/method/frappe.auth.get_logged_user` with timeout and optional site header
5. persisting verification state only when the verification request matches the current saved settings
6. recording verification success or failure into shared monitoring and activity logs

Current behavior:

1. unsaved verification is supported
2. saved secrets are never returned to the UI
3. verification uses stored secrets when the user leaves secret inputs blank

### ToDo Snapshots

`src/services/todo-service.ts` is local CRUD only.

It lists, creates, and updates connector-owned ToDo snapshots. There is no live ERP fetch in this service today.

### Item Snapshots And Product Projection

`src/services/item-service.ts` owns:

1. listing and reading local item snapshots
2. super-admin create or update for local item snapshots
3. listing item-to-product sync logs
4. projecting selected item snapshots into `apps/core` products

Current projection behavior is narrow by design:

1. item code becomes product code and SKU
2. item name, description, group text, brand text, HSN candidate, active flag, and variant capability are projected
3. projection writes call `createProduct` or `updateProduct` in `apps/core`
4. duplicate handling is either `overwrite` or `skip`
5. sync logs are capped to the latest `20` runs

Not included in the current item projection:

1. price projection
2. stock projection
3. media ingestion
4. variant row synthesis
5. category or brand id reconciliation

### Purchase Receipt Snapshots

`src/services/purchase-receipt-service.ts` lists, reads, and marks selected purchase receipts as locally synced.

Current behavior is intentionally limited:

1. sync marks receipt records with `syncedRecordId`, `syncedAt`, and `isSyncedLocally`
2. it records connector events for success or missing-record failure
3. it does not write stock or valuation into `core` or `billing`

Current limitation:

1. list and read paths call `decorateReceipt`, which clears item-level `productId`, `productName`, `productSlug`, and `isSyncedToProduct`
2. as a result, the manager and preview payloads currently show receipt rows as unlinked even when the seeded raw receipt data contains linked-product references

### Sales Order Push

`src/services/sales-order-service.ts` is the live outbound transactional bridge.

It currently:

1. accepts only locally paid ecommerce orders
2. derives ERP customer code from `customerAccountId` or `coreContactId`
3. resolves ERP item codes from `apps/core` products
4. blocks push if item-code mapping is missing
5. requires connector enabled, configured, and last verification status `passed`
6. POSTs to `/api/resource/Sales Order`
7. records success or failure into `frappe_sales_order_syncs`
8. reuses an existing synced record when the same order and provider payment id are seen again

This is the implemented part of the current transactional bridge, not just a future contract.

### Ecommerce Sync-Back

`src/services/transaction-sync-service.ts` is the live inbound sync-back bridge from ERP snapshots into local ecommerce order links.

It currently supports:

1. delivery-note sync-back
2. invoice sync-back
3. return or refund sync-back
4. reconciliation queue generation
5. manual replay

Current replay behavior:

1. `sales_order` replay re-runs the outbound Sales Order push and reattaches the order link
2. `delivery_note`, `invoice`, and `return_refund` replay reattaches the latest stored local record to the ecommerce order

### Observability And Policy Reads

The remaining Frappe services are read models:

1. `observability-service.ts`
   - writes connector events into framework monitoring plus activity log
   - reads connector failure counts and recent exceptions
2. `sync-policy-service.ts`
   - exposes retry, timeout, and fail-closed policy from saved connector settings
3. `sales-order-policy-service.ts`
   - exposes approval and retry rules for the transactional Sales Order bridge
4. `item-projection-contract-service.ts`
5. `price-projection-contract-service.ts`
6. `stock-projection-contract-service.ts`
7. `customer-commercial-profile-contract-service.ts`

Those contract services are explicit boundary documents backed by code, but only the item-master projection is currently implemented as an execution path.

## API Surface

### Internal Frappe Routes

`apps/api/src/internal/frappe-routes.ts` exposes the Frappe connector under `/internal/v1/frappe/*`.

Current route groups:

1. settings and verification
2. sync policy, sales-order push policy, and observability
3. reconciliation queue and replay
4. delivery-note, invoice, and return sync-back writes
5. projection-contract reads
6. ToDo list and write routes
7. item list, read, write, sync-log, and sync-to-product routes
8. purchase-receipt list, read, and sync routes

There is no external Frappe API surface.

### Cross-App Transport Hooks

The Frappe app is also triggered from ecommerce transport:

1. `apps/api/src/external/ecommerce-routes.ts`
   - after checkout verification
   - after Razorpay webhook capture
2. `apps/api/src/internal/ecommerce-routes.ts`
   - after payment reconciliation

Those transport hooks call `pushStorefrontOrderToFrappeSalesOrder`, but the orchestration still remains inside `apps/frappe`.

## Workspace Surface

`apps/frappe/shared/workspace-items.ts` currently defines five workspace entries:

1. `overview`
2. `connection`
3. `todos`
4. `items`
5. `purchase-receipts`

`apps/frappe/web/src/workspace-sections.tsx` maps those entries to live sections.

Current section coverage:

1. `overview`
   - shows snapshot counts, connector settings summary for super admin, sync guardrails, and recent connector exceptions
2. `connection`
   - super-admin-only credential editing and verification
3. `todos`
   - local ToDo snapshot list and super-admin create or update
4. `items`
   - local item snapshot list, super-admin create or update, and sync-to-core-product controls
5. `purchase-receipts`
   - receipt list, preview, and sync-to-local-record controls

The standalone app shell at `apps/frappe/web/src/app-shell.tsx` is still only a preview card. The real working surface is the shared desk workspace rendered through the route-specific sections above.

## Current State And Limits

### Implemented Now

1. super-admin-managed connector settings with masked secret handling
2. real verification against ERPNext auth endpoint
3. local ToDo, item, purchase-receipt, and item-sync-log persistence
4. item-master projection into `apps/core` products
5. paid-order Sales Order push into ERPNext with duplicate guard
6. delivery-note, invoice, and return or refund sync-back into ecommerce order links
7. connector observability through shared monitoring and activity log
8. internal route coverage and focused tests for settings, sync policy, Sales Order push, replay, and sync-back behavior

### Not Implemented Yet

1. live ERP fetch and refresh for ToDo, item, or purchase-receipt snapshots
2. executed price projection into core pricing
3. executed stock projection into core stock
4. executed customer-commercial enrichment into ecommerce customer profiles
5. dedicated Frappe workspace pages for reconciliation queue, replay actions, policy documents, or contract views
6. registered migrations or seeders for the transaction-sync tables
7. any external public API owned by the Frappe app

### Boundary Rules To Preserve

1. only `apps/frappe`, `apps/api`, and tests may import `apps/frappe/src/services/*` directly
2. connector orchestration stays in `apps/frappe`; transport stays in `apps/api`
3. downstream business ownership stays in the target app even when Frappe writes into it
4. storefront runtime must continue reading persisted local data, not live ERP responses
