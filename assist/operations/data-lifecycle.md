# Data Lifecycle

## Storage roles

MariaDB stores deployed shared application data. SQLite supports local, test, desktop, or isolated application data where a module requires it.

Kysely is the typed SQL access layer. A module repository owns its queries and does not expose database-driver objects.

The Framework supplies driver-neutral repository, transaction, unit-of-work, and migration contracts. Platform Data providers implement these contracts. A module must not depend on a concrete database driver.

Platform Core owns the Kysely transaction adapter. A future dialect provider
creates the Kysely connection, then passes it to the adapter. This keeps
SQLite and MariaDB selection outside the Framework and module business logic.

For local tests and isolated runtime data, use the Platform SQLite factory with
an explicit database filename. It requires Node `node:sqlite` support. The
factory enables foreign-key checks, WAL mode, and a 5-second busy timeout.

SQLite support does not authorize a module schema. A module still owns its
migration, seeder, compatibility record, and rollback notes.

For deployed shared data, use the Platform MariaDB factory with the validated
root `DATABASE_URL`. It accepts a `mysql://` URL with a host and database name.
Do not put connection credentials in code, tests, or documentation. Creating a
pool does not prove live connectivity. Verify a selected deployment with a
dedicated MariaDB integration check.

## Schema ownership

Each module owns its tables, migrations, seeders, data compatibility rules, and rollback notes. One module must not alter another module's tables.

Store migrations and seeders in the owner module folder. Record migration order and applied version in the platform database-management module.

## Lifecycle records

Every data-owning module must keep a lifecycle record. The record lists the
module ID, ordered migrations, repeat-safe seeders, compatibility summary, and
rollback limit. Use the [data lifecycle record template](../templates/data-lifecycle-record.md).

`ModuleDataLifecyclePolicy` rejects missing IDs, duplicate migration or seeder
IDs, cross-module ownership, and incomplete compatibility records before a
module is accepted into a deployment plan.

## Migration and seeding rules

1. Run a migration on a clean database before it is released.
2. Run it on an upgrade database before it is released.
3. Run each seeder twice and verify repeat-safe behavior.
4. Record destructive changes as a coordinated release with a manual rollback limit.
5. Do not change an applied migration. Add a new migration instead.

## Tenant decision gate

Select the tenant isolation model before a module stores tenant data. The selection must define tenant identity, database strategy, migration scope, backup scope, and authorization checks.

Do not add tenant fields, schemas, or data access until the model is documented in a decision record.

## Backup and recovery

Each deployment profile must define backup frequency, retention, encryption, recovery owner, and restore verification.

Test restore procedures with non-production data before production use. A backup is not verified until a restore succeeds.

Before a production migration, capture the current migration state and complete
a database backup. After migration, verify the selected module data and record
the result. A deployment profile must name the backup owner, retention period,
restore owner, and restore verification date.

## Required checks

1. Run module migrations on a clean database and an upgrade database.
2. Run module seeders twice and verify safe repeat behavior.
3. Verify repository access cannot cross module or tenant boundaries.
4. Record data compatibility and rollback risks in the changelog.
