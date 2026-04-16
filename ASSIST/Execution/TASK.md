# Task

## Active Batch

- [x] `#193` Simplify billing sales invoice detail tab to match the provided reference layout
  - [x] Phase 1: execution alignment
    - [x] 1.1 confirm the requested sales layout changes from the new annotated reference image
    - [x] 1.2 record the sales-detail simplification scope in execution docs
  - [x] Phase 2: sales detail tab simplification
    - [x] 2.1 move the sales item table and totals into the `Details` tab
    - [x] 2.2 keep only bill-to name and customer GSTIN on the left and invoice number, invoice date, and voucher type on the right
    - [x] 2.3 remove the extra detail-shell fields that are no longer wanted from the top section
  - [x] Phase 3: validation
    - [x] 3.1 run focused type validation for the affected billing workspace surface

- [x] `#192` Refactor billing receipt voucher create and edit into a nav-tab record shell
  - [x] Phase 1: execution alignment
    - [x] 1.1 confirm the receipt upsert route still renders through the generic voucher editor
    - [x] 1.2 record the receipt-focused shell refactor scope in execution docs
  - [x] Phase 2: receipt voucher shell refactor
    - [x] 2.1 add a receipt-specific record header and contained nav tabs for create and edit
    - [x] 2.2 group voucher details, bill allocations, accounting lines, totals, and review state into stable tab sections
    - [x] 2.3 preserve existing billing receipt save, delete, export, and review behavior
  - [x] Phase 3: validation
    - [x] 3.1 run focused type validation for the affected billing workspace surface

- [x] `#191` Refactor billing payment voucher create and edit into a nav-tab record shell
  - [x] Phase 1: execution alignment
    - [x] 1.1 confirm the payment upsert route still renders through the generic voucher editor
    - [x] 1.2 record the payment-focused shell refactor scope in execution docs
  - [x] Phase 2: payment voucher shell refactor
    - [x] 2.1 add a payment-specific record header and contained nav tabs for create and edit
    - [x] 2.2 group voucher details, bill allocations, accounting lines, totals, and review state into stable tab sections
    - [x] 2.3 preserve existing billing payment save, delete, export, and review behavior
  - [x] Phase 3: validation
    - [x] 3.1 run focused type validation for the affected billing workspace surface

- [x] `#190` Refactor billing purchase voucher create and edit into a nav-tab record shell
  - [x] Phase 1: execution alignment
    - [x] 1.1 confirm the purchase upsert route still renders through the generic voucher editor
    - [x] 1.2 record the purchase-focused shell refactor scope in execution docs
  - [x] Phase 2: purchase voucher shell refactor
    - [x] 2.1 add a purchase-specific record header and contained nav tabs for create and edit
    - [x] 2.2 group voucher details, GST and transport, accounting lines, totals, and review state into stable tab sections
    - [x] 2.3 preserve existing billing purchase save, delete, export, and review behavior
  - [x] Phase 3: validation
    - [x] 3.1 run focused type validation for the affected billing workspace surface

- [x] `#189` Refactor billing sales invoice create and edit into a nav-tab record shell
  - [x] Phase 1: execution alignment
    - [x] 1.1 confirm the current sales upsert boundary and the product-page tab pattern
    - [x] 1.2 record the billing-focused shell refactor scope in execution docs
  - [x] Phase 2: sales invoice shell refactor
    - [x] 2.1 replace the long single-card sales upsert layout with a record header and contained nav tabs
    - [x] 2.2 group invoice details, addresses, item table, totals, transport, and review state into stable tab sections
    - [x] 2.3 preserve existing billing form state, save, delete, export, and review behavior
  - [x] Phase 3: validation
    - [x] 3.1 run focused type validation for the affected billing workspace surface

- No active execution batch.
