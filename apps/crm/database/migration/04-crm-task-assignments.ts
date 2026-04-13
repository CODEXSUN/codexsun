import type { Kysely } from "kysely"

import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { crmTableNames } from "../table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

export const crmTaskAssignmentsMigration = defineDatabaseMigration({
  id: "crm:foundation:04-crm-task-assignments",
  appId: "crm",
  moduleKey: "foundation",
  name: "Create CRM task assignment history table",
  order: 40,
  up: async ({ database }) => {
    const db = asQueryDatabase(database)

    await db.schema
      .createTable(crmTableNames.taskAssignments)
      .ifNotExists()
      .addColumn("assignment_id", "varchar(191)", (col) => col.primaryKey())
      .addColumn("crm_task_id", "varchar(191)", (col) => col.notNull())
      .addColumn("lead_id", "varchar(191)", (col) => col.notNull())
      .addColumn("interaction_id", "varchar(191)")
      .addColumn("from_assignee_user_id", "varchar(191)")
      .addColumn("from_assignee_name", "varchar(255)")
      .addColumn("to_assignee_user_id", "varchar(191)")
      .addColumn("to_assignee_name", "varchar(255)")
      .addColumn("reason", "text")
      .addColumn("assigned_by_user_id", "varchar(191)")
      .addColumn("assigned_by_name", "varchar(255)")
      .addColumn("assigned_at", "varchar(40)", (col) => col.notNull())
      .execute()
  },
})
