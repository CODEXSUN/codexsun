# Stock, Warehouse, And Delivery Blueprint

## Purpose

This document defines the future end-to-end stock workflow for Codexsun from supplier inward through warehouse availability, sales issue, and delivery handoff.

This is a planning document only. It does not mean the current runtime already supports this full flow.

## Shared Planning Contract

The future planning contract for the workflow stages and sticker metadata lives in:

- [stock-workflow.ts](/E:/Workspace/codexsun/apps/billing/shared/stock-workflow.ts:1)

That contract defines:

1. workflow stage ids
2. stock identity modes
3. barcode source modes
4. sticker field vocabulary
5. the current default sticker layout

## Target Outcome

The stock module should eventually support this full operational chain:

1. create or sync a purchase receipt
2. receive goods inward against that receipt
3. verify each inward item physically
4. assign batch and serial identity where required
5. generate internal barcode identity while preserving manufacturer barcode or serial
6. print a product sticker
7. scan-verify the sticker before putaway
8. add verified units into a warehouse as sellable stock
9. scan units into a sales document
10. reduce stock on sale posting
11. hand the issued units to delivery or pickup with traceability preserved

## Current Ownership Baseline

The blueprint must respect the current repository boundaries:

1. `apps/core` owns product master identity and the persisted stock rows that storefront reads
2. `apps/billing` owns purchase, sales, voucher, and stock-accounting behavior
3. `apps/frappe` owns ERP purchase-receipt and stock snapshot ingestion, not the final stock authority
4. `apps/ecommerce` consumes sellable stock and owns order and delivery-facing runtime
5. `apps/cxapp` company data provides printable company contact values such as primary email and primary phone

## Required Document Chain

The future operational document chain should be:

1. `purchase receipt`
2. `goods inward note`
3. `stock unit record`
4. `barcode print batch`
5. `warehouse stock posting`
6. `sales issue`
7. `delivery handoff`

## Stock Identity Model

Future stock control should support four identity modes:

1. `none`
2. `batch`
3. `serial`
4. `batch-and-serial`

Rules:

1. identity mode must be declared by the product or variant policy before inward starts
2. a serial-controlled inward quantity must produce one stock-unit identity per received unit
3. batch-controlled stock may group quantity under one batch, but sellability and expiry checks later must still be explicit
4. manufacturer barcode and manufacturer serial must be stored as external references, not as the only internal identity

## Barcode Model

Every inwarded sellable unit should eventually support:

1. internal stock barcode value
2. internal batch number
3. internal serial number where applicable
4. manufacturer barcode
5. manufacturer serial number

Rules:

1. internal barcode identity is the operational lookup key
2. manufacturer references remain searchable aliases
3. one scan should resolve to a single sellable stock unit or a single batch-controlled stock group
4. ambiguous resolution must fail closed for operator review

## Sticker Specification

The first supported inventory label should be:

1. width: `25 mm`
2. height: `50 mm`

Planned printed fields:

1. product name
2. product code
3. internal barcode value
4. batch number
5. serial number
6. MRP
7. variant name
8. attribute summary
9. manufacturer barcode
10. manufacturer serial
11. company primary email
12. company primary phone

Rules:

1. company email and phone should come from the active company record, not from hardcoded template text
2. the human-readable code lines and the scannable barcode must refer to the same stock identity
3. label generation must store a print audit record so reprints are traceable
4. label layout should later support QR or Code128 style selection, but the stored stock identity must remain format-neutral

## Operational Flow

### 1. Purchase Receipt

The operator creates or syncs a purchase receipt with:

1. supplier
2. posting date
3. destination warehouse
4. product or variant lines
5. expected quantity
6. rate or landed-cost context
7. identity mode requirement

This stage should not make stock sellable yet.

### 2. Goods Inward

The operator physically receives items and records:

1. accepted quantity
2. rejected quantity
3. damaged quantity
4. inward notes
5. manufacturer barcode or serial scans if available
6. pack or carton references if later needed

This stage still should not mark units as sellable until identity verification is complete.

### 3. Identity Assignment

The system or operator assigns:

1. internal batch number
2. internal serial number
3. internal barcode value
4. manufacturer barcode mapping
5. manufacturer serial mapping

### 4. Barcode Print

The operator generates the `25 mm x 50 mm` sticker print batch using:

1. product master data from `core`
2. price or MRP data from the product pricing record
3. variant and attribute summary from the product or variant definition
4. company email and phone from the active company record
5. batch or serial identity from the inward stock-unit record

### 5. Scan Verification

Before putaway, the operator scans the printed label or manufacturer barcode to confirm:

1. the stock unit resolves correctly
2. the product and variant match the inward line
3. the batch or serial match the expected values
4. the warehouse destination is still valid

Only verified units should proceed to sellable warehouse stock.

### 6. Warehouse Putaway

After verification, the system posts warehouse stock:

1. warehouse id
2. product id
3. variant id if applicable
4. stock unit or batch identity
5. available quantity
6. cost context
7. inward reference

At this point the unit becomes eligible for sale.

### 7. Sales Scan And Issue

In the future sales UI, scanning should:

1. resolve a stock unit or batch
2. confirm the unit is available in the selected warehouse
3. add the correct product line into the sales document
4. preserve the issued stock identity for invoice and audit trace

On save or post:

1. available quantity reduces
2. movement ledger updates
3. issued unit state changes to sold or issued

### 8. Delivery Handoff

Delivery or pickup should carry forward:

1. sales document reference
2. stock unit or batch identity
3. warehouse issue source
4. courier or pickup handoff metadata
5. later return or warranty traceability

## Relationship To Current Core Stock Rows

Current `core` product stock rows are aggregate warehouse balances.

The future model should layer unit-level traceability underneath them:

1. stock units and batch records become the fine-grained operational truth
2. current `core` stock rows remain the summarized warehouse balance used by storefront and broader reporting
3. the summarization path must stay deterministic and auditable

## Relationship To Frappe

Frappe purchase receipts and stock snapshots should remain inbound sources only.

That means:

1. Frappe may seed or sync purchase receipt context
2. local inward verification, label generation, and warehouse sellability still happen in Codexsun-owned operational flows
3. unresolved item or warehouse mapping from ERP should stop inward automation for operator review

## Implementation Phases

Recommended delivery order:

### Phase 1. Receipt And Inward Foundation

1. introduce purchase receipt and goods inward documents
2. introduce inward acceptance states
3. keep stock non-sellable until verification

### Phase 2. Identity And Barcode Foundation

1. add batch and serial policies per product or variant
2. add stock-unit identity records
3. add manufacturer barcode and serial alias mapping

### Phase 3. Sticker Printing

1. add sticker data builder
2. add `25 mm x 50 mm` print layout
3. add print-batch audit records

### Phase 4. Scan Verification And Putaway

1. add scan-verify workflow
2. post verified units into warehouse stock
3. keep aggregate `core` stock in sync with unit-level records

### Phase 5. Sales Scan And Issue

1. allow barcode scan into sales document
2. allocate stock units or batches explicitly
3. reduce stock on posting with audit-safe traceability

### Phase 6. Delivery And Return Traceability

1. connect issued stock identity to delivery handoff
2. preserve traceability for return, warranty, and service scenarios

## Testing Gates

Later implementation should not ship without automated coverage for:

1. inward verification state transitions
2. batch and serial uniqueness rules
3. barcode alias resolution
4. label payload generation
5. warehouse putaway posting
6. scan-to-sales allocation
7. stock reduction and reversal
8. delivery and return traceability

## Open Questions For Later Batches

1. which barcode symbology is the first default: Code128, QR, or both?
2. does every serial-controlled unit get its own printed label even when a manufacturer barcode exists?
3. will warehouse bins or racks be modeled in the first release, or only warehouse-level stock?
4. should sales scanning work from aggregate warehouse selection plus barcode, or from prebuilt pick lists?
5. how much of this first release must sync back to ERP versus staying local as the operational truth?
