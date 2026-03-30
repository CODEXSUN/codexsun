import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { asQueryDatabase } from "../../src/data/query-database.js"

import { coreTableNames } from "../table-names.js"

export const coreAuthSessionsMigration = defineDatabaseMigration({
  id: "core:auth:06-auth-sessions",
  appId: "core",
  moduleKey: "auth",
  name: "Create auth session and verification tables",
  order: 60,
  up: async ({ database }) => {
    const queryDatabase = asQueryDatabase(database)

    await queryDatabase.schema
      .createTable(coreTableNames.authSessions)
      .ifNotExists()
      .addColumn("id", "varchar(191)", (column) => column.primaryKey())
      .addColumn("user_id", "varchar(191)", (column) => column.notNull())
      .addColumn("token_id", "varchar(191)", (column) => column.notNull().unique())
      .addColumn("actor_type", "varchar(32)", (column) => column.notNull())
      .addColumn("ip_address", "varchar(64)")
      .addColumn("user_agent", "text")
      .addColumn("expires_at", "varchar(40)", (column) => column.notNull())
      .addColumn("last_seen_at", "varchar(40)")
      .addColumn("revoked_at", "varchar(40)")
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .addForeignKeyConstraint(
        "auth_sessions_user_fk",
        ["user_id"],
        coreTableNames.authUsers,
        ["id"]
      )
      .execute()

    await queryDatabase.schema
      .createTable(coreTableNames.authContactVerifications)
      .ifNotExists()
      .addColumn("id", "varchar(191)", (column) => column.primaryKey())
      .addColumn("purpose", "varchar(64)", (column) => column.notNull())
      .addColumn("actor_type", "varchar(32)", (column) => column.notNull())
      .addColumn("channel", "varchar(32)", (column) => column.notNull())
      .addColumn("destination", "varchar(255)", (column) => column.notNull())
      .addColumn("otp_hash", "varchar(255)", (column) => column.notNull())
      .addColumn("expires_at", "varchar(40)", (column) => column.notNull())
      .addColumn("verified_at", "varchar(40)")
      .addColumn("consumed_at", "varchar(40)")
      .addColumn("attempted_count", "integer", (column) =>
        column.notNull().defaultTo(0)
      )
      .addColumn("is_active", "integer", (column) => column.notNull().defaultTo(1))
      .addColumn("metadata", "text")
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .execute()
  },
})
