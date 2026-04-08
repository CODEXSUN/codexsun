import type { Kysely } from "kysely"

import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { billingTableNames } from "../table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

export const billingBillSettlementsMigration = defineDatabaseMigration({
  id: "billing:vouchers:24-bill-settlements",
  appId: "billing",
  moduleKey: "bill-settlements",
  name: "Create billing bill settlement ledger table",
  order: 240,
  up: async ({ database }) => {
    await asQueryDatabase(database).schema
      .createTable(billingTableNames.billSettlements)
      .ifNotExists()
      .addColumn("settlement_id", "varchar(191)", (col) => col.primaryKey())
      .addColumn("bill_ref_id", "varchar(191)", (col) => col.notNull())
      .addColumn("ref_number", "varchar(191)", (col) => col.notNull())
      .addColumn("party_ledger_id", "varchar(191)", (col) => col.notNull())
      .addColumn("party_ledger_name", "varchar(191)", (col) => col.notNull())
      .addColumn("direction", "varchar(10)", (col) => col.notNull())
      .addColumn("settlement_voucher_id", "varchar(191)", (col) => col.notNull())
      .addColumn("settlement_voucher_number", "varchar(191)", (col) => col.notNull())
      .addColumn("settlement_voucher_type", "varchar(40)", (col) => col.notNull())
      .addColumn("settlement_date", "varchar(40)", (col) => col.notNull())
      .addColumn("settlement_type", "varchar(20)", (col) => col.notNull())
      .addColumn("settlement_amount", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("discount_amount", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("write_off_amount", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("balance_before", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("balance_after", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("against_advance_ref_id", "varchar(191)")
      .addColumn("financial_year_code", "varchar(40)", (col) => col.notNull())
      .addColumn("narration", "text", (col) => col.notNull().defaultTo(""))
      .addColumn("created_at", "varchar(40)", (col) => col.notNull())
      .addColumn("updated_at", "varchar(40)", (col) => col.notNull())
      .execute()
  },
})
