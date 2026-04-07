import type { Kysely } from "kysely"

import { frameworkActivityLogTableNames } from "../../../activity-log/activity-log-table-names.js"
import { defineDatabaseMigration } from "../types.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

export const frameworkActivityLogMigration = defineDatabaseMigration({
  id: "framework:runtime:03-activity-log",
  appId: "framework",
  moduleKey: "activity-log",
  name: "Create framework activity log table",
  order: 30,
  up: async ({ database }) => {
    await asQueryDatabase(database).schema
      .createTable(frameworkActivityLogTableNames.auditLogs)
      .ifNotExists()
      .addColumn("id", "varchar(191)", (column) => column.primaryKey())
      .addColumn("category", "varchar(100)", (column) => column.notNull())
      .addColumn("action", "varchar(191)", (column) => column.notNull())
      .addColumn("level", "varchar(20)", (column) => column.notNull())
      .addColumn("message", "text", (column) => column.notNull())
      .addColumn("actor_id", "varchar(191)")
      .addColumn("actor_email", "varchar(191)")
      .addColumn("actor_type", "varchar(100)")
      .addColumn("request_id", "varchar(191)")
      .addColumn("route_path", "varchar(255)")
      .addColumn("context_json", "text")
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .execute()
  },
})
