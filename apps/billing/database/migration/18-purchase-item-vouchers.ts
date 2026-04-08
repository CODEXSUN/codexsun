import type { Kysely } from "kysely"

import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { billingTableNames } from "../table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

export const billingPurchaseItemVouchersMigration = defineDatabaseMigration({
  id: "billing:vouchers:18-purchase-item-vouchers",
  appId: "billing",
  moduleKey: "purchase-item-vouchers",
  name: "Create billing purchase item voucher detail table",
  order: 180,
  up: async ({ database }) => {
    await asQueryDatabase(database).schema
      .createTable(billingTableNames.purchaseItemVouchers)
      .ifNotExists()
      .addColumn("item_id", "varchar(191)", (col) => col.primaryKey())
      .addColumn("voucher_id", "varchar(191)", (col) => col.notNull())
      .addColumn("voucher_number", "varchar(191)", (col) => col.notNull())
      .addColumn("voucher_date", "varchar(40)", (col) => col.notNull())
      .addColumn("financial_year_code", "varchar(40)", (col) => col.notNull())
      .addColumn("line_order", "integer", (col) => col.notNull())
      .addColumn("product_id", "varchar(191)")
      .addColumn("warehouse_id", "varchar(191)")
      .addColumn("item_name", "varchar(191)", (col) => col.notNull())
      .addColumn("description", "text", (col) => col.notNull().defaultTo(""))
      .addColumn("hsn_or_sac", "varchar(40)", (col) => col.notNull())
      .addColumn("quantity", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("unit", "varchar(40)", (col) => col.notNull())
      .addColumn("rate", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("gross_amount", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("discount_rate", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("discount_amount", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("taxable_amount", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("tax_rate", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("cgst_amount", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("sgst_amount", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("igst_amount", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("total_tax_amount", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("net_amount", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("itc_eligible", "integer", (col) => col.notNull().defaultTo(1))
      .addColumn("itc_reversal_reason", "varchar(191)")
      .addColumn("supply_type", "varchar(10)")
      .addColumn("place_of_supply", "varchar(40)")
      .addColumn("created_at", "varchar(40)", (col) => col.notNull())
      .addColumn("updated_at", "varchar(40)", (col) => col.notNull())
      .execute()
  },
})
