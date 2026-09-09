import { sql } from 'kysely'
import type { ZetroMigration } from '../../infrastructure/zetro-database.js'

export const gitDeliveryMigrations: readonly ZetroMigration[] = [
  {
    checksum: 'git-delivery-001-settings-flows-v1',
    id: '001-create-settings-and-flows',
    async up(database, driver) {
      const text = driver === 'mariadb' ? 'varchar(191)' : 'text'
      const document = driver === 'mariadb' ? 'longtext' : 'text'
      await sql
        .raw(
          `
        create table zetro_git_delivery_settings (
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
        create table zetro_git_delivery_flows (
          id ${text} primary key,
          project_id ${text} not null,
          status ${text} not null,
          created_at ${text} not null,
          data ${document} not null
        )
      `,
        )
        .execute(database)
      await sql
        .raw(
          'create index zetro_delivery_project_created on zetro_git_delivery_flows (project_id, created_at)',
        )
        .execute(database)
    },
  },
]
