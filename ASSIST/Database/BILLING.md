# Database Table Structure

This document is the canonical reference for the Billing app database tables.
Tables are organized by logical layer. Every split voucher-type table references
`billing_voucher_headers.voucher_id` and `billing_vouchers.id` (the raw JSON store)
so reports can join only the subset they need without touching the monolithic JSON.

---

## Layer Overview

```
billing_vouchers                    ← raw JSON master store (source-of-truth)
    └── billing_voucher_headers         ← normalized header (all types, fast aggregation)
            ├── billing_voucher_lines           ← per-line debit/credit detail
            ├── billing_ledger_entries          ← immutable posted entries (ledger)
            │
            ├── billing_sales_vouchers          ┐  Split type-detail tables
            │       └── billing_sales_item_vouchers       (one row per voucher)
            ├── billing_purchase_vouchers       │
            │       └── billing_purchase_item_vouchers
            ├── billing_receipt_vouchers        │  Itemised sub-tables
            │       └── billing_receipt_item_vouchers     (one row per line /
            ├── billing_payment_vouchers        │   allocation / product)
            │       └── billing_payment_item_vouchers
            ├── billing_journal_vouchers        │
            │       └── billing_journal_item_vouchers
            ├── billing_contra_vouchers         │
            │       └── billing_contra_item_vouchers
            └── billing_petty_cash_vouchers     ┘
                        │
            ┌───────────┴────────────┐
            ▼                        ▼
  billing_bank_book_entries   billing_cash_book_entries
  (one row per bank-touching  (one row per cash-touching
   voucher, BRS-ready)         voucher, daily cash-book)
```

---

## 1. Document JSON Stores

### `billing_categories`
> JSON store for billing categories.

- `id` VARCHAR(191) PRIMARY KEY
- `module_key` VARCHAR(100) NULL
- `sort_order` INTEGER NOT NULL DEFAULT 0
- `payload` TEXT NOT NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

<br>

### `billing_ledgers`
> JSON store for accounting ledgers.

- `id` VARCHAR(191) PRIMARY KEY
- `module_key` VARCHAR(100) NULL
- `sort_order` INTEGER NOT NULL DEFAULT 0
- `payload` TEXT NOT NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

<br>

### `billing_voucher_groups`
> JSON store for voucher groups.

- `id` VARCHAR(191) PRIMARY KEY
- `module_key` VARCHAR(100) NULL
- `sort_order` INTEGER NOT NULL DEFAULT 0
- `payload` TEXT NOT NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

<br>

### `billing_voucher_types`
> JSON store for voucher types.

- `id` VARCHAR(191) PRIMARY KEY
- `module_key` VARCHAR(100) NULL
- `sort_order` INTEGER NOT NULL DEFAULT 0
- `payload` TEXT NOT NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

<br>

### `billing_vouchers`
> Raw JSON master store for all voucher data. Source-of-truth; never mutated after post.

- `id` VARCHAR(191) PRIMARY KEY
- `module_key` VARCHAR(100) NULL
- `sort_order` INTEGER NOT NULL DEFAULT 0
- `payload` TEXT NOT NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

---

## 2. Shared Normalized Tables

### `billing_voucher_headers`
> Normalized header (all voucher types). Fast aggregation and cross-type reporting.

- `voucher_id` VARCHAR(191) PRIMARY KEY
- `voucher_number` VARCHAR(191) NOT NULL
- `status` VARCHAR(40) NOT NULL
- `type` VARCHAR(40) NOT NULL
- `date` VARCHAR(40) NOT NULL
- `counterparty` VARCHAR(191) NOT NULL
- `narration` TEXT NOT NULL
- `financial_year_code` VARCHAR(40) NOT NULL
- `financial_year_label` VARCHAR(80) NOT NULL
- `financial_year_start_date` VARCHAR(40) NOT NULL
- `financial_year_end_date` VARCHAR(40) NOT NULL
- `financial_year_sequence_number` INTEGER NOT NULL
- `financial_year_prefix` VARCHAR(40) NOT NULL
- `total_debit` REAL NOT NULL
- `total_credit` REAL NOT NULL
- `line_count` INTEGER NOT NULL
- `bill_allocation_count` INTEGER NOT NULL
- `has_gst` INTEGER NOT NULL DEFAULT 0
- `has_sales_invoice` INTEGER NOT NULL DEFAULT 0
- `reversal_of_voucher_id` VARCHAR(191) NULL
- `reversal_of_voucher_number` VARCHAR(191) NULL
- `reversed_by_voucher_id` VARCHAR(191) NULL
- `reversed_by_voucher_number` VARCHAR(191) NULL
- `reversed_at` VARCHAR(40) NULL
- `reversal_reason` TEXT NULL
- `source_voucher_id` VARCHAR(191) NULL
- `source_voucher_number` VARCHAR(191) NULL
- `source_voucher_type` VARCHAR(40) NULL
- `dimension_branch` VARCHAR(191) NULL
- `dimension_project` VARCHAR(191) NULL
- `dimension_cost_center` VARCHAR(191) NULL
- `review_status` VARCHAR(40) NOT NULL DEFAULT `not_required`
- `review_approval_policy` VARCHAR(40) NOT NULL DEFAULT `none`
- `review_requested_by_user_id` VARCHAR(191) NULL
- `review_requested_at` VARCHAR(40) NULL
- `review_reviewed_at` VARCHAR(40) NULL
- `review_reviewed_by_user_id` VARCHAR(191) NULL
- `review_note` TEXT NOT NULL DEFAULT ``
- `review_required_reason` TEXT NULL
- `review_maker_checker_required` INTEGER NOT NULL DEFAULT 0
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL
- `created_by_user_id` VARCHAR(191) NULL

<br>

### `billing_voucher_lines`
> Normalized line items for detailed cross-type voucher queries.

- `line_id` VARCHAR(191) PRIMARY KEY
- `voucher_id` VARCHAR(191) NOT NULL → `billing_voucher_headers.voucher_id`
- `voucher_number` VARCHAR(191) NOT NULL
- `voucher_status` VARCHAR(40) NOT NULL
- `voucher_type` VARCHAR(40) NOT NULL
- `voucher_date` VARCHAR(40) NOT NULL
- `line_order` INTEGER NOT NULL
- `ledger_id` VARCHAR(191) NOT NULL
- `ledger_name` VARCHAR(191) NOT NULL
- `side` VARCHAR(10) NOT NULL
- `amount` REAL NOT NULL
- `note` TEXT NOT NULL
- `counterparty` VARCHAR(191) NOT NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

<br>

### `billing_ledger_entries`
> Immutable posted ledger entries used for final accounting.

- `entry_id` VARCHAR(191) PRIMARY KEY
- `voucher_id` VARCHAR(191) NOT NULL → `billing_voucher_headers.voucher_id`
- `voucher_line_id` VARCHAR(191) NOT NULL
- `voucher_number` VARCHAR(191) NOT NULL
- `voucher_type` VARCHAR(40) NOT NULL
- `voucher_status` VARCHAR(40) NOT NULL
- `voucher_date` VARCHAR(40) NOT NULL
- `entry_order` INTEGER NOT NULL
- `ledger_id` VARCHAR(191) NOT NULL
- `ledger_name` VARCHAR(191) NOT NULL
- `side` VARCHAR(10) NOT NULL
- `amount` REAL NOT NULL
- `counterparty` VARCHAR(191) NOT NULL
- `narration` TEXT NOT NULL
- `reversal_of_voucher_id` VARCHAR(191) NULL
- `reversal_of_voucher_number` VARCHAR(191) NULL
- `posted_at` VARCHAR(40) NOT NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

---

## 3. Split Voucher-Type Detail Tables

> Each table holds **one row per voucher** with type-specific columns.  
> All tables carry `voucher_id` PRIMARY KEY referencing `billing_voucher_headers.voucher_id`.

### `billing_sales_vouchers`
> Sales Invoice detail. Reports: sales register, party-wise sales, GST sales summary.

- `voucher_id` VARCHAR(191) PRIMARY KEY
- `voucher_number` VARCHAR(191) NOT NULL
- `voucher_date` VARCHAR(40) NOT NULL
- `status` VARCHAR(40) NOT NULL
- `party_ledger_id` VARCHAR(191) NOT NULL
- `party_ledger_name` VARCHAR(191) NOT NULL
- `gross_amount` REAL NOT NULL DEFAULT 0
- `discount_amount` REAL NOT NULL DEFAULT 0
- `taxable_amount` REAL NOT NULL DEFAULT 0
- `tax_amount` REAL NOT NULL DEFAULT 0
- `net_amount` REAL NOT NULL DEFAULT 0
- `has_gst` INTEGER NOT NULL DEFAULT 0
- `gst_type` VARCHAR(40) NULL — `IGST` | `CGST_SGST` | `exempt`
- `place_of_supply` VARCHAR(40) NULL
- `order_reference` VARCHAR(191) NULL
- `dispatch_reference` VARCHAR(191) NULL
- `due_date` VARCHAR(40) NULL
- `dimension_branch` VARCHAR(191) NULL
- `dimension_project` VARCHAR(191) NULL
- `dimension_cost_center` VARCHAR(191) NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL
- `created_by_user_id` VARCHAR(191) NULL

<br>

### `billing_purchase_vouchers`
> Purchase Invoice detail. Reports: purchase register, supplier-wise, GST ITC summary.

- `voucher_id` VARCHAR(191) PRIMARY KEY
- `voucher_number` VARCHAR(191) NOT NULL
- `voucher_date` VARCHAR(40) NOT NULL
- `status` VARCHAR(40) NOT NULL
- `supplier_ledger_id` VARCHAR(191) NOT NULL
- `supplier_ledger_name` VARCHAR(191) NOT NULL
- `supplier_invoice_number` VARCHAR(191) NULL
- `supplier_invoice_date` VARCHAR(40) NULL
- `gross_amount` REAL NOT NULL DEFAULT 0
- `discount_amount` REAL NOT NULL DEFAULT 0
- `taxable_amount` REAL NOT NULL DEFAULT 0
- `tax_amount` REAL NOT NULL DEFAULT 0
- `net_amount` REAL NOT NULL DEFAULT 0
- `has_gst` INTEGER NOT NULL DEFAULT 0
- `gst_type` VARCHAR(40) NULL — `IGST` | `CGST_SGST` | `exempt`
- `itc_eligible` INTEGER NOT NULL DEFAULT 1
- `itc_reversal_reason` VARCHAR(191) NULL
- `place_of_supply` VARCHAR(40) NULL
- `due_date` VARCHAR(40) NULL
- `dimension_branch` VARCHAR(191) NULL
- `dimension_project` VARCHAR(191) NULL
- `dimension_cost_center` VARCHAR(191) NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL
- `created_by_user_id` VARCHAR(191) NULL

<br>

### `billing_receipt_vouchers`
> Receipt detail. Reports: receipt register, collection by mode/bank, receivables reconciliation.

- `voucher_id` VARCHAR(191) PRIMARY KEY
- `voucher_number` VARCHAR(191) NOT NULL
- `voucher_date` VARCHAR(40) NOT NULL
- `status` VARCHAR(40) NOT NULL
- `party_ledger_id` VARCHAR(191) NOT NULL
- `party_ledger_name` VARCHAR(191) NOT NULL
- `payment_mode` VARCHAR(40) NOT NULL — `cash` | `bank` | `upi` | `cheque`
- `bank_ledger_id` VARCHAR(191) NULL
- `bank_ledger_name` VARCHAR(191) NULL
- `cheque_number` VARCHAR(100) NULL
- `cheque_date` VARCHAR(40) NULL
- `cheque_bank_name` VARCHAR(191) NULL
- `transaction_id` VARCHAR(191) NULL
- `receipt_amount` REAL NOT NULL DEFAULT 0
- `dimension_branch` VARCHAR(191) NULL
- `dimension_project` VARCHAR(191) NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL
- `created_by_user_id` VARCHAR(191) NULL

<br>

### `billing_payment_vouchers`
> Payment detail. Reports: payment register, supplier payment history, disbursement summary.

- `voucher_id` VARCHAR(191) PRIMARY KEY
- `voucher_number` VARCHAR(191) NOT NULL
- `voucher_date` VARCHAR(40) NOT NULL
- `status` VARCHAR(40) NOT NULL
- `party_ledger_id` VARCHAR(191) NOT NULL
- `party_ledger_name` VARCHAR(191) NOT NULL
- `payment_mode` VARCHAR(40) NOT NULL — `cash` | `bank` | `upi` | `cheque` | `dd`
- `bank_ledger_id` VARCHAR(191) NULL
- `bank_ledger_name` VARCHAR(191) NULL
- `cheque_number` VARCHAR(100) NULL
- `cheque_date` VARCHAR(40) NULL
- `cheque_bank_name` VARCHAR(191) NULL
- `transaction_id` VARCHAR(191) NULL
- `payment_amount` REAL NOT NULL DEFAULT 0
- `tds_amount` REAL NOT NULL DEFAULT 0
- `tds_section` VARCHAR(40) NULL
- `dimension_branch` VARCHAR(191) NULL
- `dimension_project` VARCHAR(191) NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL
- `created_by_user_id` VARCHAR(191) NULL

<br>

### `billing_journal_vouchers`
> Journal / General Journal detail. Reports: journal register, adjustment/provision entries.

- `voucher_id` VARCHAR(191) PRIMARY KEY
- `voucher_number` VARCHAR(191) NOT NULL
- `voucher_date` VARCHAR(40) NOT NULL
- `status` VARCHAR(40) NOT NULL
- `journal_type` VARCHAR(40) NOT NULL DEFAULT `general` — `general` | `adjustment` | `provision` | `depreciation` | `closing` | `opening`
- `is_auto_generated` INTEGER NOT NULL DEFAULT 0
- `auto_generated_reason` VARCHAR(191) NULL
- `total_debit` REAL NOT NULL DEFAULT 0
- `total_credit` REAL NOT NULL DEFAULT 0
- `dimension_branch` VARCHAR(191) NULL
- `dimension_project` VARCHAR(191) NULL
- `dimension_cost_center` VARCHAR(191) NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL
- `created_by_user_id` VARCHAR(191) NULL

<br>

### `billing_contra_vouchers`
> Contra detail. Reports: cash deposit/withdrawal register, inter-bank transfer log.

- `voucher_id` VARCHAR(191) PRIMARY KEY
- `voucher_number` VARCHAR(191) NOT NULL
- `voucher_date` VARCHAR(40) NOT NULL
- `status` VARCHAR(40) NOT NULL
- `contra_type` VARCHAR(40) NOT NULL — `cash_to_bank` | `bank_to_cash` | `bank_to_bank` | `cash_to_cash`
- `from_ledger_id` VARCHAR(191) NOT NULL
- `from_ledger_name` VARCHAR(191) NOT NULL
- `to_ledger_id` VARCHAR(191) NOT NULL
- `to_ledger_name` VARCHAR(191) NOT NULL
- `cheque_number` VARCHAR(100) NULL
- `cheque_date` VARCHAR(40) NULL
- `transaction_id` VARCHAR(191) NULL
- `transfer_amount` REAL NOT NULL DEFAULT 0
- `dimension_branch` VARCHAR(191) NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL
- `created_by_user_id` VARCHAR(191) NULL

<br>

### `billing_petty_cash_vouchers`
> Petty Cash detail. Reports: petty cash expense register, fund replenishment summary.

- `voucher_id` VARCHAR(191) PRIMARY KEY
- `voucher_number` VARCHAR(191) NOT NULL
- `voucher_date` VARCHAR(40) NOT NULL
- `status` VARCHAR(40) NOT NULL
- `petty_cash_ledger_id` VARCHAR(191) NOT NULL
- `petty_cash_ledger_name` VARCHAR(191) NOT NULL
- `payee_name` VARCHAR(191) NOT NULL DEFAULT ``
- `payee_ledger_id` VARCHAR(191) NULL
- `payee_ledger_name` VARCHAR(191) NULL
- `expense_ledger_id` VARCHAR(191) NOT NULL
- `expense_ledger_name` VARCHAR(191) NOT NULL
- `expense_category` VARCHAR(100) NULL
- `expense_amount` REAL NOT NULL DEFAULT 0
- `bill_number` VARCHAR(191) NULL
- `bill_date` VARCHAR(40) NULL
- `is_replenishment` INTEGER NOT NULL DEFAULT 0
- `replenishment_voucher_id` VARCHAR(191) NULL
- `dimension_branch` VARCHAR(191) NULL
- `dimension_cost_center` VARCHAR(191) NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL
- `created_by_user_id` VARCHAR(191) NULL

---

## 4. Book-of-Account Entry Tables

> Append-only rows written at voucher-post time. Each table covers one class of
> account (bank or cash). Running balance is maintained at write time.

### `billing_bank_book_entries`
> One row per bank-account-touching voucher line.  
> Reports: bank statement view, BRS, bank-wise cashflow.

- `entry_id` VARCHAR(191) PRIMARY KEY
- `voucher_id` VARCHAR(191) NOT NULL → `billing_voucher_headers.voucher_id`
- `voucher_number` VARCHAR(191) NOT NULL
- `voucher_date` VARCHAR(40) NOT NULL
- `voucher_type` VARCHAR(40) NOT NULL — `receipt` | `payment` | `contra` | `journal` | `sales` | `purchase`
- `voucher_status` VARCHAR(40) NOT NULL
- `bank_ledger_id` VARCHAR(191) NOT NULL
- `bank_ledger_name` VARCHAR(191) NOT NULL
- `transaction_side` VARCHAR(10) NOT NULL — `debit` | `credit`
- `transaction_amount` REAL NOT NULL DEFAULT 0
- `running_balance` REAL NOT NULL DEFAULT 0
- `payment_mode` VARCHAR(40) NULL — `cheque` | `neft` | `rtgs` | `upi` | `dd` | `card`
- `cheque_number` VARCHAR(100) NULL
- `cheque_date` VARCHAR(40) NULL
- `cheque_bank_name` VARCHAR(191) NULL
- `transaction_id` VARCHAR(191) NULL
- `value_date` VARCHAR(40) NULL
- `counterparty_ledger_id` VARCHAR(191) NULL
- `counterparty_ledger_name` VARCHAR(191) NULL
- `narration` TEXT NOT NULL DEFAULT ``
- `is_reconciled` INTEGER NOT NULL DEFAULT 0
- `reconciled_at` VARCHAR(40) NULL
- `bank_statement_ref` VARCHAR(191) NULL
- `financial_year_code` VARCHAR(40) NOT NULL
- `dimension_branch` VARCHAR(191) NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

<br>

### `billing_cash_book_entries`
> One row per cash-account-touching voucher line.  
> Reports: cash book view, daily cash position, denomination-level verification.

- `entry_id` VARCHAR(191) PRIMARY KEY
- `voucher_id` VARCHAR(191) NOT NULL → `billing_voucher_headers.voucher_id`
- `voucher_number` VARCHAR(191) NOT NULL
- `voucher_date` VARCHAR(40) NOT NULL
- `voucher_type` VARCHAR(40) NOT NULL — `receipt` | `payment` | `petty_cash` | `contra` | `journal` | `sales` | `purchase`
- `voucher_status` VARCHAR(40) NOT NULL
- `cash_ledger_id` VARCHAR(191) NOT NULL
- `cash_ledger_name` VARCHAR(191) NOT NULL
- `transaction_side` VARCHAR(10) NOT NULL — `debit` | `credit`
- `transaction_amount` REAL NOT NULL DEFAULT 0
- `running_balance` REAL NOT NULL DEFAULT 0
- `counterparty_ledger_id` VARCHAR(191) NULL
- `counterparty_ledger_name` VARCHAR(191) NULL
- `narration` TEXT NOT NULL DEFAULT ``
- `is_petty_cash` INTEGER NOT NULL DEFAULT 0
- `denomination_json` TEXT NULL
- `financial_year_code` VARCHAR(40) NOT NULL
- `dimension_branch` VARCHAR(191) NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

---

## 5. Itemised Line Sub-Tables

> Each table holds **one row per line item / allocation / ledger entry** within a voucher.  
> All tables carry `item_id` PRIMARY KEY and `voucher_id` referencing the parent split-detail table.  
> Purpose: item-level drill-down, product-wise reports, HSN summary, bill-wise allocation history — without parsing JSON.

<br>

### `billing_sales_item_vouchers`
> One row per product/service line item inside a Sales Invoice.  
> Reports: item-wise sales, HSN/SAC summary, product turnover, quantity sold.

- `item_id` VARCHAR(191) PRIMARY KEY — `sales-item:<uuid>`
- `voucher_id` VARCHAR(191) NOT NULL → `billing_sales_vouchers.voucher_id`
- `voucher_number` VARCHAR(191) NOT NULL
- `voucher_date` VARCHAR(40) NOT NULL
- `financial_year_code` VARCHAR(40) NOT NULL
- `line_order` INTEGER NOT NULL
- `product_id` VARCHAR(191) NULL
- `warehouse_id` VARCHAR(191) NULL
- `item_name` VARCHAR(191) NOT NULL
- `description` TEXT NOT NULL DEFAULT `''`
- `hsn_or_sac` VARCHAR(40) NOT NULL
- `quantity` REAL NOT NULL DEFAULT 0
- `unit` VARCHAR(40) NOT NULL
- `rate` REAL NOT NULL DEFAULT 0
- `gross_amount` REAL NOT NULL DEFAULT 0 — `quantity × rate`
- `discount_rate` REAL NOT NULL DEFAULT 0
- `discount_amount` REAL NOT NULL DEFAULT 0
- `taxable_amount` REAL NOT NULL DEFAULT 0
- `tax_rate` REAL NOT NULL DEFAULT 0
- `cgst_amount` REAL NOT NULL DEFAULT 0
- `sgst_amount` REAL NOT NULL DEFAULT 0
- `igst_amount` REAL NOT NULL DEFAULT 0
- `total_tax_amount` REAL NOT NULL DEFAULT 0
- `net_amount` REAL NOT NULL DEFAULT 0
- `supply_type` VARCHAR(10) NULL — `intra` | `inter`
- `place_of_supply` VARCHAR(40) NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

<br>

### `billing_purchase_item_vouchers`
> One row per product/service line item inside a Purchase Invoice.  
> Reports: item-wise purchase, ITC item detail, HSN/SAC inward summary, stock valuation input.

- `item_id` VARCHAR(191) PRIMARY KEY — `purchase-item:<uuid>`
- `voucher_id` VARCHAR(191) NOT NULL → `billing_purchase_vouchers.voucher_id`
- `voucher_number` VARCHAR(191) NOT NULL
- `voucher_date` VARCHAR(40) NOT NULL
- `financial_year_code` VARCHAR(40) NOT NULL
- `line_order` INTEGER NOT NULL
- `product_id` VARCHAR(191) NULL
- `warehouse_id` VARCHAR(191) NULL
- `item_name` VARCHAR(191) NOT NULL
- `description` TEXT NOT NULL DEFAULT `''`
- `hsn_or_sac` VARCHAR(40) NOT NULL
- `quantity` REAL NOT NULL DEFAULT 0
- `unit` VARCHAR(40) NOT NULL
- `rate` REAL NOT NULL DEFAULT 0
- `gross_amount` REAL NOT NULL DEFAULT 0
- `discount_rate` REAL NOT NULL DEFAULT 0
- `discount_amount` REAL NOT NULL DEFAULT 0
- `taxable_amount` REAL NOT NULL DEFAULT 0
- `tax_rate` REAL NOT NULL DEFAULT 0
- `cgst_amount` REAL NOT NULL DEFAULT 0
- `sgst_amount` REAL NOT NULL DEFAULT 0
- `igst_amount` REAL NOT NULL DEFAULT 0
- `total_tax_amount` REAL NOT NULL DEFAULT 0
- `net_amount` REAL NOT NULL DEFAULT 0
- `itc_eligible` INTEGER NOT NULL DEFAULT 1
- `itc_reversal_reason` VARCHAR(191) NULL
- `supply_type` VARCHAR(10) NULL — `intra` | `inter`
- `place_of_supply` VARCHAR(40) NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

<br>

### `billing_receipt_item_vouchers`
> One row per bill allocation line inside a Receipt voucher.  
> Reports: against-invoice settlement history, receipt-wise outstanding clearance, on-account tracking.

- `item_id` VARCHAR(191) PRIMARY KEY — `receipt-alloc:<uuid>`
- `voucher_id` VARCHAR(191) NOT NULL → `billing_receipt_vouchers.voucher_id`
- `voucher_number` VARCHAR(191) NOT NULL
- `voucher_date` VARCHAR(40) NOT NULL
- `financial_year_code` VARCHAR(40) NOT NULL
- `line_order` INTEGER NOT NULL
- `reference_type` VARCHAR(40) NOT NULL — `new_ref` | `against_ref` | `on_account`
- `reference_number` VARCHAR(191) NOT NULL
- `reference_date` VARCHAR(40) NULL
- `due_date` VARCHAR(40) NULL
- `original_amount` REAL NOT NULL DEFAULT 0
- `allocated_amount` REAL NOT NULL DEFAULT 0
- `balance_amount` REAL NOT NULL DEFAULT 0 — `original − allocated`
- `note` TEXT NOT NULL DEFAULT `''`
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

<br>

### `billing_payment_item_vouchers`
> One row per bill allocation line inside a Payment voucher.  
> Reports: against-invoice payment history, payment-wise outstanding clearance, advance tracking.

- `item_id` VARCHAR(191) PRIMARY KEY — `payment-alloc:<uuid>`
- `voucher_id` VARCHAR(191) NOT NULL → `billing_payment_vouchers.voucher_id`
- `voucher_number` VARCHAR(191) NOT NULL
- `voucher_date` VARCHAR(40) NOT NULL
- `financial_year_code` VARCHAR(40) NOT NULL
- `line_order` INTEGER NOT NULL
- `reference_type` VARCHAR(40) NOT NULL — `new_ref` | `against_ref` | `on_account`
- `reference_number` VARCHAR(191) NOT NULL
- `reference_date` VARCHAR(40) NULL
- `due_date` VARCHAR(40) NULL
- `original_amount` REAL NOT NULL DEFAULT 0
- `allocated_amount` REAL NOT NULL DEFAULT 0
- `balance_amount` REAL NOT NULL DEFAULT 0
- `tds_deducted` REAL NOT NULL DEFAULT 0
- `tds_section` VARCHAR(40) NULL
- `note` TEXT NOT NULL DEFAULT `''`
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

<br>

### `billing_journal_item_vouchers`
> One row per debit/credit ledger entry inside a Journal voucher.  
> Reports: ledger-wise journal detail, account-head drill-down, cost-centre allocation breakdown.

- `item_id` VARCHAR(191) PRIMARY KEY — `journal-line:<uuid>`
- `voucher_id` VARCHAR(191) NOT NULL → `billing_journal_vouchers.voucher_id`
- `voucher_number` VARCHAR(191) NOT NULL
- `voucher_date` VARCHAR(40) NOT NULL
- `financial_year_code` VARCHAR(40) NOT NULL
- `line_order` INTEGER NOT NULL
- `ledger_id` VARCHAR(191) NOT NULL
- `ledger_name` VARCHAR(191) NOT NULL
- `ledger_group` VARCHAR(191) NOT NULL DEFAULT `''`
- `side` VARCHAR(10) NOT NULL — `debit` | `credit`
- `amount` REAL NOT NULL DEFAULT 0
- `note` TEXT NOT NULL DEFAULT `''`
- `dimension_branch` VARCHAR(191) NULL
- `dimension_project` VARCHAR(191) NULL
- `dimension_cost_center` VARCHAR(191) NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

<br>

### `billing_contra_item_vouchers`
> One row per ledger line inside a Contra voucher.  
> Reports: instrument-wise contra detail, NEFT/cheque tracking per transfer leg, multi-account contra breakdown.

- `item_id` VARCHAR(191) PRIMARY KEY — `contra-line:<uuid>`
- `voucher_id` VARCHAR(191) NOT NULL → `billing_contra_vouchers.voucher_id`
- `voucher_number` VARCHAR(191) NOT NULL
- `voucher_date` VARCHAR(40) NOT NULL
- `financial_year_code` VARCHAR(40) NOT NULL
- `line_order` INTEGER NOT NULL
- `ledger_id` VARCHAR(191) NOT NULL
- `ledger_name` VARCHAR(191) NOT NULL
- `account_type` VARCHAR(20) NOT NULL — `bank` | `cash`
- `side` VARCHAR(10) NOT NULL — `debit` | `credit`
- `amount` REAL NOT NULL DEFAULT 0
- `instrument_type` VARCHAR(40) NULL — `cheque` | `neft` | `rtgs` | `upi` | `dd` | `cash`
- `instrument_number` VARCHAR(191) NULL — cheque no. / UTR / transaction ref
- `instrument_date` VARCHAR(40) NULL
- `note` TEXT NOT NULL DEFAULT `''`
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

---

## Migration Order

| Order | File | Table Created |
|------:|------|---------------|
| 10 | `01-categories.ts` | `billing_categories` |
| 10 | `01-ledgers.ts` | `billing_ledgers` |
| 20 | `02-voucher-groups.ts` | `billing_voucher_groups` |
| 20 | `02-vouchers.ts` | `billing_vouchers` |
| 30 | `03-voucher-types.ts` | `billing_voucher_types` |
| 40 | `04-voucher-headers.ts` | `billing_voucher_headers` |
| 50 | `05-voucher-lines.ts` | `billing_voucher_lines` |
| 60 | `06-ledger-entries.ts` | `billing_ledger_entries` |
| 70 | `07-accounting-controls.ts` | _(alters voucher-headers)_ |
| 80 | `08-sales-vouchers.ts` | `billing_sales_vouchers` |
| 90 | `09-purchase-vouchers.ts` | `billing_purchase_vouchers` |
| 100 | `10-receipt-vouchers.ts` | `billing_receipt_vouchers` |
| 110 | `11-payment-vouchers.ts` | `billing_payment_vouchers` |
| 120 | `12-journal-vouchers.ts` | `billing_journal_vouchers` |
| 130 | `13-contra-vouchers.ts` | `billing_contra_vouchers` |
| 140 | `14-petty-cash-vouchers.ts` | `billing_petty_cash_vouchers` |
| 150 | `15-bank-book-entries.ts` | `billing_bank_book_entries` |
| 160 | `16-cash-book-entries.ts` | `billing_cash_book_entries` |
| 170 | `17-sales-item-vouchers.ts` | `billing_sales_item_vouchers` |
| 180 | `18-purchase-item-vouchers.ts` | `billing_purchase_item_vouchers` |
| 190 | `19-receipt-item-vouchers.ts` | `billing_receipt_item_vouchers` |
| 200 | `20-payment-item-vouchers.ts` | `billing_payment_item_vouchers` |
| 210 | `21-journal-item-vouchers.ts` | `billing_journal_item_vouchers` |
| 220 | `22-contra-item-vouchers.ts` | `billing_contra_item_vouchers` |
| 230 | `23-bill-references.ts` | `billing_bill_references` |
| 240 | `24-bill-settlements.ts` | `billing_bill_settlements` |
| 250 | `25-bill-overdue-tracking.ts` | `billing_bill_overdue_tracking` |

---

## 6. Bill-wise Adjustment System

> Tally-style bill-by-bill settlement engine for Receipts and Payments.  
> Supports full payment, partial payment, on-account, advance, write-off, and discount modes.  
> Drives outstanding balances, aging buckets, overdue alerts, and penalty computation — without re-scanning ledger entries.

### How it works

```
Sales Invoice posted
  └── billing_bill_references (ref_type = new_ref, status = open)
            │
            │  Receipt posted → "Adjust against bill"
            ▼
  billing_bill_settlements  (settlement_amount = partial or full)
            │
            └── billing_bill_references.settled_amount += settlement_amount
                billing_bill_references.balance_amount  = original - settled
                billing_bill_references.status          → partial | settled

  Nightly job / on-demand
            └── billing_bill_overdue_tracking (aging, penalty, reminder)
```

---

### `billing_bill_references`
> **Master open-bill register.** One row per bill reference created by a Sales / Purchase / Journal voucher.  
> This is the single source of truth for "what is owed" by/to each party.  
>
> `ref_type` values match Tally semantics:
> - `new_ref` — a fresh receivable/payable raised by an invoice
> - `against_ref` — a receipt/payment that closes an existing ref (creates no new balance)
> - `on_account` — advance or unallocated amount, not yet tied to any invoice

- `ref_id` VARCHAR(191) PRIMARY KEY — `billref:<uuid>`
- `ref_number` VARCHAR(191) NOT NULL — user-visible reference (e.g. `INV-001`, `ADV-2024-003`)
- `ref_date` VARCHAR(40) NOT NULL — date the bill reference was created
- `due_date` VARCHAR(40) NULL — payment due date (NULL for on-account)
- `party_ledger_id` VARCHAR(191) NOT NULL
- `party_ledger_name` VARCHAR(191) NOT NULL
- `direction` VARCHAR(10) NOT NULL — `receivable` | `payable`
- `voucher_id` VARCHAR(191) NOT NULL — originating voucher (sales / purchase / journal)
- `voucher_number` VARCHAR(191) NOT NULL
- `voucher_type` VARCHAR(40) NOT NULL — `sales` | `purchase` | `journal` | `debit_note` | `credit_note`
- `voucher_date` VARCHAR(40) NOT NULL
- `ref_type` VARCHAR(20) NOT NULL — `new_ref` | `on_account`
- `original_amount` REAL NOT NULL DEFAULT 0 — gross bill amount at creation
- `discount_amount` REAL NOT NULL DEFAULT 0 — early-payment / trade discount granted
- `write_off_amount` REAL NOT NULL DEFAULT 0 — bad debt / write-off applied
- `settled_amount` REAL NOT NULL DEFAULT 0 — cumulative cash settled so far
- `balance_amount` REAL NOT NULL DEFAULT 0 — `original − discount − write_off − settled`
- `status` VARCHAR(20) NOT NULL DEFAULT `open` — `open` | `partial` | `settled` | `written_off` | `cancelled`
- `financial_year_code` VARCHAR(40) NOT NULL
- `dimension_branch` VARCHAR(191) NULL
- `narration` TEXT NOT NULL DEFAULT `''`
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

<br>

### `billing_bill_settlements`
> **Allocation ledger.** One row per settlement transaction — each time a Receipt, Payment, or Journal partially or fully adjusts a bill reference.  
> Multiple settlements can exist for one `ref_id` (partial payments over time).  
>
> `settlement_type` values:
> - `full` — entire balance cleared in one transaction
> - `partial` — portion of balance cleared
> - `on_account` — allocated to an on-account advance (not tied to a specific invoice)
> - `discount` — seller grants discount and knocks off the balance
> - `write_off` — bad debt write-off (fully or partially removes the balance)
> - `advance_adjust` — applies a prior advance/on-account credit to an invoice

- `settlement_id` VARCHAR(191) PRIMARY KEY — `settle:<uuid>`
- `bill_ref_id` VARCHAR(191) NOT NULL → `billing_bill_references.ref_id`
- `ref_number` VARCHAR(191) NOT NULL — denormalized for fast display
- `party_ledger_id` VARCHAR(191) NOT NULL
- `party_ledger_name` VARCHAR(191) NOT NULL
- `direction` VARCHAR(10) NOT NULL — `receivable` | `payable`
- `settlement_voucher_id` VARCHAR(191) NOT NULL — the receipt / payment / journal that settles
- `settlement_voucher_number` VARCHAR(191) NOT NULL
- `settlement_voucher_type` VARCHAR(40) NOT NULL — `receipt` | `payment` | `journal` | `credit_note` | `debit_note`
- `settlement_date` VARCHAR(40) NOT NULL
- `settlement_type` VARCHAR(20) NOT NULL — `full` | `partial` | `on_account` | `discount` | `write_off` | `advance_adjust`
- `settlement_amount` REAL NOT NULL DEFAULT 0 — amount settled in this transaction
- `discount_amount` REAL NOT NULL DEFAULT 0 — discount granted in this settlement
- `write_off_amount` REAL NOT NULL DEFAULT 0 — write-off applied in this settlement
- `balance_before` REAL NOT NULL DEFAULT 0 — balance on the ref before this settlement
- `balance_after` REAL NOT NULL DEFAULT 0 — balance on the ref after this settlement
- `against_advance_ref_id` VARCHAR(191) NULL → `billing_bill_references.ref_id` — links to the advance/on-account ref being consumed
- `financial_year_code` VARCHAR(40) NOT NULL
- `narration` TEXT NOT NULL DEFAULT `''`
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

<br>

### `billing_bill_overdue_tracking`
> **Overdue / aging store.** One row per open or partially-settled bill reference.  
> Refreshed nightly (or on-demand after each settlement). Drives:
> - Aging reports (current / 1–30 / 31–60 / 61–90 / 91–180 / 181–365 / 365+)
> - Penalty/interest computation
> - Reminder scheduling and escalation
>
> `aging_bucket` matches the standard receivables aging ladder:
>
> | Bucket key | Range |
> |------------|-------|
> | `current` | Not yet due |
> | `1_30` | 1 – 30 days overdue |
> | `31_60` | 31 – 60 days overdue |
> | `61_90` | 61 – 90 days overdue |
> | `91_180` | 91 – 180 days overdue |
> | `181_365` | 181 – 365 days overdue |
> | `365_plus` | More than 1 year overdue |

- `overdue_id` VARCHAR(191) PRIMARY KEY — `overdue:<ref_id>`
- `bill_ref_id` VARCHAR(191) NOT NULL UNIQUE → `billing_bill_references.ref_id`
- `ref_number` VARCHAR(191) NOT NULL
- `party_ledger_id` VARCHAR(191) NOT NULL
- `party_ledger_name` VARCHAR(191) NOT NULL
- `direction` VARCHAR(10) NOT NULL — `receivable` | `payable`
- `voucher_id` VARCHAR(191) NOT NULL
- `voucher_number` VARCHAR(191) NOT NULL
- `voucher_type` VARCHAR(40) NOT NULL
- `ref_date` VARCHAR(40) NOT NULL
- `due_date` VARCHAR(40) NULL
- `overdue_days` INTEGER NOT NULL DEFAULT 0 — `MAX(0, today − due_date)`
- `overdue_amount` REAL NOT NULL DEFAULT 0 — current `balance_amount` from bill ref
- `aging_bucket` VARCHAR(20) NOT NULL — `current` | `1_30` | `31_60` | `61_90` | `91_180` | `181_365` | `365_plus`
- `penalty_rate_pa` REAL NOT NULL DEFAULT 0 — annual penalty / interest rate (%)
- `penalty_days` INTEGER NOT NULL DEFAULT 0 — days for which penalty is computed
- `penalty_amount` REAL NOT NULL DEFAULT 0 — `overdue_amount × rate × days / 365`
- `reminder_count` INTEGER NOT NULL DEFAULT 0 — number of reminders sent so far
- `last_reminder_at` VARCHAR(40) NULL
- `next_reminder_due_at` VARCHAR(40) NULL
- `reminder_level` VARCHAR(20) NOT NULL DEFAULT `none` — `none` | `soft` | `medium` | `escalated` | `legal`
- `status` VARCHAR(20) NOT NULL DEFAULT `current` — `current` | `due_today` | `overdue` | `severely_overdue` | `written_off`
- `financial_year_code` VARCHAR(40) NOT NULL
- `dimension_branch` VARCHAR(191) NULL
- `computed_at` VARCHAR(40) NOT NULL — timestamp of last refresh
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

---

### Settlement Flow Examples

#### Example A — Partial Payment (like Tally "Against Ref")
```
Sales Invoice INV-001  →  billing_bill_references  ref_id=R1, original=10000, status=open

Receipt REC-001 for ₹6000:
  billing_bill_settlements: settlement_id=S1, bill_ref_id=R1,
      settlement_type=partial, settlement_amount=6000,
      balance_before=10000, balance_after=4000

  billing_bill_references: settled_amount=6000, balance_amount=4000, status=partial

Receipt REC-002 for ₹4000:
  billing_bill_settlements: settlement_id=S2, bill_ref_id=R1,
      settlement_type=full, settlement_amount=4000,
      balance_before=4000, balance_after=0

  billing_bill_references: settled_amount=10000, balance_amount=0, status=settled
  billing_bill_overdue_tracking: row deleted / status=written_off
```

#### Example B — Advance then Invoice (On-Account → Advance Adjust)
```
Receipt REC-003 ₹5000 (advance, no invoice yet):
  billing_bill_references: ref_type=on_account, original=5000, status=open (ADV-001)

Sales Invoice INV-002 ₹8000 raised later:
  billing_bill_references: ref_type=new_ref, original=8000, status=open

Receipt REC-004 ₹3000 (balance after advance):
  billing_bill_settlements S3: advance_adjust against ADV-001, amount=5000
  billing_bill_settlements S4: partial against INV-002, amount=3000
  billing_bill_references ADV-001: status=settled
  billing_bill_references INV-002: settled_amount=8000, status=settled
```

#### Example C — Discount / Write-off
```
Sales Invoice INV-003 ₹1000, customer pays ₹950 (₹50 discount agreed):
  billing_bill_settlements S5: settlement_type=discount,
      settlement_amount=950, discount_amount=50,
      balance_before=1000, balance_after=0
  billing_bill_references: discount_amount=50, settled_amount=950,
      balance_amount=0, status=settled
```

---
