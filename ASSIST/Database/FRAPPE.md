# Database Table Structure

This document serves as the canonical reference for the Frappe integration app foundation tables. It is organized by logical layers to support a framework-agnostic architecture and is optimized for manual auditing.

---

## 1. Sync & Connector JSON Stores

### `frappe_settings`
> Configuration for ERPNext/Frappe connector parameters.

- `id` VARCHAR(191) PRIMARY KEY
- `module_key` VARCHAR(100) NULL
- `sort_order` INTEGER NOT NULL DEFAULT 0
- `payload` TEXT NOT NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

<br>

### `frappe_todos`
> Snapshots of ERPNext To-Do records.

- `id` VARCHAR(191) PRIMARY KEY
- `module_key` VARCHAR(100) NULL
- `sort_order` INTEGER NOT NULL DEFAULT 0
- `payload` TEXT NOT NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

<br>

### `frappe_items`
> Snapshots of ERPNext Item catalog entries.

- `id` VARCHAR(191) PRIMARY KEY
- `module_key` VARCHAR(100) NULL
- `sort_order` INTEGER NOT NULL DEFAULT 0
- `payload` TEXT NOT NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

<br>

### `frappe_purchase_receipts`
> Snapshots of ERPNext Purchase Receipt documents.

- `id` VARCHAR(191) PRIMARY KEY
- `module_key` VARCHAR(100) NULL
- `sort_order` INTEGER NOT NULL DEFAULT 0
- `payload` TEXT NOT NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

<br>

### `frappe_item_product_sync_logs`
> Diagnostic log tracing synchronizations across internal products and upstream Frappe items.

- `id` VARCHAR(191) PRIMARY KEY
- `module_key` VARCHAR(100) NULL
- `sort_order` INTEGER NOT NULL DEFAULT 0
- `payload` TEXT NOT NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL
