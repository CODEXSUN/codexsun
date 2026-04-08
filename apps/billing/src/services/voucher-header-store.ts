import type { Kysely } from "kysely"

import {
  billingVoucherHeaderListResponseSchema,
  billingVoucherHeaderSchema,
  type BillingVoucher,
} from "../../shared/index.js"
import { billingTableNames } from "../../database/table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

type BillingVoucherHeaderRow = {
  voucher_id: string
  voucher_number: string
  status: string
  type: string
  date: string
  counterparty: string
  narration: string
  financial_year_code: string
  financial_year_label: string
  financial_year_start_date: string
  financial_year_end_date: string
  financial_year_sequence_number: number
  financial_year_prefix: string
  total_debit: number | string
  total_credit: number | string
  line_count: number
  bill_allocation_count: number
  has_gst: number
  has_sales_invoice: number
  reversal_of_voucher_id: string | null
  reversal_of_voucher_number: string | null
  reversed_by_voucher_id: string | null
  reversed_by_voucher_number: string | null
  reversed_at: string | null
  reversal_reason: string | null
  source_voucher_id: string | null
  source_voucher_number: string | null
  source_voucher_type: string | null
  review_status: string
  review_requested_at: string | null
  review_reviewed_at: string | null
  review_reviewed_by_user_id: string | null
  review_note: string
  review_required_reason: string | null
  created_at: string
  updated_at: string
  created_by_user_id: string | null
}

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

function getVoucherTotals(voucher: BillingVoucher) {
  return voucher.lines.reduce(
    (totals, line) => {
      if (line.side === "debit") {
        totals.totalDebit += line.amount
      } else {
        totals.totalCredit += line.amount
      }

      return totals
    },
    { totalCredit: 0, totalDebit: 0 }
  )
}

export async function ensureBillingVoucherHeaderTable(database: Kysely<unknown>) {
  await asQueryDatabase(database).schema
    .createTable(billingTableNames.voucherHeaders)
    .ifNotExists()
    .addColumn("voucher_id", "varchar(191)", (column) => column.primaryKey())
    .addColumn("voucher_number", "varchar(191)", (column) => column.notNull())
    .addColumn("status", "varchar(40)", (column) => column.notNull())
    .addColumn("type", "varchar(40)", (column) => column.notNull())
    .addColumn("date", "varchar(40)", (column) => column.notNull())
    .addColumn("counterparty", "varchar(191)", (column) => column.notNull())
    .addColumn("narration", "text", (column) => column.notNull())
    .addColumn("financial_year_code", "varchar(40)", (column) => column.notNull())
    .addColumn("financial_year_label", "varchar(80)", (column) => column.notNull())
    .addColumn("financial_year_start_date", "varchar(40)", (column) => column.notNull())
    .addColumn("financial_year_end_date", "varchar(40)", (column) => column.notNull())
    .addColumn("financial_year_sequence_number", "integer", (column) => column.notNull())
    .addColumn("financial_year_prefix", "varchar(40)", (column) => column.notNull())
    .addColumn("total_debit", "real", (column) => column.notNull())
    .addColumn("total_credit", "real", (column) => column.notNull())
    .addColumn("line_count", "integer", (column) => column.notNull())
    .addColumn("bill_allocation_count", "integer", (column) => column.notNull())
    .addColumn("has_gst", "integer", (column) => column.notNull().defaultTo(0))
    .addColumn("has_sales_invoice", "integer", (column) => column.notNull().defaultTo(0))
    .addColumn("reversal_of_voucher_id", "varchar(191)")
    .addColumn("reversal_of_voucher_number", "varchar(191)")
    .addColumn("reversed_by_voucher_id", "varchar(191)")
    .addColumn("reversed_by_voucher_number", "varchar(191)")
    .addColumn("reversed_at", "varchar(40)")
    .addColumn("reversal_reason", "text")
    .addColumn("source_voucher_id", "varchar(191)")
    .addColumn("source_voucher_number", "varchar(191)")
    .addColumn("source_voucher_type", "varchar(40)")
    .addColumn("review_status", "varchar(40)", (column) => column.notNull().defaultTo("not_required"))
    .addColumn("review_requested_at", "varchar(40)")
    .addColumn("review_reviewed_at", "varchar(40)")
    .addColumn("review_reviewed_by_user_id", "varchar(191)")
    .addColumn("review_note", "text", (column) => column.notNull().defaultTo(""))
    .addColumn("review_required_reason", "text")
    .addColumn("created_at", "varchar(40)", (column) => column.notNull())
    .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
    .addColumn("created_by_user_id", "varchar(191)")
    .execute()
}

function toBillingVoucherHeaderRecord(voucher: BillingVoucher) {
  const totals = getVoucherTotals(voucher)

  return {
    voucher_id: voucher.id,
    voucher_number: voucher.voucherNumber,
    status: voucher.status,
    type: voucher.type,
    date: voucher.date,
    counterparty: voucher.counterparty,
    narration: voucher.narration,
    financial_year_code: voucher.financialYear.code,
    financial_year_label: voucher.financialYear.label,
    financial_year_start_date: voucher.financialYear.startDate,
    financial_year_end_date: voucher.financialYear.endDate,
    financial_year_sequence_number: voucher.financialYear.sequenceNumber,
    financial_year_prefix: voucher.financialYear.prefix,
    total_debit: Number(totals.totalDebit.toFixed(2)),
    total_credit: Number(totals.totalCredit.toFixed(2)),
    line_count: voucher.lines.length,
    bill_allocation_count: voucher.billAllocations.length,
    has_gst: voucher.gst ? 1 : 0,
    has_sales_invoice: voucher.sales ? 1 : 0,
    reversal_of_voucher_id: voucher.reversalOfVoucherId,
    reversal_of_voucher_number: voucher.reversalOfVoucherNumber,
    reversed_by_voucher_id: voucher.reversedByVoucherId,
    reversed_by_voucher_number: voucher.reversedByVoucherNumber,
    reversed_at: voucher.reversedAt,
    reversal_reason: voucher.reversalReason,
    source_voucher_id: voucher.sourceDocument?.voucherId ?? null,
    source_voucher_number: voucher.sourceDocument?.voucherNumber ?? null,
    source_voucher_type: voucher.sourceDocument?.voucherType ?? null,
    review_status: voucher.review.status,
    review_requested_at: voucher.review.requestedAt,
    review_reviewed_at: voucher.review.reviewedAt,
    review_reviewed_by_user_id: voucher.review.reviewedByUserId,
    review_note: voucher.review.note,
    review_required_reason: voucher.review.requiredReason,
    created_at: voucher.createdAt,
    updated_at: voucher.updatedAt,
    created_by_user_id: voucher.createdByUserId,
  }
}

function parseBillingVoucherHeaderRow(row: BillingVoucherHeaderRow) {
  return billingVoucherHeaderSchema.parse({
    voucherId: row.voucher_id,
    voucherNumber: row.voucher_number,
    status: row.status,
    type: row.type,
    date: row.date,
    counterparty: row.counterparty,
    narration: row.narration,
    financialYearCode: row.financial_year_code,
    financialYearLabel: row.financial_year_label,
    financialYearStartDate: row.financial_year_start_date,
    financialYearEndDate: row.financial_year_end_date,
    financialYearSequenceNumber: row.financial_year_sequence_number,
    financialYearPrefix: row.financial_year_prefix,
    totalDebit: Number(row.total_debit),
    totalCredit: Number(row.total_credit),
    lineCount: row.line_count,
    billAllocationCount: row.bill_allocation_count,
    hasGst: Number(row.has_gst) === 1,
    hasSalesInvoice: Number(row.has_sales_invoice) === 1,
    reversalOfVoucherId: row.reversal_of_voucher_id,
    reversalOfVoucherNumber: row.reversal_of_voucher_number,
    reversedByVoucherId: row.reversed_by_voucher_id,
    reversedByVoucherNumber: row.reversed_by_voucher_number,
    reversedAt: row.reversed_at,
    reversalReason: row.reversal_reason,
    sourceDocument:
      row.source_voucher_id && row.source_voucher_number && row.source_voucher_type
        ? {
            voucherId: row.source_voucher_id,
            voucherNumber: row.source_voucher_number,
            voucherType: row.source_voucher_type,
          }
        : null,
    reviewStatus: row.review_status,
    reviewRequestedAt: row.review_requested_at,
    reviewReviewedAt: row.review_reviewed_at,
    reviewReviewedByUserId: row.review_reviewed_by_user_id,
    reviewNote: row.review_note,
    reviewRequiredReason: row.review_required_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdByUserId: row.created_by_user_id,
  })
}

export async function replaceBillingVoucherHeaders(
  database: Kysely<unknown>,
  vouchers: BillingVoucher[]
) {
  await ensureBillingVoucherHeaderTable(database)

  const queryDatabase = asQueryDatabase(database)

  await queryDatabase.deleteFrom(billingTableNames.voucherHeaders).execute()

  if (vouchers.length === 0) {
    return
  }

  await queryDatabase
    .insertInto(billingTableNames.voucherHeaders)
    .values(vouchers.map((voucher) => toBillingVoucherHeaderRecord(voucher)))
    .execute()
}

export async function listBillingVoucherHeaders(database: Kysely<unknown>) {
  await ensureBillingVoucherHeaderTable(database)

  const rows = (await asQueryDatabase(database)
    .selectFrom(billingTableNames.voucherHeaders)
    .selectAll()
    .orderBy("date", "desc")
    .orderBy("updated_at", "desc")
    .execute()) as BillingVoucherHeaderRow[]

  return billingVoucherHeaderListResponseSchema.parse({
    items: rows.map((row) => parseBillingVoucherHeaderRow(row)),
  })
}
