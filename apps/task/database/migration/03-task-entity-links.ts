import type { Kysely } from "kysely"

import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { taskTableNames } from "../table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

export const taskEntityLinksMigration = defineDatabaseMigration({
  id: "task:foundation:03-task-entity-links",
  appId: "task",
  moduleKey: "foundation",
  name: "Create task entity links pivot table",
  order: 30,
  up: async ({ database }) => {
    await asQueryDatabase(database).schema
      .createTable(taskTableNames.taskEntityLinks)
      .ifNotExists()
      .addColumn("link_id", "varchar(191)", (column) => column.primaryKey())
      .addColumn("task_id", "varchar(191)", (column) => column.notNull())
      .addColumn("entity_type", "varchar(120)", (column) => column.notNull())
      .addColumn("entity_id", "varchar(191)", (column) => column.notNull())
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .execute()
  },
})
