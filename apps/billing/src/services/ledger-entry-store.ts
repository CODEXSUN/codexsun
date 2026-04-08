import type { Kysely } from "kysely"

import {
  billingLedgerEntryListResponseSchema,
  billingLedgerEntrySchema,
  type BillingVoucher,
} from "../../shared/index.js"
import { billingTableNames } from "../../database/table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

type BillingLedgerEntryRow = {
  entry_id: string
  voucher_id: string
  voucher_line_id: string
  voucher_number: string
  voucher_type: string
  voucher_status: string
  voucher_date: string
  entry_order: number
  ledger_id: string
  ledger_name: string
  side: string
  amount: number | string
  counterparty: string
  narration: string
  reversal_of_voucher_id: string | null
  reversal_of_voucher_number: string | null
  posted_at: string
  created_at: string
  updated_at: string
}

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

export async function ensureBillingLedgerEntryTable(database: Kysely<unknown>) {
  await asQueryDatabase(database).schema
    .createTable(billingTableNames.ledgerEntries)
    .ifNotExists()
    .addColumn("entry_id", "varchar(191)", (column) => column.primaryKey())
    .addColumn("voucher_id", "varchar(191)", (column) => column.notNull())
    .addColumn("voucher_line_id", "varchar(191)", (column) => column.notNull())
    .addColumn("voucher_number", "varchar(191)", (column) => column.notNull())
    .addColumn("voucher_type", "varchar(40)", (column) => column.notNull())
    .addColumn("voucher_status", "varchar(40)", (column) => column.notNull())
    .addColumn("voucher_date", "varchar(40)", (column) => column.notNull())
    .addColumn("entry_order", "integer", (column) => column.notNull())
    .addColumn("ledger_id", "varchar(191)", (column) => column.notNull())
    .addColumn("ledger_name", "varchar(191)", (column) => column.notNull())
    .addColumn("side", "varchar(10)", (column) => column.notNull())
    .addColumn("amount", "real", (column) => column.notNull())
    .addColumn("counterparty", "varchar(191)", (column) => column.notNull())
    .addColumn("narration", "text", (column) => column.notNull())
    .addColumn("reversal_of_voucher_id", "varchar(191)")
    .addColumn("reversal_of_voucher_number", "varchar(191)")
    .addColumn("posted_at", "varchar(40)", (column) => column.notNull())
    .addColumn("created_at", "varchar(40)", (column) => column.notNull())
    .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
    .execute()
}

function toLedgerEntryRecords(voucher: BillingVoucher) {
  if (!["posted", "reversed"].includes(voucher.status)) {
    return []
  }

  return voucher.lines.map((line, index) => ({
    entry_id: `${voucher.id}:${line.id}`,
    voucher_id: voucher.id,
    voucher_line_id: line.id,
    voucher_number: voucher.voucherNumber,
    voucher_type: voucher.type,
    voucher_status: voucher.status,
    voucher_date: voucher.date,
    entry_order: index + 1,
    ledger_id: line.ledgerId,
    ledger_name: line.ledgerName,
    side: line.side,
    amount: Number(line.amount.toFixed(2)),
    counterparty: voucher.counterparty,
    narration: voucher.narration,
    reversal_of_voucher_id: voucher.reversalOfVoucherId,
    reversal_of_voucher_number: voucher.reversalOfVoucherNumber,
    posted_at: voucher.createdAt,
    created_at: voucher.createdAt,
    updated_at: voucher.updatedAt,
  }))
}

function parseBillingLedgerEntryRow(row: BillingLedgerEntryRow) {
  return billingLedgerEntrySchema.parse({
    entryId: row.entry_id,
    voucherId: row.voucher_id,
    voucherLineId: row.voucher_line_id,
    voucherNumber: row.voucher_number,
    voucherType: row.voucher_type,
    voucherStatus: row.voucher_status,
    voucherDate: row.voucher_date,
    entryOrder: row.entry_order,
    ledgerId: row.ledger_id,
    ledgerName: row.ledger_name,
    side: row.side,
    amount: Number(row.amount),
    counterparty: row.counterparty,
    narration: row.narration,
    reversalOfVoucherId: row.reversal_of_voucher_id,
    reversalOfVoucherNumber: row.reversal_of_voucher_number,
    postedAt: row.posted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
}

export async function replaceBillingLedgerEntries(
  database: Kysely<unknown>,
  vouchers: BillingVoucher[]
) {
  await ensureBillingLedgerEntryTable(database)

  const queryDatabase = asQueryDatabase(database)

  await queryDatabase.deleteFrom(billingTableNames.ledgerEntries).execute()

  const entries = vouchers.flatMap((voucher) => toLedgerEntryRecords(voucher))

  if (entries.length === 0) {
    return
  }

  await queryDatabase
    .insertInto(billingTableNames.ledgerEntries)
    .values(entries)
    .execute()
}

export async function listBillingLedgerEntries(database: Kysely<unknown>) {
  await ensureBillingLedgerEntryTable(database)

  const rows = (await asQueryDatabase(database)
    .selectFrom(billingTableNames.ledgerEntries)
    .selectAll()
    .orderBy("voucher_date", "desc")
    .orderBy("voucher_number")
    .orderBy("entry_order")
    .execute()) as BillingLedgerEntryRow[]

  return billingLedgerEntryListResponseSchema.parse({
    items: rows.map((row) => parseBillingLedgerEntryRow(row)),
  })
}
