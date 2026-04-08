# Database Table Structure

This document serves as the canonical reference for the Ecommerce app foundation tables. It is organized by logical layers to support a framework-agnostic architecture and is optimized for manual auditing.

---

## 1. Ecommerce JSON Stores

### `ecommerce_storefront_settings`
> Configuration data for the public storefront logic.

- `id` VARCHAR(191) PRIMARY KEY
- `module_key` VARCHAR(100) NULL
- `sort_order` INTEGER NOT NULL DEFAULT 0
- `payload` TEXT NOT NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

<br>

### `ecommerce_customer_accounts`
> Represents external customers engaging with commerce flows.

- `id` VARCHAR(191) PRIMARY KEY
- `module_key` VARCHAR(100) NULL
- `sort_order` INTEGER NOT NULL DEFAULT 0
- `payload` TEXT NOT NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

<br>

### `ecommerce_customer_portal`
> Preferences and metadata for the client-facing customer portal.

- `id` VARCHAR(191) PRIMARY KEY
- `module_key` VARCHAR(100) NULL
- `sort_order` INTEGER NOT NULL DEFAULT 0
- `payload` TEXT NOT NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

<br>

### `ecommerce_support_cases`
> Recorded customer support interactions and tickets.

- `id` VARCHAR(191) PRIMARY KEY
- `module_key` VARCHAR(100) NULL
- `sort_order` INTEGER NOT NULL DEFAULT 0
- `payload` TEXT NOT NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

<br>

### `ecommerce_order_requests`
> Intermediate store for order drafts or quote requests.

- `id` VARCHAR(191) PRIMARY KEY
- `module_key` VARCHAR(100) NULL
- `sort_order` INTEGER NOT NULL DEFAULT 0
- `payload` TEXT NOT NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

<br>

### `ecommerce_orders`
> Store for finalized placed ecommerce transactions.

- `id` VARCHAR(191) PRIMARY KEY
- `module_key` VARCHAR(100) NULL
- `sort_order` INTEGER NOT NULL DEFAULT 0
- `payload` TEXT NOT NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL

<br>

### `ecommerce_payment_webhook_events`
> Logs asynchronous events triggered by external payment gateways.

- `id` VARCHAR(191) PRIMARY KEY
- `module_key` VARCHAR(100) NULL
- `sort_order` INTEGER NOT NULL DEFAULT 0
- `payload` TEXT NOT NULL
- `created_at` VARCHAR(40) NOT NULL
- `updated_at` VARCHAR(40) NOT NULL
