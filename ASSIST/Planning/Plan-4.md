# Database Table Structure And Fields

## Purpose

This is the first database file for the platform foundation.

It is focused on framework-agnostic tables only:

1. system control
2. company foundation
3. company customization
4. auth and user control
5. media and storage
6. deployment and update management
7. database manager and migrator
8. operational audit

Product tables such as catalog, customer, and transactions belong in the next file after this foundation is stable.

## Migration Organization Rule

When implementing this plan in code:

1. split schema contracts by ordered section under `apps/framework/src/runtime/database/schema/sections`
2. split migrations by module and ordered section under `apps/framework/src/runtime/database/migrations/modules/<module>/sections`
3. keep major tables or stable logical table groups in their own ordered file or section file
4. do not append unrelated tables into one giant migration file
5. keep registry files small and use them only to compose ordered section files
6. test migration execution with SQLite before claiming the migration batch is ready

## Foundation Direction

Build the platform database in layers.

Layer order:

1. system and runtime control
2. companies as client root
3. auth and access control
4. media and storage
5. deployment and update operations
6. database management
7. audit and support operations

This keeps the platform reusable for website, storefront, ecommerce, billing, desktop, and future client-specific surfaces.

## Naming Rules

Use:

1. `snake_case`
2. plural table names
3. clear module ownership
4. stable prefixes only when they improve meaning

Recommended examples:

1. `companies`
2. `companies_settings`
3. `companies_features`
4. `auth_users`
5. `media_files`
6. `storage_disks`
7. `deployment_targets`
8. `database_backups`

## Common Field Standards

### Main Table Fields

Use these on most foundation tables:

1. `id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT`
2. `public_id CHAR(26) NOT NULL UNIQUE`
3. `code VARCHAR(64) NULL`
4. `name VARCHAR(255) NOT NULL`
5. `status VARCHAR(40) NOT NULL DEFAULT 'active'`
6. `sort_order INT NOT NULL DEFAULT 0`
7. `is_active TINYINT(1) NOT NULL DEFAULT 1`
8. `meta_json JSON NULL`
9. `created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`
10. `updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
11. `deleted_at DATETIME NULL`
12. `created_by BIGINT UNSIGNED NULL`
13. `updated_by BIGINT UNSIGNED NULL`

### Setting Table Fields

Use these for per-company or per-system settings:

1. `id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT`
2. `owner_id BIGINT UNSIGNED NOT NULL`
3. `scope_key VARCHAR(80) NOT NULL`
4. `setting_key VARCHAR(120) NOT NULL`
5. `value_type VARCHAR(40) NOT NULL`
6. `value_text TEXT NULL`
7. `value_json JSON NULL`
8. `is_secret TINYINT(1) NOT NULL DEFAULT 0`
9. `is_public TINYINT(1) NOT NULL DEFAULT 0`
10. `updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`

### Feature Toggle Fields

Use these for client feature enablement:

1. `id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT`
2. `company_id BIGINT UNSIGNED NOT NULL`
3. `surface_key VARCHAR(80) NOT NULL`
4. `feature_key VARCHAR(120) NOT NULL`
5. `is_enabled TINYINT(1) NOT NULL DEFAULT 0`
6. `rollout_state VARCHAR(40) NOT NULL DEFAULT 'manual'`
7. `config_json JSON NULL`
8. `starts_at DATETIME NULL`
9. `ends_at DATETIME NULL`
10. `created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`
11. `updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`

### Asset Table Fields

Use these for logo, favicon, loader, and icon mappings:

1. `id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT`
2. `company_id BIGINT UNSIGNED NOT NULL`
3. `profile_id BIGINT UNSIGNED NULL`
4. `surface_key VARCHAR(80) NOT NULL`
5. `asset_key VARCHAR(120) NOT NULL`
6. `media_file_id BIGINT UNSIGNED NULL`
7. `fallback_path VARCHAR(500) NULL`
8. `alt_text VARCHAR(255) NULL`
9. `width_px INT NULL`
10. `height_px INT NULL`
11. `format VARCHAR(40) NULL`
12. `sort_order INT NOT NULL DEFAULT 0`
13. `is_active TINYINT(1) NOT NULL DEFAULT 1`
14. `created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`
15. `updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`

## First-To-Last Table Order

### 1. System And Runtime Tables

Purpose:

1. migration tracking
2. seed tracking
3. system settings
4. runtime jobs and locks

Recommended tables:

1. `system_migrations`
2. `system_seeders`
3. `system_settings`
4. `system_jobs`
5. `system_job_locks`

Recommended fields:

`system_migrations`

1. `id VARCHAR(128) PRIMARY KEY`
2. `name VARCHAR(255) NOT NULL`
3. `module_key VARCHAR(80) NOT NULL`
4. `applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`

`system_seeders`

1. `id VARCHAR(128) PRIMARY KEY`
2. `name VARCHAR(255) NOT NULL`
3. `applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`

`system_settings`

1. `id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT`
2. `scope_key VARCHAR(80) NOT NULL`
3. `setting_key VARCHAR(120) NOT NULL`
4. `value_type VARCHAR(40) NOT NULL`
5. `value_text TEXT NULL`
6. `value_json JSON NULL`
7. `is_secret TINYINT(1) NOT NULL DEFAULT 0`
8. `updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`

### 2. Companies As Client Root

Purpose:

1. every company is a client root
2. every company can run multiple surfaces
3. every company can be customized without touching platform core code

Recommended tables:

1. `companies`
2. `companies_branches`
3. `companies_addresses`
4. `companies_emails`
5. `companies_phones`
6. `companies_bank_accounts`
7. `companies_domains`
8. `companies_surfaces`

Recommended fields:

`companies`

1. `id`
2. `public_id`
3. `code VARCHAR(64) NOT NULL UNIQUE`
4. `name VARCHAR(255) NOT NULL`
5. `legal_name VARCHAR(255) NULL`
6. `slug VARCHAR(255) NULL UNIQUE`
7. `tax_identifier VARCHAR(80) NULL`
8. `registration_identifier VARCHAR(120) NULL`
9. `currency_code VARCHAR(12) NULL`
10. `timezone VARCHAR(80) NULL`
11. `default_locale VARCHAR(20) NULL`
12. `country_code VARCHAR(12) NULL`
13. `status VARCHAR(40) NOT NULL DEFAULT 'active'`
14. `meta_json JSON NULL`
15. audit fields

`companies_surfaces`

1. `id`
2. `public_id`
3. `company_id BIGINT UNSIGNED NOT NULL`
4. `surface_key VARCHAR(80) NOT NULL`
5. `display_name VARCHAR(255) NOT NULL`
6. `is_enabled TINYINT(1) NOT NULL DEFAULT 0`
7. `is_public TINYINT(1) NOT NULL DEFAULT 0`
8. `default_route VARCHAR(255) NULL`
9. `theme_key VARCHAR(80) NULL`
10. `default_locale VARCHAR(20) NULL`
11. `sort_order INT NOT NULL DEFAULT 0`
12. `created_at`
13. `updated_at`

`companies_domains`

1. `id`
2. `public_id`
3. `company_id BIGINT UNSIGNED NOT NULL`
4. `surface_key VARCHAR(80) NOT NULL`
5. `hostname VARCHAR(255) NOT NULL`
6. `base_url VARCHAR(500) NOT NULL`
7. `is_primary TINYINT(1) NOT NULL DEFAULT 0`
8. `ssl_mode VARCHAR(40) NOT NULL DEFAULT 'managed'`
9. `redirect_to_primary TINYINT(1) NOT NULL DEFAULT 1`
10. `created_at`
11. `updated_at`

### 3. Company Customization And Frontend Control Tables

Purpose:

1. client branding
2. client software toggles
3. client frontend identity
4. client desktop and electron assets

Recommended tables:

1. `companies_settings`
2. `companies_features`
3. `companies_profiles`
4. `companies_brand_assets`
5. `companies_social_links`

Recommended fields:

`companies_settings`

1. `id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT`
2. `company_id BIGINT UNSIGNED NOT NULL`
3. `scope_key VARCHAR(80) NOT NULL`
4. `setting_key VARCHAR(120) NOT NULL`
5. `value_type VARCHAR(40) NOT NULL`
6. `value_text TEXT NULL`
7. `value_json JSON NULL`
8. `is_secret TINYINT(1) NOT NULL DEFAULT 0`
9. `is_public TINYINT(1) NOT NULL DEFAULT 0`
10. `updated_by BIGINT UNSIGNED NULL`
11. `updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`

Use this table for:

1. per-client runtime settings
2. storefront text toggles
3. billing defaults
4. website layout choices
5. deployment preferences

`companies_features`

1. `id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT`
2. `company_id BIGINT UNSIGNED NOT NULL`
3. `surface_key VARCHAR(80) NOT NULL`
4. `feature_key VARCHAR(120) NOT NULL`
5. `is_enabled TINYINT(1) NOT NULL DEFAULT 0`
6. `rollout_state VARCHAR(40) NOT NULL DEFAULT 'manual'`
7. `config_json JSON NULL`
8. `starts_at DATETIME NULL`
9. `ends_at DATETIME NULL`
10. `created_at`
11. `updated_at`

Use this table for:

1. website
2. storefront
3. ecommerce admin
4. billing workspace
5. desktop mode
6. electron features

`companies_profiles`

1. `id`
2. `public_id`
3. `company_id BIGINT UNSIGNED NOT NULL`
4. `surface_key VARCHAR(80) NOT NULL`
5. `title VARCHAR(255) NULL`
6. `title_suffix VARCHAR(255) NULL`
7. `logo_text VARCHAR(255) NULL`
8. `tagline VARCHAR(255) NULL`
9. `short_bio TEXT NULL`
10. `about_text LONGTEXT NULL`
11. `support_email VARCHAR(255) NULL`
12. `support_phone VARCHAR(64) NULL`
13. `loader_text VARCHAR(255) NULL`
14. `theme_key VARCHAR(80) NULL`
15. `default_locale VARCHAR(20) NULL`
16. `meta_json JSON NULL`
17. `is_default TINYINT(1) NOT NULL DEFAULT 0`
18. `created_at`
19. `updated_at`

Use this table for:

1. brand title
2. subtitle
3. about page copy
4. software header text
5. client-facing storefront profile

`companies_brand_assets`

1. `id`
2. `public_id`
3. `company_id BIGINT UNSIGNED NOT NULL`
4. `profile_id BIGINT UNSIGNED NULL`
5. `surface_key VARCHAR(80) NOT NULL`
6. `asset_key VARCHAR(120) NOT NULL`
7. `media_file_id BIGINT UNSIGNED NULL`
8. `fallback_path VARCHAR(500) NULL`
9. `alt_text VARCHAR(255) NULL`
10. `width_px INT NULL`
11. `height_px INT NULL`
12. `format VARCHAR(40) NULL`
13. `sort_order INT NOT NULL DEFAULT 0`
14. `is_active TINYINT(1) NOT NULL DEFAULT 1`
15. `created_at`
16. `updated_at`

Use this table for:

1. logo light
2. logo dark
3. favicon
4. logo text image
5. global loader icon
6. splash image
7. electron app icon
8. tray icon
9. installer icon

`companies_social_links`

1. `id`
2. `public_id`
3. `company_id BIGINT UNSIGNED NOT NULL`
4. `surface_key VARCHAR(80) NULL`
5. `platform_key VARCHAR(80) NOT NULL`
6. `label VARCHAR(120) NULL`
7. `profile_url VARCHAR(500) NOT NULL`
8. `handle VARCHAR(120) NULL`
9. `icon_key VARCHAR(80) NULL`
10. `sort_order INT NOT NULL DEFAULT 0`
11. `is_active TINYINT(1) NOT NULL DEFAULT 1`
12. `created_at`
13. `updated_at`

### 4. Auth And User Control Tables

Purpose:

1. platform users
2. client-level memberships
3. roles and permissions
4. user control and security

Recommended tables:

1. `auth_users`
2. `auth_roles`
3. `auth_permissions`
4. `auth_role_permissions`
5. `company_memberships`
6. `company_membership_roles`
7. `auth_sessions`
8. `auth_api_tokens`
9. `auth_password_reset_tokens`
10. `auth_contact_verifications`
11. `auth_user_preferences`
12. `auth_access_logs`

Recommended fields:

`auth_users`

1. `id`
2. `public_id`
3. `email VARCHAR(255) NULL UNIQUE`
4. `phone VARCHAR(32) NULL UNIQUE`
5. `password_hash VARCHAR(255) NOT NULL`
6. `display_name VARCHAR(255) NOT NULL`
7. `avatar_media_file_id BIGINT UNSIGNED NULL`
8. `status VARCHAR(40) NOT NULL DEFAULT 'active'`
9. `last_login_at DATETIME NULL`
10. audit fields

`company_memberships`

1. `id`
2. `public_id`
3. `company_id BIGINT UNSIGNED NOT NULL`
4. `user_id BIGINT UNSIGNED NOT NULL`
5. `actor_type VARCHAR(40) NOT NULL`
6. `membership_status VARCHAR(40) NOT NULL DEFAULT 'active'`
7. `is_owner TINYINT(1) NOT NULL DEFAULT 0`
8. `joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`
9. `created_at`
10. `updated_at`

`auth_user_preferences`

1. `id`
2. `public_id`
3. `user_id BIGINT UNSIGNED NOT NULL`
4. `company_id BIGINT UNSIGNED NULL`
5. `surface_key VARCHAR(80) NULL`
6. `theme_key VARCHAR(80) NULL`
7. `locale VARCHAR(20) NULL`
8. `timezone VARCHAR(80) NULL`
9. `preferences_json JSON NULL`
10. `updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`

### 5. Media And Storage Tables

Purpose:

1. shared file metadata
2. storage target control
3. file usage and versioning

Recommended tables:

1. `storage_disks`
2. `storage_roots`
3. `media_folders`
4. `media_files`
5. `media_versions`
6. `media_tags`
7. `media_tag_map`
8. `media_usage`

Recommended fields:

`storage_disks`

1. `id`
2. `public_id`
3. `code VARCHAR(64) NOT NULL UNIQUE`
4. `name VARCHAR(255) NOT NULL`
5. `driver_key VARCHAR(40) NOT NULL`
6. `visibility VARCHAR(20) NOT NULL`
7. `base_path VARCHAR(500) NULL`
8. `base_url VARCHAR(500) NULL`
9. `config_json JSON NULL`
10. `is_active TINYINT(1) NOT NULL DEFAULT 1`
11. `created_at`
12. `updated_at`

`media_files`

1. `id`
2. `public_id`
3. `disk_id BIGINT UNSIGNED NOT NULL`
4. `folder_id BIGINT UNSIGNED NULL`
5. `company_id BIGINT UNSIGNED NULL`
6. `file_name VARCHAR(255) NOT NULL`
7. `storage_path VARCHAR(500) NOT NULL`
8. `mime_type VARCHAR(120) NULL`
9. `extension VARCHAR(20) NULL`
10. `size_bytes BIGINT UNSIGNED NOT NULL DEFAULT 0`
11. `visibility VARCHAR(20) NOT NULL DEFAULT 'public'`
12. `checksum_sha256 VARCHAR(128) NULL`
13. audit fields

### 6. Deployment And Update Tables

Purpose:

1. deployment target control
2. release artifacts
3. update application via git
4. update application via zip

Recommended tables:

1. `deployment_targets`
2. `deployment_runs`
3. `release_artifacts`
4. `update_sources`
5. `update_git_runs`
6. `update_zip_packages`
7. `update_zip_runs`

Recommended fields:

`deployment_targets`

1. `id`
2. `public_id`
3. `company_id BIGINT UNSIGNED NULL`
4. `code VARCHAR(64) NOT NULL UNIQUE`
5. `name VARCHAR(255) NOT NULL`
6. `target_type VARCHAR(40) NOT NULL`
7. `base_path VARCHAR(500) NULL`
8. `base_url VARCHAR(500) NULL`
9. `runtime_mode VARCHAR(40) NULL`
10. `config_json JSON NULL`
11. `is_active TINYINT(1) NOT NULL DEFAULT 1`
12. `created_at`
13. `updated_at`

`update_sources`

1. `id`
2. `public_id`
3. `source_type VARCHAR(20) NOT NULL`
4. `source_name VARCHAR(255) NOT NULL`
5. `repository_url VARCHAR(500) NULL`
6. `branch_name VARCHAR(120) NULL`
7. `zip_file_media_id BIGINT UNSIGNED NULL`
8. `checksum_value VARCHAR(128) NULL`
9. `config_json JSON NULL`
10. `created_at`
11. `updated_at`

`update_git_runs`

1. `id`
2. `public_id`
3. `source_id BIGINT UNSIGNED NOT NULL`
4. `target_id BIGINT UNSIGNED NOT NULL`
5. `commit_hash VARCHAR(120) NULL`
6. `run_status VARCHAR(40) NOT NULL`
7. `log_text LONGTEXT NULL`
8. `started_at DATETIME NULL`
9. `finished_at DATETIME NULL`
10. `created_at`

`update_zip_runs`

1. `id`
2. `public_id`
3. `package_id BIGINT UNSIGNED NOT NULL`
4. `target_id BIGINT UNSIGNED NOT NULL`
5. `run_status VARCHAR(40) NOT NULL`
6. `extract_path VARCHAR(500) NULL`
7. `log_text LONGTEXT NULL`
8. `started_at DATETIME NULL`
9. `finished_at DATETIME NULL`
10. `created_at`

### 7. Database Manager And Migrator Tables

Purpose:

1. database backups
2. restore operations
3. maintenance operations
4. migration control

Recommended tables:

1. `database_backups`
2. `database_restore_runs`
3. `database_maintenance_runs`
4. `database_migration_runs`

Recommended fields:

`database_backups`

1. `id`
2. `public_id`
3. `company_id BIGINT UNSIGNED NULL`
4. `backup_type VARCHAR(40) NOT NULL`
5. `storage_file_id BIGINT UNSIGNED NULL`
6. `file_name VARCHAR(255) NULL`
7. `size_bytes BIGINT UNSIGNED NULL`
8. `backup_status VARCHAR(40) NOT NULL`
9. `started_at DATETIME NULL`
10. `finished_at DATETIME NULL`
11. `created_at`

`database_migration_runs`

1. `id`
2. `public_id`
3. `module_key VARCHAR(80) NOT NULL`
4. `migration_id VARCHAR(128) NOT NULL`
5. `run_status VARCHAR(40) NOT NULL`
6. `log_text LONGTEXT NULL`
7. `started_at DATETIME NULL`
8. `finished_at DATETIME NULL`
9. `created_at`

### 8. Audit And Support Tables

Purpose:

1. operational visibility
2. user control traceability
3. support-safe event history

Recommended tables:

1. `audit_logs`
2. `support_events`
3. `system_notifications`

Recommended fields:

`audit_logs`

1. `id`
2. `public_id`
3. `company_id BIGINT UNSIGNED NULL`
4. `actor_id BIGINT UNSIGNED NULL`
5. `entity_type VARCHAR(80) NOT NULL`
6. `entity_id BIGINT UNSIGNED NULL`
7. `action_key VARCHAR(120) NOT NULL`
8. `payload_json JSON NULL`
9. `ip_address VARCHAR(64) NULL`
10. `user_agent TEXT NULL`
11. `occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`

## Relationship Rules

1. `companies` is the main client root
2. `companies_settings` and `companies_features` extend client control without editing shared code
3. `companies_profiles`, `companies_brand_assets`, and `companies_social_links` drive frontend identity
4. `company_memberships` connects users to client companies
5. `media_files` stores reusable file metadata and connects to branding assets
6. deployment and database tables stay platform-level and should not carry app business logic

## Migration Sequence Rule

Apply migrations in this order:

1. system
2. companies
3. company customization
4. auth and memberships
5. media and storage
6. deployment and updates
7. database manager and migrator
8. audit and support

## Final Rule

The first database file is the platform foundation.

Every client company should be configurable through data, not through code edits.
