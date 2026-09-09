import { sql } from 'kysely'
import type { ZetroMigration } from '../../infrastructure/zetro-database.js'

export const developerToolsMigrations: readonly ZetroMigration[] = [
  {
    checksum: 'developer-tools-001-settings-v1',
    id: '001-create-settings',
    async up(database, driver) {
      const text = driver === 'mariadb' ? 'varchar(191)' : 'text'
      const document = driver === 'mariadb' ? 'longtext' : 'text'
      await sql
        .raw(
          `
        create table zetro_developer_tool_settings (
          scope_key ${text} primary key,
          updated_at ${text} not null,
          data ${document} not null
        )
      `,
        )
        .execute(database)
    },
  },
]
