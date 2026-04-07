import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { asQueryDatabase } from "../../src/data/query-database.js"

import { cxappTableNames } from "../table-names.js"

export const coreAuthHardeningMigration = defineDatabaseMigration({
  id: "cxapp:auth:15-auth-hardening",
  appId: "cxapp",
  moduleKey: "auth",
  name: "Add auth lockout and hardening columns",
  order: 150,
  up: async ({ database }) => {
    const queryDatabase = asQueryDatabase(database)

    const usersTable = await queryDatabase.introspection.getTables()
    const authUsers = usersTable.find((table) => table.name === cxappTableNames.authUsers)
    const existingColumns = new Set(authUsers?.columns.map((column) => column.name) ?? [])

    if (!existingColumns.has("failed_login_count")) {
      await queryDatabase.schema
        .alterTable(cxappTableNames.authUsers)
        .addColumn("failed_login_count", "integer", (column) => column.notNull().defaultTo(0))
        .execute()
    }

    if (!existingColumns.has("last_failed_login_at")) {
      await queryDatabase.schema
        .alterTable(cxappTableNames.authUsers)
        .addColumn("last_failed_login_at", "varchar(40)")
        .execute()
    }

    if (!existingColumns.has("locked_until")) {
      await queryDatabase.schema
        .alterTable(cxappTableNames.authUsers)
        .addColumn("locked_until", "varchar(40)")
        .execute()
    }
  },
})
