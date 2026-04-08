import type { Kysely } from "kysely"

import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { billingTableNames } from "../table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

/**
 * billing_receipt_vouchers
 * ────────────────────────
 * Per-voucher detail rows for Receipt vouchers (money received from parties).
 * One row per voucher. References billing_voucher_headers.voucher_id.
 *
 * Typical report use-cases:
 *   - Receipt register
 *   - Collection report by mode / bank
 *   - Outstanding receivables reconciliation
 */
export const billingReceiptVouchersMigration = defineDatabaseMigration({
  id: "billing:vouchers:10-receipt-vouchers",
  appId: "billing",
  moduleKey: "receipt-vouchers",
  name: "Create billing receipt voucher detail table",
  order: 100,
  up: async ({ database }) => {
    await asQueryDatabase(database).schema
      .createTable(billingTableNames.receiptVouchers)
      .ifNotExists()
      // ── Primary key / FK to shared header ─────────────────────────────────
      .addColumn("voucher_id", "varchar(191)", (col) => col.primaryKey())
      .addColumn("voucher_number", "varchar(191)", (col) => col.notNull())
      .addColumn("voucher_date", "varchar(40)", (col) => col.notNull())
      .addColumn("status", "varchar(40)", (col) => col.notNull())
      // ── Party (payer) ─────────────────────────────────────────────────────
      .addColumn("party_ledger_id", "varchar(191)", (col) => col.notNull())
      .addColumn("party_ledger_name", "varchar(191)", (col) => col.notNull())
      // ── Payment mode & instrument ──────────────────────────────────────────
      .addColumn("payment_mode", "varchar(40)", (col) => col.notNull()) // cash | bank | upi | cheque
      .addColumn("bank_ledger_id", "varchar(191)")
      .addColumn("bank_ledger_name", "varchar(191)")
      .addColumn("cheque_number", "varchar(100)")
      .addColumn("cheque_date", "varchar(40)")
      .addColumn("cheque_bank_name", "varchar(191)")
      .addColumn("transaction_id", "varchar(191)") // UPI / NEFT / RTGS ref
      // ── Amount ────────────────────────────────────────────────────────────
      .addColumn("receipt_amount", "real", (col) => col.notNull().defaultTo(0))
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
