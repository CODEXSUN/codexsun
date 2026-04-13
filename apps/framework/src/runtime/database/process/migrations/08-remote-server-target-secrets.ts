import type { Kysely } from "kysely"

import { defineDatabaseMigration } from "../types.js"
import { frameworkOperationsTableNames } from "../../../operations/operations-table-names.js"

async function addColumnIfMissing(
  database: Kysely<unknown>,
  tableName: string,
  columnName: string,
  columnType: "varchar(255)" | "varchar(40)"
) {
  try {
    await database.schema
      .alterTable(tableName)
      .addColumn(columnName, columnType)
      .execute()
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code).toLowerCase()
        : ""

    if (
      message.includes("duplicate column") ||
      message.includes("duplicate column name") ||
      message.includes("already exists") ||
      code === "sqlite_error"
    ) {
      return
    }

    throw error
  }
}

export const frameworkRemoteServerTargetSecretsMigration = defineDatabaseMigration({
  id: "framework:runtime:08-remote-server-target-secrets",
  appId: "framework",
  moduleKey: "operations-governance",
  name: "Add per-server monitor secret and confirmation columns",
  order: 80,
  up: async ({ database }) => {
    await addColumnIfMissing(
      database,
      frameworkOperationsTableNames.remoteServerTargets,
      "monitor_secret",
      "varchar(255)"
    )
    await addColumnIfMissing(
      database,
      frameworkOperationsTableNames.remoteServerTargets,
      "confirmed_at",
      "varchar(40)"
    )
  },
})
