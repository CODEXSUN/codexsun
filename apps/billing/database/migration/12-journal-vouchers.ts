import type { Kysely } from "kysely"

import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"

import { billingTableNames } from "../table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

/**
 * billing_journal_vouchers
 * ────────────────────────
 * Per-voucher detail rows for Journal / General Journal vouchers.
 * One row per voucher. References billing_voucher_headers.voucher_id.
 *
 * Typical report use-cases:
 *   - Journal register
 *   - Adjustment / provision entries
 *   - Period-end closing entries
 */
export const billingJournalVouchersMigration = defineDatabaseMigration({
  id: "billing:vouchers:12-journal-vouchers",
  appId: "billing",
  moduleKey: "journal-vouchers",
  name: "Create billing journal voucher detail table",
  order: 120,
  up: async ({ database }) => {
    await asQueryDatabase(database).schema
      .createTable(billingTableNames.journalVouchers)
      .ifNotExists()
      // ── Primary key / FK to shared header ─────────────────────────────────
      .addColumn("voucher_id", "varchar(191)", (col) => col.primaryKey())
      .addColumn("voucher_number", "varchar(191)", (col) => col.notNull())
      .addColumn("voucher_date", "varchar(40)", (col) => col.notNull())
      .addColumn("status", "varchar(40)", (col) => col.notNull())
      // ── Journal classification ─────────────────────────────────────────────
      .addColumn("journal_type", "varchar(40)", (col) => col.notNull().defaultTo("general"))
      // Values: general | adjustment | provision | depreciation | closing | opening
      .addColumn("is_auto_generated", "integer", (col) => col.notNull().defaultTo(0))
      .addColumn("auto_generated_reason", "varchar(191)")
      // ── Totals ────────────────────────────────────────────────────────────
      .addColumn("total_debit", "real", (col) => col.notNull().defaultTo(0))
      .addColumn("total_credit", "real", (col) => col.notNull().defaultTo(0))
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
