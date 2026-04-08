import type { Kysely } from "kysely"

import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { billingTableNames } from "../table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

/**
 * billing_sales_vouchers
 * ──────────────────────
 * Per-voucher detail rows for Sales Invoice vouchers.
 * One row per voucher. References billing_voucher_headers.voucher_id.
 *
 * Typical report use-cases:
 *   - Sales register / day book
 *   - Party-wise sales report
 *   - GST sales summary
 */
export const billingSalesVouchersMigration = defineDatabaseMigration({
  id: "billing:vouchers:08-sales-vouchers",
  appId: "billing",
  moduleKey: "sales-vouchers",
  name: "Create billing sales voucher detail table",
  order: 80,
  up: async ({ database }) => {
    await asQueryDatabase(database).schema
      .createTable(billingTableNames.salesVouchers)
      .ifNotExists()
      // ── Primary key / FK to shared header ─────────────────────────────────
      .addColumn("voucher_id", "varchar(191)", (col) => col.primaryKey())
      .addColumn("voucher_number", "varchar(191)", (col) => col.notNull())
      .addColumn("voucher_date", "varchar(40)", (col) => col.notNull())
      .addColumn("status", "varchar(40)", (col) => col.notNull())
      // ── Party / customer ───────────────────────────────────────────────────
      .addColumn("party_ledger_id", "varchar(191)", (col) => col.notNull())
      .addColumn("party_ledger_name", "varchar(191)", (col) => col.notNull())
      // ── Sales-specific amounts ─────────────────────────────────────────────
      .addColumn("gross_amount", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("discount_amount", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("taxable_amount", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("tax_amount", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("net_amount", "real", (col) => col.notNull().defaultTo(0))
      // ── GST ───────────────────────────────────────────────────────────────
      .addColumn("has_gst", "integer", (col) => col.notNull().defaultTo(0))
      .addColumn("gst_type", "varchar(40)") // IGST | CGST_SGST | exempt
      .addColumn("place_of_supply", "varchar(40)")
      // ── Reference fields ──────────────────────────────────────────────────
      .addColumn("order_reference", "varchar(191)")
      .addColumn("dispatch_reference", "varchar(191)")
      .addColumn("due_date", "varchar(40)")
      // ── Dimensions ────────────────────────────────────────────────────────
      .addColumn("dimension_branch", "varchar(191)")
      .addColumn("dimension_project", "varchar(191)")
      .addColumn("dimension_cost_center", "varchar(191)")
      // ── Audit ─────────────────────────────────────────────────────────────
      .addColumn("created_at", "varchar(40)", (col) => col.notNull())
      .addColumn("updated_at", "varchar(40)", (col) => col.notNull())
      .addColumn("created_by_user_id", "varchar(191)")
      .execute()
  },
})
