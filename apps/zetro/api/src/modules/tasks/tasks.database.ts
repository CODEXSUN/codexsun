import type { ColumnType } from 'kysely'

export interface TaskTable {
  archived: ColumnType<number, number, number>
  data: string
  id: string
  pinned: ColumnType<number, number, number>
  project_id: string
  updated_at: string
}

export interface TasksDatabase {
  zetro_tasks: TaskTable
}
