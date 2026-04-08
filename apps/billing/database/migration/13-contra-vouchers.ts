import type { Kysely } from "kysely"

import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { billingTableNames } from "../table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

/**
 * billing_contra_vouchers
 * ───────────────────────
 * Per-voucher detail rows for Contra vouchers
 * (fund transfers between cash and bank accounts within the same entity).
 * One row per voucher. References billing_voucher_headers.voucher_id.
 *
 * Typical report use-cases:
 *   - Cash deposit / withdrawal register
 *   - Inter-bank transfer log
 *   - Reconciliation of cash vs bank
 */
export const billingContraVouchersMigration = defineDatabaseMigration({
  id: "billing:vouchers:13-contra-vouchers",
  appId: "billing",
  moduleKey: "contra-vouchers",
  name: "Create billing contra voucher detail table",
  order: 130,
  up: async ({ database }) => {
    await asQueryDatabase(database).schema
      .createTable(billingTableNames.contraVouchers)
      .ifNotExists()
      // ── Primary key / FK to shared header ─────────────────────────────────
      .addColumn("voucher_id", "varchar(191)", (col) => col.primaryKey())
      .addColumn("voucher_number", "varchar(191)", (col) => col.notNull())
      .addColumn("voucher_date", "varchar(40)", (col) => col.notNull())
      .addColumn("status", "varchar(40)", (col) => col.notNull())
      // ── Contra sub-type ───────────────────────────────────────────────────
      .addColumn("contra_type", "varchar(40)", (col) => col.notNull())
      // Values: cash_to_bank | bank_to_cash | bank_to_bank | cash_to_cash
      // ── Source account (debit side) ───────────────────────────────────────
      .addColumn("from_ledger_id", "varchar(191)", (col) => col.notNull())
      .addColumn("from_ledger_name", "varchar(191)", (col) => col.notNull())
      // ── Destination account (credit side) ─────────────────────────────────
      .addColumn("to_ledger_id", "varchar(191)", (col) => col.notNull())
      .addColumn("to_ledger_name", "varchar(191)", (col) => col.notNull())
      // ── Instrument details ─────────────────────────────────────────────────
      .addColumn("cheque_number", "varchar(100)")
      .addColumn("cheque_date", "varchar(40)")
      .addColumn("transaction_id", "varchar(191)") // NEFT / RTGS ref
      // ── Amount ────────────────────────────────────────────────────────────
      .addColumn("transfer_amount", "real", (col) => col.notNull().defaultTo(0))
      // ── Dimensions ────────────────────────────────────────────────────────
      .addColumn("dimension_branch", "varchar(191)")
      // ── Audit ─────────────────────────────────────────────────────────────
      .addColumn("created_at", "varchar(40)", (col) => col.notNull())
      .addColumn("updated_at", "varchar(40)", (col) => col.notNull())
      .addColumn("created_by_user_id", "varchar(191)")
      .execute()
  },
})
