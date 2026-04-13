# Planning

## Active Batch

- `#186` Implement ecommerce stock operations frontend and separate side-menu entry
  - Scope: expose the new stock lifecycle runtime through the ecommerce admin workspace so operators can create purchase receipts, record goods inward verification, post inward stock, generate stickers, verify scans, and issue stock into sales without dropping into backend-only tooling.
  - Constraint: keep the UI inside the existing ecommerce workspace shell and add it as a distinct side-menu destination rather than mixing it into billing or framework utility menus.
  - Delivered:
    - added a dedicated ecommerce stock operations workspace section with overview, purchase receipt, goods inward, stock-unit and sticker, and scan-to-sale tabs
    - wired the section to the new billing internal routes for receipt creation, inward creation, inward posting, sticker batch generation, barcode resolution, and stock sale allocation
    - added `Stock Operations` to the ecommerce workspace items and desk menu grouping as its own stock menu section
    - updated the framework workspace hero suppression list so the page opens in the same clean app-style layout as the other ecommerce operator sections
  - Validation:
    - `npm run typecheck`
    - `npm run version:sync`
