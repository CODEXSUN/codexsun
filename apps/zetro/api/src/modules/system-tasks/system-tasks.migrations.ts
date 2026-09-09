import { sql } from 'kysely'
import type { ZetroMigration } from '../../infrastructure/zetro-database.js'

export const systemTaskMigrations: readonly ZetroMigration[] = [
  {
    checksum: 'system-tasks-001-tasks-steps-v1',
    id: '001-create-system-tasks',
    async up(database, driver) {
      const text = driver === 'mariadb' ? 'varchar(191)' : 'text'
      const document = driver === 'mariadb' ? 'longtext' : 'text'
      await sql
        .raw(
          `
        create table zetro_system_tasks (
          id ${text} primary key,
          type ${text} not null,
          project_id ${text} null,
          status ${text} not null,
          created_at ${text} not null,
          updated_at ${text} not null,
          data ${document} not null
        )
      `,
        )
        .execute(database)
      await sql
        .raw(
          'create index zetro_system_tasks_status_created on zetro_system_tasks (status, created_at)',
        )
        .execute(database)
      await sql
        .raw(
          `
        create table zetro_system_task_steps (
          id ${text} primary key,
          task_id ${text} not null,
          completed_at ${text} not null,
          data ${document} not null
        )
      `,
        )
        .execute(database)
      await sql
        .raw(
          'create index zetro_system_task_steps_task on zetro_system_task_steps (task_id, completed_at)',
        )
        .execute(database)
    },
  },
]
