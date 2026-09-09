import { sql } from 'kysely'
import type { ZetroMigration } from '../../infrastructure/zetro-database.js'

export const chatMigrations: readonly ZetroMigration[] = [
  {
    checksum: 'chat-001-conversation-storage-v1',
    id: '001-create-conversations',
    async up(database, driver) {
      const text = driver === 'mariadb' ? 'varchar(191)' : 'text'
      const document = driver === 'mariadb' ? 'longtext' : 'text'
      await sql
        .raw(
          `
        create table zetro_chat_conversations (
          id ${text} primary key,
          project_id ${text} not null,
          archived_at ${text} null,
          pinned integer not null,
          updated_at ${text} not null,
          data ${document} not null
        )
      `,
        )
        .execute(database)
      await sql
        .raw(
          'create index zetro_chat_project_updated on zetro_chat_conversations (project_id, updated_at)',
        )
        .execute(database)
    },
  },
]
