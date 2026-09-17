# Data Lifecycle

## Storage roles

MariaDB stores deployed shared application data. SQLite supports local, test, desktop, or isolated application data where a module requires it.

Kysely is the typed SQL access layer. A module repository owns its queries and does not expose database-driver objects.

## Schema ownership

Each module owns its tables, migrations, seeders, data compatibility rules, and rollback notes. One module must not alter another module's tables.

Store migrations and seeders in the owner module folder. Record migration order and applied version in the platform database-management module.

## Tenant decision gate

Select the tenant isolation model before a module stores tenant data. The selection must define tenant identity, database strategy, migration scope, backup scope, and authorization checks.

Do not add tenant fields, schemas, or data access until the model is documented in a decision record.

## Backup and recovery

Each deployment profile must define backup frequency, retention, encryption, recovery owner, and restore verification.

Test restore procedures with non-production data before production use. A backup is not verified until a restore succeeds.

## Required checks

1. Run module migrations on a clean database and an upgrade database.
2. Run module seeders twice and verify safe repeat behavior.
3. Verify repository access cannot cross module or tenant boundaries.
4. Record data compatibility and rollback risks in the changelog.
