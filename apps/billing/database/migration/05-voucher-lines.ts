import type { Kysely } from "kysely"

import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { billingTableNames } from "../table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

export const billingVoucherLinesMigration = defineDatabaseMigration({
  id: "billing:vouchers:05-voucher-lines",
  appId: "billing",
  moduleKey: "voucher-lines",
  name: "Create normalized billing voucher line table",
  order: 50,
  up: async ({ database }) => {
    await asQueryDatabase(database).schema
      .createTable(billingTableNames.voucherLines)
      .ifNotExists()
      .addColumn("line_id", "varchar(191)", (column) => column.primaryKey())
      .addColumn("voucher_id", "varchar(191)", (column) => column.notNull())
      .addColumn("voucher_number", "varchar(191)", (column) => column.notNull())
      .addColumn("voucher_status", "varchar(40)", (column) => column.notNull())
      .addColumn("voucher_type", "varchar(40)", (column) => column.notNull())
      .addColumn("voucher_date", "varchar(40)", (column) => column.notNull())
      .addColumn("line_order", "integer", (column) => column.notNull())
      .addColumn("ledger_id", "varchar(191)", (column) => column.notNull())
      .addColumn("ledger_name", "varchar(191)", (column) => column.notNull())
      .addColumn("side", "varchar(10)", (column) => column.notNull())
      .addColumn("amount", "real", (column) => column.notNull())
      .addColumn("note", "text", (column) => column.notNull())
      .addColumn("counterparty", "varchar(191)", (column) => column.notNull())
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .execute()
  },
})
