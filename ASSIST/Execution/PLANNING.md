# Planning

## Active Batch

- `#193` Simplify billing sales invoice detail tab to match the provided reference layout
  - Goal: reshape the billing sales invoice `Details` tab so it follows the provided reference more closely, with a minimal top section and the sales item table directly below it.
  - Current reality:
    - the current sales tabbed shell still shows too many top-level fields in the `Details` area
    - the sales item table currently sits in its own `Items` tab instead of remaining inside `Details`
  - Implementation plan:
    - keep the existing sales invoice save and posting behavior unchanged
    - move the sales item table and totals into the `Details` tab
    - reduce the visible top section to bill-to name and customer GSTIN on the left, with invoice number, invoice date, and voucher type on the right
    - remove the extra top-section fields and cards that are not needed in the requested layout
  - Validation target:
    - the sales invoice page should compile cleanly and reflect the requested simplified details layout without regressing billing behavior
  - Validation completed:
    - `npm run typecheck`

- `#192` Refactor billing receipt voucher create and edit into a nav-tab record shell
  - Goal: move the billing receipt voucher create and edit experience onto the same contained tabbed record-shell pattern used by products, sales, purchase, and payment, while keeping the existing voucher posting logic intact.
  - Current reality:
    - the receipt voucher route still renders through the generic `VoucherModuleUpsertSection` and shared `VoucherEditor`
    - receipt create and edit do not yet have a receipt-owned record header or tab grouping
  - Implementation plan:
    - keep the existing receipt voucher form state and route handlers as the behavioral source of truth
    - add a receipt-specific tabbed shell only for `receipt-vouchers-upsert` rather than rewriting the shared editor used by other voucher lanes
    - group receipt details, bill-wise adjustments, accounting dimensions and lines, totals, and review state into contained tabs
    - attach the technical name to the outer receipt upsert shell boundary
  - Validation target:
    - the receipt voucher surface should compile cleanly and present the same underlying behavior through a product-style tabbed shell without regressing billing voucher posting flows
  - Validation completed:
    - `npm run typecheck`

- `#191` Refactor billing payment voucher create and edit into a nav-tab record shell
  - Goal: move the billing payment voucher create and edit experience onto the same contained tabbed record-shell pattern used by products, sales, and purchase, while keeping the existing voucher posting logic intact.
  - Current reality:
    - the payment voucher route still renders through the generic `VoucherModuleUpsertSection` and shared `VoucherEditor`
    - payment create and edit do not yet have a payment-owned record header or tab grouping
  - Implementation plan:
    - keep the existing payment voucher form state and route handlers as the behavioral source of truth
    - add a payment-specific tabbed shell only for `payment-vouchers-upsert` rather than rewriting the shared editor used by other voucher lanes
    - group payment details, bill-wise adjustments, accounting dimensions and lines, totals, and review state into contained tabs
    - attach the technical name to the outer payment upsert shell boundary
  - Validation target:
    - the payment voucher surface should compile cleanly and present the same underlying behavior through a product-style tabbed shell without regressing billing voucher posting flows
  - Validation completed:
    - `npm run typecheck`

- `#190` Refactor billing purchase voucher create and edit into a nav-tab record shell
  - Goal: move the billing purchase voucher create and edit experience onto the same contained tabbed record-shell pattern used by products and now sales, while keeping the existing voucher posting logic intact.
  - Current reality:
    - the purchase voucher route still renders through the generic `VoucherModuleUpsertSection` and shared `VoucherEditor`
    - purchase create and edit do not yet have a purchase-owned record header or tab grouping
  - Implementation plan:
    - keep the existing purchase voucher form state and route handlers as the behavioral source of truth
    - add a purchase-specific tabbed shell only for `purchase-vouchers-upsert` rather than rewriting the shared editor used by other voucher lanes
    - group purchase details, GST and transport controls, accounting dimensions and lines, totals, and review state into contained tabs
    - attach the technical name to the outer purchase upsert shell boundary
  - Validation target:
    - the purchase voucher surface should compile cleanly and present the same underlying behavior through a product-style tabbed shell without regressing billing voucher posting flows
  - Validation completed:
    - `npm run typecheck`

- `#189` Refactor billing sales invoice create and edit into a nav-tab record shell
  - Goal: move the billing sales invoice create and edit experience onto the same contained tabbed record-shell pattern already used by product management, while keeping current voucher logic and inline line-item editing intact.
  - Current reality:
    - the products page already uses a header-level nav tab strip for large record forms
    - the billing sales invoice create and edit surface still renders as one long single-card form inside `apps/billing/web/src/workspace-sections/index.tsx`
  - Implementation plan:
    - keep the existing `SalesVoucherUpsertSection` state, handlers, and save-review-delete flows as the behavioral source of truth
    - introduce a record header with back navigation, title, and shell-level actions matching the product-page posture
    - split the long form into contained tabs for invoice details, addresses and compliance, line items and totals, and transport or review actions
    - attach technical names to the outer billing sales upsert shell boundaries rather than individual inner fields
  - Validation target:
    - the sales invoice surface should compile cleanly and present the same underlying fields through a product-style tab navigation shell without regressing billing voucher behavior
  - Validation completed:
    - `npm run typecheck`

- No active execution batch.
