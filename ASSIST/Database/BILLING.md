# Database Table Structure

This document serves as the canonical reference for the Billing app foundation tables. It is organized by logical layers to support a framework-agnostic architecture and is optimized for manual auditing.

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
> JSON store for raw billing vouchers data.

- `id` VARCHAR(191) PRIMARY KEY
- `module_key` VARCHAR(100) NULL
- `sort_order` INTEGER NOT NULL DEFAULT 0
- `payload` TEXT NOT NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

---

## 2. Normalized Transaction Tables

### `billing_voucher_headers`
> Normalized header table for fast querying and aggregation of vouchers.

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
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL
- `created_by_user_id` VARCHAR(191) NULL

<br>

### `billing_voucher_lines`
> Normalized line items for detailed voucher queries.

- `line_id` VARCHAR(191) PRIMARY KEY
- `voucher_id` VARCHAR(191) NOT NULL
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
- `voucher_id` VARCHAR(191) NOT NULL
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
