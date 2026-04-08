import type { Kysely } from "kysely"

import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { billingTableNames } from "../table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

/**
 * billing_bank_book_entries
 * ─────────────────────────
 * Denormalized, append-only bank book rows.
 * One row per voucher that involves a bank account (Receipt, Payment, Contra).
 * References billing_voucher_headers.voucher_id.
 *
 * This table is the physical bank book — every debit or credit hit against
 * any bank account ledger is recorded here for fast statement-style reporting.
 *
 * Typical report use-cases:
 *   - Bank book / bank statement view
 *   - Bank reconciliation statement (BRS)
 *   - Bank-wise cashflow summary
 */
export const billingBankBookEntriesMigration = defineDatabaseMigration({
  id: "billing:vouchers:15-bank-book-entries",
  appId: "billing",
  moduleKey: "bank-book-entries",
  name: "Create billing bank book entry table",
  order: 150,
  up: async ({ database }) => {
    await asQueryDatabase(database).schema
      .createTable(billingTableNames.bankBookEntries)
      .ifNotExists()
      // ── Primary key ───────────────────────────────────────────────────────
      .addColumn("entry_id", "varchar(191)", (col) => col.primaryKey())
      // ── Source voucher link ────────────────────────────────────────────────
      .addColumn("voucher_id", "varchar(191)", (col) => col.notNull())
      .addColumn("voucher_number", "varchar(191)", (col) => col.notNull())
      .addColumn("voucher_date", "varchar(40)", (col) => col.notNull())
      .addColumn("voucher_type", "varchar(40)", (col) => col.notNull())
      // Values: receipt | payment | contra | journal | sales | purchase
      .addColumn("voucher_status", "varchar(40)", (col) => col.notNull())
      // ── Bank account ──────────────────────────────────────────────────────
      .addColumn("bank_ledger_id", "varchar(191)", (col) => col.notNull())
      .addColumn("bank_ledger_name", "varchar(191)", (col) => col.notNull())
      // ── Transaction details ────────────────────────────────────────────────
      .addColumn("transaction_side", "varchar(10)", (col) => col.notNull()) // debit | credit
      .addColumn("transaction_amount", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("running_balance", "real", (col) => col.notNull().defaultTo(0))
      // ── Instrument / mode ─────────────────────────────────────────────────
      .addColumn("payment_mode", "varchar(40)") // cheque | neft | rtgs | upi | dd | card
      .addColumn("cheque_number", "varchar(100)")
      .addColumn("cheque_date", "varchar(40)")
      .addColumn("cheque_bank_name", "varchar(191)")
      .addColumn("transaction_id", "varchar(191)") // UTR / ref number
      .addColumn("value_date", "varchar(40)") // date funds actually clear
      // ── Counterparty ──────────────────────────────────────────────────────
      .addColumn("counterparty_ledger_id", "varchar(191)")
      .addColumn("counterparty_ledger_name", "varchar(191)")
      // ── Narration ─────────────────────────────────────────────────────────
      .addColumn("narration", "text", (col) => col.notNull().defaultTo(""))
      // ── Reconciliation ───────────────────────────────────────────────────
      .addColumn("is_reconciled", "integer", (col) => col.notNull().defaultTo(0))
      .addColumn("reconciled_at", "varchar(40)")
      .addColumn("bank_statement_ref", "varchar(191)") // matched bank statement line
      // ── Financial year ────────────────────────────────────────────────────
      .addColumn("financial_year_code", "varchar(40)", (col) => col.notNull())
      // ── Dimensions ────────────────────────────────────────────────────────
      .addColumn("dimension_branch", "varchar(191)")
      // ── Audit ─────────────────────────────────────────────────────────────
      .addColumn("created_at", "varchar(40)", (col) => col.notNull())
      .addColumn("updated_at", "varchar(40)", (col) => col.notNull())
      .execute()
  },
})
