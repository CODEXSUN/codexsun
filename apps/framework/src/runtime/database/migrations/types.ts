export type DatabaseMigrationSection = {
  key: string
  order: number
  moduleKey: string
  schemaSectionKey: string
  name: string
  tableNames: string[]
}
