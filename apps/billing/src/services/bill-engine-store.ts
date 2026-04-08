import type { Kysely } from "kysely"

import type { BillingVoucher } from "../../shared/index.js"
import { billingTableNames } from "../../database/table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

type BillReferenceRow = {
  ref_id: string
  ref_number: string
  ref_date: string
  due_date: string | null
  party_ledger_id: string
  party_ledger_name: string
  direction: string
  voucher_id: string
  voucher_number: string
  voucher_type: string
  voucher_date: string
  ref_type: string
  original_amount: number
  discount_amount: number
  write_off_amount: number
  settled_amount: number
  balance_amount: number
  status: string
  financial_year_code: string
  dimension_branch: string | null
  narration: string
  created_at: string
  updated_at: string
}

type BillSettlementRow = {
  settlement_id: string
  bill_ref_id: string
  ref_number: string
  party_ledger_id: string
  party_ledger_name: string
  direction: string
  settlement_voucher_id: string
  settlement_voucher_number: string
  settlement_voucher_type: string
  settlement_date: string
  settlement_type: string
  settlement_amount: number
  discount_amount: number
  write_off_amount: number
  balance_before: number
  balance_after: number
  against_advance_ref_id: string | null
  financial_year_code: string
  narration: string
  created_at: string
  updated_at: string
}

type BillOverdueRow = {
  overdue_id: string
  bill_ref_id: string
  ref_number: string
  party_ledger_id: string
  party_ledger_name: string
  direction: string
  voucher_id: string
  voucher_number: string
  voucher_type: string
  ref_date: string
  due_date: string | null
  overdue_days: number
  overdue_amount: number
  bucket_key: string
  bucket_label: string
  penalty_rate: number
  penalty_amount: number
  last_reminder_at: string | null
  status: string
  financial_year_code: string
  created_at: string
  updated_at: string
}

function asDb(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

function roundAmount(value: number) {
  return Number(value.toFixed(2))
}

function getVoucherAmount(voucher: BillingVoucher) {
  if (voucher.sales) {
    return roundAmount(voucher.sales.grandTotal)
  }

  if (voucher.gst) {
    return roundAmount(voucher.gst.invoiceAmount)
  }

  const debitTotal = voucher.lines
    .filter((line) => line.side === "debit")
    .reduce((sum, line) => sum + line.amount, 0)

  return roundAmount(debitTotal)
}

function getSalesParty(voucher: BillingVoucher) {
  return {
    ledgerId: voucher.sales?.customerLedgerId ?? voucher.gst?.partyLedgerId ?? voucher.counterparty,
    ledgerName: voucher.sales?.customerLedgerName ?? voucher.gst?.partyLedgerName ?? voucher.counterparty,
  }
}

function getPurchaseParty(voucher: BillingVoucher) {
  return {
    ledgerId: voucher.gst?.partyLedgerId ?? voucher.counterparty,
    ledgerName: voucher.gst?.partyLedgerName ?? voucher.counterparty,
  }
}

function getReceiptParty(voucher: BillingVoucher) {
  const creditLine = voucher.lines.find((line) => line.side === "credit")
  return {
    ledgerId: creditLine?.ledgerId ?? voucher.counterparty,
    ledgerName: creditLine?.ledgerName ?? voucher.counterparty,
  }
}

function getPaymentParty(voucher: BillingVoucher) {
  const debitLine = voucher.lines.find((line) => line.side === "debit")
  return {
    ledgerId: debitLine?.ledgerId ?? voucher.counterparty,
    ledgerName: debitLine?.ledgerName ?? voucher.counterparty,
  }
}

function getDaysBetween(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00.000Z`)
  const end = new Date(`${endDate}T00:00:00.000Z`)
  const diffMs = end.getTime() - start.getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

function getAgingBucket(overdueDays: number) {
  if (overdueDays <= 0) return { key: "current", label: "Current" }
  if (overdueDays <= 30) return { key: "1_30", label: "1 - 30 days overdue" }
  if (overdueDays <= 60) return { key: "31_60", label: "31 - 60 days overdue" }
  if (overdueDays <= 90) return { key: "61_90", label: "61 - 90 days overdue" }
  if (overdueDays <= 180) return { key: "91_180", label: "91 - 180 days overdue" }
  if (overdueDays <= 365) return { key: "181_365", label: "181 - 365 days overdue" }
  return { key: "365_plus", label: "More than 1 year overdue" }
}

async function replaceTable<T extends Record<string, unknown>>(
  database: Kysely<unknown>,
  tableName: string,
  rows: T[]
) {
  const db = asDb(database)
  await db.deleteFrom(tableName).execute()
  if (rows.length > 0) {
    await db.insertInto(tableName).values(rows).execute()
  }
}

export async function replaceBillingBillEngineTables(
  database: Kysely<unknown>,
  vouchers: BillingVoucher[]
) {
  const postedVouchers = vouchers.filter((voucher) => voucher.status === "posted")
  const asOfDate = postedVouchers.reduce((latest, voucher) =>
    voucher.date > latest ? voucher.date : latest, new Date().toISOString().slice(0, 10))

  const billReferences: BillReferenceRow[] = []
  const billReferenceByNumber = new Map<string, BillReferenceRow>()
  const advanceReferenceByVoucherId = new Map<string, string[]>()

  for (const voucher of postedVouchers) {
    if (voucher.reversalOfVoucherId) {
      continue
    }

    if (voucher.type === "sales") {
      const party = getSalesParty(voucher)
      const amount = getVoucherAmount(voucher)
      const row: BillReferenceRow = {
        ref_id: `billref:${voucher.id}`,
        ref_number: voucher.voucherNumber,
        ref_date: voucher.date,
        due_date: voucher.sales?.dueDate ?? null,
        party_ledger_id: party.ledgerId,
        party_ledger_name: party.ledgerName,
        direction: "receivable",
        voucher_id: voucher.id,
        voucher_number: voucher.voucherNumber,
        voucher_type: voucher.type,
        voucher_date: voucher.date,
        ref_type: "new_ref",
        original_amount: amount,
        discount_amount: 0,
        write_off_amount: 0,
        settled_amount: 0,
        balance_amount: amount,
        status: "open",
        financial_year_code: voucher.financialYear.code,
        dimension_branch: voucher.dimensions.branch,
        narration: voucher.narration,
        created_at: voucher.createdAt,
        updated_at: voucher.updatedAt,
      }
      billReferences.push(row)
      billReferenceByNumber.set(row.ref_number, row)
      continue
    }

    if (voucher.type === "purchase") {
      const party = getPurchaseParty(voucher)
      const amount = getVoucherAmount(voucher)
      const row: BillReferenceRow = {
        ref_id: `billref:${voucher.id}`,
        ref_number: voucher.voucherNumber,
        ref_date: voucher.date,
        due_date: null,
        party_ledger_id: party.ledgerId,
        party_ledger_name: party.ledgerName,
        direction: "payable",
        voucher_id: voucher.id,
        voucher_number: voucher.voucherNumber,
        voucher_type: voucher.type,
        voucher_date: voucher.date,
        ref_type: "new_ref",
        original_amount: amount,
        discount_amount: 0,
        write_off_amount: 0,
        settled_amount: 0,
        balance_amount: amount,
        status: "open",
        financial_year_code: voucher.financialYear.code,
        dimension_branch: voucher.dimensions.branch,
        narration: voucher.narration,
        created_at: voucher.createdAt,
        updated_at: voucher.updatedAt,
      }
      billReferences.push(row)
      billReferenceByNumber.set(row.ref_number, row)
      continue
    }

    if (
      (voucher.type === "receipt" || voucher.type === "payment") &&
      voucher.billAllocations.some((allocation) => allocation.referenceType !== "against_ref")
    ) {
      const party = voucher.type === "receipt" ? getReceiptParty(voucher) : getPaymentParty(voucher)
      const direction = voucher.type === "receipt" ? "receivable" : "payable"
      const refs = voucher.billAllocations
        .filter((allocation) => allocation.referenceType !== "against_ref")
        .map((allocation, index) => {
          const row: BillReferenceRow = {
            ref_id: `billref:${voucher.id}:${index + 1}`,
            ref_number: allocation.referenceNumber,
            ref_date: allocation.referenceDate ?? voucher.date,
            due_date: allocation.referenceType === "on_account" ? null : allocation.dueDate,
            party_ledger_id: party.ledgerId,
            party_ledger_name: party.ledgerName,
            direction,
            voucher_id: voucher.id,
            voucher_number: voucher.voucherNumber,
            voucher_type: voucher.type,
            voucher_date: voucher.date,
            ref_type: allocation.referenceType,
            original_amount: roundAmount(allocation.amount),
            discount_amount: 0,
            write_off_amount: 0,
            settled_amount: 0,
            balance_amount: roundAmount(allocation.amount),
            status: "open",
            financial_year_code: voucher.financialYear.code,
            dimension_branch: voucher.dimensions.branch,
            narration: allocation.note || voucher.narration,
            created_at: voucher.createdAt,
            updated_at: voucher.updatedAt,
          }
          billReferences.push(row)
          billReferenceByNumber.set(row.ref_number, row)
          return row.ref_id
        })

      if (refs.length > 0) {
        advanceReferenceByVoucherId.set(voucher.id, refs)
      }
    }
  }

  const billSettlements: BillSettlementRow[] = []

  function pushSettlement(input: {
    billRef: BillReferenceRow
    voucher: BillingVoucher
    settlementType: string
    settlementAmount: number
    discountAmount?: number
    writeOffAmount?: number
    againstAdvanceRefId?: string | null
  }) {
    const settlementAmount = roundAmount(input.settlementAmount)
    const discountAmount = roundAmount(input.discountAmount ?? 0)
    const writeOffAmount = roundAmount(input.writeOffAmount ?? 0)
    const balanceBefore = roundAmount(input.billRef.balance_amount)
    const netReduction = roundAmount(settlementAmount + discountAmount + writeOffAmount)
    input.billRef.settled_amount = roundAmount(input.billRef.settled_amount + settlementAmount)
    input.billRef.discount_amount = roundAmount(input.billRef.discount_amount + discountAmount)
    input.billRef.write_off_amount = roundAmount(input.billRef.write_off_amount + writeOffAmount)
    input.billRef.balance_amount = roundAmount(
      Math.max(
        input.billRef.original_amount -
          input.billRef.settled_amount -
          input.billRef.discount_amount -
          input.billRef.write_off_amount,
        0
      )
    )
    input.billRef.status =
      input.billRef.balance_amount === 0
        ? input.billRef.write_off_amount > 0
          ? "written_off"
          : "settled"
        : input.billRef.settled_amount > 0 || input.billRef.discount_amount > 0
          ? "partial"
          : "open"
    input.billRef.updated_at = input.voucher.updatedAt

    billSettlements.push({
      settlement_id: `settle:${input.voucher.id}:${billSettlements.length + 1}`,
      bill_ref_id: input.billRef.ref_id,
      ref_number: input.billRef.ref_number,
      party_ledger_id: input.billRef.party_ledger_id,
      party_ledger_name: input.billRef.party_ledger_name,
      direction: input.billRef.direction,
      settlement_voucher_id: input.voucher.id,
      settlement_voucher_number: input.voucher.voucherNumber,
      settlement_voucher_type: input.voucher.type,
      settlement_date: input.voucher.date,
      settlement_type: input.settlementType,
      settlement_amount: settlementAmount,
      discount_amount: discountAmount,
      write_off_amount: writeOffAmount,
      balance_before: balanceBefore,
      balance_after: roundAmount(Math.max(balanceBefore - netReduction, 0)),
      against_advance_ref_id: input.againstAdvanceRefId ?? null,
      financial_year_code: input.voucher.financialYear.code,
      narration: input.voucher.narration,
      created_at: input.voucher.createdAt,
      updated_at: input.voucher.updatedAt,
    })
  }

  for (const voucher of postedVouchers) {
    if (voucher.reversalOfVoucherId) {
      continue
    }

    if (voucher.type === "receipt" || voucher.type === "payment") {
      const advanceRefs = advanceReferenceByVoucherId.get(voucher.id) ?? []

      for (const allocation of voucher.billAllocations) {
        if (allocation.referenceType !== "against_ref") {
          continue
        }

        const billRef = billReferenceByNumber.get(allocation.referenceNumber)

        if (!billRef) {
          continue
        }

        pushSettlement({
          billRef,
          voucher,
          settlementType:
            advanceRefs.length > 0 ? "advance_adjust" : allocation.amount >= billRef.balance_amount ? "full" : "partial",
          settlementAmount: allocation.amount,
          againstAdvanceRefId: advanceRefs[0] ?? null,
        })

        if (advanceRefs.length > 0) {
          const advanceRef = billReferences.find((row) => row.ref_id === advanceRefs[0])
          if (advanceRef) {
            pushSettlement({
              billRef: advanceRef,
              voucher,
              settlementType: "advance_adjust",
              settlementAmount: allocation.amount,
            })
          }
        }
      }
    }

    if (
      (voucher.type === "credit_note" || voucher.type === "sales_return") &&
      voucher.sourceDocument?.voucherNumber
    ) {
      const billRef = billReferenceByNumber.get(voucher.sourceDocument.voucherNumber)
      if (billRef) {
        pushSettlement({
          billRef,
          voucher,
          settlementType: "discount",
          settlementAmount: 0,
          discountAmount: getVoucherAmount(voucher),
        })
      }
    }

    if (
      (voucher.type === "debit_note" || voucher.type === "purchase_return") &&
      voucher.sourceDocument?.voucherNumber
    ) {
      const billRef = billReferenceByNumber.get(voucher.sourceDocument.voucherNumber)
      if (billRef) {
        pushSettlement({
          billRef,
          voucher,
          settlementType: "discount",
          settlementAmount: 0,
          discountAmount: getVoucherAmount(voucher),
        })
      }
    }
  }

  const billOverdueTracking: BillOverdueRow[] = billReferences
    .filter((reference) => reference.status !== "cancelled" && reference.balance_amount > 0)
    .map((reference) => {
      const overdueDays = reference.due_date
        ? getDaysBetween(reference.due_date, asOfDate)
        : 0
      const bucket = getAgingBucket(overdueDays)
      const status =
        reference.status === "written_off"
          ? "written_off"
          : overdueDays > 90
            ? "severely_overdue"
            : overdueDays > 0
              ? "overdue"
              : reference.due_date === asOfDate
                ? "due_today"
                : "current"

      return {
        overdue_id: `overdue:${reference.ref_id}`,
        bill_ref_id: reference.ref_id,
        ref_number: reference.ref_number,
        party_ledger_id: reference.party_ledger_id,
        party_ledger_name: reference.party_ledger_name,
        direction: reference.direction,
        voucher_id: reference.voucher_id,
        voucher_number: reference.voucher_number,
        voucher_type: reference.voucher_type,
        ref_date: reference.ref_date,
        due_date: reference.due_date,
        overdue_days: overdueDays,
        overdue_amount: roundAmount(reference.balance_amount),
        bucket_key: bucket.key,
        bucket_label: bucket.label,
        penalty_rate: 0,
        penalty_amount: 0,
        last_reminder_at: null,
        status,
        financial_year_code: reference.financial_year_code,
        created_at: reference.created_at,
        updated_at: reference.updated_at,
      }
    })

  await replaceTable(database, billingTableNames.billReferences, billReferences)
  await replaceTable(database, billingTableNames.billSettlements, billSettlements)
  await replaceTable(database, billingTableNames.billOverdueTracking, billOverdueTracking)
}
