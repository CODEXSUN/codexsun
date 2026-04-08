# Database Table Structure

This document serves as the canonical reference for the Core app foundation tables. It is organized by logical layers to support a framework-agnostic architecture and is optimized for manual auditing.

---

## 1. Primary Record Stores

### `core_contacts`
> JSON store for CRM contact entities.

- `id` VARCHAR(191) PRIMARY KEY
- `module_key` VARCHAR(100) NULL
- `sort_order` INTEGER NOT NULL DEFAULT 0
- `payload` TEXT NOT NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

<br>

### `core_products`
> JSON store for master catalog products.

- `id` VARCHAR(191) PRIMARY KEY
- `module_key` VARCHAR(100) NULL
- `sort_order` INTEGER NOT NULL DEFAULT 0
- `payload` TEXT NOT NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

---

## 2. Common Module Infrastructure

### `core_common_module_metadata`
> JSON store for tracking common module states and definitions.

- `id` VARCHAR(191) PRIMARY KEY
- `module_key` VARCHAR(100) NULL
- `sort_order` INTEGER NOT NULL DEFAULT 0
- `payload` TEXT NOT NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

<br>

### `core_common_module_items`
> JSON store for backing raw common module seed items.

- `id` VARCHAR(191) PRIMARY KEY
- `module_key` VARCHAR(100) NULL
- `sort_order` INTEGER NOT NULL DEFAULT 0
- `payload` TEXT NOT NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

---

## 3. Dynamic Common Module Tables

> A series of dynamically created relational tables mapping from common module definitions. All tables share the same baseline structure alongside specific column configurations per module definition.
> 
> **Tables Included:**
> `common_countries`, `common_states`, `common_districts`, `common_cities`, `common_pincodes`, `common_contact_groups`, `common_contact_types`, `common_address_types`, `common_bank_names`, `common_product_groups`, `common_product_categories`, `common_product_types`, `common_units`, `common_hsn_codes`, `common_taxes`, `common_brands`, `common_colours`, `common_sizes`, `common_currencies`, `common_order_types`, `common_styles`, `common_transports`, `common_warehouses`, `common_destinations`, `common_payment_terms`, `common_storefront_templates`, `common_slider_themes`.

- `id` VARCHAR(191) PRIMARY KEY
- `...` (Various Dynamic Columns: `text`, `integer`/`boolean`, `real`)
- `is_active` INTEGER NOT NULL DEFAULT 1
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL
