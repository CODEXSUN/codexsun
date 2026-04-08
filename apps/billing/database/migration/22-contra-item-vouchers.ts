import type { Kysely } from "kysely"

import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { billingTableNames } from "../table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

export const billingContraItemVouchersMigration = defineDatabaseMigration({
  id: "billing:vouchers:22-contra-item-vouchers",
  appId: "billing",
  moduleKey: "contra-item-vouchers",
  name: "Create billing contra item voucher detail table",
  order: 220,
  up: async ({ database }) => {
    await asQueryDatabase(database).schema
      .createTable(billingTableNames.contraItemVouchers)
      .ifNotExists()
      .addColumn("item_id", "varchar(191)", (col) => col.primaryKey())
      .addColumn("voucher_id", "varchar(191)", (col) => col.notNull())
      .addColumn("voucher_number", "varchar(191)", (col) => col.notNull())
      .addColumn("voucher_date", "varchar(40)", (col) => col.notNull())
      .addColumn("financial_year_code", "varchar(40)", (col) => col.notNull())
      .addColumn("line_order", "integer", (col) => col.notNull())
      .addColumn("ledger_id", "varchar(191)", (col) => col.notNull())
      .addColumn("ledger_name", "varchar(191)", (col) => col.notNull())
      .addColumn("account_type", "varchar(20)", (col) => col.notNull())
      .addColumn("side", "varchar(10)", (col) => col.notNull())
      .addColumn("amount", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("instrument_type", "varchar(40)")
      .addColumn("instrument_number", "varchar(191)")
      .addColumn("instrument_date", "varchar(40)")
      .addColumn("note", "text", (col) => col.notNull().defaultTo(""))
      .addColumn("created_at", "varchar(40)", (col) => col.notNull())
      .addColumn("updated_at", "varchar(40)", (col) => col.notNull())
      .execute()
  },
})
