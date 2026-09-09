import { sql } from 'kysely'
import type { ZetroMigration } from '../../infrastructure/zetro-database.js'

export const projectsMigrations: readonly ZetroMigration[] = [
  {
    checksum: 'projects-001-record-storage-v1',
    id: '001-create-projects',
    async up(database, driver) {
      const text = driver === 'mariadb' ? 'varchar(191)' : 'text'
      const document = driver === 'mariadb' ? 'longtext' : 'text'
      await sql
        .raw(
          `
        create table zetro_projects (
          id ${text} primary key,
          archived integer not null,
          created_at ${text} not null,
          updated_at ${text} not null,
          data ${document} not null
        )
      `,
        )
        .execute(database)
    },
  },
]
