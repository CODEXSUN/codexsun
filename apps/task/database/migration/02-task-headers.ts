import type { Kysely } from "kysely"

import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { taskTableNames } from "../table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

export const taskHeadersMigration = defineDatabaseMigration({
  id: "task:foundation:02-task-headers",
  appId: "task",
  moduleKey: "foundation",
  name: "Create normalized task header index table",
  order: 20,
  up: async ({ database }) => {
    await asQueryDatabase(database).schema
      .createTable(taskTableNames.taskHeaders)
      .ifNotExists()
      .addColumn("task_id", "varchar(191)", (column) => column.primaryKey())
      .addColumn("title", "varchar(255)", (column) => column.notNull())
      .addColumn("board_id", "varchar(191)")
      .addColumn("board_stage_id", "varchar(191)")
      .addColumn("board_position", "real")
      .addColumn("status_key", "varchar(64)", (column) => column.notNull())
      .addColumn("priority", "varchar(40)", (column) => column.notNull())
      .addColumn("visibility", "varchar(40)", (column) => column.notNull())
      .addColumn("creator_user_id", "varchar(191)", (column) => column.notNull())
      .addColumn("assignee_user_id", "varchar(191)")
      .addColumn("entity_type", "varchar(120)")
      .addColumn("entity_id", "varchar(191)")
      .addColumn("due_at", "varchar(40)")
      .addColumn("started_at", "varchar(40)")
      .addColumn("completed_at", "varchar(40)")
      .addColumn("deleted_at", "varchar(40)")
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .execute()
  },
})
