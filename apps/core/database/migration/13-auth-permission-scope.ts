import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { asQueryDatabase } from "../../src/data/query-database.js"

import { coreTableNames } from "../table-names.js"

export const coreAuthPermissionScopeMigration = defineDatabaseMigration({
  id: "core:auth:13-auth-permission-scope",
  appId: "core",
  moduleKey: "auth",
  name: "Add scope metadata to auth permissions",
  order: 130,
  up: async ({ database }) => {
    const queryDatabase = asQueryDatabase(database)

    await queryDatabase.schema
      .alterTable(coreTableNames.authPermissions)
      .addColumn("scope_type", "varchar(32)", (column) => column.notNull().defaultTo("module"))
      .execute()

    await queryDatabase.schema
      .alterTable(coreTableNames.authPermissions)
      .addColumn("app_id", "varchar(120)")
      .execute()

    await queryDatabase.schema
      .alterTable(coreTableNames.authPermissions)
      .addColumn("resource_key", "varchar(191)", (column) => column.notNull().defaultTo("permission"))
      .execute()

    await queryDatabase.schema
      .alterTable(coreTableNames.authPermissions)
      .addColumn("action_key", "varchar(64)", (column) => column.notNull().defaultTo("view"))
      .execute()

    await queryDatabase.schema
      .alterTable(coreTableNames.authPermissions)
      .addColumn("route", "varchar(255)")
      .execute()
  },
})
