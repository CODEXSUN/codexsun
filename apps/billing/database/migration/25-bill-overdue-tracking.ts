import type { Kysely } from "kysely"

import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { billingTableNames } from "../table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

export const billingBillOverdueTrackingMigration = defineDatabaseMigration({
  id: "billing:vouchers:25-bill-overdue-tracking",
  appId: "billing",
  moduleKey: "bill-overdue-tracking",
  name: "Create billing bill overdue tracking table",
  order: 250,
  up: async ({ database }) => {
    await asQueryDatabase(database).schema
      .createTable(billingTableNames.billOverdueTracking)
      .ifNotExists()
      .addColumn("overdue_id", "varchar(191)", (col) => col.primaryKey())
      .addColumn("bill_ref_id", "varchar(191)", (col) => col.notNull().unique())
      .addColumn("ref_number", "varchar(191)", (col) => col.notNull())
      .addColumn("party_ledger_id", "varchar(191)", (col) => col.notNull())
      .addColumn("party_ledger_name", "varchar(191)", (col) => col.notNull())
      .addColumn("direction", "varchar(10)", (col) => col.notNull())
      .addColumn("voucher_id", "varchar(191)", (col) => col.notNull())
      .addColumn("voucher_number", "varchar(191)", (col) => col.notNull())
      .addColumn("voucher_type", "varchar(40)", (col) => col.notNull())
      .addColumn("ref_date", "varchar(40)", (col) => col.notNull())
      .addColumn("due_date", "varchar(40)")
      .addColumn("overdue_days", "integer", (col) => col.notNull().defaultTo(0))
      .addColumn("overdue_amount", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("bucket_key", "varchar(20)", (col) => col.notNull().defaultTo("current"))
      .addColumn("bucket_label", "varchar(40)", (col) => col.notNull().defaultTo("Current"))
      .addColumn("penalty_rate", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("penalty_amount", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("last_reminder_at", "varchar(40)")
      .addColumn("status", "varchar(20)", (col) => col.notNull().defaultTo("current"))
      .addColumn("financial_year_code", "varchar(40)", (col) => col.notNull())
      .addColumn("created_at", "varchar(40)", (col) => col.notNull())
      .addColumn("updated_at", "varchar(40)", (col) => col.notNull())
      .execute()
  },
})
