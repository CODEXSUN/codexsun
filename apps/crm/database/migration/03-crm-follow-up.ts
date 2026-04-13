import type { Kysely } from "kysely"

import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { crmTableNames } from "../table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

export const crmFollowUpMigration = defineDatabaseMigration({
  id: "crm:foundation:03-crm-follow-up",
  appId: "crm",
  moduleKey: "foundation",
  name: "Create CRM follow-up task, reminder, and audit tables",
  order: 30,
  up: async ({ database }) => {
    const db = asQueryDatabase(database)

    await db.schema
      .createTable(crmTableNames.followUpTasks)
      .ifNotExists()
      .addColumn("crm_task_id", "varchar(191)", (col) => col.primaryKey())
      .addColumn("lead_id", "varchar(191)", (col) => col.notNull())
      .addColumn("interaction_id", "varchar(191)")
      .addColumn("title", "varchar(255)", (col) => col.notNull())
      .addColumn("description", "text")
      .addColumn("status", "varchar(64)", (col) => col.notNull().defaultTo("open"))
      .addColumn("priority", "varchar(32)", (col) => col.notNull().defaultTo("medium"))
      .addColumn("source_type", "varchar(64)", (col) => col.notNull().defaultTo("interaction_followup"))
      .addColumn("assignee_user_id", "varchar(191)")
      .addColumn("assignee_name", "varchar(255)")
      .addColumn("created_by_user_id", "varchar(191)", (col) => col.notNull())
      .addColumn("due_at", "varchar(40)")
      .addColumn("completed_at", "varchar(40)")
      .addColumn("revoked_at", "varchar(40)")
      .addColumn("closed_note", "text")
      .addColumn("created_at", "varchar(40)", (col) => col.notNull())
      .addColumn("updated_at", "varchar(40)", (col) => col.notNull())
      .execute()

    await db.schema
      .createTable(crmTableNames.reminders)
      .ifNotExists()
      .addColumn("reminder_id", "varchar(191)", (col) => col.primaryKey())
      .addColumn("crm_task_id", "varchar(191)", (col) => col.notNull())
      .addColumn("lead_id", "varchar(191)", (col) => col.notNull())
      .addColumn("status", "varchar(64)", (col) => col.notNull().defaultTo("pending"))
      .addColumn("remind_at", "varchar(40)", (col) => col.notNull())
      .addColumn("snoozed_until", "varchar(40)")
      .addColumn("completed_at", "varchar(40)")
      .addColumn("revoked_at", "varchar(40)")
      .addColumn("note", "text")
      .addColumn("created_at", "varchar(40)", (col) => col.notNull())
      .addColumn("updated_at", "varchar(40)", (col) => col.notNull())
      .execute()

    await db.schema
      .createTable(crmTableNames.auditEvents)
      .ifNotExists()
      .addColumn("audit_event_id", "varchar(191)", (col) => col.primaryKey())
      .addColumn("entity_type", "varchar(64)", (col) => col.notNull())
      .addColumn("entity_id", "varchar(191)", (col) => col.notNull())
      .addColumn("lead_id", "varchar(191)")
      .addColumn("interaction_id", "varchar(191)")
      .addColumn("crm_task_id", "varchar(191)")
      .addColumn("reminder_id", "varchar(191)")
      .addColumn("action", "varchar(100)", (col) => col.notNull())
      .addColumn("actor_user_id", "varchar(191)")
      .addColumn("actor_display_name", "varchar(255)")
      .addColumn("summary", "text")
      .addColumn("metadata_json", "text")
      .addColumn("created_at", "varchar(40)", (col) => col.notNull())
      .execute()
  },
})
