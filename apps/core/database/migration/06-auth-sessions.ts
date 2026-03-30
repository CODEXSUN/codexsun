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
      .addColumn("id", "text", (column) => column.primaryKey())
      .addColumn("user_id", "text", (column) => column.notNull())
      .addColumn("token_id", "text", (column) => column.notNull().unique())
      .addColumn("actor_type", "text", (column) => column.notNull())
      .addColumn("ip_address", "text")
      .addColumn("user_agent", "text")
      .addColumn("expires_at", "text", (column) => column.notNull())
      .addColumn("last_seen_at", "text")
      .addColumn("revoked_at", "text")
      .addColumn("created_at", "text", (column) => column.notNull())
      .addColumn("updated_at", "text", (column) => column.notNull())
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
      .addColumn("id", "text", (column) => column.primaryKey())
      .addColumn("purpose", "text", (column) => column.notNull())
      .addColumn("actor_type", "text", (column) => column.notNull())
      .addColumn("channel", "text", (column) => column.notNull())
      .addColumn("destination", "text", (column) => column.notNull())
      .addColumn("otp_hash", "text", (column) => column.notNull())
      .addColumn("expires_at", "text", (column) => column.notNull())
      .addColumn("verified_at", "text")
      .addColumn("consumed_at", "text")
      .addColumn("attempted_count", "integer", (column) =>
        column.notNull().defaultTo(0)
      )
      .addColumn("is_active", "integer", (column) => column.notNull().defaultTo(1))
      .addColumn("metadata", "text")
      .addColumn("created_at", "text", (column) => column.notNull())
      .addColumn("updated_at", "text", (column) => column.notNull())
      .execute()
  },
})
