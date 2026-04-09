import type { Kysely } from "kysely"

import type { AuthUser } from "../../../cxapp/shared/index.js"
import type { ServerConfig } from "../../../framework/src/runtime/config/index.js"
import { listJsonStorePayloads } from "../../../framework/src/runtime/database/process/json-store.js"
import {
  billingAccountingReportsResponseSchema,
  type BillingAccountingExceptionItem,
  type BillingAgingItem,
  type BillingAgingReport,
  type BillingBalanceSheetEntry,
  type BillingFinanceDashboard,
  type BillingInventoryAuthority,
  type BillingMonthEndChecklist,
  type BillingCustomerStatementEntry,
  type BillingCustomerStatementItem,
  type BillingPartySettlementSummaryItem,
  type BillingStockAccountingRule,
  type BillingStockLedgerEntry,
  type BillingStockValuationPolicy,
  type BillingStockValuationReport,
  type BillingWarehouseStockPositionItem,
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
import { listCommonModuleItems } from "../../../core/src/services/common-module-service.js"
import { productSchema, type Product } from "../../../core/shared/index.js"

import { billingTableNames } from "../../database/table-names.js"
import { coreTableNames } from "../../../core/database/table-names.js"

import { assertBillingViewer } from "./access.js"
import { listBillingLedgerEntries } from "./ledger-entry-store.js"
import { listStorePayloads } from "./store.js"
import { projectBillingInventory } from "./inventory-bridge-service.js"
import { getBillingOpeningBalanceRolloverPolicy } from "./opening-balance-rollover-service.js"
import { getBillingYearEndAdjustmentControlPolicy } from "./year-end-control-service.js"
import { getBillingYearCloseWorkflow } from "./year-close-service.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

type VoucherHeaderProjectionRow = {
  voucher_id: string
  status: string
  counterparty: string
  narration: string
  source_voucher_number: string | null
  reversal_of_voucher_id: string | null
}

type BillReferenceProjectionRow = {
  ref_id: string
  ref_number: string
  due_date: string | null
  party_ledger_name: string
  voucher_id: string
  voucher_number: string
  voucher_type: string
  voucher_date: string
  ref_type: string
  original_amount: number
  settled_amount: number
  balance_amount: number
}

type BillOverdueProjectionRow = {
  bill_ref_id: string
  overdue_days: number
}

type ReceiptVoucherProjectionRow = {
  voucher_id: string
  party_ledger_name: string
  receipt_amount: number
}

type PaymentVoucherProjectionRow = {
  voucher_id: string
  party_ledger_name: string
  payment_amount: number
}

type ReceiptAllocationProjectionRow = {
  voucher_id: string
  allocated_amount: number
}

type PaymentAllocationProjectionRow = {
  voucher_id: string
  allocated_amount: number
}

type SalesVoucherProjectionRow = {
  voucher_id: string
  voucher_number: string
  voucher_date: string
  status: string
  taxable_amount: number
  tax_amount: number
  net_amount: number
  place_of_supply: string | null
}

type PurchaseVoucherProjectionRow = {
  voucher_id: string
  voucher_number: string
  voucher_date: string
  status: string
  taxable_amount: number
  tax_amount: number
  net_amount: number
  place_of_supply: string | null
}

type SalesItemProjectionRow = {
  voucher_id: string
  line_order: number
  hsn_or_sac: string
  taxable_amount: number
  tax_rate: number
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  total_tax_amount: number
  supply_type: string | null
  place_of_supply: string | null
}

type PurchaseItemProjectionRow = {
  voucher_id: string
  line_order: number
  hsn_or_sac: string
  taxable_amount: number
  tax_rate: number
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  total_tax_amount: number
  supply_type: string | null
  place_of_supply: string | null
}

function asDb(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

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

async function readVoucherHeaderRows(database: Kysely<unknown>) {
  return (await asDb(database)
    .selectFrom(billingTableNames.voucherHeaders)
    .select([
      "voucher_id",
      "status",
      "counterparty",
      "narration",
      "source_voucher_number",
      "reversal_of_voucher_id",
    ])
    .execute()) as VoucherHeaderProjectionRow[]
}

async function readBillReferenceRows(database: Kysely<unknown>) {
  return (await asDb(database)
    .selectFrom(billingTableNames.billReferences)
    .select([
      "ref_id",
      "ref_number",
      "due_date",
      "party_ledger_name",
      "voucher_id",
      "voucher_number",
      "voucher_type",
      "voucher_date",
      "ref_type",
      "original_amount",
      "settled_amount",
      "balance_amount",
    ])
    .execute()) as BillReferenceProjectionRow[]
}

async function readBillOverdueRows(database: Kysely<unknown>) {
  return (await asDb(database)
    .selectFrom(billingTableNames.billOverdueTracking)
    .select(["bill_ref_id", "overdue_days"])
    .execute()) as BillOverdueProjectionRow[]
}

async function readReceiptVoucherRows(database: Kysely<unknown>) {
  return (await asDb(database)
    .selectFrom(billingTableNames.receiptVouchers)
    .select(["voucher_id", "party_ledger_name", "receipt_amount"])
    .execute()) as ReceiptVoucherProjectionRow[]
}

async function readPaymentVoucherRows(database: Kysely<unknown>) {
  return (await asDb(database)
    .selectFrom(billingTableNames.paymentVouchers)
    .select(["voucher_id", "party_ledger_name", "payment_amount"])
    .execute()) as PaymentVoucherProjectionRow[]
}

async function readReceiptAllocationRows(database: Kysely<unknown>) {
  return (await asDb(database)
    .selectFrom(billingTableNames.receiptItemVouchers)
    .select(["voucher_id", "allocated_amount"])
    .execute()) as ReceiptAllocationProjectionRow[]
}

async function readPaymentAllocationRows(database: Kysely<unknown>) {
  return (await asDb(database)
    .selectFrom(billingTableNames.paymentItemVouchers)
    .select(["voucher_id", "allocated_amount"])
    .execute()) as PaymentAllocationProjectionRow[]
}

async function readSalesVoucherRows(database: Kysely<unknown>) {
  return (await asDb(database)
    .selectFrom(billingTableNames.salesVouchers)
    .select([
      "voucher_id",
      "voucher_number",
      "voucher_date",
      "status",
      "taxable_amount",
      "tax_amount",
      "net_amount",
      "place_of_supply",
    ])
    .execute()) as SalesVoucherProjectionRow[]
}

async function readPurchaseVoucherRows(database: Kysely<unknown>) {
  return (await asDb(database)
    .selectFrom(billingTableNames.purchaseVouchers)
    .select([
      "voucher_id",
      "voucher_number",
      "voucher_date",
      "status",
      "taxable_amount",
      "tax_amount",
      "net_amount",
      "place_of_supply",
    ])
    .execute()) as PurchaseVoucherProjectionRow[]
}

async function readSalesItemRows(database: Kysely<unknown>) {
  return (await asDb(database)
    .selectFrom(billingTableNames.salesItemVouchers)
    .select([
      "voucher_id",
      "line_order",
      "hsn_or_sac",
      "taxable_amount",
      "tax_rate",
      "cgst_amount",
      "sgst_amount",
      "igst_amount",
      "total_tax_amount",
      "supply_type",
      "place_of_supply",
    ])
    .execute()) as SalesItemProjectionRow[]
}

async function readPurchaseItemRows(database: Kysely<unknown>) {
  return (await asDb(database)
    .selectFrom(billingTableNames.purchaseItemVouchers)
    .select([
      "voucher_id",
      "line_order",
      "hsn_or_sac",
      "taxable_amount",
      "tax_rate",
      "cgst_amount",
      "sgst_amount",
      "igst_amount",
      "total_tax_amount",
      "supply_type",
      "place_of_supply",
    ])
    .execute()) as PurchaseItemProjectionRow[]
}

async function readProducts(database: Kysely<unknown>) {
  const items = await listJsonStorePayloads<Product>(database, coreTableNames.products)
  return items.map((item) =>
    productSchema.parse({
      ...item,
      attributeCount:
        typeof (item as { attributeCount?: unknown }).attributeCount === "number"
          ? (item as { attributeCount: number }).attributeCount
          : Array.isArray((item as { attributes?: unknown }).attributes)
            ? ((item as { attributes: unknown[] }).attributes?.length ?? 0)
            : 0,
      totalStockQuantity:
        typeof (item as { totalStockQuantity?: unknown }).totalStockQuantity === "number"
          ? (item as { totalStockQuantity: number }).totalStockQuantity
          : [
              ...(
                Array.isArray((item as { stockItems?: unknown }).stockItems)
                  ? ((item as { stockItems: Array<{ quantity?: unknown }> }).stockItems ?? [])
                  : []
              ),
            ].reduce(
              (sum, stockItem) =>
                sum + (typeof stockItem.quantity === "number" ? stockItem.quantity : 0),
              0
            ) +
            (
              Array.isArray((item as { variants?: unknown }).variants)
                ? ((item as { variants: Array<{ stockQuantity?: unknown }> }).variants ?? [])
                : []
            ).reduce(
              (sum, variant) =>
                sum + (typeof variant.stockQuantity === "number" ? variant.stockQuantity : 0),
              0
            ),
    })
  )
}

async function readWarehouses(database: Kysely<unknown>) {
  const response = await listCommonModuleItems(database, "warehouses")
  return response.items
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

  if (
    (voucher.type === "credit_note" || voucher.type === "sales_return") &&
    voucher.sourceDocument
  ) {
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
  if (
    (voucher.type === "debit_note" || voucher.type === "purchase_return") &&
    voucher.sourceDocument
  ) {
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

    if (voucher.type === "credit_note" || voucher.type === "sales_return") {
      const party = getCustomerStatementParty(voucher, voucherById)
      appendStatementEntry(buckets, { partyId: party.customerId, partyName: party.customerName }, {
        voucherId: voucher.id,
        voucherNumber: voucher.voucherNumber,
        voucherType: voucher.type,
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

    if (voucher.type === "debit_note" || voucher.type === "purchase_return") {
      const party = getSupplierStatementParty(voucher, voucherById)
      appendStatementEntry(buckets, { partyId: party.supplierId, partyName: party.supplierName }, {
        voucherId: voucher.id,
        voucherNumber: voucher.voucherNumber,
        voucherType: voucher.type,
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

function buildHeaderMap(rows: VoucherHeaderProjectionRow[]) {
  return new Map(rows.map((row) => [row.voucher_id, row]))
}

function buildOpenBillRecords(
  billReferences: BillReferenceProjectionRow[],
  overdueRows: BillOverdueProjectionRow[],
  headers: Map<string, VoucherHeaderProjectionRow>,
  asOfDate: string
) {
  const overdueByBillRefId = new Map(
    overdueRows.map((row) => [row.bill_ref_id, row])
  )

  return billReferences
    .filter(
      (reference) => {
        const header = headers.get(reference.voucher_id)
        return (
          (reference.voucher_type === "sales" || reference.voucher_type === "purchase") &&
          header?.status === "posted" &&
          header.reversal_of_voucher_id === null
        )
      }
    )
    .map((reference): OpenBillRecord => {
      const dueDate = reference.due_date
      const overdueDays =
        dueDate === null
          ? getDaysBetween(reference.voucher_date, asOfDate)
          : (overdueByBillRefId.get(reference.ref_id)?.overdue_days ??
            getDaysBetween(dueDate, asOfDate))

      return {
        voucherId: reference.voucher_id,
        voucherNumber: reference.voucher_number,
        voucherType: reference.voucher_type === "sales" ? "sales" : "purchase",
        date: reference.voucher_date,
        dueDate,
        overdueDays,
        counterparty:
          headers.get(reference.voucher_id)?.counterparty ?? reference.party_ledger_name,
        originalAmount: roundCurrency(reference.original_amount),
        settledAmount: roundCurrency(reference.settled_amount),
        outstandingAmount: roundCurrency(Math.max(reference.balance_amount, 0)),
        netOutstandingAmount: roundCurrency(
          reference.original_amount - reference.settled_amount
        ),
      }
    })
    .sort(
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
  billReferences: BillReferenceProjectionRow[],
  openBills: OpenBillRecord[],
  headers: Map<string, VoucherHeaderProjectionRow>
) {
  const items: BillingSettlementExceptionItem[] = []

  for (const reference of billReferences) {
    const header = headers.get(reference.voucher_id)
    if (
      (reference.voucher_type !== "payment" && reference.voucher_type !== "receipt") ||
      reference.ref_type === "against_ref" ||
      header?.status !== "posted" ||
      header.reversal_of_voucher_id !== null
    ) {
      continue
    }

    items.push({
      voucherId: reference.voucher_id,
      voucherNumber: reference.voucher_number,
      voucherType: reference.voucher_type,
      counterparty: header?.counterparty ?? reference.party_ledger_name,
      category: reference.ref_type === "new_ref" ? "advance" : "on_account",
      amount: roundCurrency(reference.original_amount),
      referenceVoucherNumber: reference.ref_number,
      note:
        reference.ref_type === "new_ref"
          ? "Advance settlement recorded before invoice matching."
          : "On-account settlement awaiting bill matching.",
    })
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

function buildPartySettlementSummary(
  receiptVouchers: ReceiptVoucherProjectionRow[],
  paymentVouchers: PaymentVoucherProjectionRow[],
  receiptAllocations: ReceiptAllocationProjectionRow[],
  paymentAllocations: PaymentAllocationProjectionRow[],
  headers: Map<string, VoucherHeaderProjectionRow>
) {
  const summaryByCounterparty = new Map<string, BillingPartySettlementSummaryItem>()

  const receiptAllocatedByVoucherId = new Map<string, number>()
  for (const item of receiptAllocations) {
    receiptAllocatedByVoucherId.set(
      item.voucher_id,
      roundCurrency(
        (receiptAllocatedByVoucherId.get(item.voucher_id) ?? 0) + item.allocated_amount
      )
    )
  }

  const paymentAllocatedByVoucherId = new Map<string, number>()
  for (const item of paymentAllocations) {
    paymentAllocatedByVoucherId.set(
      item.voucher_id,
      roundCurrency(
        (paymentAllocatedByVoucherId.get(item.voucher_id) ?? 0) + item.allocated_amount
      )
    )
  }

  for (const voucher of receiptVouchers) {
    const header = headers.get(voucher.voucher_id)
    if (header?.status !== "posted" || header.reversal_of_voucher_id !== null) {
      continue
    }

    const counterparty = header.counterparty || voucher.party_ledger_name
    const current = summaryByCounterparty.get(counterparty) ?? {
      counterparty,
      receiptCount: 0,
      paymentCount: 0,
      receiptAmount: 0,
      paymentAmount: 0,
      allocatedReceiptAmount: 0,
      allocatedPaymentAmount: 0,
      unallocatedReceiptAmount: 0,
      unallocatedPaymentAmount: 0,
    }

    const voucherAmount = roundCurrency(voucher.receipt_amount)
    const allocatedAmount = receiptAllocatedByVoucherId.get(voucher.voucher_id) ?? 0
    const unallocatedAmount = roundCurrency(Math.max(voucherAmount - allocatedAmount, 0))

    current.receiptCount += 1
    current.receiptAmount = roundCurrency(current.receiptAmount + voucherAmount)
    current.allocatedReceiptAmount = roundCurrency(
      current.allocatedReceiptAmount + allocatedAmount
    )
    current.unallocatedReceiptAmount = roundCurrency(
      current.unallocatedReceiptAmount + unallocatedAmount
    )

    summaryByCounterparty.set(counterparty, current)
  }

  for (const voucher of paymentVouchers) {
    const header = headers.get(voucher.voucher_id)
    if (header?.status !== "posted" || header.reversal_of_voucher_id !== null) {
      continue
    }

    const counterparty = header.counterparty || voucher.party_ledger_name
    const current = summaryByCounterparty.get(counterparty) ?? {
      counterparty,
      receiptCount: 0,
      paymentCount: 0,
      receiptAmount: 0,
      paymentAmount: 0,
      allocatedReceiptAmount: 0,
      allocatedPaymentAmount: 0,
      unallocatedReceiptAmount: 0,
      unallocatedPaymentAmount: 0,
    }

    const voucherAmount = roundCurrency(voucher.payment_amount)
    const allocatedAmount = paymentAllocatedByVoucherId.get(voucher.voucher_id) ?? 0
    const unallocatedAmount = roundCurrency(Math.max(voucherAmount - allocatedAmount, 0))

    current.paymentCount += 1
    current.paymentAmount = roundCurrency(current.paymentAmount + voucherAmount)
    current.allocatedPaymentAmount = roundCurrency(
      current.allocatedPaymentAmount + allocatedAmount
    )
    current.unallocatedPaymentAmount = roundCurrency(
      current.unallocatedPaymentAmount + unallocatedAmount
    )

    summaryByCounterparty.set(counterparty, current)
  }

  return {
    items: [...summaryByCounterparty.values()].sort((left, right) =>
      left.counterparty.localeCompare(right.counterparty)
    ),
  }
}

function buildGstSalesRegister(
  salesVouchers: SalesVoucherProjectionRow[],
  salesItems: SalesItemProjectionRow[],
  headers: Map<string, VoucherHeaderProjectionRow>,
  voucherById: Map<string, BillingVoucher>,
  asOfDate: string
) {
  const itemRowsByVoucherId = new Map<string, SalesItemProjectionRow[]>()
  for (const item of salesItems) {
    const current = itemRowsByVoucherId.get(item.voucher_id) ?? []
    current.push(item)
    itemRowsByVoucherId.set(item.voucher_id, current)
  }

  const items = salesVouchers
    .filter((voucher) => {
      const sourceVoucher = voucherById.get(voucher.voucher_id)
      const header = headers.get(voucher.voucher_id)
      return (
        voucher.status === "posted" &&
        header?.reversal_of_voucher_id === null &&
        sourceVoucher?.gst?.taxDirection === "output"
      )
    })
    .map((voucher) => {
      const sourceVoucher = voucherById.get(voucher.voucher_id)
      const voucherType = sourceVoucher?.type ?? "sales"
      const direction =
        voucherType === "credit_note" || voucherType === "sales_return" ? -1 : 1
      const itemRows = [...(itemRowsByVoucherId.get(voucher.voucher_id) ?? [])].sort(
        (left, right) => left.line_order - right.line_order
      )
      const firstItem = itemRows[0]

      return {
        voucherId: voucher.voucher_id,
        voucherNumber: voucher.voucher_number,
        voucherType,
        documentLabel:
          voucherType === "credit_note"
            ? "credit_note"
            : voucherType === "sales_return"
              ? "sales_return"
              : "tax_invoice",
        date: voucher.voucher_date,
        counterparty:
          headers.get(voucher.voucher_id)?.counterparty ?? sourceVoucher?.counterparty ?? "",
        partyGstin: sourceVoucher?.gst?.partyGstin ?? null,
        placeOfSupply:
          firstItem?.place_of_supply ??
          voucher.place_of_supply ??
          sourceVoucher?.gst?.placeOfSupply ??
          null,
        supplyType:
          firstItem?.supply_type ??
          sourceVoucher?.gst?.supplyType ??
          sourceVoucher?.sales?.supplyType ??
          null,
        hsnOrSac: firstItem?.hsn_or_sac ?? sourceVoucher?.gst?.hsnOrSac ?? "MIXED",
        taxRate: firstItem?.tax_rate ?? sourceVoucher?.gst?.taxRate ?? 0,
        taxableAmount: roundCurrency(
          (itemRows.length > 0
            ? itemRows.reduce((sum, row) => sum + row.taxable_amount, 0)
            : voucher.taxable_amount) * direction
        ),
        cgstAmount: roundCurrency(
          (itemRows.length > 0
            ? itemRows.reduce((sum, row) => sum + row.cgst_amount, 0)
            : sourceVoucher?.gst?.cgstAmount ?? 0) * direction
        ),
        sgstAmount: roundCurrency(
          (itemRows.length > 0
            ? itemRows.reduce((sum, row) => sum + row.sgst_amount, 0)
            : sourceVoucher?.gst?.sgstAmount ?? 0) * direction
        ),
        igstAmount: roundCurrency(
          (itemRows.length > 0
            ? itemRows.reduce((sum, row) => sum + row.igst_amount, 0)
            : sourceVoucher?.gst?.igstAmount ?? 0) * direction
        ),
        totalTaxAmount: roundCurrency(
          (itemRows.length > 0
            ? itemRows.reduce((sum, row) => sum + row.total_tax_amount, 0)
            : voucher.tax_amount) * direction
        ),
        invoiceAmount: roundCurrency(voucher.net_amount * direction),
        referenceVoucherNumber:
          headers.get(voucher.voucher_id)?.source_voucher_number ?? null,
      }
    })
    .sort(
      (left, right) =>
        left.date.localeCompare(right.date) ||
        left.voucherNumber.localeCompare(right.voucherNumber)
    )

  return {
    asOfDate,
    invoiceCount: items.filter((item) => item.voucherType === "sales").length,
    creditNoteCount: items.filter((item) => item.voucherType === "credit_note").length,
    taxableAmountTotal: roundCurrency(
      items.reduce((sum, item) => sum + item.taxableAmount, 0)
    ),
    cgstAmountTotal: roundCurrency(items.reduce((sum, item) => sum + item.cgstAmount, 0)),
    sgstAmountTotal: roundCurrency(items.reduce((sum, item) => sum + item.sgstAmount, 0)),
    igstAmountTotal: roundCurrency(items.reduce((sum, item) => sum + item.igstAmount, 0)),
    totalTaxAmountTotal: roundCurrency(
      items.reduce((sum, item) => sum + item.totalTaxAmount, 0)
    ),
    invoiceAmountTotal: roundCurrency(
      items.reduce((sum, item) => sum + item.invoiceAmount, 0)
    ),
    items,
  }
}

function buildGstPurchaseRegister(
  purchaseVouchers: PurchaseVoucherProjectionRow[],
  purchaseItems: PurchaseItemProjectionRow[],
  headers: Map<string, VoucherHeaderProjectionRow>,
  voucherById: Map<string, BillingVoucher>,
  asOfDate: string
) {
  const itemRowsByVoucherId = new Map<string, PurchaseItemProjectionRow[]>()
  for (const item of purchaseItems) {
    const current = itemRowsByVoucherId.get(item.voucher_id) ?? []
    current.push(item)
    itemRowsByVoucherId.set(item.voucher_id, current)
  }

  const items = purchaseVouchers
    .filter((voucher) => {
      const sourceVoucher = voucherById.get(voucher.voucher_id)
      const header = headers.get(voucher.voucher_id)
      return (
        voucher.status === "posted" &&
        header?.reversal_of_voucher_id === null &&
        sourceVoucher?.gst?.taxDirection === "input"
      )
    })
    .map((voucher) => {
      const sourceVoucher = voucherById.get(voucher.voucher_id)
      const voucherType = sourceVoucher?.type ?? "purchase"
      const direction =
        voucherType === "debit_note" || voucherType === "purchase_return" ? -1 : 1
      const itemRows = [...(itemRowsByVoucherId.get(voucher.voucher_id) ?? [])].sort(
        (left, right) => left.line_order - right.line_order
      )
      const firstItem = itemRows[0]

      return {
        voucherId: voucher.voucher_id,
        voucherNumber: voucher.voucher_number,
        voucherType,
        documentLabel:
          voucherType === "debit_note"
            ? "debit_note"
            : voucherType === "purchase_return"
              ? "purchase_return"
              : "purchase_invoice",
        date: voucher.voucher_date,
        counterparty:
          headers.get(voucher.voucher_id)?.counterparty ?? sourceVoucher?.counterparty ?? "",
        partyGstin: sourceVoucher?.gst?.partyGstin ?? null,
        placeOfSupply:
          firstItem?.place_of_supply ??
          voucher.place_of_supply ??
          sourceVoucher?.gst?.placeOfSupply ??
          null,
        supplyType: firstItem?.supply_type ?? sourceVoucher?.gst?.supplyType ?? null,
        hsnOrSac: firstItem?.hsn_or_sac ?? sourceVoucher?.gst?.hsnOrSac ?? "MIXED",
        taxRate: firstItem?.tax_rate ?? sourceVoucher?.gst?.taxRate ?? 0,
        taxableAmount: roundCurrency(
          (itemRows.length > 0
            ? itemRows.reduce((sum, row) => sum + row.taxable_amount, 0)
            : voucher.taxable_amount) * direction
        ),
        cgstAmount: roundCurrency(
          (itemRows.length > 0
            ? itemRows.reduce((sum, row) => sum + row.cgst_amount, 0)
            : sourceVoucher?.gst?.cgstAmount ?? 0) * direction
        ),
        sgstAmount: roundCurrency(
          (itemRows.length > 0
            ? itemRows.reduce((sum, row) => sum + row.sgst_amount, 0)
            : sourceVoucher?.gst?.sgstAmount ?? 0) * direction
        ),
        igstAmount: roundCurrency(
          (itemRows.length > 0
            ? itemRows.reduce((sum, row) => sum + row.igst_amount, 0)
            : sourceVoucher?.gst?.igstAmount ?? 0) * direction
        ),
        totalTaxAmount: roundCurrency(
          (itemRows.length > 0
            ? itemRows.reduce((sum, row) => sum + row.total_tax_amount, 0)
            : voucher.tax_amount) * direction
        ),
        invoiceAmount: roundCurrency(voucher.net_amount * direction),
        referenceVoucherNumber:
          headers.get(voucher.voucher_id)?.source_voucher_number ?? null,
      }
    })
    .sort(
      (left, right) =>
        left.date.localeCompare(right.date) ||
        left.voucherNumber.localeCompare(right.voucherNumber)
    )

  return {
    asOfDate,
    invoiceCount: items.filter((item) => item.voucherType === "purchase").length,
    debitNoteCount: items.filter((item) => item.voucherType === "debit_note").length,
    taxableAmountTotal: roundCurrency(
      items.reduce((sum, item) => sum + item.taxableAmount, 0)
    ),
    cgstAmountTotal: roundCurrency(items.reduce((sum, item) => sum + item.cgstAmount, 0)),
    sgstAmountTotal: roundCurrency(items.reduce((sum, item) => sum + item.sgstAmount, 0)),
    igstAmountTotal: roundCurrency(items.reduce((sum, item) => sum + item.igstAmount, 0)),
    totalTaxAmountTotal: roundCurrency(
      items.reduce((sum, item) => sum + item.totalTaxAmount, 0)
    ),
    invoiceAmountTotal: roundCurrency(
      items.reduce((sum, item) => sum + item.invoiceAmount, 0)
    ),
    items,
  }
}

function buildInputOutputTaxSummary(postedVouchers: BillingVoucher[], asOfDate: string) {
  const outputVouchers = postedVouchers.filter(
    (voucher) =>
      (
        voucher.type === "sales" ||
        voucher.type === "sales_return" ||
        voucher.type === "credit_note"
      ) &&
      voucher.gst?.taxDirection === "output"
  )
  const inputVouchers = postedVouchers.filter(
    (voucher) =>
      (
        voucher.type === "purchase" ||
        voucher.type === "purchase_return" ||
        voucher.type === "debit_note"
      ) &&
      voucher.gst?.taxDirection === "input"
  )

  const sumTax = (
    vouchers: BillingVoucher[],
    signResolver: (voucher: BillingVoucher) => number,
    key: "cgstAmount" | "sgstAmount" | "igstAmount" | "totalTaxAmount"
  ) =>
    roundCurrency(
      vouchers.reduce(
        (sum, voucher) => sum + ((voucher.gst?.[key] ?? 0) * signResolver(voucher)),
        0
      )
    )

  const outputSign = (voucher: BillingVoucher) =>
    voucher.type === "credit_note" || voucher.type === "sales_return" ? -1 : 1
  const inputSign = (voucher: BillingVoucher) =>
    voucher.type === "debit_note" || voucher.type === "purchase_return" ? -1 : 1

  const outputCgst = sumTax(outputVouchers, outputSign, "cgstAmount")
  const outputSgst = sumTax(outputVouchers, outputSign, "sgstAmount")
  const outputIgst = sumTax(outputVouchers, outputSign, "igstAmount")
  const outputTaxTotal = sumTax(outputVouchers, outputSign, "totalTaxAmount")

  const inputCgst = sumTax(inputVouchers, inputSign, "cgstAmount")
  const inputSgst = sumTax(inputVouchers, inputSign, "sgstAmount")
  const inputIgst = sumTax(inputVouchers, inputSign, "igstAmount")
  const inputTaxTotal = sumTax(inputVouchers, inputSign, "totalTaxAmount")

  return {
    asOfDate,
    outputCgst,
    outputSgst,
    outputIgst,
    outputTaxTotal,
    inputCgst,
    inputSgst,
    inputIgst,
    inputTaxTotal,
    netCgstPayable: roundCurrency(outputCgst - inputCgst),
    netSgstPayable: roundCurrency(outputSgst - inputSgst),
    netIgstPayable: roundCurrency(outputIgst - inputIgst),
    netTaxPayable: roundCurrency(outputTaxTotal - inputTaxTotal),
  }
}

function toPeriodKey(date: string) {
  return date.slice(0, 7)
}

function toPeriodLabel(periodKey: string) {
  const [year, month] = periodKey.split("-")
  const date = new Date(`${periodKey}-01T00:00:00.000Z`)
  return `${date.toLocaleString("en-IN", { month: "short", timeZone: "UTC" })} ${year}`
}

function getPeriodEndDate(periodKey: string) {
  const [yearText, monthText] = periodKey.split("-")
  const year = Number(yearText)
  const month = Number(monthText)
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const nextMonthDate = new Date(Date.UTC(nextYear, nextMonth - 1, 1))
  const endDate = new Date(nextMonthDate.getTime() - 24 * 60 * 60 * 1000)
  return endDate.toISOString().slice(0, 10)
}

function buildGstFilingSummary(postedVouchers: BillingVoucher[]) {
  const periodMap = new Map<
    string,
    {
      periodKey: string
      salesInvoiceCount: number
      salesCreditNoteCount: number
      purchaseInvoiceCount: number
      purchaseDebitNoteCount: number
      outwardTaxableAmount: number
      inwardTaxableAmount: number
      outputTaxTotal: number
      inputTaxTotal: number
    }
  >()

  for (const voucher of postedVouchers) {
    if (!voucher.gst) {
      continue
    }

    const periodKey = toPeriodKey(voucher.date)
    const bucket = periodMap.get(periodKey) ?? {
      periodKey,
      salesInvoiceCount: 0,
      salesCreditNoteCount: 0,
      purchaseInvoiceCount: 0,
      purchaseDebitNoteCount: 0,
      outwardTaxableAmount: 0,
      inwardTaxableAmount: 0,
      outputTaxTotal: 0,
      inputTaxTotal: 0,
    }

    if (voucher.type === "sales") {
      bucket.salesInvoiceCount += 1
      bucket.outwardTaxableAmount += voucher.gst.taxableAmount
      bucket.outputTaxTotal += voucher.gst.totalTaxAmount
    } else if (voucher.type === "credit_note" || voucher.type === "sales_return") {
      bucket.salesCreditNoteCount += 1
      bucket.outwardTaxableAmount -= voucher.gst.taxableAmount
      bucket.outputTaxTotal -= voucher.gst.totalTaxAmount
    } else if (voucher.type === "purchase") {
      bucket.purchaseInvoiceCount += 1
      bucket.inwardTaxableAmount += voucher.gst.taxableAmount
      bucket.inputTaxTotal += voucher.gst.totalTaxAmount
    } else if (voucher.type === "debit_note" || voucher.type === "purchase_return") {
      bucket.purchaseDebitNoteCount += 1
      bucket.inwardTaxableAmount -= voucher.gst.taxableAmount
      bucket.inputTaxTotal -= voucher.gst.totalTaxAmount
    }

    periodMap.set(periodKey, bucket)
  }

  const periods = [...periodMap.values()]
    .sort((left, right) => right.periodKey.localeCompare(left.periodKey))
    .map((period) => ({
      periodKey: period.periodKey,
      label: toPeriodLabel(period.periodKey),
      startDate: `${period.periodKey}-01`,
      endDate: getPeriodEndDate(period.periodKey),
      salesInvoiceCount: period.salesInvoiceCount,
      salesCreditNoteCount: period.salesCreditNoteCount,
      purchaseInvoiceCount: period.purchaseInvoiceCount,
      purchaseDebitNoteCount: period.purchaseDebitNoteCount,
      outwardTaxableAmount: roundCurrency(period.outwardTaxableAmount),
      inwardTaxableAmount: roundCurrency(period.inwardTaxableAmount),
      outputTaxTotal: roundCurrency(period.outputTaxTotal),
      inputTaxTotal: roundCurrency(period.inputTaxTotal),
      netTaxPayable: roundCurrency(period.outputTaxTotal - period.inputTaxTotal),
    }))

  return {
    latestPeriodKey: periods[0]?.periodKey ?? null,
    periods,
  }
}

function buildInventoryAuthority(): BillingInventoryAuthority {
  return {
    masterOwner: "core",
    warehouseOwner: "core",
    transactionOwner: "billing",
    valuationOwner: "billing",
    summary:
      "Core owns product and warehouse masters, while billing owns valuation policy, stock-ledger interpretation, and stock-to-account finance reporting.",
  }
}

function buildStockValuationPolicy(
  config?: ServerConfig
): BillingStockValuationPolicy {
  const method = config?.billing.compliance.stock.valuationMethod ?? "weighted_average"

  return {
    method,
    costSource:
      method === "moving_average" ? "derived_movement_average" : "core_cost_price",
    summary:
      method === "moving_average"
        ? "Billing derives movement-sensitive stock value from average movement cost when explicit stock movements exist."
        : method === "fifo"
          ? "Billing keeps FIFO as the declared finance policy while the current foundation still values warehouse positions from shared core cost price."
          : "Billing values warehouse stock from shared core product cost price using a weighted-average control posture.",
  }
}

function getWarehouseName(
  warehouseId: string,
  warehouseMap: Map<string, string>
) {
  return warehouseMap.get(warehouseId) ?? warehouseId
}

function buildStockLedger(entries: BillingStockLedgerEntry[]) {
  return {
    asOfDate: new Date().toISOString().slice(0, 10),
    items: entries,
  }
}

function buildStockAccountingRules(
  ledgers: BillingLedger[]
): { items: BillingStockAccountingRule[] } {
  const purchaseLedger = ledgers.find((ledger) => ledger.id === "ledger-purchase")?.name ?? "Purchase Account"
  const salesLedger = ledgers.find((ledger) => ledger.id === "ledger-sales")?.name ?? "Sales Account"
  const expenseLedger =
    ledgers.find((ledger) => ledger.group.toLowerCase().includes("direct"))?.name ??
    "Cost of Goods Sold"
  const inventoryControl =
    ledgers.find((ledger) => ledger.group.toLowerCase().includes("stock"))?.name ??
    "Inventory Control (planned)"
  const creditorLedger =
    ledgers.find((ledger) => ledger.id === "ledger-sundry-creditors")?.name ?? "Sundry Creditors"
  const debtorLedger =
    ledgers.find((ledger) => ledger.id === "ledger-sundry-debtors")?.name ?? "Sundry Debtors"

  return {
    items: [
      {
        ruleKey: "purchase_receipt",
        label: "Purchase to stock",
        sourceVoucherTypes: ["purchase", "purchase_return"],
        debitTarget: inventoryControl,
        creditTarget: creditorLedger,
        status: "active",
        summary: "Purchase-side stock rows now bridge into inventory quantity and valuation while finance keeps supplier-side accounting in billing.",
      },
      {
        ruleKey: "sales_issue",
        label: "Sales issue to COGS",
        sourceVoucherTypes: ["sales", "sales_return"],
        debitTarget: expenseLedger,
        creditTarget: inventoryControl,
        status: "active",
        summary: "Sales-side product-linked invoices now reduce stock position and valuation, with sales returns restoring quantity and value.",
      },
      {
        ruleKey: "sales_revenue",
        label: "Revenue posting",
        sourceVoucherTypes: ["sales", "credit_note", "sales_return"],
        debitTarget: debtorLedger,
        creditTarget: salesLedger,
        status: "active",
        summary: "Commercial sales-side documents already post receivable and revenue movement in billing while stock accounting stays policy-driven until B10.",
      },
      {
        ruleKey: "purchase_expense",
        label: "Procurement posting",
        sourceVoucherTypes: ["purchase", "debit_note", "purchase_return"],
        debitTarget: purchaseLedger,
        creditTarget: creditorLedger,
        status: "active",
        summary: "Commercial purchase-side documents already post procurement and payable movement in billing while stock capitalization remains staged for B10.",
      },
      {
        ruleKey: "stock_adjustment",
        label: "Stock adjustment",
        sourceVoucherTypes: ["stock_adjustment"],
        debitTarget: inventoryControl,
        creditTarget: expenseLedger,
        status: "active",
        summary: "Manual stock adjustments now bridge quantity corrections into core inventory while finance lines capture loss or gain treatment.",
      },
      {
        ruleKey: "landed_cost",
        label: "Landed cost capitalization",
        sourceVoucherTypes: ["landed_cost"],
        debitTarget: inventoryControl,
        creditTarget: purchaseLedger,
        status: "active",
        summary: "Landed cost vouchers capitalize non-quantity procurement overhead into stock valuation without separate quantity movement.",
      },
    ],
  }
}

function buildWarehouseStockPosition(entries: BillingStockLedgerEntry[]) {
  const positions = new Map<string, BillingWarehouseStockPositionItem>()

  const latestByWarehouseProduct = new Map<string, BillingStockLedgerEntry>()

  for (const entry of entries) {
    const key = `${entry.warehouseId}:${entry.productId}`
    const existing = latestByWarehouseProduct.get(key)

    if (
      !existing ||
      entry.movementDate > existing.movementDate ||
      (entry.movementDate === existing.movementDate && entry.entryId > existing.entryId)
    ) {
      latestByWarehouseProduct.set(key, entry)
    }
  }

  for (const entry of latestByWarehouseProduct.values()) {
    const current = positions.get(entry.warehouseId) ?? {
        warehouseId: entry.warehouseId,
        warehouseName: entry.warehouseName,
        productCount: 0,
        quantityOnHand: 0,
        reservedQuantity: 0,
        availableQuantity: 0,
        inventoryValue: 0,
    }

    current.productCount += 1
    current.quantityOnHand = roundCurrency(current.quantityOnHand + entry.balanceQuantity)
    current.reservedQuantity = roundCurrency(
      current.reservedQuantity + entry.reservedQuantity
    )
    current.availableQuantity = roundCurrency(
      current.availableQuantity + entry.availableQuantity
    )
    current.inventoryValue = roundCurrency(current.inventoryValue + entry.balanceValue)
    positions.set(entry.warehouseId, current)
  }

  const items = [...positions.values()].sort((left, right) =>
    left.warehouseName.localeCompare(right.warehouseName)
  )

  return {
    asOfDate: new Date().toISOString().slice(0, 10),
    totalInventoryValue: roundCurrency(
      items.reduce((sum, item) => sum + item.inventoryValue, 0)
    ),
    items,
  }
}

function buildStockValuationReport(
  entries: BillingStockLedgerEntry[],
  valuationPolicy: BillingStockValuationPolicy
): BillingStockValuationReport {
  const latestByWarehouseProduct = new Map<string, BillingStockLedgerEntry>()

  for (const entry of entries) {
    const key = `${entry.warehouseId}:${entry.productId}`
    const existing = latestByWarehouseProduct.get(key)

    if (
      !existing ||
      entry.movementDate > existing.movementDate ||
      (entry.movementDate === existing.movementDate && entry.entryId > existing.entryId)
    ) {
      latestByWarehouseProduct.set(key, entry)
    }
  }

  const items = [...latestByWarehouseProduct.values()]
    .map((entry) => ({
      productId: entry.productId,
      productName: entry.productName,
      warehouseId: entry.warehouseId,
      warehouseName: entry.warehouseName,
      quantityOnHand: roundCurrency(entry.balanceQuantity),
      unitCost: roundCurrency(entry.unitCost),
      inventoryValue: roundCurrency(entry.balanceValue),
      valuationMethod: valuationPolicy.method,
      lastMovementDate: entry.movementDate,
    }))
    .sort(
      (left, right) =>
        left.productName.localeCompare(right.productName) ||
        left.warehouseName.localeCompare(right.warehouseName)
    )

  return {
    asOfDate: new Date().toISOString().slice(0, 10),
    valuationMethod: valuationPolicy.method,
    totalInventoryValue: roundCurrency(
      items.reduce((sum, item) => sum + item.inventoryValue, 0)
    ),
    items,
  }
}

function buildAccountingExceptions(vouchers: BillingVoucher[]) {
  const items: BillingAccountingExceptionItem[] = []

  for (const voucher of vouchers) {
    const amount = getInvoiceAmount(voucher)
    const daysBackDated = getDaysBetween(voucher.date, voucher.createdAt.slice(0, 10))
    const altered =
      voucher.updatedAt !== voucher.createdAt &&
      ["posted", "reversed", "cancelled"].includes(voucher.status)

    if (altered) {
      items.push({
        exceptionType: "altered",
        voucherId: voucher.id,
        voucherNumber: voucher.voucherNumber,
        voucherType: voucher.type,
        voucherStatus: voucher.status,
        voucherDate: voucher.date,
        createdAt: voucher.createdAt,
        updatedAt: voucher.updatedAt,
        counterparty: voucher.counterparty,
        amount,
        daysBackDated,
        dimensions: voucher.dimensions,
        reviewStatus: voucher.review.status,
        note: "Voucher metadata changed after initial creation.",
      })
    }

    if (voucher.status === "reversed") {
      items.push({
        exceptionType: "reversed",
        voucherId: voucher.id,
        voucherNumber: voucher.voucherNumber,
        voucherType: voucher.type,
        voucherStatus: voucher.status,
        voucherDate: voucher.date,
        createdAt: voucher.createdAt,
        updatedAt: voucher.updatedAt,
        counterparty: voucher.counterparty,
        amount,
        daysBackDated,
        dimensions: voucher.dimensions,
        reviewStatus: voucher.review.status,
        note: voucher.reversalReason ?? "Voucher reversed after posting.",
      })
    }

    if (daysBackDated > 0 && voucher.status !== "draft") {
      items.push({
        exceptionType: "back_dated",
        voucherId: voucher.id,
        voucherNumber: voucher.voucherNumber,
        voucherType: voucher.type,
        voucherStatus: voucher.status,
        voucherDate: voucher.date,
        createdAt: voucher.createdAt,
        updatedAt: voucher.updatedAt,
        counterparty: voucher.counterparty,
        amount,
        daysBackDated,
        dimensions: voucher.dimensions,
        reviewStatus: voucher.review.status,
        note: `Voucher date precedes entry creation by ${daysBackDated} day${daysBackDated === 1 ? "" : "s"}.`,
      })
    }
  }

  return {
    alteredCount: items.filter((item) => item.exceptionType === "altered").length,
    reversedCount: items.filter((item) => item.exceptionType === "reversed").length,
    backDatedCount: items.filter((item) => item.exceptionType === "back_dated").length,
    items: items.sort(
      (left, right) =>
        right.voucherDate.localeCompare(left.voucherDate) ||
        right.updatedAt.localeCompare(left.updatedAt)
    ),
  }
}

function buildFinanceDashboard(
  vouchers: BillingVoucher[],
  postedVouchers: BillingVoucher[],
  trialBalanceItems: Array<{
    group: string
    closingAmount: number
  }>,
  outstanding: {
    asOfDate: string
    receivableTotal: number
    payableTotal: number
  },
  bankReconciliation: {
    pendingEntryCount: number
    mismatchAmountTotal: number
  },
  stockValuationReport: BillingStockValuationReport,
  exceptions: {
    reversedCount: number
    backDatedCount: number
  }
): BillingFinanceDashboard {
  const pendingReviewVouchers = postedVouchers.filter(
    (voucher) => voucher.review.status === "pending_review"
  )
  const bankBalance = roundCurrency(
    trialBalanceItems
      .filter((item) => item.group === "Bank Accounts")
      .reduce((sum, item) => sum + item.closingAmount, 0)
  )
  const cashBalance = roundCurrency(
    trialBalanceItems
      .filter((item) => item.group === "Cash-in-Hand")
      .reduce((sum, item) => sum + item.closingAmount, 0)
  )

  return {
    asOfDate: outstanding.asOfDate,
    postedVoucherCount: postedVouchers.length,
    pendingReviewCount: pendingReviewVouchers.length,
    pendingReviewAmount: roundCurrency(
      pendingReviewVouchers.reduce((sum, voucher) => sum + getInvoiceAmount(voucher), 0)
    ),
    reversedVoucherCount: exceptions.reversedCount,
    reversedVoucherAmount: roundCurrency(
      vouchers
        .filter((voucher) => voucher.status === "reversed")
        .reduce((sum, voucher) => sum + getInvoiceAmount(voucher), 0)
    ),
    backDatedVoucherCount: exceptions.backDatedCount,
    receivableTotal: roundCurrency(outstanding.receivableTotal),
    payableTotal: roundCurrency(outstanding.payableTotal),
    bankPendingEntryCount: bankReconciliation.pendingEntryCount,
    bankMismatchAmount: roundCurrency(bankReconciliation.mismatchAmountTotal),
    inventoryValue: roundCurrency(stockValuationReport.totalInventoryValue),
    cashBalance,
    bankBalance,
  }
}

function buildMonthEndChecklist(input: {
  asOfDate: string
  financeDashboard: BillingFinanceDashboard
  exceptions: { backDatedCount: number }
  settlementExceptions: { items: Array<unknown> }
  bankReconciliation: { pendingEntryCount: number; mismatchEntryCount: number }
  gstFilingSummary: { latestPeriodKey: string | null; periods: Array<{ periodKey: string; netTaxPayable: number }> }
  stockValuationReport: BillingStockValuationReport
}): BillingMonthEndChecklist {
  const items = [
    {
      id: "reviews",
      label: "Finance reviews cleared",
      status:
        input.financeDashboard.pendingReviewCount === 0
          ? ("ready" as const)
          : ("blocked" as const),
      value: String(input.financeDashboard.pendingReviewCount),
      detail:
        input.financeDashboard.pendingReviewCount === 0
          ? "No billing vouchers are waiting for review."
          : `${input.financeDashboard.pendingReviewCount} voucher(s) are still pending approval.`,
    },
    {
      id: "bank-reconciliation",
      label: "Bank reconciliation completed",
      status:
        input.bankReconciliation.pendingEntryCount === 0 &&
        input.bankReconciliation.mismatchEntryCount === 0
          ? ("ready" as const)
          : input.bankReconciliation.mismatchEntryCount > 0
            ? ("blocked" as const)
            : ("attention" as const),
      value: `${input.bankReconciliation.pendingEntryCount} pending / ${input.bankReconciliation.mismatchEntryCount} mismatch`,
      detail: "Month-end bank closing should not carry unresolved pending or mismatch items.",
    },
    {
      id: "back-dated",
      label: "Back-dated posting reviewed",
      status:
        input.exceptions.backDatedCount === 0 ? ("ready" as const) : ("attention" as const),
      value: String(input.exceptions.backDatedCount),
      detail: "Back-dated entries should be reviewed before books are closed.",
    },
    {
      id: "open-bills",
      label: "Open bill exceptions reviewed",
      status:
        input.settlementExceptions.items.length === 0
          ? ("ready" as const)
          : ("attention" as const),
      value: String(input.settlementExceptions.items.length),
      detail: "Advance, on-account, and overpayment exceptions should be explained before close.",
    },
    {
      id: "gst-summary",
      label: "GST period summary ready",
      status:
        input.gstFilingSummary.latestPeriodKey === null
          ? ("attention" as const)
          : ("ready" as const),
      value: input.gstFilingSummary.latestPeriodKey ?? "No period",
      detail: "Latest GST period summary should be reviewed alongside filing totals.",
    },
    {
      id: "inventory-valuation",
      label: "Inventory valuation refreshed",
      status:
        input.stockValuationReport.totalInventoryValue >= 0
          ? ("ready" as const)
          : ("blocked" as const),
      value: input.stockValuationReport.totalInventoryValue.toFixed(2),
      detail: "Stock valuation must be available for closing inventory and gross-margin review.",
    },
  ]

  return {
    asOfDate: input.asOfDate,
    readyCount: items.filter((item) => item.status === "ready").length,
    attentionCount: items.filter((item) => item.status === "attention").length,
    blockedCount: items.filter((item) => item.status === "blocked").length,
    items,
  }
}

function buildFinancialYearCloseWorkflowFallback(
  vouchers: BillingVoucher[],
  checklist: BillingMonthEndChecklist
) {
  const latestVoucher = [...vouchers].sort((left, right) =>
    right.financialYear.endDate.localeCompare(left.financialYear.endDate)
  )[0]

  if (!latestVoucher) {
    return null
  }

  return {
    financialYearCode: latestVoucher.financialYear.code,
    financialYearLabel: latestVoucher.financialYear.label,
    startDate: latestVoucher.financialYear.startDate,
    endDate: latestVoucher.financialYear.endDate,
    voucherCount: vouchers.filter(
      (voucher) => voucher.financialYear.code === latestVoucher.financialYear.code
    ).length,
    status: checklist.blockedCount > 0 ? ("blocked" as const) : ("not_started" as const),
    blockedItemCount: checklist.blockedCount,
    readyItemCount: checklist.readyCount,
    lastEvaluatedAt: new Date().toISOString(),
    closedAt: null,
    closedByUserId: null,
    note: "",
  }
}

export async function getBillingAccountingReports(
  database: Kysely<unknown>,
  user: AuthUser,
  config?: ServerConfig
) {
  assertBillingViewer(user)

  const [
    ledgers,
    vouchers,
    ledgerEntries,
    products,
    warehouses,
    voucherHeaderRows,
    billReferenceRows,
    billOverdueRows,
    receiptVoucherRows,
    paymentVoucherRows,
    receiptAllocationRows,
    paymentAllocationRows,
    salesVoucherRows,
    salesItemRows,
    purchaseVoucherRows,
    purchaseItemRows,
  ] = await Promise.all([
    readLedgers(database),
    readVouchers(database),
    listBillingLedgerEntries(database).then((response) => response.items),
    readProducts(database),
    readWarehouses(database),
    readVoucherHeaderRows(database),
    readBillReferenceRows(database),
    readBillOverdueRows(database),
    readReceiptVoucherRows(database),
    readPaymentVoucherRows(database),
    readReceiptAllocationRows(database),
    readPaymentAllocationRows(database),
    readSalesVoucherRows(database),
    readSalesItemRows(database),
    readPurchaseVoucherRows(database),
    readPurchaseItemRows(database),
  ])
  const postedVouchers = vouchers.filter((voucher) => voucher.status === "posted")
  const voucherById = new Map(vouchers.map((voucher) => [voucher.id, voucher]))
  const voucherHeaders = buildHeaderMap(voucherHeaderRows)
  const asOfDate = getMaxVoucherDate(postedVouchers)
  const movementByLedgerId = getLedgerMovement(ledgerEntries)
  const sourceReferencesByLedgerId = getLedgerSourceReferences(ledgerEntries)
  const warehouseMap = new Map(
    warehouses.map((item) => [
      item.id,
      typeof item.name === "string" && item.name.trim() ? item.name.trim() : item.id,
    ])
  )
  const inventoryAuthority = buildInventoryAuthority()
  const stockValuationPolicy = buildStockValuationPolicy(config)
  const inventoryProjection = projectBillingInventory(
    products,
    vouchers,
    stockValuationPolicy.method
  )
  const stockLedgerEntries = inventoryProjection.entries.map((entry) => ({
    ...entry,
    warehouseName: getWarehouseName(entry.warehouseId, warehouseMap),
  }))
  const stockLedger = buildStockLedger(stockLedgerEntries)
  const stockAccountingRules = buildStockAccountingRules(ledgers)
  const warehouseStockPosition = buildWarehouseStockPosition(stockLedgerEntries)
  const stockValuationReport = buildStockValuationReport(
    stockLedgerEntries,
    stockValuationPolicy
  )

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

  const openBillRecords = buildOpenBillRecords(
    billReferenceRows,
    billOverdueRows,
    voucherHeaders,
    asOfDate
  )
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
  const settlementExceptions = buildSettlementExceptions(
    billReferenceRows,
    openBillRecords,
    voucherHeaders
  )
  const bankReconciliation = (() => {
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
          mismatchedEntries.reduce((sum, entry) => sum + (entry.mismatchAmount ?? 0), 0)
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
      mismatchEntryCount: ledgers.reduce((sum, ledger) => sum + ledger.mismatchEntryCount, 0),
      mismatchAmountTotal: roundCurrency(
        ledgers.reduce((sum, ledger) => sum + ledger.mismatchAmountTotal, 0)
      ),
      ledgers,
    }
  })()
  const exceptions = buildAccountingExceptions(vouchers)
  const financeDashboard = buildFinanceDashboard(
    vouchers,
    postedVouchers,
    trialBalanceItems,
    {
      asOfDate,
      receivableTotal,
      payableTotal,
    },
    bankReconciliation,
    stockValuationReport,
    exceptions
  )
  const gstFilingSummary = buildGstFilingSummary(postedVouchers)
  const monthEndChecklist = buildMonthEndChecklist({
    asOfDate,
    financeDashboard,
    exceptions,
    settlementExceptions,
    bankReconciliation,
    gstFilingSummary,
    stockValuationReport,
  })
  const financialYearCloseWorkflow =
    (await getBillingYearCloseWorkflow(database, user)) ??
    buildFinancialYearCloseWorkflowFallback(vouchers, monthEndChecklist)
  const openingBalanceRolloverPolicy =
    await getBillingOpeningBalanceRolloverPolicy(database, user)
  const yearEndAdjustmentControlPolicy =
    await getBillingYearEndAdjustmentControlPolicy(database, user)

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
      settlementExceptions,
      partySettlementSummary: buildPartySettlementSummary(
        receiptVoucherRows,
        paymentVoucherRows,
        receiptAllocationRows,
        paymentAllocationRows,
        voucherHeaders
      ),
      generalLedger: {
        items: generalLedgerItems,
      },
      bankBook: {
        items: generalLedgerItems.filter((item) => item.group === "Bank Accounts"),
      },
      cashBook: {
        items: generalLedgerItems.filter((item) => item.group === "Cash-in-Hand"),
      },
      bankReconciliation,
      customerStatement: buildCustomerStatement(postedVouchers, voucherById),
      supplierStatement: buildSupplierStatement(postedVouchers, voucherById),
      gstSalesRegister: buildGstSalesRegister(
        salesVoucherRows,
        salesItemRows,
        voucherHeaders,
        voucherById,
        asOfDate
      ),
      gstPurchaseRegister: buildGstPurchaseRegister(
        purchaseVoucherRows,
        purchaseItemRows,
        voucherHeaders,
        voucherById,
        asOfDate
      ),
      inputOutputTaxSummary: buildInputOutputTaxSummary(postedVouchers, asOfDate),
      gstFilingSummary,
      inventoryAuthority,
      stockValuationPolicy,
      stockLedger,
      stockAccountingRules,
      warehouseStockPosition,
      stockValuationReport,
      exceptions,
      financeDashboard,
      monthEndChecklist,
      financialYearCloseWorkflow,
      openingBalanceRolloverPolicy,
      yearEndAdjustmentControlPolicy,
    },
  })
}
