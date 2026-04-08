import type { Kysely } from "kysely"

import {
  billingVoucherLineRecordListResponseSchema,
  billingVoucherLineRecordSchema,
  type BillingVoucher,
} from "../../shared/index.js"
import { billingTableNames } from "../../database/table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

type BillingVoucherLineRow = {
  line_id: string
  voucher_id: string
  voucher_number: string
  voucher_status: string
  voucher_type: string
  voucher_date: string
  line_order: number
  ledger_id: string
  ledger_name: string
  side: string
  amount: number | string
  note: string
  counterparty: string
  created_at: string
  updated_at: string
}

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

export async function ensureBillingVoucherLineTable(database: Kysely<unknown>) {
  await asQueryDatabase(database).schema
    .createTable(billingTableNames.voucherLines)
    .ifNotExists()
    .addColumn("line_id", "varchar(191)", (column) => column.primaryKey())
    .addColumn("voucher_id", "varchar(191)", (column) => column.notNull())
    .addColumn("voucher_number", "varchar(191)", (column) => column.notNull())
    .addColumn("voucher_status", "varchar(40)", (column) => column.notNull())
    .addColumn("voucher_type", "varchar(40)", (column) => column.notNull())
    .addColumn("voucher_date", "varchar(40)", (column) => column.notNull())
    .addColumn("line_order", "integer", (column) => column.notNull())
    .addColumn("ledger_id", "varchar(191)", (column) => column.notNull())
    .addColumn("ledger_name", "varchar(191)", (column) => column.notNull())
    .addColumn("side", "varchar(10)", (column) => column.notNull())
    .addColumn("amount", "real", (column) => column.notNull())
    .addColumn("note", "text", (column) => column.notNull())
    .addColumn("counterparty", "varchar(191)", (column) => column.notNull())
    .addColumn("created_at", "varchar(40)", (column) => column.notNull())
    .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
    .execute()
}

function toBillingVoucherLineRecords(voucher: BillingVoucher) {
  return voucher.lines.map((line, index) => ({
    line_id: line.id,
    voucher_id: voucher.id,
    voucher_number: voucher.voucherNumber,
    voucher_status: voucher.status,
    voucher_type: voucher.type,
    voucher_date: voucher.date,
    line_order: index + 1,
    ledger_id: line.ledgerId,
    ledger_name: line.ledgerName,
    side: line.side,
    amount: Number(line.amount.toFixed(2)),
    note: line.note,
    counterparty: voucher.counterparty,
    created_at: voucher.createdAt,
    updated_at: voucher.updatedAt,
  }))
}

function parseBillingVoucherLineRow(row: BillingVoucherLineRow) {
  return billingVoucherLineRecordSchema.parse({
    lineId: row.line_id,
    voucherId: row.voucher_id,
    voucherNumber: row.voucher_number,
    voucherStatus: row.voucher_status,
    voucherType: row.voucher_type,
    voucherDate: row.voucher_date,
    lineOrder: row.line_order,
    ledgerId: row.ledger_id,
    ledgerName: row.ledger_name,
    side: row.side,
    amount: Number(row.amount),
    note: row.note,
    counterparty: row.counterparty,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
}

export async function replaceBillingVoucherLines(
  database: Kysely<unknown>,
  vouchers: BillingVoucher[]
) {
  await ensureBillingVoucherLineTable(database)

  const queryDatabase = asQueryDatabase(database)

  await queryDatabase.deleteFrom(billingTableNames.voucherLines).execute()

  const lineRecords = vouchers.flatMap((voucher) => toBillingVoucherLineRecords(voucher))

  if (lineRecords.length === 0) {
    return
  }

  await queryDatabase
    .insertInto(billingTableNames.voucherLines)
    .values(lineRecords)
    .execute()
}

export async function listBillingVoucherLines(database: Kysely<unknown>) {
  await ensureBillingVoucherLineTable(database)

  const rows = (await asQueryDatabase(database)
    .selectFrom(billingTableNames.voucherLines)
    .selectAll()
    .orderBy("voucher_date", "desc")
    .orderBy("voucher_number")
    .orderBy("line_order")
    .execute()) as BillingVoucherLineRow[]

  return billingVoucherLineRecordListResponseSchema.parse({
    items: rows.map((row) => parseBillingVoucherLineRow(row)),
  })
}
