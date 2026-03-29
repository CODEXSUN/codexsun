export type DatabaseFoundationTable = {
  key: string
  name: string
  purpose: string
}

export type DatabaseFoundationSection = {
  key: string
  order: number
  name: string
  purpose: string
  tables: DatabaseFoundationTable[]
}
