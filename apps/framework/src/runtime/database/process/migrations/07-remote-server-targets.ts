import type { Kysely } from "kysely"

import { frameworkOperationsTableNames } from "../../../operations/operations-table-names.js"
import { defineDatabaseMigration } from "../types.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

export const frameworkRemoteServerTargetsMigration = defineDatabaseMigration({
  id: "framework:runtime:07-remote-server-targets",
  appId: "framework",
  moduleKey: "operations-governance",
  name: "Create framework remote server target table",
  order: 70,
  up: async ({ database }) => {
    await asQueryDatabase(database).schema
      .createTable(frameworkOperationsTableNames.remoteServerTargets)
      .ifNotExists()
      .addColumn("id", "varchar(191)", (column) => column.primaryKey())
      .addColumn("name", "varchar(191)", (column) => column.notNull())
      .addColumn("base_url", "varchar(500)", (column) => column.notNull())
      .addColumn("description", "text")
      .addColumn("is_active", "integer", (column) => column.notNull().defaultTo(1))
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .addColumn("created_by", "varchar(191)")
      .addColumn("updated_by", "varchar(191)")
      .execute()
  },
})
