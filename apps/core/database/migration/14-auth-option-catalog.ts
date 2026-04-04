import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { asQueryDatabase } from "../../src/data/query-database.js"

import { coreTableNames } from "../table-names.js"

export const coreAuthOptionCatalogMigration = defineDatabaseMigration({
  id: "core:auth:14-auth-option-catalog",
  appId: "core",
  moduleKey: "auth",
  name: "Create auth option catalog table",
  order: 140,
  up: async ({ database }) => {
    const queryDatabase = asQueryDatabase(database)

    await queryDatabase.schema
      .createTable(coreTableNames.authOptionCatalog)
      .ifNotExists()
      .addColumn("id", "varchar(191)", (column) => column.primaryKey())
      .addColumn("category", "varchar(64)", (column) => column.notNull())
      .addColumn("option_key", "varchar(191)", (column) => column.notNull())
      .addColumn("label", "varchar(255)", (column) => column.notNull())
      .addColumn("summary", "text")
      .addColumn("app_id", "varchar(120)")
      .addColumn("route", "varchar(255)")
      .addColumn("scope_type", "varchar(64)")
      .addColumn("is_active", "integer", (column) => column.notNull().defaultTo(1))
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .addUniqueConstraint("auth_option_catalog_category_key_scope_unique", [
        "category",
        "option_key",
        "app_id",
        "scope_type",
      ])
      .execute()
  },
})
