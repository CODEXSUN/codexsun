import type { Kysely } from "kysely"

import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { billingTableNames } from "../table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

export const billingBillReferencesMigration = defineDatabaseMigration({
  id: "billing:vouchers:23-bill-references",
  appId: "billing",
  moduleKey: "bill-references",
  name: "Create billing bill reference register table",
  order: 230,
  up: async ({ database }) => {
    await asQueryDatabase(database).schema
      .createTable(billingTableNames.billReferences)
      .ifNotExists()
      .addColumn("ref_id", "varchar(191)", (col) => col.primaryKey())
      .addColumn("ref_number", "varchar(191)", (col) => col.notNull())
      .addColumn("ref_date", "varchar(40)", (col) => col.notNull())
      .addColumn("due_date", "varchar(40)")
      .addColumn("party_ledger_id", "varchar(191)", (col) => col.notNull())
      .addColumn("party_ledger_name", "varchar(191)", (col) => col.notNull())
      .addColumn("direction", "varchar(10)", (col) => col.notNull())
      .addColumn("voucher_id", "varchar(191)", (col) => col.notNull())
      .addColumn("voucher_number", "varchar(191)", (col) => col.notNull())
      .addColumn("voucher_type", "varchar(40)", (col) => col.notNull())
      .addColumn("voucher_date", "varchar(40)", (col) => col.notNull())
      .addColumn("ref_type", "varchar(20)", (col) => col.notNull())
      .addColumn("original_amount", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("discount_amount", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("write_off_amount", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("settled_amount", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("balance_amount", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("status", "varchar(20)", (col) => col.notNull().defaultTo("open"))
      .addColumn("financial_year_code", "varchar(40)", (col) => col.notNull())
      .addColumn("dimension_branch", "varchar(191)")
      .addColumn("narration", "text", (col) => col.notNull().defaultTo(""))
      .addColumn("created_at", "varchar(40)", (col) => col.notNull())
      .addColumn("updated_at", "varchar(40)", (col) => col.notNull())
      .execute()
  },
})
