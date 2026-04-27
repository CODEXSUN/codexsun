# Task

## Active

- [x] `#273` Change Delivery Note clear to cancel
  - [x] Phase 1: update action row
    - [x] 1.1 rename Clear to Cancel
    - [x] 1.2 make Cancel return to Delivery Note list
    - [x] 1.3 remove duplicate Go back button
  - [x] Phase 2: validation
    - [x] 2.1 run focused TypeScript validation
    - [x] 2.2 run focused ESLint validation

- [x] `#272` Add Delivery Note form back action
  - [x] Phase 1: add action
    - [x] 1.1 add Go back button at the end of Delivery Note form actions
  - [x] Phase 2: validation
    - [x] 2.1 run focused TypeScript validation
    - [x] 2.2 run focused ESLint validation

- [x] `#271` Format Delivery Note date and contact labels
  - [x] Phase 1: add display helpers
    - [x] 1.1 format Delivery Note posting date as `dd-MM-yyyy`
    - [x] 1.2 resolve/clean contact labels without `contact:` prefix
  - [x] Phase 2: apply to Delivery Note surfaces
    - [x] 2.1 update list display/search/print labels
    - [x] 2.2 update show page display/print labels
  - [x] Phase 3: validation
    - [x] 3.1 run focused TypeScript validation
    - [x] 3.2 run focused ESLint validation

- [x] `#270` Polish Delivery Note list and save redirect
  - [x] Phase 1: align list tone
    - [x] 1.1 render Delivery Note list with `MasterList`
    - [x] 1.2 add search, status filters, pagination, and action menu
  - [x] Phase 2: save redirect
    - [x] 2.1 redirect save to Delivery Note list
  - [x] Phase 3: validation
    - [x] 3.1 run focused TypeScript validation
    - [x] 3.2 run focused ESLint validation

- [x] `#269` Persist Delivery Notes with list show edit
  - [x] Phase 1: backend contract and table
    - [x] 1.1 add delivery note schemas and response types
    - [x] 1.2 add delivery note JSON store table migration
    - [x] 1.3 add delivery note service and stock manager wrappers
    - [x] 1.4 add internal stock delivery note API routes
  - [x] Phase 2: frontend routes and pages
    - [x] 2.1 add stock delivery note list page
    - [x] 2.2 convert current form to new/edit upsert page
    - [x] 2.3 add delivery note show page
    - [x] 2.4 add cxapp routes for new/show/edit
  - [x] Phase 3: validation
    - [x] 3.1 run TypeScript validation
    - [x] 3.2 run focused ESLint validation

- [x] `#268` Rename Delivery Note print actions
  - [x] Phase 1: update buttons
    - [x] 1.1 remove standalone Print button
    - [x] 1.2 rename Send to print to Save and print
  - [x] Phase 2: validation
    - [x] 2.1 run focused TypeScript validation
    - [x] 2.2 run focused ESLint validation

- [x] `#267` Add Delivery Note print actions
  - [x] Phase 1: add print document helper
    - [x] 1.1 build printable Delivery Note HTML from current form and items
    - [x] 1.2 send printable document to browser print dialog
  - [x] Phase 2: add actions
    - [x] 2.1 add Print button beside Save/Clear
    - [x] 2.2 add Send to print button beside Save/Clear
  - [x] Phase 3: validation
    - [x] 3.1 run focused TypeScript validation
    - [x] 3.2 run focused ESLint validation

- [x] `#266` Add Delivery Note action spacing
  - [x] Phase 1: adjust actions spacing
    - [x] 1.1 add top margin before Save/Clear buttons
  - [x] Phase 2: validation
    - [x] 2.1 run focused TypeScript validation
    - [x] 2.2 run focused ESLint validation

- [x] `#265` Remove Delivery Note message card spacing
  - [x] Phase 1: adjust message presentation
    - [x] 1.1 remove the card wrapper around Delivery Note messages
    - [x] 1.2 keep warnings visible as inline text
  - [x] Phase 2: adjust section spacing
    - [x] 2.1 increase vertical spacing between Delivery Note form sections
  - [x] Phase 3: validation
    - [x] 3.1 run focused TypeScript validation
    - [x] 3.2 run focused ESLint validation

- [x] `#264` Restrict Delivery Note to accepted stock
  - [x] Phase 1: update eligibility
    - [x] 1.1 remove received stock from Delivery Note delivery eligibility
    - [x] 1.2 keep manual stock barcode options filtered by accepted/live stock only
  - [x] Phase 2: improve scan warnings
    - [x] 2.1 show warning text for unknown barcode scans
    - [x] 2.2 show warning text for received/unaccepted scans
  - [x] Phase 3: validation
    - [x] 3.1 run focused TypeScript validation
    - [x] 3.2 run focused ESLint validation

- [x] `#263` Fix Delivery Note item adding
  - [x] Phase 1: trace current add path
    - [x] 1.1 inspect Delivery Note barcode resolution flow
    - [x] 1.2 inspect Purchase Receipt manual product lookup pattern
  - [x] Phase 2: implement scan and manual item add
    - [x] 2.1 share stock-unit append logic for scanned and manual items
    - [x] 2.2 add manual product and barcode lookup controls
    - [x] 2.3 allow live stock statuses used by current stock lifecycle
  - [x] Phase 3: validation
    - [x] 3.1 run focused TypeScript validation
    - [x] 3.2 run focused ESLint validation

- [x] `#262` Simplify Delivery Note number
  - [x] Phase 1: locate generator
    - [x] 1.1 find Delivery Note number default creation
  - [x] Phase 2: update number format
    - [x] 2.1 change generated number from dated `DN-*` format to padded `01`
  - [x] Phase 3: validation
    - [x] 3.1 run focused TypeScript validation
    - [x] 3.2 run focused ESLint validation

- [x] `#261` Remove Delivery Note workspace hero card
  - [x] Phase 1: locate hero visibility control
    - [x] 1.1 find stock workspace hero hide list
  - [x] Phase 2: hide hero on Delivery Note
    - [x] 2.1 add `delivery-note` to stock hero hidden sections
  - [x] Phase 3: validation
    - [x] 3.1 run focused TypeScript validation
    - [x] 3.2 run focused ESLint validation

- [x] `#260` Keep stock Outward as sidebar group
  - [x] Phase 1: confirm flattening behavior
    - [x] 1.1 verify Stock Outward group exists in desk registry
    - [x] 1.2 verify sidebar flattens single-item groups
  - [x] Phase 2: force Outward group rendering
    - [x] 2.1 add an explicit menu-group flag for single-item grouping
    - [x] 2.2 set the flag on Stock Outward
  - [x] Phase 3: validation
    - [x] 3.1 run focused TypeScript validation
    - [x] 3.2 run focused ESLint validation

- [x] `#259` Add stock Outward sidebar group
  - [x] Phase 1: confirm current stock sidebar grouping
    - [x] 1.1 verify Delivery Note workspace item exists
    - [x] 1.2 verify Outward group is missing from stock menu groups
  - [x] Phase 2: add Outward group
    - [x] 2.1 place Outward below Inward and above Operations
    - [x] 2.2 include Delivery Note in Outward
  - [x] Phase 3: validation
    - [x] 3.1 run focused validation for stock desk registry

- [x] `#258` Add stock outward delivery note page
  - [x] Phase 1: trace stock navigation and page routing
    - [x] 1.1 find stock sidebar grouping source
    - [x] 1.2 find stock route/page switch for workspace sections
    - [x] 1.3 reuse purchase receipt tone and table patterns for delivery note UI
  - [x] Phase 2: add outward delivery note UI
    - [x] 2.1 add Outward sidebar group with Delivery Note menu
    - [x] 2.2 create Delivery Note page with required header fields and customer lookup
    - [x] 2.3 add `is return` checkbox flag
    - [x] 2.4 add barcode scan input and item table in purchase-receipt tone
  - [x] Phase 3: validation
    - [x] 3.1 run focused TypeScript validation for changed stock UI/navigation files
    - [x] 3.2 run focused ESLint validation for changed stock UI/navigation files

- [x] `#257` Add rejected goods table pagination
  - [x] Phase 1: add pagination state
    - [x] 1.1 track page and rows per page for rejected goods
    - [x] 1.2 slice rejected rows for current page
  - [x] Phase 2: render pagination footer
    - [x] 2.1 add total, rows-per-page, range, previous, current page, and next controls below table
    - [x] 2.2 reset page safely when filters or page size change
  - [x] Phase 3: validation
    - [x] 3.1 run focused TypeScript validation for the changed stock UI file
    - [x] 3.2 run focused ESLint validation for the changed stock UI file

- [x] `#256` Compact rejected goods table card
  - [x] Phase 1: remove table helper header
    - [x] 1.1 remove Rejected Goods Table title
    - [x] 1.2 remove helper description
  - [x] Phase 2: trim card spacing
    - [x] 2.1 reduce top padding so table starts closer to card edge
  - [x] Phase 3: validation
    - [x] 3.1 run focused TypeScript validation for the changed stock UI file
    - [x] 3.2 run focused ESLint validation for the changed stock UI file

- [x] `#255` Swap stock sidebar goods rejection and ledger order
  - [x] Phase 1: locate stock sidebar navigation source
    - [x] 1.1 find the Inward section item order
  - [x] Phase 2: update item order
    - [x] 2.1 move Stock Ledger above Goods Rejections
  - [x] Phase 3: validation
    - [x] 3.1 run focused validation for the changed navigation file

- [x] `#254` Polish rejected goods table columns
  - [x] Phase 1: update rejected goods table structure
    - [x] 1.1 remove Status column
    - [x] 1.2 move Reason column to the end
  - [x] Phase 2: clean warehouse labels
    - [x] 2.1 display `warehouse:default` as `default`
  - [x] Phase 3: validation
    - [x] 3.1 run focused TypeScript validation for the changed stock UI file
    - [x] 3.2 run focused ESLint validation for the changed stock UI file

- [x] `#253` Enlarge goods rejection summary badges
  - [x] Phase 1: adjust summary spacing
    - [x] 1.1 add space between purchase receipt filter and count badges
    - [x] 1.2 keep the summary responsive
  - [x] Phase 2: enlarge count badges
    - [x] 2.1 render rejected rows and quantity with larger badge sizing
  - [x] Phase 3: validation
    - [x] 3.1 run focused TypeScript validation for the changed stock UI file
    - [x] 3.2 run focused ESLint validation for the changed stock UI file

- [x] `#252` Simplify goods rejection summary and type section
  - [x] Phase 1: adjust summary card presentation
    - [x] 1.1 render rejected rows and rejected quantity as badges
    - [x] 1.2 keep purchase receipt filter layout stable
  - [x] Phase 2: remove rejection types page section
    - [x] 2.1 remove the Rejection Types card from Goods Rejections
    - [x] 2.2 keep the rejection type lookup working from Core common modules
  - [x] Phase 3: validation
    - [x] 3.1 run focused TypeScript validation for the changed stock UI file
    - [x] 3.2 run focused ESLint validation for the changed stock UI file

- [x] `#251` Polish goods rejections page header and entry row
  - [x] Phase 1: update Goods Rejections page layout copy
    - [x] 1.1 remove the redundant page intro card
    - [x] 1.2 tighten the barcode rejection card title and description
  - [x] Phase 2: align rejection entry controls
    - [x] 2.1 remove the action field label
    - [x] 2.2 vertically align the update button with the input controls
  - [x] Phase 3: validation
    - [x] 3.1 run focused TypeScript validation for the changed stock UI file
    - [x] 3.2 run focused ESLint validation for the changed stock UI file

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
