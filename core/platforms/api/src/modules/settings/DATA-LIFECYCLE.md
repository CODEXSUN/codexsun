# Platform Settings Data Lifecycle

Migration: `settings.001`

Seeder: `settings.seed.001`

Compatibility: additive. The first migration creates one table and index.

Rollback: remove the module only before external clients depend on this route. Do not drop setting records during an application rollback.

Backup: include `platform_settings` in the selected Platform database backup.
