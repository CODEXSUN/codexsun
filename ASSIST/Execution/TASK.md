# Task

## Active

- [x] `#250` Convert goods rejection type to creatable lookup
  - [x] Phase 1: trace current goods rejection type and lookup patterns
    - [x] 1.1 inspect goods rejections barcode update card and rejected records table
    - [x] 1.2 inspect core/common lookup create-on-miss UI patterns used by stock forms
  - [x] Phase 2: implement rejection type lookup behavior
    - [x] 2.1 replace fixed rejection type dropdown with an autocomplete lookup-style field
    - [x] 2.2 support creating a new rejection type when no matching option exists
    - [x] 2.3 keep inventory lifecycle status as `rejected` and show rejection type separately
  - [x] Phase 3: validation
    - [x] 3.1 run focused TypeScript validation for changed stock UI files
    - [x] 3.2 run focused ESLint validation for changed stock UI files

- [x] `#249` Standardize light-tone stock app status badges
  - [x] Phase 1: trace stock app status badge surfaces
    - [x] 1.1 find status badge renderers across stock workspace forms and pages
    - [x] 1.2 identify the reusable local tone helpers needed for purchase receipt and stock-unit statuses
  - [x] Phase 2: implement light status tones
    - [x] 2.1 change purchase receipt and stock-unit status badges to light-tone styling
    - [x] 2.2 align other stock app form status badges to the same light-tone treatment
  - [x] Phase 3: validation
    - [x] 3.1 run focused TypeScript validation for changed stock UI files
    - [x] 3.2 run focused ESLint validation for changed stock UI files

- [x] `#248` Color stock purchase receipt status badges
  - [x] Phase 1: trace purchase receipt status badge rendering
    - [x] 1.1 confirm list and detail status badge locations
    - [x] 1.2 confirm existing badge default from shared UI project defaults
  - [x] Phase 2: implement focused status badge styling
    - [x] 2.1 add a local purchase receipt status badge color helper
    - [x] 2.2 use full colored badges for purchase receipt statuses
  - [x] Phase 3: validation
    - [x] 3.1 run focused TypeScript validation for the purchase receipt screen
    - [x] 3.2 run focused ESLint validation for the purchase receipt screen

- [x] `#247` Add barcode-driven rejection updates to the goods rejections page
  - [x] Phase 1: trace current goods rejection and barcode resolution flow
    - [x] 1.1 confirm how the goods rejections page currently reads rejected acceptance rows
    - [x] 1.2 confirm how barcode resolution and stock acceptance currently identify temporary stock units
  - [x] Phase 2: implement focused goods rejection entry update
    - [x] 2.1 add a top goods-rejections card with barcode input, default rejection-type dropdown, and update action
    - [x] 2.2 persist the selected rejection reason while keeping the stock-unit lifecycle status as `rejected`
    - [x] 2.3 refresh the rejected goods register after barcode-based rejection updates
  - [x] Phase 3: validation
    - [x] 3.1 run focused TypeScript and ESLint validation for the changed stock and billing files
    - [x] 3.2 run focused stock acceptance rejection coverage for the new rejection-reason flow

- [x] `#246` Move stock rejection capture to sticker verification and add goods rejection page
  - [x] Phase 1: trace acceptance and rejection ownership
    - [x] 1.1 confirm where sticker verification currently persists accepted and mismatch rows
    - [x] 1.2 confirm how stock sidebar sections and workspace routes expose inward verification screens
  - [x] Phase 2: implement sticker-verification rejection flow
    - [x] 2.1 persist rejected stock acceptance rows with notes and update stock-unit status to `rejected`
    - [x] 2.2 move rejection capture UI to the sticker verification card and add rejected-record tables
    - [x] 2.3 add a dedicated stock goods-rejections page and sidebar entry
  - [x] Phase 3: validation
    - [x] 3.1 run focused TypeScript and ESLint validation for the changed stock, billing, and cxapp files
    - [x] 3.2 run focused billing and stock flow tests for acceptance rejection behavior

- [x] `#245` Record goods inward damage receipt, vendor return, and ledger timestamp polish
  - [x] Phase 1: confirm stock entry, goods inward, and stock ledger surfaces
    - [x] 1.1 verify where goods inward currently stores rejected and damaged quantities
    - [x] 1.2 verify where stock ledger status badges and timestamps are rendered
  - [x] Phase 2: implement focused damage and return recording
    - [x] 2.1 add persisted damage-received, return-to-vendor, and remarks fields on goods inward lines
    - [x] 2.2 update stock entry and goods inward detail views to edit and display those fields
    - [x] 2.3 format stock ledger timestamps and add explicit return and damage status badge styling
  - [x] Phase 3: validation
    - [x] 3.1 run focused TypeScript and ESLint validation for the changed stock and billing files
    - [x] 3.2 run focused goods-inward service test coverage for damage and return persistence

- [x] `#244` Add colored status badges to stock ledger unit rows
  - [x] Phase 1: confirm stock ledger status badge surfaces
    - [x] 1.1 locate the stock ledger detail status column
    - [x] 1.2 locate the shared stock-units ledger table using the same outline badge
  - [x] Phase 2: implement stock status color mapping
    - [x] 2.1 style `available` as blue, `received` as light yellow, and `sold` as green
    - [x] 2.2 keep fallback styling for other stock-unit statuses
  - [x] Phase 3: validation
    - [x] 3.1 run focused TypeScript validation for the stock support workspace
    - [x] 3.2 run focused ESLint validation for the stock support workspace

- [x] `#243` Show product code under product name in generated barcode tables
  - [x] Phase 1: confirm generated-barcode product display fields
    - [x] 1.1 confirm the generated barcode sections already receive `productCode`
    - [x] 1.2 confirm which product cells still render repeated id-like fallback text
  - [x] Phase 2: implement generated-barcode product label cleanup
    - [x] 2.1 show product name plus product code in the immediate generated barcode batch table
    - [x] 2.2 show product name plus product code in the persisted generated barcode table
  - [x] Phase 3: validation
    - [x] 3.1 run focused TypeScript validation for the updated stock purchase-receipt screen
    - [x] 3.2 run focused ESLint validation for the updated stock purchase-receipt screen

- [x] `#242` Add selected generated-barcode rollback on stock purchase receipts
  - [x] Phase 1: trace generated-barcode persistence and rollback scope
    - [x] 1.1 confirm which records are created by purchase-receipt barcode generation
    - [x] 1.2 confirm where the generated barcode table can select rows for rollback
  - [x] Phase 2: implement selected rollback flow
    - [x] 2.1 add a backend rollback path that deletes selected temporary stock units and linked generated records
    - [x] 2.2 add a purchase-receipt UI action to delete selected generated barcodes before acceptance
  - [x] Phase 3: validation
    - [x] 3.1 run focused TypeScript and ESLint validation for the changed stock and billing files
    - [x] 3.2 run focused stock billing tests for barcode rollback and live-flow wiring

- [x] `#241` Remove automatic separators from stock receipt barcode format
  - [x] Phase 1: confirm separator insertion path
    - [x] 1.1 confirm where serial prefix adds automatic `-`
    - [x] 1.2 confirm where barcode prefix and batch join with automatic `-`
  - [x] Phase 2: implement flat prefix concatenation
    - [x] 2.1 keep only user-typed hyphens from prefixes
    - [x] 2.2 generate serial and barcode values as flat concatenation when no separator is typed
  - [x] Phase 3: validation
    - [x] 3.1 run focused TypeScript validation for the changed stock lifecycle service
    - [x] 3.2 run focused lint and stock-flow test validation

- [x] `#240` Fix stock purchase-receipt barcode persistence and format
  - [x] Phase 1: diagnose serialization reload and barcode format behavior
    - [x] 1.1 confirm why saved batch and serial inputs reset on purchase-receipt reload
    - [x] 1.2 confirm where the hardcoded `CS-` internal barcode format is applied
  - [x] Phase 2: implement focused stock barcode fix
    - [x] 2.1 persist and restore saved receipt barcode generation settings per purchase-receipt line
    - [x] 2.2 add configurable receipt barcode prefix logic without the forced `CS-` module prefix
  - [x] Phase 3: validation
    - [x] 3.1 run focused TypeScript validation for the changed stock and billing files
    - [x] 3.2 run focused lint validation for the changed stock and billing files

- [x] `#238` Restore storefront homepage LCP budget
  - [x] Phase 1: diagnose homepage LCP
    - [x] 1.1 identify the homepage LCP element and current measured timing
    - [x] 1.2 inspect first-screen storefront home render path for heavy preload or animation cost
  - [x] Phase 2: implement focused fix
    - [x] 2.1 apply the smallest homepage-first-render optimization
    - [x] 2.2 keep catalog and product performance budgets passing
  - [x] Phase 3: validation
    - [x] 3.1 rerun homepage performance budget
    - [x] 3.2 rerun full storefront performance config
