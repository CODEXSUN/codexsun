import type { Kysely } from "kysely"

import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { taskTableNames } from "../table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

export const taskPerformanceMetricsMigration = defineDatabaseMigration({
  id: "task:foundation:04-task-performance-metrics",
  appId: "task",
  moduleKey: "foundation",
  name: "Create task performance metrics table",
  order: 40,
  up: async ({ database }) => {
    await asQueryDatabase(database).schema
      .createTable(taskTableNames.taskPerformanceMetrics)
      .ifNotExists()
      .addColumn("metric_id", "varchar(191)", (column) => column.primaryKey())
      .addColumn("user_id", "varchar(191)", (column) => column.notNull())
      .addColumn("task_id", "varchar(191)", (column) => column.notNull())
      .addColumn("routine_id", "varchar(191)")
      .addColumn("assignment_date", "varchar(40)", (column) => column.notNull())
      .addColumn("time_to_completion_seconds", "integer")
      .addColumn("overdue_by_seconds", "integer")
      .addColumn("checkpoints_passed", "integer", (column) => column.notNull().defaultTo(0))
      .addColumn("checkpoints_failed", "integer", (column) => column.notNull().defaultTo(0))
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .execute()
  },
})
