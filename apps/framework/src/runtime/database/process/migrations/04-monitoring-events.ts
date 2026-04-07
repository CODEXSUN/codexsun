import type { Kysely } from "kysely"

import { frameworkMonitoringTableNames } from "../../../monitoring/monitoring-table-names.js"
import { defineDatabaseMigration } from "../types.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

export const frameworkMonitoringEventsMigration = defineDatabaseMigration({
  id: "framework:runtime:04-monitoring-events",
  appId: "framework",
  moduleKey: "monitoring",
  name: "Create framework monitoring events table",
  order: 40,
  up: async ({ database }) => {
    await asQueryDatabase(database).schema
      .createTable(frameworkMonitoringTableNames.monitoringEvents)
      .ifNotExists()
      .addColumn("id", "varchar(191)", (column) => column.primaryKey())
      .addColumn("source_app", "varchar(100)", (column) => column.notNull())
      .addColumn("operation", "varchar(40)", (column) => column.notNull())
      .addColumn("status", "varchar(20)", (column) => column.notNull())
      .addColumn("message", "text", (column) => column.notNull())
      .addColumn("request_id", "varchar(191)")
      .addColumn("route_path", "varchar(255)")
      .addColumn("reference_id", "varchar(191)")
      .addColumn("context_json", "text")
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .execute()
  },
})
