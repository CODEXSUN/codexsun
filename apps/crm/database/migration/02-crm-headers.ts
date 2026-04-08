import type { Kysely } from "kysely"

import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { crmTableNames } from "../table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

export const crmHeadersMigration = defineDatabaseMigration({
  id: "crm:foundation:02-crm-headers",
  appId: "crm",
  moduleKey: "foundation",
  name: "Create CRM normalized header index tables",
  order: 20,
  up: async ({ database }) => {
    const db = asQueryDatabase(database)

    // Lead headers — indexed for pipeline dashboard sorting
    await db.schema
      .createTable(crmTableNames.leadHeaders)
      .ifNotExists()
      .addColumn("lead_id", "varchar(191)", (col) => col.primaryKey())
      .addColumn("company_name", "varchar(255)", (col) => col.notNull())
      .addColumn("contact_name", "varchar(255)", (col) => col.notNull())
      .addColumn("email", "varchar(255)")
      .addColumn("phone", "varchar(80)")
      .addColumn("source", "varchar(100)")
      // Status: Cold | Warm | Qualified | Converted | Lost
      .addColumn("status", "varchar(64)", (col) => col.notNull().defaultTo("Cold"))
      .addColumn("owner_id", "varchar(191)")
      .addColumn("deleted_at", "varchar(40)")
      .addColumn("created_at", "varchar(40)", (col) => col.notNull())
      .addColumn("updated_at", "varchar(40)", (col) => col.notNull())
      .execute()

    // Interaction headers — indexed per lead, drives task orchestration
    await db.schema
      .createTable(crmTableNames.interactionHeaders)
      .ifNotExists()
      .addColumn("interaction_id", "varchar(191)", (col) => col.primaryKey())
      .addColumn("lead_id", "varchar(191)", (col) => col.notNull())
      // Type: Cold Call | Email | Meeting | Reply
      .addColumn("type", "varchar(64)", (col) => col.notNull())
      .addColumn("summary", "text")
      .addColumn("sentiment", "varchar(40)")
      // When true, task engine will auto-instantiate a follow-up task
      .addColumn("requires_followup", "integer", (col) => col.notNull().defaultTo(0))
      .addColumn("linked_task_id", "varchar(191)")
      .addColumn("interaction_date", "varchar(40)", (col) => col.notNull())
      .addColumn("created_at", "varchar(40)", (col) => col.notNull())
      .execute()
  },
})
