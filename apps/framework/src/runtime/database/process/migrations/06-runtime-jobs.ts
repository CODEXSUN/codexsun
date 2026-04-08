import type { Kysely } from "kysely"

import { runtimeJobTableNames } from "../../../jobs/runtime-job-table-names.js"
import { defineDatabaseMigration } from "../types.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

export const frameworkRuntimeJobsMigration = defineDatabaseMigration({
  id: "framework:runtime:06-runtime-jobs",
  appId: "framework",
  moduleKey: "runtime-jobs",
  name: "Create runtime background job and lock tables",
  order: 60,
  up: async ({ database }) => {
    const queryDatabase = asQueryDatabase(database)

    await queryDatabase.schema
      .createTable(runtimeJobTableNames.jobs)
      .ifNotExists()
      .addColumn("id", "varchar(191)", (column) => column.primaryKey())
      .addColumn("queue_name", "varchar(80)", (column) => column.notNull())
      .addColumn("handler_key", "varchar(120)", (column) => column.notNull())
      .addColumn("app_id", "varchar(80)", (column) => column.notNull())
      .addColumn("module_key", "varchar(120)", (column) => column.notNull())
      .addColumn("dedupe_key", "varchar(255)")
      .addColumn("payload_json", "text", (column) => column.notNull())
      .addColumn("status", "varchar(30)", (column) => column.notNull())
      .addColumn("attempts", "integer", (column) => column.notNull().defaultTo(0))
      .addColumn("max_attempts", "integer", (column) => column.notNull().defaultTo(3))
      .addColumn("scheduled_at", "varchar(40)", (column) => column.notNull())
      .addColumn("available_at", "varchar(40)", (column) => column.notNull())
      .addColumn("started_at", "varchar(40)")
      .addColumn("completed_at", "varchar(40)")
      .addColumn("failed_at", "varchar(40)")
      .addColumn("locked_by", "varchar(191)")
      .addColumn("locked_at", "varchar(40)")
      .addColumn("last_error", "text")
      .addColumn("result_summary", "text")
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .execute()

    await queryDatabase.schema
      .createIndex("system_jobs_status_available_idx")
      .ifNotExists()
      .on(runtimeJobTableNames.jobs)
      .columns(["status", "available_at"])
      .execute()

    await queryDatabase.schema
      .createIndex("system_jobs_handler_dedupe_idx")
      .ifNotExists()
      .on(runtimeJobTableNames.jobs)
      .columns(["handler_key", "dedupe_key", "status"])
      .execute()

    await queryDatabase.schema
      .createTable(runtimeJobTableNames.locks)
      .ifNotExists()
      .addColumn("lock_key", "varchar(191)", (column) => column.primaryKey())
      .addColumn("owner_id", "varchar(191)", (column) => column.notNull())
      .addColumn("expires_at", "varchar(40)", (column) => column.notNull())
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .execute()
  },
})
