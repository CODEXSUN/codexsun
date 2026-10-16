# Database Migration Runbook

## Purpose

Use this runbook for CODEXSUN database changes that affect platform or tenant schemas.

## Before Creating A Migration

- Confirm the owning app or module.
- Write the database change as a tracked migration, not a manual production edit.
- Prefer expand/migrate/contract for destructive or risky changes.
- Record affected tables, expected runtime, risk level, and validation SQL in the migration notes.

## Local Restored-Dump Test

1. Create or download a recent safe dump.
2. Restore it into local platform and tenant databases.
3. Set the local `.env` database names to the restored databases.
4. Run `npm run db:migrations:preflight`.
5. Run `CODEXSUN_RESTORED_DUMP_TEST=1 npm run db:migrations:test-local`.
6. Run affected API and app tests.
7. Compare row counts, important totals, and schema snapshots.

## Production Preflight

Production migration preflight requires a verified pre-migration backup:

```text
CODEXSUN_VERIFIED_BACKUP_ID=<backup-run-id>
npm run db:migrations:preflight
```

Do not continue if backup freshness, restore status, tenant targets, or rollback notes are missing.

## Running Migrations

Run migrations through the stable command:

```text
npm run db:migrations:run
```

All Platform, tenant-runtime, Core, Billing, and Mail migrations in this
baseline are release batch `1`. The shared `migration_schema` ledger
records the scope, batch, integer step version, SHA-256 checksum, status,
operator, timestamps, and failure text. Applied checksums are immutable:
change the schema through a new versioned step instead of editing an applied
step.

The runner holds a database advisory lock and processes a bounded number of
steps at a time. Reruns skip only checksum-validated applied steps. A failed
step remains visible in the ledger, and automatically reversible steps from
the current attempt are rolled back in reverse order.

Database naming is part of the ownership boundary:

- Platform master tables are unprefixed. Never add `app_` to master tables.
- `app_` is reserved for tenant-database framework/runtime tables.
- `core_` for Core-owned tables.
- `billing_` for Billing-owned tables.
- `crm_` for CRM-owned tables.
- `mail_` for Mail-owned tables.

The migration ledger is always `migration_schema`, regardless of database
owner. The runner adopts the legacy `app_migration_batches` ledger by an
in-place rename. Platform master tables that were incorrectly given `app_`
are also restored by in-place rename. Migration fails closed when both a
legacy and target name exist; reconcile the rows explicitly instead of
allowing an implicit merge.

List the checksum ledger with:

```text
npm run db:migrations:list
```

Run a guarded rollback with:

```text
npm run db:migrations:rollback
```

Production also requires
`CODEXSUN_MIGRATION_ROLLBACK_CONFIRM=ROLLBACK`. A baseline step without a
declared safe `down` refuses rollback and requires the verified backup or a
new corrective forward migration. The command never silently drops a table or
column.

## Consolidated Lifecycle Order

Framework and UI are database-free infrastructure packages. They do not own migrations or seeders.

Database installation, migration, seeding, tenant setup, and tenant reinstall use one deterministic order for every registered tenant database:

1. Platform master module migrations.
2. Platform master module seeders.
3. Tenant runtime migrations: module settings, users, roles, permissions, user roles, and role permissions.
4. Core leaf migrations in dependency order: Common lookups, Organisation, then Master modules.
5. Project Manager registry, Ecommerce, CRM, Frappe, Auditor, and Zetro migrations.
6. Billing migrations before LogicX ERP schemes, followed by Accounts, Mail, Task Manager, and Blog migrations.
7. Tenant runtime seeders for users, roles, and tenant module settings. Known app settings are reconciled to the tenant registry, including disabling an app removed from the enabled set.
8. Core leaf seeders in dependency order.
9. Enabled app seeders in their composition order. These install defaults and permission grants only for apps enabled for that tenant; Blog defaults follow Task Manager. App schema presence does not activate an app.

All module SQL and seed behavior remains in the owning module's `*.migration.ts` and `*.seed.ts` files. Database composition roots only order and record those module-owned lifecycle functions. Repeatable seeders are additive: they insert missing defaults but do not reset tenant passwords, module JSON, or edited lookup labels.

`npm run db:migrate` runs migrations without application seeders. `npm run db:seed` ensures migrations and then runs seeders. Tenant setup and reinstall preserve existing data, run every installed tenant-app migration first, then run enabled app seeders repeatably. Accounts activation uses `accounts.overview`; the older `accounts.accounting` key resolves to it during tenant access and seeding, then normalizes on tenant update.

Q Cafe currently runs as a separate SQLite service with its own database path and PIN login. Its local migration files are outside the shared tenant MariaDB lifecycle. Multi-tenant mode keeps its tenant activation off, including when a legacy tenant or plan contains `qcafe`. Give it a tenant-aware storage and authentication contract before operating multiple tenants on one Q Cafe service.

For a local full lifecycle check against a disposable database, run `tsx tools/e2e/all-tenant-apps-upgrade.e2e.ts --fresh`. Pass a tenant SQL dump path instead of `--fresh` to restore it into a uniquely named sandbox and check migration, existing row retention, and repeat seeding. The test leaves the sandbox database for inspection.

For production, run during the approved release window and keep logs with the release record.

## Failure Handling

- Stop the rollout.
- Preserve logs and failed migration status.
- Do not edit an already-applied migration.
- Add a corrective forward migration unless the approved rollback plan says otherwise.
- Re-run preflight before retrying.
- Run `npm run test:migration-contract` to validate owner prefixes, standard
  columns, destructive-DDL exclusions, checksum mutation, and reversible
  prefix planning.
