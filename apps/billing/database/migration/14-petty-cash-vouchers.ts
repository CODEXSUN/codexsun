import type { Kysely } from "kysely"

import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { billingTableNames } from "../table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

/**
 * billing_petty_cash_vouchers
 * ───────────────────────────
 * Per-voucher detail rows for Petty Cash vouchers
 * (small day-to-day cash expenses disbursed from an imprest fund).
 * One row per voucher. References billing_voucher_headers.voucher_id.
 *
 * Typical report use-cases:
 *   - Petty cash expense register
 *   - Petty cash fund replenishment summary
 *   - Expense-head-wise petty cash analysis
 */
export const billingPettyCashVouchersMigration = defineDatabaseMigration({
  id: "billing:vouchers:14-petty-cash-vouchers",
  appId: "billing",
  moduleKey: "petty-cash-vouchers",
  name: "Create billing petty cash voucher detail table",
  order: 140,
  up: async ({ database }) => {
    await asQueryDatabase(database).schema
      .createTable(billingTableNames.pettyCashVouchers)
      .ifNotExists()
      // ── Primary key / FK to shared header ─────────────────────────────────
      .addColumn("voucher_id", "varchar(191)", (col) => col.primaryKey())
      .addColumn("voucher_number", "varchar(191)", (col) => col.notNull())
      .addColumn("voucher_date", "varchar(40)", (col) => col.notNull())
      .addColumn("status", "varchar(40)", (col) => col.notNull())
      // ── Imprest fund account ───────────────────────────────────────────────
      .addColumn("petty_cash_ledger_id", "varchar(191)", (col) => col.notNull())
      .addColumn("petty_cash_ledger_name", "varchar(191)", (col) => col.notNull())
      // ── Recipient / payee ──────────────────────────────────────────────────
      .addColumn("payee_name", "varchar(191)", (col) => col.notNull().defaultTo(""))
      .addColumn("payee_ledger_id", "varchar(191)")
      .addColumn("payee_ledger_name", "varchar(191)")
      // ── Expense classification ─────────────────────────────────────────────
      .addColumn("expense_ledger_id", "varchar(191)", (col) => col.notNull())
      .addColumn("expense_ledger_name", "varchar(191)", (col) => col.notNull())
      .addColumn("expense_category", "varchar(100)") // e.g. office_supplies | travel | refreshment
      // ── Amount ────────────────────────────────────────────────────────────
      .addColumn("expense_amount", "real", (col) => col.notNull().defaultTo(0))
      // ── Receipt / bill reference ───────────────────────────────────────────
      .addColumn("bill_number", "varchar(191)")
      .addColumn("bill_date", "varchar(40)")
      // ── Replenishment flag ─────────────────────────────────────────────────
      .addColumn("is_replenishment", "integer", (col) => col.notNull().defaultTo(0))
      .addColumn("replenishment_voucher_id", "varchar(191)") // points to the payment / journal that topped-up the fund
      // ── Dimensions ────────────────────────────────────────────────────────
      .addColumn("dimension_branch", "varchar(191)")
      .addColumn("dimension_cost_center", "varchar(191)")
      // ── Audit ─────────────────────────────────────────────────────────────
      .addColumn("created_at", "varchar(40)", (col) => col.notNull())
      .addColumn("updated_at", "varchar(40)", (col) => col.notNull())
      .addColumn("created_by_user_id", "varchar(191)")
      .execute()
  },
})
