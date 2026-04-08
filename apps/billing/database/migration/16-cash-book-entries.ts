import type { Kysely } from "kysely"

import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { billingTableNames } from "../table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

/**
 * billing_cash_book_entries
 * ─────────────────────────
 * Denormalized, append-only cash book rows.
 * One row per voucher that involves a cash account (Receipt, Payment, Petty Cash, Contra).
 * References billing_voucher_headers.voucher_id.
 *
 * This table is the physical cash book — every debit or credit hit against
 * any cash account ledger is recorded here for fast statement-style reporting.
 *
 * Typical report use-cases:
 *   - Cash book / cash register view
 *   - Daily cash position report
 *   - Cash-wise inflow / outflow summary
 *   - Denomination-level cash counting (optional)
 */
export const billingCashBookEntriesMigration = defineDatabaseMigration({
  id: "billing:vouchers:16-cash-book-entries",
  appId: "billing",
  moduleKey: "cash-book-entries",
  name: "Create billing cash book entry table",
  order: 160,
  up: async ({ database }) => {
    await asQueryDatabase(database).schema
      .createTable(billingTableNames.cashBookEntries)
      .ifNotExists()
      // ── Primary key ───────────────────────────────────────────────────────
      .addColumn("entry_id", "varchar(191)", (col) => col.primaryKey())
      // ── Source voucher link ────────────────────────────────────────────────
      .addColumn("voucher_id", "varchar(191)", (col) => col.notNull())
      .addColumn("voucher_number", "varchar(191)", (col) => col.notNull())
      .addColumn("voucher_date", "varchar(40)", (col) => col.notNull())
      .addColumn("voucher_type", "varchar(40)", (col) => col.notNull())
      // Values: receipt | payment | petty_cash | contra | journal | sales | purchase
      .addColumn("voucher_status", "varchar(40)", (col) => col.notNull())
      // ── Cash account ──────────────────────────────────────────────────────
      .addColumn("cash_ledger_id", "varchar(191)", (col) => col.notNull())
      .addColumn("cash_ledger_name", "varchar(191)", (col) => col.notNull())
      // ── Transaction details ────────────────────────────────────────────────
      .addColumn("transaction_side", "varchar(10)", (col) => col.notNull()) // debit | credit
      .addColumn("transaction_amount", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("running_balance", "real", (col) => col.notNull().defaultTo(0))
      // ── Counterparty ──────────────────────────────────────────────────────
      .addColumn("counterparty_ledger_id", "varchar(191)")
      .addColumn("counterparty_ledger_name", "varchar(191)")
      // ── Narration ─────────────────────────────────────────────────────────
      .addColumn("narration", "text", (col) => col.notNull().defaultTo(""))
      // ── Petty cash marker ─────────────────────────────────────────────────
      .addColumn("is_petty_cash", "integer", (col) => col.notNull().defaultTo(0))
      // ── Denomination breakdown (optional, for physical cash verification) ──
      // Stored as serialized JSON: { "500": 2, "100": 5, ... }
      .addColumn("denomination_json", "text")
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
