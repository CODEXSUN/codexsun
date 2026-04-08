import type { Kysely } from "kysely"

import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { billingTableNames } from "../table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

export const billingJournalItemVouchersMigration = defineDatabaseMigration({
  id: "billing:vouchers:21-journal-item-vouchers",
  appId: "billing",
  moduleKey: "journal-item-vouchers",
  name: "Create billing journal item voucher detail table",
  order: 210,
  up: async ({ database }) => {
    await asQueryDatabase(database).schema
      .createTable(billingTableNames.journalItemVouchers)
      .ifNotExists()
      .addColumn("item_id", "varchar(191)", (col) => col.primaryKey())
      .addColumn("voucher_id", "varchar(191)", (col) => col.notNull())
      .addColumn("voucher_number", "varchar(191)", (col) => col.notNull())
      .addColumn("voucher_date", "varchar(40)", (col) => col.notNull())
      .addColumn("financial_year_code", "varchar(40)", (col) => col.notNull())
      .addColumn("line_order", "integer", (col) => col.notNull())
      .addColumn("ledger_id", "varchar(191)", (col) => col.notNull())
      .addColumn("ledger_name", "varchar(191)", (col) => col.notNull())
      .addColumn("ledger_group", "varchar(191)", (col) => col.notNull().defaultTo(""))
      .addColumn("side", "varchar(10)", (col) => col.notNull())
      .addColumn("amount", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("note", "text", (col) => col.notNull().defaultTo(""))
      .addColumn("dimension_branch", "varchar(191)")
      .addColumn("dimension_project", "varchar(191)")
      .addColumn("dimension_cost_center", "varchar(191)")
      .addColumn("created_at", "varchar(40)", (col) => col.notNull())
      .addColumn("updated_at", "varchar(40)", (col) => col.notNull())
      .execute()
  },
})
