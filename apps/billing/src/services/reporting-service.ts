import type { Kysely } from "kysely"

import type { AuthUser } from "../../../cxapp/shared/index.js"
import {
  billingAccountingReportsResponseSchema,
  type BillingAgingItem,
  type BillingAgingReport,
  type BillingBalanceSheetEntry,
  type BillingCustomerStatementEntry,
  type BillingCustomerStatementItem,
  type BillingPartySettlementSummaryItem,
  type BillingSettlementExceptionItem,
  type BillingSettlementFollowUpItem,
  type BillingSupplierStatementEntry,
  type BillingSupplierStatementItem,
  billingLedgerSchema,
  type BillingProfitAndLossEntry,
  billingVoucherSchema,
  type BillingLedgerEntry,
  type BillingLedger,
  type BillingOutstandingItem,
  type BillingVoucher,
} from "../../shared/index.js"

import { billingTableNames } from "../../database/table-names.js"

import { assertBillingViewer } from "./access.js"
import { listBillingLedgerEntries } from "./ledger-entry-store.js"
import { listStorePayloads } from "./store.js"

function roundCurrency(value: number) {
  return Number(value.toFixed(2))
}

const AGING_BUCKETS = [
  { bucketKey: "current", label: "Current" },
  { bucketKey: "1_30", label: "1-30 Days" },
  { bucketKey: "31_60", label: "31-60 Days" },
  { bucketKey: "61_90", label: "61-90 Days" },
  { bucketKey: "91_plus", label: "91+ Days" },
] as const

function toSignedAmount(
  side: BillingLedger["closingSide"],
  amount: number
) {
  return side === "debit" ? amount : -amount
}

function toBalance(amount: number) {
  return {
    side: amount >= 0 ? ("debit" as const) : ("credit" as const),
    amount: roundCurrency(Math.abs(amount)),
  }
}

function toSignedEntryAmount(side: "debit" | "credit", amount: number) {
  return side === "debit" ? amount : -amount
}

async function readLedgers(database: Kysely<unknown>) {
  return listStorePayloads(database, billingTableNames.ledgers, billingLedgerSchema)
}

async function readVouchers(database: Kysely<unknown>) {
  return listStorePayloads(database, billingTableNames.vouchers, billingVoucherSchema)
}

function getLedgerMovement(entries: BillingLedgerEntry[]) {
  const movementByLedgerId = new Map<
    string,
    {
      debitAmount: number
      creditAmount: number
      signedMovement: number
    }
  >()

  for (const entry of entries) {
    const current = movementByLedgerId.get(entry.ledgerId) ?? {
      debitAmount: 0,
      creditAmount: 0,
      signedMovement: 0,
    }

    if (entry.side === "debit") {
      current.debitAmount += entry.amount
      current.signedMovement += entry.amount
    } else {
      current.creditAmount += entry.amount
      current.signedMovement -= entry.amount
    }

    movementByLedgerId.set(entry.ledgerId, current)
  }

  return movementByLedgerId
}

function getLedgerSourceReferences(entries: BillingLedgerEntry[]) {
  const sourcesByLedgerId = new Map<
    string,
    Map<string, { voucherId: string; voucherNumber: string; entryIds: string[] }>
  >()

  for (const entry of entries) {
    let voucherMap = sourcesByLedgerId.get(entry.ledgerId)

    if (!voucherMap) {
      voucherMap = new Map()
      sourcesByLedgerId.set(entry.ledgerId, voucherMap)
    }

    const existing = voucherMap.get(entry.voucherId)

    if (existing) {
      existing.entryIds.push(entry.entryId)
      continue
    }

    voucherMap.set(entry.voucherId, {
      voucherId: entry.voucherId,
      voucherNumber: entry.voucherNumber,
      entryIds: [entry.entryId],
    })
  }

  return new Map(
    [...sourcesByLedgerId.entries()].map(([ledgerId, voucherMap]) => [
      ledgerId,
      [...voucherMap.values()].sort((left, right) =>
        left.voucherNumber.localeCompare(right.voucherNumber)
      ),
    ])
  )
}

function getInvoiceAmount(voucher: BillingVoucher) {
  if (voucher.gst) {
    return voucher.gst.invoiceAmount
  }

  const debitTotal = voucher.lines
    .filter((line) => line.side === "debit")
    .reduce((sum, line) => sum + line.amount, 0)

  return roundCurrency(debitTotal)
}

function getMaxVoucherDate(vouchers: BillingVoucher[]) {
  return vouchers.reduce(
    (latest, voucher) => (voucher.date > latest ? voucher.date : latest),
    vouchers[0]?.date ?? "1970-01-01"
  )
}

function getDaysBetween(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00.000Z`)
  const end = new Date(`${endDate}T00:00:00.000Z`)
  const diffMs = end.getTime() - start.getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

function getAgingBucket(overdueDays: number) {
  if (overdueDays <= 0) {
    return AGING_BUCKETS[0]
  }
  if (overdueDays <= 30) {
    return AGING_BUCKETS[1]
  }
  if (overdueDays <= 60) {
    return AGING_BUCKETS[2]
  }
  if (overdueDays <= 90) {
    return AGING_BUCKETS[3]
  }
  return AGING_BUCKETS[4]
}

function getVoucherAmount(voucher: BillingVoucher) {
  const debitTotal = voucher.lines
    .filter((line) => line.side === "debit")
    .reduce((sum, line) => sum + line.amount, 0)

  return roundCurrency(debitTotal)
}

function toStatementPartyKey(counterparty: string) {
  const normalized = counterparty.trim().toLowerCase().replace(/\s+/g, "-")
  return `customer:${normalized || "unknown"}`
}

function toStatementLedgerPartyKey(prefix: "customer" | "supplier", ledgerId: string) {
  return `${prefix}:${ledgerId}`
}

function getCustomerStatementParty(
  voucher: BillingVoucher,
  voucherById: Map<string, BillingVoucher>
) {
  if (voucher.sales) {
    return {
      customerId: voucher.sales.customerLedgerId,
      customerName: voucher.sales.customerLedgerName,
    }
  }

  if (voucher.type === "credit_note" && voucher.sourceDocument) {
    const sourceVoucher = voucherById.get(voucher.sourceDocument.voucherId)

    if (sourceVoucher?.sales) {
      return {
        customerId: sourceVoucher.sales.customerLedgerId,
        customerName: sourceVoucher.sales.customerLedgerName,
      }
    }
  }

  if (voucher.gst) {
    return {
      customerId: voucher.gst.partyLedgerId,
      customerName: voucher.gst.partyLedgerName,
    }
  }

  return {
    customerId: toStatementPartyKey(voucher.counterparty),
    customerName: voucher.counterparty,
  }
}

function getSupplierStatementParty(
  voucher: BillingVoucher,
  voucherById: Map<string, BillingVoucher>
) {
  if (voucher.type === "debit_note" && voucher.sourceDocument) {
    const sourceVoucher = voucherById.get(voucher.sourceDocument.voucherId)

    if (sourceVoucher?.gst) {
      return {
        supplierId: toStatementLedgerPartyKey("supplier", sourceVoucher.gst.partyLedgerId),
        supplierName: sourceVoucher.gst.partyLedgerName,
      }
    }
  }

  if (voucher.gst) {
    return {
      supplierId: toStatementLedgerPartyKey("supplier", voucher.gst.partyLedgerId),
      supplierName: voucher.gst.partyLedgerName,
    }
  }

  return {
    supplierId: `supplier:${voucher.counterparty.trim().toLowerCase().replace(/\s+/g, "-") || "unknown"}`,
    supplierName: voucher.counterparty,
  }
}

type StatementParty = {
  partyId: string
  partyName: string
}

type StatementEntryBase = {
  voucherId: string
  voucherNumber: string
  voucherType: string
  date: string
  narration: string
  referenceVoucherNumber: string | null
  debitAmount: number
  creditAmount: number
}

type OpenBillRecord = {
  voucherId: string
  voucherNumber: string
  voucherType: "sales" | "purchase"
  date: string
  dueDate: string | null
  overdueDays: number
  counterparty: string
  originalAmount: number
  settledAmount: number
  outstandingAmount: number
  netOutstandingAmount: number
}

function buildStatementItems<TEntry extends StatementEntryBase, TItem>(options: {
  buckets: Map<string, { partyId: string; partyName: string; entries: TEntry[] }>
  openingSide: "debit" | "credit"
  createItem: (input: {
    partyId: string
    partyName: string
    debitTotal: number
    creditTotal: number
    closingSide: "debit" | "credit"
    closingAmount: number
    entries: (TEntry & { runningSide: "debit" | "credit"; runningAmount: number })[]
  }) => TItem
}) {
  return [...options.buckets.values()]
    .map((party) => {
      const entries = [...party.entries].sort(
        (left, right) =>
          left.date.localeCompare(right.date) ||
          left.voucherNumber.localeCompare(right.voucherNumber)
      )

      let runningSigned = 0
      let debitTotal = 0
      let creditTotal = 0

      const runningEntries = entries.map((entry) => {
        debitTotal += entry.debitAmount
        creditTotal += entry.creditAmount
        runningSigned += entry.debitAmount - entry.creditAmount
        const running = toBalance(runningSigned)

        return {
          ...entry,
          runningSide: running.side,
          runningAmount: running.amount,
        }
      })

      const closing = toBalance(runningSigned)

      return options.createItem({
        partyId: party.partyId,
        partyName: party.partyName,
        debitTotal: roundCurrency(debitTotal),
        creditTotal: roundCurrency(creditTotal),
        closingSide: closing.side,
        closingAmount: closing.amount,
        entries: runningEntries,
      })
    })
    .sort((left, right) =>
      String((left as { customerName?: string; supplierName?: string }).customerName ?? (left as { supplierName?: string }).supplierName)
        .localeCompare(
          String((right as { customerName?: string; supplierName?: string }).customerName ?? (right as { supplierName?: string }).supplierName)
        )
    )
}

function appendStatementEntry<TEntry extends StatementEntryBase>(
  buckets: Map<string, { partyId: string; partyName: string; entries: TEntry[] }>,
  party: StatementParty,
  entry: TEntry
) {
  const bucket = buckets.get(party.partyId) ?? {
    partyId: party.partyId,
    partyName: party.partyName,
    entries: [],
  }

  bucket.entries.push(entry)
  buckets.set(party.partyId, bucket)
}

function buildCustomerStatement(
  postedVouchers: BillingVoucher[],
  voucherById: Map<string, BillingVoucher>
) {
  const buckets = new Map<
    string,
    {
      partyId: string
      partyName: string
      entries: BillingCustomerStatementEntry[]
    }
  >()

  for (const voucher of postedVouchers) {
    if (voucher.type === "sales") {
      const party = getCustomerStatementParty(voucher, voucherById)
      appendStatementEntry(buckets, { partyId: party.customerId, partyName: party.customerName }, {
        voucherId: voucher.id,
        voucherNumber: voucher.voucherNumber,
        voucherType: "sales",
        date: voucher.date,
        narration: voucher.narration,
        referenceVoucherNumber: null,
        debitAmount: getInvoiceAmount(voucher),
        creditAmount: 0,
        runningAmount: 0,
        runningSide: "debit",
      })
      continue
    }

    if (voucher.type === "credit_note") {
      const party = getCustomerStatementParty(voucher, voucherById)
      appendStatementEntry(buckets, { partyId: party.customerId, partyName: party.customerName }, {
        voucherId: voucher.id,
        voucherNumber: voucher.voucherNumber,
        voucherType: "credit_note",
        date: voucher.date,
        narration: voucher.narration,
        referenceVoucherNumber: voucher.sourceDocument?.voucherNumber ?? null,
        debitAmount: 0,
        creditAmount: getVoucherAmount(voucher),
        runningAmount: 0,
        runningSide: "debit",
      })
      continue
    }

    if (voucher.type !== "receipt") {
      continue
    }

    if (voucher.billAllocations.length > 0) {
      for (const allocation of voucher.billAllocations) {
        const sourceVoucher = postedVouchers.find(
          (candidate) =>
            candidate.voucherNumber === allocation.referenceNumber &&
            candidate.type === "sales"
        )

        const party = sourceVoucher
          ? getCustomerStatementParty(sourceVoucher, voucherById)
          : {
              customerId: toStatementPartyKey(voucher.counterparty),
              customerName: voucher.counterparty,
            }

        appendStatementEntry(buckets, { partyId: party.customerId, partyName: party.customerName }, {
          voucherId: voucher.id,
          voucherNumber: voucher.voucherNumber,
          voucherType: "receipt",
          date: voucher.date,
          narration: voucher.narration,
          referenceVoucherNumber: allocation.referenceNumber,
          debitAmount: 0,
          creditAmount: roundCurrency(allocation.amount),
          runningAmount: 0,
          runningSide: "debit",
        })
      }

      continue
    }

    appendStatementEntry(buckets, {
      partyId: toStatementPartyKey(voucher.counterparty),
      partyName: voucher.counterparty,
    }, {
      voucherId: voucher.id,
      voucherNumber: voucher.voucherNumber,
      voucherType: "receipt",
      date: voucher.date,
      narration: voucher.narration,
      referenceVoucherNumber: null,
      debitAmount: 0,
      creditAmount: getVoucherAmount(voucher),
      runningAmount: 0,
      runningSide: "debit",
    })
  }

  return {
    items: buildStatementItems({
      buckets,
      openingSide: "debit",
      createItem: ({
        partyId,
        partyName,
        debitTotal,
        creditTotal,
        closingSide,
        closingAmount,
        entries,
      }): BillingCustomerStatementItem => ({
        customerId: partyId,
        customerName: partyName,
        openingSide: "debit",
        openingAmount: 0,
        debitTotal,
        creditTotal,
        closingSide,
        closingAmount,
        entries,
      }),
    }),
  }
}

function buildSupplierStatement(
  postedVouchers: BillingVoucher[],
  voucherById: Map<string, BillingVoucher>
) {
  const buckets = new Map<
    string,
    {
      partyId: string
      partyName: string
      entries: BillingSupplierStatementEntry[]
    }
  >()

  for (const voucher of postedVouchers) {
    if (voucher.type === "purchase") {
      const party = getSupplierStatementParty(voucher, voucherById)
      appendStatementEntry(buckets, { partyId: party.supplierId, partyName: party.supplierName }, {
        voucherId: voucher.id,
        voucherNumber: voucher.voucherNumber,
        voucherType: "purchase",
        date: voucher.date,
        narration: voucher.narration,
        referenceVoucherNumber: null,
        debitAmount: 0,
        creditAmount: getInvoiceAmount(voucher),
        runningAmount: 0,
        runningSide: "credit",
      })
      continue
    }

    if (voucher.type === "debit_note") {
      const party = getSupplierStatementParty(voucher, voucherById)
      appendStatementEntry(buckets, { partyId: party.supplierId, partyName: party.supplierName }, {
        voucherId: voucher.id,
        voucherNumber: voucher.voucherNumber,
        voucherType: "debit_note",
        date: voucher.date,
        narration: voucher.narration,
        referenceVoucherNumber: voucher.sourceDocument?.voucherNumber ?? null,
        debitAmount: roundCurrency(getVoucherAmount(voucher)),
        creditAmount: 0,
        runningAmount: 0,
        runningSide: "debit",
      })
      continue
    }

    if (voucher.type !== "payment") {
      continue
    }

    if (voucher.billAllocations.length > 0) {
      for (const allocation of voucher.billAllocations) {
        const sourceVoucher = postedVouchers.find(
          (candidate) =>
            candidate.voucherNumber === allocation.referenceNumber &&
            candidate.type === "purchase"
        )

        const party = sourceVoucher
          ? getSupplierStatementParty(sourceVoucher, voucherById)
          : {
              supplierId: `supplier:${voucher.counterparty.trim().toLowerCase().replace(/\s+/g, "-") || "unknown"}`,
              supplierName: voucher.counterparty,
            }

        appendStatementEntry(buckets, { partyId: party.supplierId, partyName: party.supplierName }, {
          voucherId: voucher.id,
          voucherNumber: voucher.voucherNumber,
          voucherType: "payment",
          date: voucher.date,
          narration: voucher.narration,
          referenceVoucherNumber: allocation.referenceNumber,
          debitAmount: roundCurrency(allocation.amount),
          creditAmount: 0,
          runningAmount: 0,
          runningSide: "debit",
        })
      }

      continue
    }

    appendStatementEntry(buckets, {
      partyId: `supplier:${voucher.counterparty.trim().toLowerCase().replace(/\s+/g, "-") || "unknown"}`,
      partyName: voucher.counterparty,
    }, {
      voucherId: voucher.id,
      voucherNumber: voucher.voucherNumber,
      voucherType: "payment",
      date: voucher.date,
      narration: voucher.narration,
      referenceVoucherNumber: null,
      debitAmount: getVoucherAmount(voucher),
      creditAmount: 0,
      runningAmount: 0,
      runningSide: "debit",
    })
  }

  return {
    items: buildStatementItems({
      buckets,
      openingSide: "credit",
      createItem: ({
        partyId,
        partyName,
        debitTotal,
        creditTotal,
        closingSide,
        closingAmount,
        entries,
      }): BillingSupplierStatementItem => ({
        supplierId: partyId,
        supplierName: partyName,
        openingSide: "credit",
        openingAmount: 0,
        debitTotal,
        creditTotal,
        closingSide,
        closingAmount,
        entries,
      }),
    }),
  }
}

function getOutstandingDueDate(voucher: BillingVoucher) {
  if (voucher.type === "sales") {
    return voucher.sales?.dueDate ?? null
  }

  return null
}

function buildOpenBillRecords(postedVouchers: BillingVoucher[], asOfDate: string) {
  const openBillMap = new Map<string, OpenBillRecord>()

  for (const voucher of postedVouchers) {
    if (!["sales", "purchase"].includes(voucher.type) || voucher.reversalOfVoucherId) {
      continue
    }

    const dueDate = getOutstandingDueDate(voucher)
    const ageingBaseDate = dueDate ?? voucher.date
    const overdueDays = getDaysBetween(ageingBaseDate, asOfDate)

    openBillMap.set(voucher.voucherNumber, {
      voucherId: voucher.id,
      voucherNumber: voucher.voucherNumber,
      voucherType: voucher.type === "sales" ? "sales" : "purchase",
      date: voucher.date,
      dueDate,
      overdueDays,
      counterparty: voucher.counterparty,
      originalAmount: getInvoiceAmount(voucher),
      settledAmount: 0,
      outstandingAmount: getInvoiceAmount(voucher),
      netOutstandingAmount: getInvoiceAmount(voucher),
    })
  }

  for (const voucher of postedVouchers) {
    if (!["payment", "receipt"].includes(voucher.type)) {
      continue
    }

    for (const allocation of voucher.billAllocations) {
      const item = openBillMap.get(allocation.referenceNumber)

      if (!item) {
        continue
      }

      item.settledAmount = roundCurrency(item.settledAmount + allocation.amount)
      item.netOutstandingAmount = roundCurrency(item.originalAmount - item.settledAmount)
      item.outstandingAmount = roundCurrency(Math.max(item.netOutstandingAmount, 0))
    }
  }

  return [...openBillMap.values()].sort(
    (left, right) =>
      left.date.localeCompare(right.date) ||
      left.voucherNumber.localeCompare(right.voucherNumber)
  )
}

function buildAgingReport(
  items: OpenBillRecord[],
  voucherType: "sales" | "purchase",
  asOfDate: string
): BillingAgingReport {
  const reportItems: BillingAgingItem[] = items
    .filter((item) => item.voucherType === voucherType && item.outstandingAmount > 0)
    .map((item) => {
      const bucket = getAgingBucket(item.overdueDays)

      return {
        voucherId: item.voucherId,
        voucherNumber: item.voucherNumber,
        voucherType: item.voucherType,
        counterparty: item.counterparty,
        date: item.date,
        dueDate: item.dueDate,
        overdueDays: item.overdueDays,
        outstandingAmount: item.outstandingAmount,
        bucketKey: bucket.bucketKey,
        bucketLabel: bucket.label,
      }
    })

  const buckets = AGING_BUCKETS.map((bucket) => ({
    bucketKey: bucket.bucketKey,
    label: bucket.label,
    amount: roundCurrency(
      reportItems
        .filter((item) => item.bucketKey === bucket.bucketKey)
        .reduce((sum, item) => sum + item.outstandingAmount, 0)
    ),
  }))

  return {
    asOfDate,
    totalAmount: roundCurrency(reportItems.reduce((sum, item) => sum + item.outstandingAmount, 0)),
    buckets,
    items: reportItems.sort((left, right) => right.overdueDays - left.overdueDays),
  }
}

function buildSettlementFollowUp(items: OpenBillRecord[]) {
  return {
    items: items
      .filter((item) => item.outstandingAmount > 0)
      .map((item): BillingSettlementFollowUpItem => ({
        voucherId: item.voucherId,
        voucherNumber: item.voucherNumber,
        voucherType: item.voucherType,
        counterparty: item.counterparty,
        dueDate: item.dueDate,
        overdueDays: item.overdueDays,
        outstandingAmount: item.outstandingAmount,
        priority:
          item.overdueDays > 30
            ? "high"
            : item.overdueDays > 7
              ? "medium"
              : "normal",
        recommendedAction:
          item.voucherType === "sales"
            ? "Follow up and create receipt voucher"
            : "Follow up and create payment voucher",
        actionRoute:
          item.voucherType === "sales"
            ? "/dashboard/billing/receipt-vouchers/new"
            : "/dashboard/billing/payment-vouchers/new",
      }))
      .sort(
        (left, right) =>
          right.overdueDays - left.overdueDays ||
          right.outstandingAmount - left.outstandingAmount
      ),
  }
}

function buildSettlementExceptions(
  postedVouchers: BillingVoucher[],
  openBills: OpenBillRecord[]
) {
  const items: BillingSettlementExceptionItem[] = []

  for (const voucher of postedVouchers) {
    if (!["payment", "receipt"].includes(voucher.type)) {
      continue
    }

    for (const allocation of voucher.billAllocations) {
      if (allocation.referenceType === "against_ref") {
        continue
      }

      items.push({
        voucherId: voucher.id,
        voucherNumber: voucher.voucherNumber,
        voucherType: voucher.type,
        counterparty: voucher.counterparty,
        category: allocation.referenceType === "new_ref" ? "advance" : "on_account",
        amount: roundCurrency(allocation.amount),
        referenceVoucherNumber: allocation.referenceNumber,
        note:
          allocation.referenceType === "new_ref"
            ? "Advance settlement recorded before invoice matching."
            : "On-account settlement awaiting bill matching.",
      })
    }
  }

  for (const item of openBills) {
    if (item.netOutstandingAmount >= 0) {
      continue
    }

    items.push({
      voucherId: item.voucherId,
      voucherNumber: item.voucherNumber,
      voucherType: item.voucherType,
      counterparty: item.counterparty,
      category: "overpayment",
      amount: roundCurrency(Math.abs(item.netOutstandingAmount)),
      referenceVoucherNumber: item.voucherNumber,
      note: "Settlements exceed the original bill amount.",
    })
  }

  return {
    advanceTotal: roundCurrency(
      items.filter((item) => item.category === "advance").reduce((sum, item) => sum + item.amount, 0)
    ),
    onAccountTotal: roundCurrency(
      items.filter((item) => item.category === "on_account").reduce((sum, item) => sum + item.amount, 0)
    ),
    overpaymentTotal: roundCurrency(
      items.filter((item) => item.category === "overpayment").reduce((sum, item) => sum + item.amount, 0)
    ),
    items,
  }
}

function buildPartySettlementSummary(postedVouchers: BillingVoucher[]) {
  const summaryByCounterparty = new Map<string, BillingPartySettlementSummaryItem>()

  for (const voucher of postedVouchers) {
    if (!["payment", "receipt"].includes(voucher.type)) {
      continue
    }

    const current = summaryByCounterparty.get(voucher.counterparty) ?? {
      counterparty: voucher.counterparty,
      receiptCount: 0,
      paymentCount: 0,
      receiptAmount: 0,
      paymentAmount: 0,
      allocatedReceiptAmount: 0,
      allocatedPaymentAmount: 0,
      unallocatedReceiptAmount: 0,
      unallocatedPaymentAmount: 0,
    }

    const voucherAmount = getVoucherAmount(voucher)
    const allocatedAmount = roundCurrency(
      voucher.billAllocations.reduce((sum, allocation) => sum + allocation.amount, 0)
    )
    const unallocatedAmount = roundCurrency(Math.max(voucherAmount - allocatedAmount, 0))

    if (voucher.type === "receipt") {
      current.receiptCount += 1
      current.receiptAmount = roundCurrency(current.receiptAmount + voucherAmount)
      current.allocatedReceiptAmount = roundCurrency(
        current.allocatedReceiptAmount + allocatedAmount
      )
      current.unallocatedReceiptAmount = roundCurrency(
        current.unallocatedReceiptAmount + unallocatedAmount
      )
    } else {
      current.paymentCount += 1
      current.paymentAmount = roundCurrency(current.paymentAmount + voucherAmount)
      current.allocatedPaymentAmount = roundCurrency(
        current.allocatedPaymentAmount + allocatedAmount
      )
      current.unallocatedPaymentAmount = roundCurrency(
        current.unallocatedPaymentAmount + unallocatedAmount
      )
    }

    summaryByCounterparty.set(voucher.counterparty, current)
  }

  return {
    items: [...summaryByCounterparty.values()].sort((left, right) =>
      left.counterparty.localeCompare(right.counterparty)
    ),
  }
}

export async function getBillingAccountingReports(
  database: Kysely<unknown>,
  user: AuthUser
) {
  assertBillingViewer(user)

  const [ledgers, vouchers, ledgerEntries] = await Promise.all([
    readLedgers(database),
    readVouchers(database),
    listBillingLedgerEntries(database).then((response) => response.items),
  ])
  const postedVouchers = vouchers.filter((voucher) => voucher.status === "posted")
  const voucherById = new Map(vouchers.map((voucher) => [voucher.id, voucher]))
  const asOfDate = getMaxVoucherDate(postedVouchers)
  const movementByLedgerId = getLedgerMovement(ledgerEntries)
  const sourceReferencesByLedgerId = getLedgerSourceReferences(ledgerEntries)

  const trialBalanceItems = ledgers
    .map((ledger) => {
      const openingSigned = toSignedAmount(ledger.closingSide, ledger.closingAmount)
      const movement = movementByLedgerId.get(ledger.id) ?? {
        debitAmount: 0,
        creditAmount: 0,
        signedMovement: 0,
      }
      const closingSigned = openingSigned + movement.signedMovement
      const closing = toBalance(closingSigned)

      return {
        ledgerId: ledger.id,
        ledgerName: ledger.name,
        group: ledger.group,
        nature: ledger.nature,
        openingSide: ledger.closingSide,
        openingAmount: roundCurrency(ledger.closingAmount),
        debitAmount: roundCurrency(movement.debitAmount),
        creditAmount: roundCurrency(movement.creditAmount),
        closingSide: closing.side,
        closingAmount: closing.amount,
        sourceReferences: sourceReferencesByLedgerId.get(ledger.id) ?? [],
      }
    })
    .sort((left, right) => left.ledgerName.localeCompare(right.ledgerName))

  const generalLedgerItems = ledgers
    .map((ledger) => {
      const openingSigned = toSignedAmount(ledger.closingSide, ledger.closingAmount)
      const ledgerEntriesForLedger = ledgerEntries
        .filter((entry) => entry.ledgerId === ledger.id)
        .sort((left, right) =>
          left.voucherDate.localeCompare(right.voucherDate) ||
          left.voucherNumber.localeCompare(right.voucherNumber) ||
          left.entryOrder - right.entryOrder
        )

      let runningSigned = openingSigned
      let debitTotal = 0
      let creditTotal = 0

      const entries = ledgerEntriesForLedger.map((entry) => {
        if (entry.side === "debit") {
          debitTotal += entry.amount
        } else {
          creditTotal += entry.amount
        }

        runningSigned += toSignedEntryAmount(entry.side, entry.amount)
        const running = toBalance(runningSigned)

        return {
          entryId: entry.entryId,
          voucherId: entry.voucherId,
          voucherNumber: entry.voucherNumber,
          voucherType: entry.voucherType,
          voucherDate: entry.voucherDate,
          counterparty: entry.counterparty,
          narration: entry.narration,
          side: entry.side,
          amount: roundCurrency(entry.amount),
          runningSide: running.side,
          runningAmount: running.amount,
        }
      })

      const closing = toBalance(runningSigned)

      return {
        ledgerId: ledger.id,
        ledgerName: ledger.name,
        group: ledger.group,
        openingSide: ledger.closingSide,
        openingAmount: roundCurrency(ledger.closingAmount),
        debitTotal: roundCurrency(debitTotal),
        creditTotal: roundCurrency(creditTotal),
        closingSide: closing.side,
        closingAmount: closing.amount,
        entries,
      }
    })
    .sort((left, right) => left.ledgerName.localeCompare(right.ledgerName))

  const profitAndLoss = trialBalanceItems.reduce(
    (result, item) => {
      if (item.nature === "income") {
        result.incomeItems.push({
          ledgerId: item.ledgerId,
          ledgerName: item.ledgerName,
          group: item.group,
          amount: item.closingAmount,
          sourceReferences: item.sourceReferences,
        })
        result.totalIncome += item.closingAmount
      }

      if (item.nature === "expense") {
        result.expenseItems.push({
          ledgerId: item.ledgerId,
          ledgerName: item.ledgerName,
          group: item.group,
          amount: item.closingAmount,
          sourceReferences: item.sourceReferences,
        })
        result.totalExpense += item.closingAmount
      }

      return result
    },
    {
      incomeItems: [] as BillingProfitAndLossEntry[],
      expenseItems: [] as BillingProfitAndLossEntry[],
      totalIncome: 0,
      totalExpense: 0,
    }
  )

  const totalIncome = roundCurrency(profitAndLoss.totalIncome)
  const totalExpense = roundCurrency(profitAndLoss.totalExpense)
  const netProfit = roundCurrency(Math.max(totalIncome - totalExpense, 0))
  const netLoss = roundCurrency(Math.max(totalExpense - totalIncome, 0))

  const balanceSheet = trialBalanceItems.reduce(
    (result, item) => {
      if (item.nature === "asset") {
        result.assetItems.push({
          ledgerId: item.ledgerId,
          ledgerName: item.ledgerName,
          group: item.group,
          amount: item.closingAmount,
          sourceReferences: item.sourceReferences,
        })
        result.totalAssets += item.closingAmount
      }

      if (item.nature === "liability") {
        result.liabilityItems.push({
          ledgerId: item.ledgerId,
          ledgerName: item.ledgerName,
          group: item.group,
          amount: item.closingAmount,
          sourceReferences: item.sourceReferences,
        })
        result.totalLiabilities += item.closingAmount
      }

      return result
    },
    {
      assetItems: [] as BillingBalanceSheetEntry[],
      liabilityItems: [] as BillingBalanceSheetEntry[],
      totalAssets: 0,
      totalLiabilities: 0,
    }
  )

  if (netProfit > 0) {
    balanceSheet.liabilityItems.push({
      ledgerId: "derived-current-period-profit",
      ledgerName: "Current Period Profit",
      group: "Current Earnings",
      amount: netProfit,
      sourceReferences: [],
    })
    balanceSheet.totalLiabilities += netProfit
  } else if (netLoss > 0) {
    balanceSheet.assetItems.push({
      ledgerId: "derived-current-period-loss",
      ledgerName: "Current Period Loss",
      group: "Current Earnings",
      amount: netLoss,
      sourceReferences: [],
    })
    balanceSheet.totalAssets += netLoss
  }

  const openBillRecords = buildOpenBillRecords(postedVouchers, asOfDate)
  const outstandingItems = openBillRecords
    .filter((item) => item.outstandingAmount > 0)
    .map((item) => ({
      voucherId: item.voucherId,
      voucherNumber: item.voucherNumber,
      voucherType: item.voucherType,
      date: item.date,
      dueDate: item.dueDate,
      overdueDays: item.overdueDays,
      counterparty: item.counterparty,
      originalAmount: item.originalAmount,
      settledAmount: item.settledAmount,
      outstandingAmount: item.outstandingAmount,
    }))
    .sort((left, right) => left.date.localeCompare(right.date))
  const receivableTotal = roundCurrency(
    outstandingItems
      .filter((item) => item.voucherType === "sales")
      .reduce((sum, item) => sum + item.outstandingAmount, 0)
  )
  const payableTotal = roundCurrency(
    outstandingItems
      .filter((item) => item.voucherType === "purchase")
      .reduce((sum, item) => sum + item.outstandingAmount, 0)
  )

  return billingAccountingReportsResponseSchema.parse({
    item: {
      trialBalance: {
        items: trialBalanceItems,
        debitTotal: roundCurrency(
          trialBalanceItems
            .filter((item) => item.closingSide === "debit")
            .reduce((sum, item) => sum + item.closingAmount, 0)
        ),
        creditTotal: roundCurrency(
          trialBalanceItems
            .filter((item) => item.closingSide === "credit")
            .reduce((sum, item) => sum + item.closingAmount, 0)
        ),
      },
      profitAndLoss: {
        incomeItems: profitAndLoss.incomeItems.sort((left, right) =>
          left.ledgerName.localeCompare(right.ledgerName)
        ),
        expenseItems: profitAndLoss.expenseItems.sort((left, right) =>
          left.ledgerName.localeCompare(right.ledgerName)
        ),
        totalIncome,
        totalExpense,
        netProfit,
        netLoss,
      },
      balanceSheet: {
        assetItems: balanceSheet.assetItems.sort((left, right) =>
          left.ledgerName.localeCompare(right.ledgerName)
        ),
        liabilityItems: balanceSheet.liabilityItems.sort((left, right) =>
          left.ledgerName.localeCompare(right.ledgerName)
        ),
        totalAssets: roundCurrency(balanceSheet.totalAssets),
        totalLiabilities: roundCurrency(balanceSheet.totalLiabilities),
        balanceGap: roundCurrency(
          Math.abs(balanceSheet.totalAssets - balanceSheet.totalLiabilities)
        ),
      },
      outstanding: {
        asOfDate,
        receivableTotal,
        payableTotal,
        items: outstandingItems,
      },
      receivableAging: buildAgingReport(openBillRecords, "sales", asOfDate),
      payableAging: buildAgingReport(openBillRecords, "purchase", asOfDate),
      settlementFollowUp: buildSettlementFollowUp(openBillRecords),
      settlementExceptions: buildSettlementExceptions(postedVouchers, openBillRecords),
      partySettlementSummary: buildPartySettlementSummary(postedVouchers),
      generalLedger: {
        items: generalLedgerItems,
      },
      bankBook: {
        items: generalLedgerItems.filter((item) => item.group === "Bank Accounts"),
      },
      cashBook: {
        items: generalLedgerItems.filter((item) => item.group === "Cash-in-Hand"),
      },
      bankReconciliation: (() => {
        const bankLedgers = generalLedgerItems.filter((item) => item.group === "Bank Accounts")
        const ledgers = bankLedgers.map((item) => {
          const enrichedEntries = item.entries.map((entry) => {
            const reconciliation = voucherById.get(entry.voucherId)?.bankReconciliation ?? {
              status: "not_applicable" as const,
              clearedDate: null,
              statementReference: null,
              statementAmount: null,
              mismatchAmount: null,
              note: "",
            }

            return {
              entryId: entry.entryId,
              voucherId: entry.voucherId,
              voucherNumber: entry.voucherNumber,
              voucherType: entry.voucherType,
              voucherDate: entry.voucherDate,
              counterparty: entry.counterparty,
              narration: entry.narration,
              side: entry.side,
              amount: entry.amount,
              reconciliationStatus: reconciliation.status,
              clearedDate: reconciliation.clearedDate,
              statementReference: reconciliation.statementReference,
              statementAmount: reconciliation.statementAmount,
              mismatchAmount: reconciliation.mismatchAmount,
              pendingAgeDays:
                reconciliation.status === "pending"
                  ? getDaysBetween(entry.voucherDate, asOfDate)
                  : null,
              note: reconciliation.note,
            }
          })
          const matchedEntries = enrichedEntries.filter(
            (entry) => entry.reconciliationStatus === "matched"
          )
          const pendingEntries = enrichedEntries.filter(
            (entry) => entry.reconciliationStatus === "pending"
          )
          const mismatchedEntries = enrichedEntries.filter(
            (entry) => entry.reconciliationStatus === "mismatch"
          )

          return {
            ledgerId: item.ledgerId,
            ledgerName: item.ledgerName,
            openingSide: item.openingSide,
            openingAmount: item.openingAmount,
            closingSide: item.closingSide,
            closingAmount: item.closingAmount,
            matchedEntryCount: matchedEntries.length,
            matchedDebitTotal: roundCurrency(
              matchedEntries
                .filter((entry) => entry.side === "debit")
                .reduce((sum, entry) => sum + entry.amount, 0)
            ),
            matchedCreditTotal: roundCurrency(
              matchedEntries
                .filter((entry) => entry.side === "credit")
                .reduce((sum, entry) => sum + entry.amount, 0)
            ),
            pendingDebitTotal: roundCurrency(
              pendingEntries
                .filter((entry) => entry.side === "debit")
                .reduce((sum, entry) => sum + entry.amount, 0)
            ),
            pendingCreditTotal: roundCurrency(
              pendingEntries
                .filter((entry) => entry.side === "credit")
                .reduce((sum, entry) => sum + entry.amount, 0)
            ),
            oldestPendingDays: pendingEntries.reduce(
              (max, entry) => Math.max(max, entry.pendingAgeDays ?? 0),
              0
            ),
            mismatchEntryCount: mismatchedEntries.length,
            mismatchAmountTotal: roundCurrency(
              mismatchedEntries.reduce(
                (sum, entry) => sum + (entry.mismatchAmount ?? 0),
                0
              )
            ),
            matchedEntries,
            pendingEntries,
            mismatchedEntries,
          }
        })

        return {
          asOfDate,
          matchedEntryCount: ledgers.reduce((sum, ledger) => sum + ledger.matchedEntryCount, 0),
          matchedDebitTotal: roundCurrency(
            ledgers.reduce((sum, ledger) => sum + ledger.matchedDebitTotal, 0)
          ),
          matchedCreditTotal: roundCurrency(
            ledgers.reduce((sum, ledger) => sum + ledger.matchedCreditTotal, 0)
          ),
          pendingEntryCount: ledgers.reduce((sum, ledger) => sum + ledger.pendingEntries.length, 0),
          pendingDebitTotal: roundCurrency(
            ledgers.reduce((sum, ledger) => sum + ledger.pendingDebitTotal, 0)
          ),
          pendingCreditTotal: roundCurrency(
            ledgers.reduce((sum, ledger) => sum + ledger.pendingCreditTotal, 0)
          ),
          oldestPendingDays: ledgers.reduce(
            (max, ledger) => Math.max(max, ledger.oldestPendingDays),
            0
          ),
          mismatchEntryCount: ledgers.reduce(
            (sum, ledger) => sum + ledger.mismatchEntryCount,
            0
          ),
          mismatchAmountTotal: roundCurrency(
            ledgers.reduce((sum, ledger) => sum + ledger.mismatchAmountTotal, 0)
          ),
          ledgers,
        }
      })(),
      customerStatement: buildCustomerStatement(postedVouchers, voucherById),
      supplierStatement: buildSupplierStatement(postedVouchers, voucherById),
    },
  })
}
