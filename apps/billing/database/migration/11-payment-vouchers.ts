import type { Kysely } from "kysely"

import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { billingTableNames } from "../table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

/**
 * billing_payment_vouchers
 * ────────────────────────
 * Per-voucher detail rows for Payment vouchers (money paid to parties).
 * One row per voucher. References billing_voucher_headers.voucher_id.
 *
 * Typical report use-cases:
 *   - Payment register
 *   - Supplier payment history
 *   - Bank / cash disbursement summary
 */
export const billingPaymentVouchersMigration = defineDatabaseMigration({
  id: "billing:vouchers:11-payment-vouchers",
  appId: "billing",
  moduleKey: "payment-vouchers",
  name: "Create billing payment voucher detail table",
  order: 110,
  up: async ({ database }) => {
    await asQueryDatabase(database).schema
      .createTable(billingTableNames.paymentVouchers)
      .ifNotExists()
      // ── Primary key / FK to shared header ─────────────────────────────────
      .addColumn("voucher_id", "varchar(191)", (col) => col.primaryKey())
      .addColumn("voucher_number", "varchar(191)", (col) => col.notNull())
      .addColumn("voucher_date", "varchar(40)", (col) => col.notNull())
      .addColumn("status", "varchar(40)", (col) => col.notNull())
      // ── Party (payee) ─────────────────────────────────────────────────────
      .addColumn("party_ledger_id", "varchar(191)", (col) => col.notNull())
      .addColumn("party_ledger_name", "varchar(191)", (col) => col.notNull())
      // ── Payment mode & instrument ──────────────────────────────────────────
      .addColumn("payment_mode", "varchar(40)", (col) => col.notNull()) // cash | bank | upi | cheque | dd
      .addColumn("bank_ledger_id", "varchar(191)")
      .addColumn("bank_ledger_name", "varchar(191)")
      .addColumn("cheque_number", "varchar(100)")
      .addColumn("cheque_date", "varchar(40)")
      .addColumn("cheque_bank_name", "varchar(191)")
      .addColumn("transaction_id", "varchar(191)") // NEFT / RTGS / UPI ref
      // ── Amount ────────────────────────────────────────────────────────────
      .addColumn("payment_amount", "real", (col) => col.notNull().defaultTo(0))
      // ── TDS ───────────────────────────────────────────────────────────────
      .addColumn("tds_amount", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("tds_section", "varchar(40)")
      // ── Dimensions ────────────────────────────────────────────────────────
      .addColumn("dimension_branch", "varchar(191)")
      .addColumn("dimension_project", "varchar(191)")
      // ── Audit ─────────────────────────────────────────────────────────────
      .addColumn("created_at", "varchar(40)", (col) => col.notNull())
      .addColumn("updated_at", "varchar(40)", (col) => col.notNull())
      .addColumn("created_by_user_id", "varchar(191)")
      .execute()
  },
})
