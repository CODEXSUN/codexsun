# Database Table Structure

This document serves as the canonical reference for the Codexsun platform foundation tables. It is organized by logical layers to support a framework-agnostic architecture and is optimized for manual auditing.

---

## 1. System And Runtime Tables

### `system_migrations`
> Tracks executed database migrations to prevent duplicate runs and maintain schema state.

- `id` VARCHAR(128) PRIMARY KEY         -- Unique identifier for the migration
- `name` VARCHAR(255) NOT NULL          -- Descriptive name of the migration
- `module_key` VARCHAR(80) NOT NULL     -- The app or module that owns this migration
- `applied_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

<br>

### `system_seeders`
> Tracks applied database seeders to ensure baseline data is inserted exactly once.

- `id` VARCHAR(128) PRIMARY KEY         -- Unique identifier for the seeder
- `name` VARCHAR(255) NOT NULL          -- Descriptive name of the seeder
- `applied_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

<br>

### `system_settings`
> Global, system-wide configuration settings and flags.

- `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT
- `scope_key` VARCHAR(80) NOT NULL      -- Grouping/category for the setting
- `setting_key` VARCHAR(120) NOT NULL   -- The specific configuration key
- `value_type` VARCHAR(40) NOT NULL     -- Type cast (string, boolean, json, etc.)
- `value_text` TEXT NULL                -- Storage for scalar values
- `value_json` JSON NULL                -- Storage for complex objects
- `is_secret` TINYINT(1) NOT NULL DEFAULT 0 -- If 1, value should be masked in UI
- `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

---

## 2. Companies As Client Root

### `companies`
> The root tenant entity. Every client, internal organization, or brand hangs from a company record.

- `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT
- `public_id` CHAR(26) NOT NULL UNIQUE  -- ULID for safe external referencing
- `code` VARCHAR(64) NOT NULL UNIQUE    -- Internal shorthand/reference code
- `name` VARCHAR(255) NOT NULL          -- Display name
- `legal_name` VARCHAR(255) NULL        -- Official business name
- `slug` VARCHAR(255) NULL UNIQUE       -- URL-friendly identifier
- `tax_identifier` VARCHAR(80) NULL     -- Corporate tax ID (e.g., EIN, VAT)
- `registration_identifier` VARCHAR(120) NULL -- Corporate registration number
- `currency_code` VARCHAR(12) NULL      -- Primary accounting currency
- `timezone` VARCHAR(80) NULL           -- Default operational timezone
- `default_locale` VARCHAR(20) NULL     -- Primary language/region
- `country_code` VARCHAR(12) NULL       -- 2-letter ISO country code
- `status` VARCHAR(40) NOT NULL DEFAULT 'active' -- active, suspended, deleted
- `meta_json` JSON NULL                 -- Extensible unstructured metadata
- `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
- `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

<br>

### `companies_surfaces`
> Defines the distinct frontend applications (surfaces) exposed for a specific company (e.g., storefront, admin desk, POS).

- `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT
- `public_id` CHAR(26) NOT NULL UNIQUE
- `company_id` BIGINT UNSIGNED NOT NULL -- Foreign key to companies
- `surface_key` VARCHAR(80) NOT NULL    -- e.g., 'ecommerce', 'admin', 'billing'
- `display_name` VARCHAR(255) NOT NULL  -- User-facing name of the surface
- `is_enabled` TINYINT(1) NOT NULL DEFAULT 0
- `is_public` TINYINT(1) NOT NULL DEFAULT 0  -- 1 if accessible without auth
- `default_route` VARCHAR(255) NULL     -- Default entry path after navigation
- `theme_key` VARCHAR(80) NULL          -- Link to UI design system theme
- `default_locale` VARCHAR(20) NULL     
- `sort_order` INT NOT NULL DEFAULT 0
- `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
- `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

<br>

### `companies_domains`
> Custom domains mapped to specific company surfaces.

- `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT
- `public_id` CHAR(26) NOT NULL UNIQUE
- `company_id` BIGINT UNSIGNED NOT NULL
- `surface_key` VARCHAR(80) NOT NULL    -- Target surface for this domain
- `hostname` VARCHAR(255) NOT NULL      -- e.g., 'shop.example.com'
- `base_url` VARCHAR(500) NOT NULL      -- Fully qualified URL
- `is_primary` TINYINT(1) NOT NULL DEFAULT 0 -- Primary domain for canonical links
- `ssl_mode` VARCHAR(40) NOT NULL DEFAULT 'managed'
- `redirect_to_primary` TINYINT(1) NOT NULL DEFAULT 1
- `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
- `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

---

## 3. Company Customization & Identity

### `companies_settings`
> Extends company functionality via key-value preferences without hard-coding schemas.

- `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT
- `company_id` BIGINT UNSIGNED NOT NULL
- `scope_key` VARCHAR(80) NOT NULL      -- Setting grouping
- `setting_key` VARCHAR(120) NOT NULL   -- Specific setting key
- `value_type` VARCHAR(40) NOT NULL     -- Type casting validation
- `value_text` TEXT NULL
- `value_json` JSON NULL
- `is_secret` TINYINT(1) NOT NULL DEFAULT 0  -- Masked flag
- `is_public` TINYINT(1) NOT NULL DEFAULT 0  -- Safe to expose to public APIs
- `updated_by` BIGINT UNSIGNED NULL          -- Audit user
- `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

<br>

### `companies_features`
> Feature toggles controlling access to specific application capabilities.

- `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT
- `company_id` BIGINT UNSIGNED NOT NULL
- `surface_key` VARCHAR(80) NOT NULL
- `feature_key` VARCHAR(120) NOT NULL   -- Name of the feature flag
- `is_enabled` TINYINT(1) NOT NULL DEFAULT 0
- `rollout_state` VARCHAR(40) NOT NULL DEFAULT 'manual'
- `config_json` JSON NULL               -- Tweakable params for the feature
- `starts_at` DATETIME NULL             -- Optional activation schedule
- `ends_at` DATETIME NULL               -- Optional deactivation schedule
- `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
- `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

<br>

### `companies_profiles`
> Text and biographical copy used for brand representation on frontend surfaces.

- `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT
- `public_id` CHAR(26) NOT NULL UNIQUE
- `company_id` BIGINT UNSIGNED NOT NULL
- `surface_key` VARCHAR(80) NOT NULL
- `title` VARCHAR(255) NULL             -- Display title
- `title_suffix` VARCHAR(255) NULL      -- e.g., ' | Store' appended to meta tags
- `logo_text` VARCHAR(255) NULL         -- Text to use if no image logo exists
- `tagline` VARCHAR(255) NULL           -- Brand motto
- `short_bio` TEXT NULL                 -- For footer or sidebar
- `about_text` LONGTEXT NULL            -- For main 'About Us' page
- `support_email` VARCHAR(255) NULL
- `support_phone` VARCHAR(64) NULL
- `loader_text` VARCHAR(255) NULL       -- Text displayed during app boot
- `theme_key` VARCHAR(80) NULL
- `default_locale` VARCHAR(20) NULL
- `meta_json` JSON NULL
- `is_default` TINYINT(1) NOT NULL DEFAULT 0
- `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
- `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

<br>

### `companies_brand_assets`
> Visual identity assets mapped from `media_files` to specific brand placements.

- `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT
- `public_id` CHAR(26) NOT NULL UNIQUE
- `company_id` BIGINT UNSIGNED NOT NULL
- `profile_id` BIGINT UNSIGNED NULL     -- Link to specific profile context
- `surface_key` VARCHAR(80) NOT NULL    -- Target surface (e.g. 'storefront')
- `asset_key` VARCHAR(120) NOT NULL     -- Placement (e.g. 'logo-light', 'favicon')
- `media_file_id` BIGINT UNSIGNED NULL  -- Foreign key to media_files
- `fallback_path` VARCHAR(500) NULL     -- Hardcoded path if media fails
- `alt_text` VARCHAR(255) NULL          -- A11y text
- `width_px` INT NULL
- `height_px` INT NULL
- `format` VARCHAR(40) NULL
- `sort_order` INT NOT NULL DEFAULT 0
- `is_active` TINYINT(1) NOT NULL DEFAULT 1
- `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
- `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

<br>

### `companies_social_links`
> Curated links to external platforms and social networks.

- `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT
- `public_id` CHAR(26) NOT NULL UNIQUE
- `company_id` BIGINT UNSIGNED NOT NULL
- `surface_key` VARCHAR(80) NULL
- `platform_key` VARCHAR(80) NOT NULL   -- e.g., 'twitter', 'instagram'
- `label` VARCHAR(120) NULL             -- Accessible label
- `profile_url` VARCHAR(500) NOT NULL   -- Target hyperlink
- `handle` VARCHAR(120) NULL            -- @username
- `icon_key` VARCHAR(80) NULL           -- Maps to frontend icon library
- `sort_order` INT NOT NULL DEFAULT 0
- `is_active` TINYINT(1) NOT NULL DEFAULT 1
- `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
- `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

---

## 4. Auth And User Control

### `auth_users`
> The global operator or user entity. 

- `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT
- `public_id` CHAR(26) NOT NULL UNIQUE
- `email` VARCHAR(255) NULL UNIQUE
- `phone` VARCHAR(32) NULL UNIQUE
- `password_hash` VARCHAR(255) NOT NULL
- `display_name` VARCHAR(255) NOT NULL  -- Full name
- `avatar_media_file_id` BIGINT UNSIGNED NULL
- `status` VARCHAR(40) NOT NULL DEFAULT 'active'
- `last_login_at` DATETIME NULL
- `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
- `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

<br>

### `company_memberships`
> Binds an `auth_user` to a `company` to grant contextual access.

- `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT
- `public_id` CHAR(26) NOT NULL UNIQUE
- `company_id` BIGINT UNSIGNED NOT NULL -- Tenant mapping
- `user_id` BIGINT UNSIGNED NOT NULL    -- User mapping
- `actor_type` VARCHAR(40) NOT NULL     -- e.g., 'employee', 'contractor', 'customer'
- `membership_status` VARCHAR(40) NOT NULL DEFAULT 'active'
- `is_owner` TINYINT(1) NOT NULL DEFAULT 0  -- Bypasses role checks if 1
- `joined_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
- `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
- `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

<br>

### `auth_user_preferences`
> User-specific configuration that overrides application defaults.

- `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT
- `public_id` CHAR(26) NOT NULL UNIQUE
- `user_id` BIGINT UNSIGNED NOT NULL
- `company_id` BIGINT UNSIGNED NULL     -- Null means globally applied
- `surface_key` VARCHAR(80) NULL
- `theme_key` VARCHAR(80) NULL          -- 'dark', 'light', 'system'
- `locale` VARCHAR(20) NULL             -- e.g., 'en-US'
- `timezone` VARCHAR(80) NULL
- `preferences_json` JSON NULL          -- Extended UI settings
- `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

---

## 5. Media And Storage

### `storage_disks`
> Cloud or local storage destinations for the filesystem manager.

- `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT
- `public_id` CHAR(26) NOT NULL UNIQUE
- `code` VARCHAR(64) NOT NULL UNIQUE    -- e.g., 's3-us-east', 'local-public'
- `name` VARCHAR(255) NOT NULL
- `driver_key` VARCHAR(40) NOT NULL     -- e.g., 's3', 'local'
- `visibility` VARCHAR(20) NOT NULL     -- 'public', 'private'
- `base_path` VARCHAR(500) NULL         -- Root folder constraint
- `base_url` VARCHAR(500) NULL          -- CDN or host prefix
- `config_json` JSON NULL               -- Credentials and bucket settings
- `is_active` TINYINT(1) NOT NULL DEFAULT 1
- `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
- `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

<br>

### `media_files`
> Unified inventory for all uploaded files, tracking physical location and metadata.

- `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT
- `public_id` CHAR(26) NOT NULL UNIQUE
- `disk_id` BIGINT UNSIGNED NOT NULL    -- Foreign key to storage_disks
- `folder_id` BIGINT UNSIGNED NULL      -- (Optional folder tree mapping)
- `company_id` BIGINT UNSIGNED NULL     -- Tenant isolation
- `file_name` VARCHAR(255) NOT NULL     -- Original name or slug
- `storage_path` VARCHAR(500) NOT NULL  -- Relative path on the disk
- `mime_type` VARCHAR(120) NULL         -- e.g., 'image/jpeg'
- `extension` VARCHAR(20) NULL
- `size_bytes` BIGINT UNSIGNED NOT NULL DEFAULT 0
- `visibility` VARCHAR(20) NOT NULL DEFAULT 'public'
- `checksum_sha256` VARCHAR(128) NULL   -- For deduplication and integrity
- `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
- `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- `created_by` BIGINT UNSIGNED NULL

---

## 6. Deployment And Updates

### `deployment_targets`
> Where the application is deployed (environments).

- `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT
- `public_id` CHAR(26) NOT NULL UNIQUE
- `company_id` BIGINT UNSIGNED NULL
- `code` VARCHAR(64) NOT NULL UNIQUE
- `name` VARCHAR(255) NOT NULL          -- e.g., 'Production', 'Staging'
- `target_type` VARCHAR(40) NOT NULL    -- 'server', 'docker', 'vercel'
- `base_path` VARCHAR(500) NULL
- `base_url` VARCHAR(500) NULL
- `runtime_mode` VARCHAR(40) NULL       -- e.g., 'production', 'development'
- `config_json` JSON NULL               -- Deployment secrets
- `is_active` TINYINT(1) NOT NULL DEFAULT 1
- `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
- `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

<br>

### `update_sources`
> Origins for receiving codebase updates (Git repository or Zip drops).

- `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT
- `public_id` CHAR(26) NOT NULL UNIQUE
- `source_type` VARCHAR(20) NOT NULL    -- 'git', 'zip'
- `source_name` VARCHAR(255) NOT NULL
- `repository_url` VARCHAR(500) NULL    -- Set if source_type = 'git'
- `branch_name` VARCHAR(120) NULL
- `zip_file_media_id` BIGINT UNSIGNED NULL -- Set if source_type = 'zip'
- `checksum_value` VARCHAR(128) NULL    -- Release integrity verification
- `config_json` JSON NULL
- `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
- `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

<br>

### `update_git_runs`
> Logs detailing the outcome of a Git pull/checkout deployment operation.

- `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT
- `public_id` CHAR(26) NOT NULL UNIQUE
- `source_id` BIGINT UNSIGNED NOT NULL  -- Foreign key to update_sources
- `target_id` BIGINT UNSIGNED NOT NULL  -- Foreign key to deployment_targets
- `commit_hash` VARCHAR(120) NULL       -- The checked out SHA
- `run_status` VARCHAR(40) NOT NULL     -- 'pending', 'success', 'failed'
- `log_text` LONGTEXT NULL              -- Shell output
- `started_at` DATETIME NULL
- `finished_at` DATETIME NULL
- `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

<br>

### `update_zip_runs`
> Logs detailing the outcome of extracting and applying a Zip release.

- `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT
- `public_id` CHAR(26) NOT NULL UNIQUE
- `package_id` BIGINT UNSIGNED NOT NULL -- Identifier of the zip payload
- `target_id` BIGINT UNSIGNED NOT NULL  -- Target deployment
- `run_status` VARCHAR(40) NOT NULL     -- 'pending', 'success', 'failed'
- `extract_path` VARCHAR(500) NULL      -- Where files were unpacked
- `log_text` LONGTEXT NULL
- `started_at` DATETIME NULL
- `finished_at` DATETIME NULL
- `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

---

## 7. Database Manager

### `database_backups`
> Tracks scheduled and manual database exports.

- `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT
- `public_id` CHAR(26) NOT NULL UNIQUE
- `company_id` BIGINT UNSIGNED NULL     -- Allows tenant-isolated backups if split
- `backup_type` VARCHAR(40) NOT NULL    -- 'full', 'schema', 'data_only'
- `storage_file_id` BIGINT UNSIGNED NULL -- Links back to media_files for retrieval
- `file_name` VARCHAR(255) NULL
- `size_bytes` BIGINT UNSIGNED NULL
- `backup_status` VARCHAR(40) NOT NULL  -- 'running', 'completed', 'failed'
- `started_at` DATETIME NULL
- `finished_at` DATETIME NULL
- `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

<br>

### `database_migration_runs`
> Detailed execution logs for migrations beyond the simple `system_migrations` checklist.

- `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT
- `public_id` CHAR(26) NOT NULL UNIQUE
- `module_key` VARCHAR(80) NOT NULL
- `migration_id` VARCHAR(128) NOT NULL
- `run_status` VARCHAR(40) NOT NULL
- `log_text` LONGTEXT NULL
- `started_at` DATETIME NULL
- `finished_at` DATETIME NULL
- `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

---

## 8. Audit And Support

### `audit_logs`
> Immutable ledger of critical actions performed by users or the system.

- `id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT
- `public_id` CHAR(26) NOT NULL UNIQUE
- `company_id` BIGINT UNSIGNED NULL
- `actor_id` BIGINT UNSIGNED NULL       -- The user triggering the event
- `entity_type` VARCHAR(80) NOT NULL    -- e.g., 'sales_invoice', 'auth_user'
- `entity_id` BIGINT UNSIGNED NULL      -- The record that was mutated
- `action_key` VARCHAR(120) NOT NULL    -- 'create', 'update', 'delete', 'login'
- `payload_json` JSON NULL              -- Snapshot of changes/data
- `ip_address` VARCHAR(64) NULL         -- Origin constraint tracing
- `user_agent` TEXT NULL                -- Device metadata
- `occurred_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP