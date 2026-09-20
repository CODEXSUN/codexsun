# Q Cafe Foundation Data Lifecycle

## Ownership

- Module ID: `qcafe.foundation`
- Local application database: `QCAFE_SQLITE_PATH`
- Local identity database: `QCAFE_IDENTITY_DATABASE_PATH`
- Shared database: the MariaDB database selected by the repository `DB_*`
  settings

The Foundation module owns all tables with the `qcafe_` prefix that its
migrations create. Identity tables remain owned by Platform Identity.

## Ordered Migrations

| Order | Migration ID           | Purpose                                      |
| ----: | ---------------------- | -------------------------------------------- |
|     1 | `qcafe.foundation.001` | Create the Foundation compatibility metadata |
|     2 | `qcafe.foundation.002` | Create business and location setup records   |
|     3 | `qcafe.foundation.003` | Create Foundation activity audit records    |

## Ordered Seeders

| Order | Seeder ID                   | Purpose                                 |
| ----: | --------------------------- | --------------------------------------- |
|     1 | `qcafe.foundation.seed.001` | Record the Foundation readiness default |

The migrations are additive. The seeder is repeat-safe and runs after all
migrations. Platform Core records each descriptor's SHA-256 checksum, serial
position, timestamps, and run count.

## Compatibility And Rollback

SQLite and MariaDB use the same Kysely repository contracts and migration IDs.
Changing `DB_DRIVER` changes the active store; it does not synchronize records.
Rollback is manual because the migrations create durable business records.
Back up the selected database before destructive schema changes.

## Verification

Run the Q Cafe database smoke command before application tests. It initializes
both configured stores and executes a read query. A production deployment must
also use its normal backup and restore verification procedure.
