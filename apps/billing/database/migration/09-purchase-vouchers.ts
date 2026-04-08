import type { Kysely } from "kysely"

import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { billingTableNames } from "../table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

/**
 * billing_purchase_vouchers
 * ─────────────────────────
 * Per-voucher detail rows for Purchase Invoice vouchers.
 * One row per voucher. References billing_voucher_headers.voucher_id.
 *
 * Typical report use-cases:
 *   - Purchase register / day book
 *   - Supplier-wise purchase report
 *   - GST purchase (ITC) summary
 */
export const billingPurchaseVouchersMigration = defineDatabaseMigration({
  id: "billing:vouchers:09-purchase-vouchers",
  appId: "billing",
  moduleKey: "purchase-vouchers",
  name: "Create billing purchase voucher detail table",
  order: 90,
  up: async ({ database }) => {
    await asQueryDatabase(database).schema
      .createTable(billingTableNames.purchaseVouchers)
      .ifNotExists()
      // ── Primary key / FK to shared header ─────────────────────────────────
      .addColumn("voucher_id", "varchar(191)", (col) => col.primaryKey())
      .addColumn("voucher_number", "varchar(191)", (col) => col.notNull())
      .addColumn("voucher_date", "varchar(40)", (col) => col.notNull())
      .addColumn("status", "varchar(40)", (col) => col.notNull())
      // ── Supplier ──────────────────────────────────────────────────────────
      .addColumn("supplier_ledger_id", "varchar(191)", (col) => col.notNull())
      .addColumn("supplier_ledger_name", "varchar(191)", (col) => col.notNull())
      // ── Supplier invoice reference ─────────────────────────────────────────
      .addColumn("supplier_invoice_number", "varchar(191)")
      .addColumn("supplier_invoice_date", "varchar(40)")
      // ── Purchase-specific amounts ──────────────────────────────────────────
      .addColumn("gross_amount", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("discount_amount", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("taxable_amount", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("tax_amount", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("net_amount", "real", (col) => col.notNull().defaultTo(0))
      // ── GST / ITC ─────────────────────────────────────────────────────────
      .addColumn("has_gst", "integer", (col) => col.notNull().defaultTo(0))
      .addColumn("gst_type", "varchar(40)") // IGST | CGST_SGST | exempt
      .addColumn("itc_eligible", "integer", (col) => col.notNull().defaultTo(1))
      .addColumn("itc_reversal_reason", "varchar(191)")
      .addColumn("place_of_supply", "varchar(40)")
      // ── Due date ──────────────────────────────────────────────────────────
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
