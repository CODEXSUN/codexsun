import type { ColumnType } from 'kysely'

export interface ProjectTable {
  archived: ColumnType<number, number, number>
  created_at: string
  data: string
  id: string
  updated_at: string
}

export interface ProjectsDatabase {
  zetro_projects: ProjectTable
}
