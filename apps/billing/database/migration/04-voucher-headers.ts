import type { Kysely } from "kysely"

import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { billingTableNames } from "../table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

export const billingVoucherHeadersMigration = defineDatabaseMigration({
  id: "billing:vouchers:04-voucher-headers",
  appId: "billing",
  moduleKey: "voucher-headers",
  name: "Create normalized billing voucher header table",
  order: 40,
  up: async ({ database }) => {
    await asQueryDatabase(database).schema
      .createTable(billingTableNames.voucherHeaders)
      .ifNotExists()
      .addColumn("voucher_id", "varchar(191)", (column) => column.primaryKey())
      .addColumn("voucher_number", "varchar(191)", (column) => column.notNull())
      .addColumn("status", "varchar(40)", (column) => column.notNull())
      .addColumn("type", "varchar(40)", (column) => column.notNull())
      .addColumn("date", "varchar(40)", (column) => column.notNull())
      .addColumn("counterparty", "varchar(191)", (column) => column.notNull())
      .addColumn("narration", "text", (column) => column.notNull())
      .addColumn("financial_year_code", "varchar(40)", (column) => column.notNull())
      .addColumn("financial_year_label", "varchar(80)", (column) => column.notNull())
      .addColumn("financial_year_start_date", "varchar(40)", (column) => column.notNull())
      .addColumn("financial_year_end_date", "varchar(40)", (column) => column.notNull())
      .addColumn("financial_year_sequence_number", "integer", (column) => column.notNull())
      .addColumn("financial_year_prefix", "varchar(40)", (column) => column.notNull())
      .addColumn("total_debit", "real", (column) => column.notNull())
      .addColumn("total_credit", "real", (column) => column.notNull())
      .addColumn("line_count", "integer", (column) => column.notNull())
      .addColumn("bill_allocation_count", "integer", (column) => column.notNull())
      .addColumn("has_gst", "integer", (column) => column.notNull().defaultTo(0))
      .addColumn("has_sales_invoice", "integer", (column) => column.notNull().defaultTo(0))
      .addColumn("reversal_of_voucher_id", "varchar(191)")
      .addColumn("reversal_of_voucher_number", "varchar(191)")
      .addColumn("reversed_by_voucher_id", "varchar(191)")
      .addColumn("reversed_by_voucher_number", "varchar(191)")
      .addColumn("reversed_at", "varchar(40)")
      .addColumn("reversal_reason", "text")
      .addColumn("source_voucher_id", "varchar(191)")
      .addColumn("source_voucher_number", "varchar(191)")
      .addColumn("source_voucher_type", "varchar(40)")
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .addColumn("created_by_user_id", "varchar(191)")
      .execute()
  },
})
