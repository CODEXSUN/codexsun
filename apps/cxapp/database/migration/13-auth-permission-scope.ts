import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { asQueryDatabase } from "../../src/data/query-database.js"

import { cxappTableNames } from "../table-names.js"

export const coreAuthPermissionScopeMigration = defineDatabaseMigration({
  id: "cxapp:auth:13-auth-permission-scope",
  appId: "cxapp",
  moduleKey: "auth",
  name: "Add scope metadata to auth permissions",
  order: 130,
  up: async ({ database }) => {
    const queryDatabase = asQueryDatabase(database)

    await queryDatabase.schema
      .alterTable(cxappTableNames.authPermissions)
      .addColumn("scope_type", "varchar(32)", (column) => column.notNull().defaultTo("module"))
      .execute()

    await queryDatabase.schema
      .alterTable(cxappTableNames.authPermissions)
      .addColumn("app_id", "varchar(120)")
      .execute()

    await queryDatabase.schema
      .alterTable(cxappTableNames.authPermissions)
      .addColumn("resource_key", "varchar(191)", (column) => column.notNull().defaultTo("permission"))
      .execute()

    await queryDatabase.schema
      .alterTable(cxappTableNames.authPermissions)
      .addColumn("action_key", "varchar(64)", (column) => column.notNull().defaultTo("view"))
      .execute()

    await queryDatabase.schema
      .alterTable(cxappTableNames.authPermissions)
      .addColumn("route", "varchar(255)")
      .execute()
  },
})
