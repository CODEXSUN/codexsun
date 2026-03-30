import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { asQueryDatabase } from "../../src/data/query-database.js"

import { coreTableNames } from "../table-names.js"

export const coreAuthFoundationMigration = defineDatabaseMigration({
  id: "core:auth:05-auth-foundation",
  appId: "core",
  moduleKey: "auth",
  name: "Create auth users, roles, and permissions tables",
  order: 50,
  up: async ({ database }) => {
    const queryDatabase = asQueryDatabase(database)

    await queryDatabase.schema
      .createTable(coreTableNames.authPermissions)
      .ifNotExists()
      .addColumn("id", "varchar(191)", (column) => column.primaryKey())
      .addColumn("permission_key", "varchar(191)", (column) => column.notNull().unique())
      .addColumn("name", "varchar(255)", (column) => column.notNull())
      .addColumn("summary", "text", (column) => column.notNull())
      .addColumn("is_active", "integer", (column) => column.notNull().defaultTo(1))
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .execute()

    await queryDatabase.schema
      .createTable(coreTableNames.authRoles)
      .ifNotExists()
      .addColumn("id", "varchar(191)", (column) => column.primaryKey())
      .addColumn("role_key", "varchar(191)", (column) => column.notNull().unique())
      .addColumn("name", "varchar(255)", (column) => column.notNull())
      .addColumn("summary", "text", (column) => column.notNull())
      .addColumn("actor_type", "varchar(32)", (column) => column.notNull())
      .addColumn("is_active", "integer", (column) => column.notNull().defaultTo(1))
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .execute()

    await queryDatabase.schema
      .createTable(coreTableNames.authUsers)
      .ifNotExists()
      .addColumn("id", "varchar(191)", (column) => column.primaryKey())
      .addColumn("email", "varchar(255)", (column) => column.notNull().unique())
      .addColumn("phone_number", "varchar(32)")
      .addColumn("display_name", "varchar(255)", (column) => column.notNull())
      .addColumn("actor_type", "varchar(32)", (column) => column.notNull())
      .addColumn("password_hash", "varchar(255)", (column) => column.notNull())
      .addColumn("avatar_url", "text")
      .addColumn("organization_name", "varchar(255)")
      .addColumn("is_super_admin", "integer", (column) =>
        column.notNull().defaultTo(0)
      )
      .addColumn("is_active", "integer", (column) => column.notNull().defaultTo(1))
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .execute()

    await queryDatabase.schema
      .createTable(coreTableNames.authUserRoles)
      .ifNotExists()
      .addColumn("id", "varchar(191)", (column) => column.primaryKey())
      .addColumn("user_id", "varchar(191)", (column) => column.notNull())
      .addColumn("role_id", "varchar(191)", (column) => column.notNull())
      .addColumn("is_active", "integer", (column) => column.notNull().defaultTo(1))
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .addUniqueConstraint("auth_user_roles_user_role_unique", [
        "user_id",
        "role_id",
      ])
      .addForeignKeyConstraint(
        "auth_user_roles_user_fk",
        ["user_id"],
        coreTableNames.authUsers,
        ["id"]
      )
      .addForeignKeyConstraint(
        "auth_user_roles_role_fk",
        ["role_id"],
        coreTableNames.authRoles,
        ["id"]
      )
      .execute()

    await queryDatabase.schema
      .createTable(coreTableNames.authRolePermissions)
      .ifNotExists()
      .addColumn("id", "varchar(191)", (column) => column.primaryKey())
      .addColumn("role_id", "varchar(191)", (column) => column.notNull())
      .addColumn("permission_id", "varchar(191)", (column) => column.notNull())
      .addColumn("is_active", "integer", (column) => column.notNull().defaultTo(1))
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .addUniqueConstraint("auth_role_permissions_role_permission_unique", [
        "role_id",
        "permission_id",
      ])
      .addForeignKeyConstraint(
        "auth_role_permissions_role_fk",
        ["role_id"],
        coreTableNames.authRoles,
        ["id"]
      )
      .addForeignKeyConstraint(
        "auth_role_permissions_permission_fk",
        ["permission_id"],
        coreTableNames.authPermissions,
        ["id"]
      )
      .execute()
  },
})
