import type { ColumnType } from 'kysely'

export interface ConversationTable {
  archived_at: string | null
  data: string
  id: string
  pinned: ColumnType<number, number, number>
  project_id: string
  updated_at: string
}

export interface ChatDatabase {
  zetro_chat_conversations: ConversationTable
}
