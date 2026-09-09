import { sql } from 'kysely'
import type { ZetroMigration } from '../../infrastructure/zetro-database.js'

export const operationsMigrations: readonly ZetroMigration[] = [
  {
    checksum: 'operations-001-settings-metrics-v1',
    id: '001-create-operations',
    async up(database, driver) {
      const text = driver === 'mariadb' ? 'varchar(191)' : 'text'
      const document = driver === 'mariadb' ? 'longtext' : 'text'
      await sql
        .raw(
          `
        create table zetro_operations_settings (
          scope_key ${text} primary key,
          updated_at ${text} not null,
          data ${document} not null
        )
      `,
        )
        .execute(database)
      await sql
        .raw(
          `
        create table zetro_connected_app_metrics (
          id ${text} primary key,
          app_id ${text} not null,
          observed_at ${text} not null,
          received_at ${text} not null,
          data ${document} not null
        )
      `,
        )
        .execute(database)
      await sql
        .raw(
          'create index zetro_metrics_app_observed on zetro_connected_app_metrics (app_id, observed_at)',
        )
        .execute(database)
    },
  },
]
