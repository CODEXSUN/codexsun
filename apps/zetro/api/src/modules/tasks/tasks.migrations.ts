import { sql } from 'kysely'
import type { ZetroMigration } from '../../infrastructure/zetro-database.js'

export const tasksMigrations: readonly ZetroMigration[] = [
  {
    checksum: 'tasks-001-record-storage-v1',
    id: '001-create-tasks',
    async up(database, driver) {
      const text = driver === 'mariadb' ? 'varchar(191)' : 'text'
      const document = driver === 'mariadb' ? 'longtext' : 'text'
      await sql
        .raw(
          `
        create table zetro_tasks (
          id ${text} primary key,
          project_id ${text} not null,
          archived integer not null,
          pinned integer not null,
          updated_at ${text} not null,
          data ${document} not null
        )
      `,
        )
        .execute(database)
      await sql
        .raw('create index zetro_tasks_project_updated on zetro_tasks (project_id, updated_at)')
        .execute(database)
    },
  },
]
