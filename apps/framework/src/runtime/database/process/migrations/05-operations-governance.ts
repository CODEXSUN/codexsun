import type { Kysely } from "kysely"

import { frameworkOperationsTableNames } from "../../../operations/operations-table-names.js"
import { defineDatabaseMigration } from "../types.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

export const frameworkOperationsGovernanceMigration = defineDatabaseMigration({
  id: "framework:runtime:05-operations-governance",
  appId: "framework",
  moduleKey: "operations-governance",
  name: "Create framework backup and security review tables",
  order: 50,
  up: async ({ database }) => {
    const queryDatabase = asQueryDatabase(database)

    await queryDatabase.schema
      .createTable(frameworkOperationsTableNames.databaseBackups)
      .ifNotExists()
      .addColumn("id", "varchar(191)", (column) => column.primaryKey())
      .addColumn("file_name", "varchar(255)", (column) => column.notNull())
      .addColumn("file_path", "varchar(500)", (column) => column.notNull())
      .addColumn("driver", "varchar(20)", (column) => column.notNull())
      .addColumn("status", "varchar(30)", (column) => column.notNull())
      .addColumn("trigger_kind", "varchar(30)", (column) => column.notNull())
      .addColumn("storage_target", "varchar(30)", (column) => column.notNull())
      .addColumn("google_drive_sync_status", "varchar(30)", (column) => column.notNull())
      .addColumn("google_drive_file_id", "varchar(255)")
      .addColumn("size_bytes", "bigint", (column) => column.notNull())
      .addColumn("checksum", "varchar(191)")
      .addColumn("summary", "text")
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("completed_at", "varchar(40)")
      .execute()

    await queryDatabase.schema
      .createTable(frameworkOperationsTableNames.databaseRestoreRuns)
      .ifNotExists()
      .addColumn("id", "varchar(191)", (column) => column.primaryKey())
      .addColumn("backup_id", "varchar(191)", (column) => column.notNull())
      .addColumn("mode", "varchar(20)", (column) => column.notNull())
      .addColumn("status", "varchar(30)", (column) => column.notNull())
      .addColumn("summary", "text")
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("completed_at", "varchar(40)")
      .execute()

    await queryDatabase.schema
      .createTable(frameworkOperationsTableNames.securityReviewItems)
      .ifNotExists()
      .addColumn("id", "varchar(191)", (column) => column.primaryKey())
      .addColumn("section", "varchar(120)", (column) => column.notNull())
      .addColumn("control_key", "varchar(120)", (column) => column.notNull())
      .addColumn("title", "varchar(255)", (column) => column.notNull())
      .addColumn("description", "text", (column) => column.notNull())
      .addColumn("status", "varchar(30)", (column) => column.notNull())
      .addColumn("evidence", "text")
      .addColumn("notes", "text")
      .addColumn("reviewed_by", "varchar(191)")
      .addColumn("reviewed_at", "varchar(40)")
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .execute()

    await queryDatabase.schema
      .createTable(frameworkOperationsTableNames.securityReviewRuns)
      .ifNotExists()
      .addColumn("id", "varchar(191)", (column) => column.primaryKey())
      .addColumn("overall_status", "varchar(30)", (column) => column.notNull())
      .addColumn("summary", "text", (column) => column.notNull())
      .addColumn("reviewed_by", "varchar(191)")
      .addColumn("reviewed_at", "varchar(40)", (column) => column.notNull())
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .execute()
  },
})
