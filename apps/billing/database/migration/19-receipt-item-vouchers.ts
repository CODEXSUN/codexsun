import type { Kysely } from "kysely"

import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { billingTableNames } from "../table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

export const billingReceiptItemVouchersMigration = defineDatabaseMigration({
  id: "billing:vouchers:19-receipt-item-vouchers",
  appId: "billing",
  moduleKey: "receipt-item-vouchers",
  name: "Create billing receipt item voucher detail table",
  order: 190,
  up: async ({ database }) => {
    await asQueryDatabase(database).schema
      .createTable(billingTableNames.receiptItemVouchers)
      .ifNotExists()
      .addColumn("item_id", "varchar(191)", (col) => col.primaryKey())
      .addColumn("voucher_id", "varchar(191)", (col) => col.notNull())
      .addColumn("voucher_number", "varchar(191)", (col) => col.notNull())
      .addColumn("voucher_date", "varchar(40)", (col) => col.notNull())
      .addColumn("financial_year_code", "varchar(40)", (col) => col.notNull())
      .addColumn("line_order", "integer", (col) => col.notNull())
      .addColumn("reference_type", "varchar(40)", (col) => col.notNull())
      .addColumn("reference_number", "varchar(191)", (col) => col.notNull())
      .addColumn("reference_date", "varchar(40)")
      .addColumn("due_date", "varchar(40)")
      .addColumn("original_amount", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("allocated_amount", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("balance_amount", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("note", "text", (col) => col.notNull().defaultTo(""))
      .addColumn("created_at", "varchar(40)", (col) => col.notNull())
      .addColumn("updated_at", "varchar(40)", (col) => col.notNull())
      .execute()
  },
})
