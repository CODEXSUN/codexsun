import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import type { AuthUser } from "../../../cxapp/shared/index.js"
import { listCommonModuleItems } from "../../../core/src/services/common-module-service.js"
import { productSchema, type Product } from "../../../core/shared/index.js"
import { writeActivityLog } from "../../../framework/src/runtime/activity-log/activity-log-service.js"
import type { ServerConfig } from "../../../framework/src/runtime/config/index.js"
import { listJsonStorePayloads } from "../../../framework/src/runtime/database/process/json-store.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import {
  billingVoucherBankReconciliationPayloadSchema,
  billingVoucherBankReconciliationResponseSchema,
  billingVoucherDocumentFormatSchema,
  billingVoucherDocumentResponseSchema,
  billingVoucherDocumentTemplateSchema,
  billingVoucherEInvoiceSchema,
  billingVoucherEWayBillSchema,
  billingLedgerSchema,
  billingSalesInvoiceSchema,
  billingVoucherStockSchema,
  billingVoucherGstSchema,
  billingVoucherListResponseSchema,
  billingVoucherMasterTypeSchema,
  billingVoucherReviewPayloadSchema,
  billingVoucherReviewResponseSchema,
  billingVoucherReversePayloadSchema,
  billingVoucherReverseResponseSchema,
  billingVoucherResponseSchema,
  billingVoucherSchema,
  billingVoucherUpsertPayloadSchema,
  type BillingVoucher,
  type BillingVoucherDocumentFormat,
  type BillingVoucherGst,
} from "../../shared/index.js"

import { billingTableNames } from "../../database/table-names.js"
import { coreTableNames } from "../../../core/database/table-names.js"

import { assertBillingViewer } from "./access.js"
import {
  assertBillingOperationDateAllowed,
  createVoucherNumber,
  generateEInvoiceRecord,
  generateEWayBillRecord,
  getConfiguredVoucherPrefix,
  getVoucherPrefix,
  resolveFinancialYear,
  validateBillAllocations,
} from "./compliance-service.js"
import {
  getStorePayloadById,
  listStorePayloads,
  replaceStorePayloads,
} from "./store.js"
import { replaceBillingVoucherHeaders } from "./voucher-header-store.js"
import { replaceBillingVoucherLines } from "./voucher-line-store.js"
import { replaceBillingLedgerEntries } from "./ledger-entry-store.js"
import { synchronizeBillingInventoryToCore } from "./inventory-bridge-service.js"

async function readLedgers(database: Kysely<unknown>) {
  return listStorePayloads(database, billingTableNames.ledgers, billingLedgerSchema)
}

async function readVoucherTypes(database: Kysely<unknown>) {
  return listStorePayloads(
    database,
    billingTableNames.voucherTypes,
    billingVoucherMasterTypeSchema
  )
}

async function readProducts(database: Kysely<unknown>) {
  const items = await listJsonStorePayloads<Product>(database, coreTableNames.products)
  return items.map((item) => productSchema.parse(item))
}

async function readWarehouses(database: Kysely<unknown>) {
  const response = await listCommonModuleItems(database, "warehouses")
  return response.items
}

async function readVouchers(database: Kysely<unknown>) {
  const items = await listStorePayloads(
    database,
    billingTableNames.vouchers,
    billingVoucherSchema
  )

  return items.sort((left, right) =>
    right.date.localeCompare(left.date) ||
    right.updatedAt.localeCompare(left.updatedAt)
  )
}

function assertVoucherIsMutable(voucher: BillingVoucher) {
  if (voucher.status !== "draft") {
    throw new ApplicationError(
      "Only draft vouchers can be changed directly. Posted records require lifecycle actions instead of silent mutation.",
      {
        status: voucher.status,
        voucherId: voucher.id,
        voucherNumber: voucher.voucherNumber,
      },
      409
    )
  }
}

async function writeBillingVoucherAudit(
  database: Kysely<unknown>,
  config: ServerConfig,
  user: AuthUser,
  input: {
    action:
      | "voucher_create"
      | "voucher_post"
      | "voucher_cancel"
      | "voucher_delete"
      | "voucher_reverse"
      | "voucher_reconcile"
      | "voucher_review"
    message: string
    voucher: BillingVoucher
    details?: Record<string, unknown>
  }
) {
  if (!config.operations.audit.adminAuditEnabled) {
    return
  }

  await writeActivityLog(database, {
    category: "billing",
    action: input.action,
    level: "info",
    message: input.message,
    actorId: user.id,
    actorEmail: user.email,
    actorType: user.actorType,
    context: {
      voucherId: input.voucher.id,
      voucherNumber: input.voucher.voucherNumber,
      voucherStatus: input.voucher.status,
      voucherType: input.voucher.type,
      voucherDate: input.voucher.date,
      ...input.details,
    },
  })
}

function toTodayDate() {
  return new Date().toISOString().slice(0, 10)
}

function getVoucherTotals(voucher: Pick<BillingVoucher, "lines">) {
  return voucher.lines.reduce(
    (totals, line) => {
      if (line.side === "debit") {
        totals.debit += line.amount
      } else {
        totals.credit += line.amount
      }

      return totals
    },
    { credit: 0, debit: 0 }
  )
}

function roundCurrency(value: number) {
  return Number(value.toFixed(2))
}

function getVoucherAbsoluteAmount(
  voucherLike: Pick<BillingVoucher, "gst" | "sales" | "lines">
) {
  if (voucherLike.sales) {
    return roundCurrency(voucherLike.sales.grandTotal)
  }

  if (voucherLike.gst) {
    return roundCurrency(voucherLike.gst.invoiceAmount)
  }

  return roundCurrency(
    voucherLike.lines.reduce((maxAmount, line) => Math.max(maxAmount, line.amount), 0)
  )
}

function isSensitiveVoucherType(type: BillingVoucher["type"]) {
  return [
    "payment",
    "contra",
    "journal",
    "credit_note",
    "debit_note",
    "sales_return",
    "purchase_return",
    "stock_adjustment",
    "landed_cost",
  ].includes(type)
}

function getRequiredSourceType(type: BillingVoucher["type"]) {
  switch (type) {
    case "credit_note":
    case "sales_return":
      return "sales" as const
    case "debit_note":
    case "purchase_return":
    case "landed_cost":
      return "purchase" as const
    default:
      return null
  }
}

function getSourceDocumentLabel(type: BillingVoucher["type"]) {
  switch (type) {
    case "credit_note":
      return "Credit note"
    case "debit_note":
      return "Debit note"
    case "sales_return":
      return "Sales return"
    case "purchase_return":
      return "Purchase return"
    case "stock_adjustment":
      return "Stock adjustment"
    case "landed_cost":
      return "Landed cost"
    default:
      return "Voucher"
  }
}

function buildVoucherReviewState(
  voucher: Pick<BillingVoucher, "type" | "gst" | "sales" | "lines">,
  config: ServerConfig,
  existing: BillingVoucher | undefined,
  timestamp: string
) {
  const reviewEnabled = config.billing.compliance.review.enabled
  const amount = getVoucherAbsoluteAmount(voucher)
  const requiresReview =
    reviewEnabled &&
    (
      isSensitiveVoucherType(voucher.type) ||
      amount >= config.billing.compliance.review.amountThreshold
    )

  if (!requiresReview) {
    return {
      status: "not_required" as const,
      requestedAt: null,
      reviewedAt: null,
      reviewedByUserId: null,
      note: existing?.review.status === "not_required" ? existing.review.note : "",
      requiredReason: null,
    }
  }

  const requiredReason = isSensitiveVoucherType(voucher.type)
    ? "Sensitive finance document type requires review."
    : `Voucher amount ${amount.toFixed(2)} meets the finance review threshold.`

  if (
    existing?.review.status === "approved" ||
    existing?.review.status === "rejected"
  ) {
    return {
      ...existing.review,
      requiredReason,
    }
  }

  return {
    status: "pending_review" as const,
    requestedAt: existing?.review.requestedAt ?? timestamp,
    reviewedAt: null,
    reviewedByUserId: null,
    note: existing?.review.note ?? "",
    requiredReason,
  }
}

function resolveVoucherNumber(
  parsedPayload: ReturnType<typeof billingVoucherUpsertPayloadSchema.parse>,
  financialYear: BillingVoucher["financialYear"],
  config: ServerConfig
) {
  const manualVoucherNumber = parsedPayload.voucherNumber.trim()
  const policy = config.billing.compliance.documentNumbering.policy
  const prefix = financialYear.prefix

  if (policy === "auto" && manualVoucherNumber.length > 0) {
    throw new ApplicationError(
      "Manual voucher numbers are disabled by the current billing numbering policy.",
      { voucherNumber: manualVoucherNumber, policy },
      409
    )
  }

  if (policy === "manual" && manualVoucherNumber.length === 0) {
    throw new ApplicationError(
      "Manual voucher number is required by the current billing numbering policy.",
      { policy, voucherType: parsedPayload.type },
      409
    )
  }

  return manualVoucherNumber || createVoucherNumber(parsedPayload.type, financialYear, prefix)
}

function buildVoucherDocumentTitle(voucher: BillingVoucher) {
  switch (voucher.type) {
    case "sales":
      return "Sales Invoice"
    case "purchase":
      return "Purchase Voucher"
    case "sales_return":
      return "Sales Return"
    case "purchase_return":
      return "Purchase Return"
    case "credit_note":
      return "Credit Note"
    case "debit_note":
      return "Debit Note"
    case "stock_adjustment":
      return "Stock Adjustment"
    case "landed_cost":
      return "Landed Cost"
    case "payment":
      return "Payment Voucher"
    case "receipt":
      return "Receipt Voucher"
    case "contra":
      return "Contra Voucher"
    case "journal":
      return "Journal Voucher"
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
}

function formatDocumentAmount(value: number) {
  return value.toFixed(2)
}

function buildVoucherPrintDocument(voucher: BillingVoucher) {
  const title = buildVoucherDocumentTitle(voucher)
  const total = getVoucherAbsoluteAmount(voucher)
  const lineRows = voucher.lines
    .map(
      (line) =>
        `<tr><td>${escapeHtml(line.ledgerName)}</td><td>${escapeHtml(line.side)}</td><td style="text-align:right;">${formatDocumentAmount(line.amount)}</td><td>${escapeHtml(line.note)}</td></tr>`
    )
    .join("")

  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)} ${escapeHtml(voucher.voucherNumber)}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111827}h1{margin:0 0 8px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #d1d5db;padding:8px;font-size:12px}th{text-align:left;background:#f3f4f6}.meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:16px}.pill{display:inline-block;padding:4px 8px;border:1px solid #d1d5db;border-radius:999px;font-size:12px}</style></head><body><h1>${escapeHtml(title)}</h1><p class="pill">${escapeHtml(voucher.voucherNumber)}</p><div class="meta"><div><strong>Date:</strong> ${escapeHtml(voucher.date)}</div><div><strong>Counterparty:</strong> ${escapeHtml(voucher.counterparty)}</div><div><strong>Status:</strong> ${escapeHtml(voucher.status)}</div><div><strong>Review:</strong> ${escapeHtml(voucher.review.status)}</div></div><p><strong>Narration:</strong> ${escapeHtml(voucher.narration || "-")}</p><table><thead><tr><th>Ledger</th><th>Side</th><th>Amount</th><th>Note</th></tr></thead><tbody>${lineRows}</tbody></table><p style="margin-top:16px;"><strong>Total:</strong> ${formatDocumentAmount(total)}</p></body></html>`
}

function buildVoucherCsvDocument(voucher: BillingVoucher) {
  const rows = [
    ["Voucher Number", voucher.voucherNumber],
    ["Title", buildVoucherDocumentTitle(voucher)],
    ["Date", voucher.date],
    ["Counterparty", voucher.counterparty],
    ["Status", voucher.status],
    ["Review Status", voucher.review.status],
    ["Narration", voucher.narration],
    [],
    ["Ledger", "Side", "Amount", "Note"],
    ...voucher.lines.map((line) => [
      line.ledgerName,
      line.side,
      formatDocumentAmount(line.amount),
      line.note,
    ]),
  ]

  return rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n")
}

function isBankLedger(ledgerId: string, ledgerMap: Map<string, Awaited<ReturnType<typeof readLedgers>>[number]>) {
  return ledgerMap.get(ledgerId)?.group === "Bank Accounts"
}

function hasBankLedgerLine(
  lines: BillingVoucher["lines"],
  ledgerMap: Map<string, Awaited<ReturnType<typeof readLedgers>>[number]>
) {
  return lines.some((line) => isBankLedger(line.ledgerId, ledgerMap))
}

function getBankLedgerSettlementAmount(
  lines: BillingVoucher["lines"],
  ledgerMap: Map<string, Awaited<ReturnType<typeof readLedgers>>[number]>
) {
  return roundCurrency(
    lines
      .filter((line) => isBankLedger(line.ledgerId, ledgerMap))
      .reduce((sum, line) => sum + line.amount, 0)
  )
}

function summarizeHsnOrSac(items: Array<{ hsnOrSac: string }>) {
  const uniqueValues = [...new Set(items.map((item) => item.hsnOrSac.trim()).filter(Boolean))]
  if (uniqueValues.length === 1) {
    return uniqueValues[0] ?? "MIXED"
  }

  return "MIXED"
}

function getRequiredTaxLedgerIds(
  taxDirection: BillingVoucherGst["taxDirection"],
  supplyType: BillingVoucherGst["supplyType"]
) {
  if (taxDirection === "output") {
    return supplyType === "intra"
      ? ["ledger-output-cgst", "ledger-output-sgst"]
      : ["ledger-output-igst"]
  }

  return supplyType === "intra"
    ? ["ledger-input-cgst", "ledger-input-sgst"]
    : ["ledger-input-igst"]
}

function buildAutoPostedGst(
  voucherType: BillingVoucher["type"],
  gstPayload: NonNullable<ReturnType<typeof billingVoucherUpsertPayloadSchema.parse>["gst"]>,
  ledgerMap: Map<string, Awaited<ReturnType<typeof readLedgers>>[number]>
) {
  if (
    !["sales", "purchase", "sales_return", "purchase_return", "credit_note", "debit_note"].includes(voucherType)
  ) {
    throw new ApplicationError(
      "GST auto-posting is available only for sales, purchase, return, credit note, and debit note vouchers.",
      { voucherType },
      400
    )
  }

  const taxableLedger = ledgerMap.get(gstPayload.taxableLedgerId)
  const partyLedger = ledgerMap.get(gstPayload.partyLedgerId)

  if (!taxableLedger) {
    throw new ApplicationError(
      "GST taxable ledger could not be found.",
      { ledgerId: gstPayload.taxableLedgerId },
      400
    )
  }

  if (!partyLedger) {
    throw new ApplicationError(
      "GST party ledger could not be found.",
      { ledgerId: gstPayload.partyLedgerId },
      400
    )
  }

  const expectedTaxDirection =
    voucherType === "sales" ||
    voucherType === "sales_return" ||
    voucherType === "credit_note"
      ? "output"
      : "input"
  const isSalesLike =
    voucherType === "sales" ||
    voucherType === "debit_note" ||
    voucherType === "purchase_return"
  const taxRate = gstPayload.taxRate
  const taxableAmount = roundCurrency(gstPayload.taxableAmount)
  const totalTaxAmount = roundCurrency((taxableAmount * taxRate) / 100)
  const cgstAmount =
    gstPayload.supplyType === "intra" ? roundCurrency(totalTaxAmount / 2) : 0
  const sgstAmount =
    gstPayload.supplyType === "intra" ? roundCurrency(totalTaxAmount / 2) : 0
  const igstAmount =
    gstPayload.supplyType === "inter" ? roundCurrency(totalTaxAmount) : 0
  const invoiceAmount = roundCurrency(taxableAmount + totalTaxAmount)

  const taxLedgerIds = getRequiredTaxLedgerIds(expectedTaxDirection, gstPayload.supplyType)
  const taxLines = taxLedgerIds.map((ledgerId) => {
    const ledger = ledgerMap.get(ledgerId)

    if (!ledger) {
      throw new ApplicationError(
        "Configured GST tax ledger could not be found.",
        { ledgerId },
        500
      )
    }

    const amount =
      ledgerId.includes("cgst")
        ? cgstAmount
        : ledgerId.includes("sgst")
          ? sgstAmount
          : igstAmount

    return {
      ledger,
      amount,
    }
  }).filter((entry) => entry.amount > 0)

  const lines =
    isSalesLike
      ? [
          {
            id: `voucher-line:${randomUUID()}`,
            ledgerId: partyLedger.id,
            ledgerName: partyLedger.name,
            side: "debit" as const,
            amount: invoiceAmount,
            note:
              voucherType === "debit_note"
                || voucherType === "purchase_return"
                ? "Supplier ledger debited for the GST note amount."
                : "Customer or cash ledger raised for the GST invoice amount.",
          },
          {
            id: `voucher-line:${randomUUID()}`,
            ledgerId: taxableLedger.id,
            ledgerName: taxableLedger.name,
            side: "credit" as const,
            amount: taxableAmount,
            note:
              voucherType === "debit_note"
                || voucherType === "purchase_return"
                ? "Taxable value credited to the purchase correction ledger."
                : "Taxable value credited to the sales ledger.",
          },
          ...taxLines.map((entry) => ({
            id: `voucher-line:${randomUUID()}`,
            ledgerId: entry.ledger.id,
            ledgerName: entry.ledger.name,
            side: "credit" as const,
            amount: entry.amount,
            note:
              voucherType === "debit_note"
                || voucherType === "purchase_return"
                ? `${entry.ledger.name} auto-posted as purchase-side tax reversal.`
                : `${entry.ledger.name} auto-posted from GST rate calculation.`,
          })),
        ]
      : [
          {
            id: `voucher-line:${randomUUID()}`,
            ledgerId: taxableLedger.id,
            ledgerName: taxableLedger.name,
            side: "debit" as const,
            amount: taxableAmount,
            note:
              voucherType === "credit_note"
                || voucherType === "sales_return"
                ? "Taxable value debited to the sales correction ledger."
                : "Taxable value debited to the purchase ledger.",
          },
          ...taxLines.map((entry) => ({
            id: `voucher-line:${randomUUID()}`,
            ledgerId: entry.ledger.id,
            ledgerName: entry.ledger.name,
            side: "debit" as const,
            amount: entry.amount,
            note:
              voucherType === "credit_note"
                || voucherType === "sales_return"
                ? `${entry.ledger.name} auto-posted as sales-side tax reversal.`
                : `${entry.ledger.name} auto-posted as input tax credit.`,
          })),
          {
            id: `voucher-line:${randomUUID()}`,
            ledgerId: partyLedger.id,
            ledgerName: partyLedger.name,
            side: "credit" as const,
            amount: invoiceAmount,
            note:
              voucherType === "credit_note"
                || voucherType === "sales_return"
                ? "Customer ledger credited for the GST note amount."
                : "Supplier ledger credited for the GST bill amount.",
          },
        ]

  const gst = billingVoucherGstSchema.parse({
    supplyType: gstPayload.supplyType,
    taxDirection: expectedTaxDirection,
    placeOfSupply: gstPayload.placeOfSupply,
    partyGstin: gstPayload.partyGstin,
    hsnOrSac: gstPayload.hsnOrSac,
    taxableAmount,
    taxRate,
    taxableLedgerId: taxableLedger.id,
    taxableLedgerName: taxableLedger.name,
    partyLedgerId: partyLedger.id,
    partyLedgerName: partyLedger.name,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalTaxAmount,
    invoiceAmount,
  })

  return {
    gst,
    lines,
  }
}

function buildSalesInvoice(
  salesPayload: NonNullable<ReturnType<typeof billingVoucherUpsertPayloadSchema.parse>["sales"]>,
  voucherTypeMap: Map<string, Awaited<ReturnType<typeof readVoucherTypes>>[number]>,
  ledgerMap: Map<string, Awaited<ReturnType<typeof readLedgers>>[number]>,
  productMap: Map<string, Product>
) {
  const voucherType = voucherTypeMap.get(salesPayload.voucherTypeId)

  if (!voucherType) {
    throw new ApplicationError(
      "Sales voucher type could not be found.",
      { voucherTypeId: salesPayload.voucherTypeId },
      400
    )
  }

  if (voucherType.postingType !== "sales") {
    throw new ApplicationError(
      "Selected voucher type is not configured for sales posting.",
      { voucherTypeId: voucherType.id, postingType: voucherType.postingType },
      400
    )
  }

  const salesLedger = ledgerMap.get(voucherType.ledgerId)
  const customerLedger = ledgerMap.get(salesPayload.customerLedgerId)

  if (!salesLedger) {
    throw new ApplicationError(
      "Sales ledger could not be found for the selected voucher type.",
      { ledgerId: voucherType.ledgerId },
      400
    )
  }

  if (!customerLedger) {
    throw new ApplicationError(
      "Customer ledger could not be found.",
      { ledgerId: salesPayload.customerLedgerId },
      400
    )
  }

  const items = salesPayload.items.map((item) => {
    const amount = roundCurrency(item.quantity * item.rate)
    const product = item.productId ? productMap.get(item.productId) : null
    const warehouseId =
      item.warehouseId ??
      product?.stockItems.find((stockItem) => stockItem.isActive)?.warehouseId ??
      null

    return {
      id: `sales-item:${randomUUID()}`,
      productId: item.productId,
      warehouseId,
      itemName: item.itemName,
      description: item.description,
      hsnOrSac: item.hsnOrSac,
      quantity: item.quantity,
      unit: item.unit,
      rate: item.rate,
      amount,
    }
  })

  const subtotal = roundCurrency(items.reduce((sum, item) => sum + item.amount, 0))
  const totalQuantity = roundCurrency(
    items.reduce((sum, item) => sum + item.quantity, 0)
  )
  const taxAmount = roundCurrency((subtotal * salesPayload.taxRate) / 100)
  const grandTotal = roundCurrency(subtotal + taxAmount)

  const sales = billingSalesInvoiceSchema.parse({
    voucherTypeId: voucherType.id,
    voucherTypeName: voucherType.name,
    ledgerId: salesLedger.id,
    ledgerName: salesLedger.name,
    customerLedgerId: customerLedger.id,
    customerLedgerName: customerLedger.name,
    billToName: salesPayload.billToName,
    billToAddress: salesPayload.billToAddress,
    shipToName: salesPayload.shipToName,
    shipToAddress: salesPayload.shipToAddress,
    dueDate: salesPayload.dueDate,
    referenceNumber: salesPayload.referenceNumber,
    supplyType: salesPayload.supplyType,
    placeOfSupply: salesPayload.placeOfSupply,
    partyGstin: salesPayload.partyGstin,
    taxRate: salesPayload.taxRate,
    subtotal,
    totalQuantity,
    taxAmount,
    grandTotal,
    items,
  })

  return {
    counterparty: sales.billToName,
    gstPayload: {
      supplyType: sales.supplyType,
      placeOfSupply: sales.placeOfSupply,
      partyGstin: sales.partyGstin,
      hsnOrSac: summarizeHsnOrSac(sales.items),
      taxableAmount: sales.subtotal,
      taxRate: sales.taxRate,
      taxableLedgerId: sales.ledgerId,
      partyLedgerId: sales.customerLedgerId,
    },
    sales,
  }
}

function buildVoucherStock(
  voucherType: BillingVoucher["type"],
  parsedPayload: ReturnType<typeof billingVoucherUpsertPayloadSchema.parse>,
  salesInvoice: ReturnType<typeof buildSalesInvoice> | null,
  productMap: Map<string, Product>,
  warehouseNameMap: Map<string, string>,
  existing?: BillingVoucher
) {
  if (voucherType === "sales" && salesInvoice?.sales) {
    const items = salesInvoice.sales.items
      .filter((item) => item.productId && item.warehouseId)
      .map((item, index) => ({
        id: existing?.stock?.items[index]?.id ?? `voucher-stock-item:${randomUUID()}`,
        productId: item.productId as string,
        productName: productMap.get(item.productId as string)?.name ?? item.itemName,
        warehouseId: item.warehouseId as string,
        warehouseName:
          warehouseNameMap.get(item.warehouseId as string) ?? (item.warehouseId as string),
        quantity: item.quantity,
        unit: item.unit,
        unitCost: 0,
        landedCostAmount: 0,
        totalCost: 0,
        note: item.description,
      }))

    return items.length > 0 ? billingVoucherStockSchema.parse({ items }) : null
  }

  if (!parsedPayload.stock) {
    return existing?.stock ?? null
  }

  return billingVoucherStockSchema.parse({
    items: parsedPayload.stock.items.map((item, index) => ({
      id: existing?.stock?.items[index]?.id ?? `voucher-stock-item:${randomUUID()}`,
      productId: item.productId,
      productName: productMap.get(item.productId)?.name ?? item.productId,
      warehouseId: item.warehouseId,
      warehouseName: warehouseNameMap.get(item.warehouseId) ?? item.warehouseId,
      quantity: item.quantity,
      unit: item.unit,
      unitCost: roundCurrency(item.unitCost),
      landedCostAmount: roundCurrency(item.landedCostAmount),
      totalCost: roundCurrency(item.quantity * item.unitCost + item.landedCostAmount),
      note: item.note,
    })),
  })
}

async function buildVoucherRecord(
  database: Kysely<unknown>,
  user: AuthUser,
  config: ServerConfig,
  payload: unknown,
  existing?: BillingVoucher
) {
  assertBillingViewer(user)

  const parsedPayload = billingVoucherUpsertPayloadSchema.parse(payload)
  try {
    assertBillingOperationDateAllowed(parsedPayload.date, config, "Voucher")
  } catch (error) {
    throw new ApplicationError(
      error instanceof Error ? error.message : "Voucher date is blocked by billing period controls.",
      { date: parsedPayload.date },
      409
    )
  }
  const ledgers = await readLedgers(database)
  const voucherTypes = await readVoucherTypes(database)
  const products = await readProducts(database)
  const warehouses = await readWarehouses(database)
  const ledgerMap = new Map(ledgers.map((ledger) => [ledger.id, ledger]))
  const voucherTypeMap = new Map(voucherTypes.map((type) => [type.id, type]))
  const productMap = new Map(products.map((product) => [product.id, product]))
  const warehouseNameMap = new Map(
    warehouses.map((warehouse) => [
      warehouse.id,
      typeof warehouse.name === "string" && warehouse.name.trim()
        ? warehouse.name.trim()
        : warehouse.id,
    ])
  )
  const normalizedVoucherNumber = parsedPayload.voucherNumber.trim().toLowerCase()
  const existingVouchers = await readVouchers(database)
  const duplicateVoucher = existingVouchers.find(
    (voucher) =>
      voucher.id !== existing?.id &&
      normalizedVoucherNumber.length > 0 &&
      voucher.voucherNumber.trim().toLowerCase() === normalizedVoucherNumber
  )

  if (duplicateVoucher) {
    throw new ApplicationError(
      "Voucher number already exists.",
      { voucherNumber: parsedPayload.voucherNumber },
      409
    )
  }

  let sourceDocument: BillingVoucher["sourceDocument"] = existing?.sourceDocument ?? null
  const requiredSourceType = getRequiredSourceType(parsedPayload.type)

  if (requiredSourceType) {
    const sourceDocumentLabel = getSourceDocumentLabel(parsedPayload.type)

    if (!parsedPayload.sourceVoucherId) {
      throw new ApplicationError(
        `${sourceDocumentLabel} requires a source voucher id.`,
        { type: parsedPayload.type },
        400
      )
    }

    const linkedVoucher = existingVouchers.find(
      (voucher) => voucher.id === parsedPayload.sourceVoucherId
    )

    if (!linkedVoucher) {
      throw new ApplicationError(
        "Source voucher for note could not be found.",
        { sourceVoucherId: parsedPayload.sourceVoucherId },
        404
      )
    }

    if (linkedVoucher.type !== requiredSourceType) {
      throw new ApplicationError(
        `${sourceDocumentLabel} must reference a ${requiredSourceType} voucher.`,
        { sourceVoucherId: linkedVoucher.id, sourceVoucherType: linkedVoucher.type },
        409
      )
    }

    sourceDocument = {
      voucherId: linkedVoucher.id,
      voucherNumber: linkedVoucher.voucherNumber,
      voucherType: linkedVoucher.type,
    }
  } else if (parsedPayload.sourceVoucherId !== null) {
    throw new ApplicationError(
      "Source voucher linkage is supported only for returns, notes, and landed cost documents.",
      { type: parsedPayload.type, sourceVoucherId: parsedPayload.sourceVoucherId },
      400
    )
  }

  const normalizedManualLines = parsedPayload.lines.map((line) => {
    const ledger = ledgerMap.get(line.ledgerId)

    if (!ledger) {
      throw new ApplicationError(
        "Voucher line ledger could not be found.",
        { ledgerId: line.ledgerId },
        400
      )
    }

    return {
      id: existing?.lines.find(
        (candidate) =>
          candidate.ledgerId === line.ledgerId &&
          candidate.side === line.side &&
          candidate.note === line.note &&
          candidate.amount === line.amount
      )?.id ?? `voucher-line:${randomUUID()}`,
      ledgerId: ledger.id,
      ledgerName: ledger.name,
      side: line.side,
      amount: line.amount,
      note: line.note,
    }
  })

  const salesInvoice =
    parsedPayload.type === "sales" && parsedPayload.sales !== null
      ? buildSalesInvoice(parsedPayload.sales, voucherTypeMap, ledgerMap, productMap)
      : null
  const stock = buildVoucherStock(
    parsedPayload.type,
    parsedPayload,
    salesInvoice,
    productMap,
    warehouseNameMap,
    existing
  )
  const derivedGstPayload = salesInvoice?.gstPayload ?? parsedPayload.gst
  const autoPosted =
    derivedGstPayload !== null
      ? buildAutoPostedGst(parsedPayload.type, derivedGstPayload, ledgerMap)
      : null

  if (derivedGstPayload === null && normalizedManualLines.length < 2) {
    throw new ApplicationError(
      "At least two voucher lines are required for non-GST vouchers.",
      {},
      400
    )
  }

  const lines = autoPosted?.lines ?? normalizedManualLines
  const gst = autoPosted?.gst ?? null
  const counterparty = salesInvoice?.counterparty ?? parsedPayload.counterparty.trim()

  if (!counterparty) {
    throw new ApplicationError(
      "Counterparty is required.",
      { type: parsedPayload.type },
      400
    )
  }

  if (
    ["stock_adjustment", "landed_cost"].includes(parsedPayload.type) &&
    stock === null
  ) {
    throw new ApplicationError(
      "Stock-linked voucher requires stock rows.",
      { type: parsedPayload.type },
      400
    )
  }
  const settlementAmount =
    lines.find((line) =>
      parsedPayload.type === "receipt"
        ? line.side === "debit"
        : parsedPayload.type === "payment"
          ? line.side === "credit"
          : false
    )?.amount ?? 0

  try {
    validateBillAllocations(
      parsedPayload.type,
      parsedPayload.billAllocations,
      settlementAmount
    )
  } catch (error) {
    throw new ApplicationError(
      error instanceof Error ? error.message : "Invalid bill allocations.",
      {},
      400
    )
  }

  const totals = getVoucherTotals({ lines })

  if (totals.debit <= 0 || totals.credit <= 0) {
    throw new ApplicationError(
      "Both debit and credit totals must be greater than zero.",
      totals,
      400
    )
  }

  if (totals.debit !== totals.credit) {
    throw new ApplicationError(
      "Voucher is not balanced. Debit and credit totals must match.",
      totals,
      400
    )
  }

  const timestamp = new Date().toISOString()
  const fyBase = resolveFinancialYear(parsedPayload.date, config)
  const prefix = getConfiguredVoucherPrefix(parsedPayload.type, config)
  const sequenceNumber =
    existing?.financialYear.sequenceNumber ??
    existingVouchers.filter((voucher) => voucher.financialYear.code === fyBase.code && voucher.type === parsedPayload.type).length + 1
  const financialYear = {
    ...fyBase,
    sequenceNumber,
    prefix,
  }
  const voucherNumber = resolveVoucherNumber(parsedPayload, financialYear, config)
  const review = buildVoucherReviewState(
    {
      type: parsedPayload.type,
      gst,
      lines,
      sales:
        parsedPayload.type === "sales"
          ? salesInvoice?.sales ?? existing?.sales ?? null
          : null,
    },
    config,
    existing,
    timestamp
  )

  const baseRecord = {
    id: existing?.id ?? `voucher:${randomUUID()}`,
    voucherNumber,
    status: parsedPayload.status,
    reversalOfVoucherId: existing?.reversalOfVoucherId ?? null,
    reversalOfVoucherNumber: existing?.reversalOfVoucherNumber ?? null,
    reversedByVoucherId: existing?.reversedByVoucherId ?? null,
    reversedByVoucherNumber: existing?.reversedByVoucherNumber ?? null,
    reversedAt: existing?.reversedAt ?? null,
    reversalReason: existing?.reversalReason ?? null,
    sourceDocument,
    review,
    type: parsedPayload.type,
    date: parsedPayload.date,
    counterparty,
    narration: parsedPayload.narration,
    lines,
    gst,
    sales:
      parsedPayload.type === "sales"
        ? salesInvoice?.sales ?? existing?.sales ?? null
        : null,
    stock,
    financialYear,
    billAllocations: parsedPayload.billAllocations.map((allocation) => ({
      id:
        existing?.billAllocations.find(
          (candidate) => candidate.referenceNumber === allocation.referenceNumber
        )?.id ?? `bill-allocation:${randomUUID()}`,
      referenceType: allocation.referenceType,
      referenceNumber: allocation.referenceNumber,
      referenceDate: allocation.referenceDate,
      dueDate: allocation.dueDate,
      amount: allocation.amount,
      note: allocation.note,
    })),
    bankReconciliation:
      hasBankLedgerLine(lines, ledgerMap)
        ? existing?.bankReconciliation ?? {
            status: "pending" as const,
            clearedDate: null,
            statementReference: null,
            statementAmount: null,
            mismatchAmount: null,
            note: "",
          }
        : {
            status: "not_applicable" as const,
            clearedDate: null,
            statementReference: null,
            statementAmount: null,
            mismatchAmount: null,
            note: "",
          },
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    createdByUserId: existing?.createdByUserId ?? user.id,
  }

  const eInvoice = billingVoucherEInvoiceSchema.parse(
    parsedPayload.generateEInvoice
      ? await generateEInvoiceRecord(
          billingVoucherSchema.parse({
            ...baseRecord,
            eInvoice: existing?.eInvoice ?? {
              status: "pending",
              irn: null,
              ackNo: null,
              ackDate: null,
              qrCodePayload: null,
              signedInvoice: null,
              generatedAt: null,
              errorMessage: null,
            },
            eWayBill: existing?.eWayBill ?? {
              status: "pending",
              ewayBillNo: null,
              ewayBillDate: null,
              validUpto: null,
              distanceKm: null,
              vehicleNumber: null,
              transporterId: null,
              generatedAt: null,
              errorMessage: null,
            },
          }),
          config
        )
      : existing?.eInvoice ?? {
          status: "not_applicable",
          irn: null,
          ackNo: null,
          ackDate: null,
          qrCodePayload: null,
          signedInvoice: null,
          generatedAt: null,
          errorMessage: null,
        }
  )
  const eWayBill = billingVoucherEWayBillSchema.parse(
    parsedPayload.generateEWayBill
      ? await generateEWayBillRecord(
          billingVoucherSchema.parse({
            ...baseRecord,
            eInvoice,
            eWayBill: existing?.eWayBill ?? {
              status: "pending",
              ewayBillNo: null,
              ewayBillDate: null,
              validUpto: null,
              distanceKm: null,
              vehicleNumber: null,
              transporterId: null,
              generatedAt: null,
              errorMessage: null,
            },
          }),
          config,
          parsedPayload.transport
        )
      : existing?.eWayBill ?? {
          status: "not_applicable",
          ewayBillNo: null,
          ewayBillDate: null,
          validUpto: null,
          distanceKm: null,
          vehicleNumber: null,
          transporterId: null,
          generatedAt: null,
          errorMessage: null,
        }
  )

  return billingVoucherSchema.parse({
    ...baseRecord,
    eInvoice,
    eWayBill,
  })
}

export async function listBillingVouchers(
  database: Kysely<unknown>,
  user: AuthUser,
  type?: BillingVoucher["type"]
) {
  assertBillingViewer(user)

  return billingVoucherListResponseSchema.parse({
    items: (await readVouchers(database)).filter((item) =>
      type ? item.type === type : true
    ),
  })
}

export async function getBillingVoucher(
  database: Kysely<unknown>,
  user: AuthUser,
  voucherId: string
) {
  assertBillingViewer(user)

  const item = await getStorePayloadById(
    database,
    billingTableNames.vouchers,
    voucherId,
    billingVoucherSchema
  )

  if (!item) {
    throw new ApplicationError("Billing voucher could not be found.", { voucherId }, 404)
  }

  return billingVoucherResponseSchema.parse({
    item,
  })
}

export async function createBillingVoucher(
  database: Kysely<unknown>,
  user: AuthUser,
  config: ServerConfig,
  payload: unknown
) {
  const createdItem = await buildVoucherRecord(database, user, config, payload)
  const items = await readVouchers(database)
  const nextItems = [createdItem, ...items].sort((left, right) =>
    right.date.localeCompare(left.date) ||
    right.updatedAt.localeCompare(left.updatedAt)
  )

  await replaceStorePayloads(
    database,
    billingTableNames.vouchers,
    nextItems.map((item, index) => ({
      id: item.id,
      moduleKey: "vouchers",
      sortOrder: index + 1,
      payload: item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  )

  await replaceBillingVoucherHeaders(database, nextItems)
  await replaceBillingVoucherLines(database, nextItems)
  await replaceBillingLedgerEntries(database, nextItems)
  await synchronizeBillingInventoryToCore(database, nextItems, config)

  await writeBillingVoucherAudit(database, config, user, {
    action: createdItem.status === "posted" ? "voucher_post" : "voucher_create",
    message:
      createdItem.status === "posted"
        ? `Posted billing voucher ${createdItem.voucherNumber}.`
        : `Created draft billing voucher ${createdItem.voucherNumber}.`,
    voucher: createdItem,
  })

  return billingVoucherResponseSchema.parse({
    item: createdItem,
  })
}

export async function updateBillingVoucher(
  database: Kysely<unknown>,
  user: AuthUser,
  config: ServerConfig,
  voucherId: string,
  payload: unknown
) {
  const items = await readVouchers(database)
  const existingItem = items.find((item) => item.id === voucherId)

  if (!existingItem) {
    throw new ApplicationError("Billing voucher could not be found.", { voucherId }, 404)
  }

  assertVoucherIsMutable(existingItem)

  const updatedItem = await buildVoucherRecord(
    database,
    user,
    config,
    payload,
    existingItem
  )
  const nextItems = items
    .map((item) => (item.id === voucherId ? updatedItem : item))
    .sort((left, right) =>
      right.date.localeCompare(left.date) ||
      right.updatedAt.localeCompare(left.updatedAt)
    )

  await replaceStorePayloads(
    database,
    billingTableNames.vouchers,
    nextItems.map((item, index) => ({
      id: item.id,
      moduleKey: "vouchers",
      sortOrder: index + 1,
      payload: item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  )

  await replaceBillingVoucherHeaders(database, nextItems)
  await replaceBillingVoucherLines(database, nextItems)
  await replaceBillingLedgerEntries(database, nextItems)
  await synchronizeBillingInventoryToCore(database, nextItems, config)

  if (updatedItem.status === "posted" && existingItem.status !== "posted") {
    await writeBillingVoucherAudit(database, config, user, {
      action: "voucher_post",
      message: `Posted billing voucher ${updatedItem.voucherNumber}.`,
      voucher: updatedItem,
      details: {
        previousStatus: existingItem.status,
      },
    })
  }

  if (updatedItem.status === "cancelled" && existingItem.status !== "cancelled") {
    await writeBillingVoucherAudit(database, config, user, {
      action: "voucher_cancel",
      message: `Cancelled billing voucher ${updatedItem.voucherNumber}.`,
      voucher: updatedItem,
      details: {
        previousStatus: existingItem.status,
      },
    })
  }

  return billingVoucherResponseSchema.parse({
    item: updatedItem,
  })
}

export async function deleteBillingVoucher(
  database: Kysely<unknown>,
  user: AuthUser,
  config: ServerConfig,
  voucherId: string
) {
  assertBillingViewer(user)

  const items = await readVouchers(database)
  const existingItem = items.find((item) => item.id === voucherId)

  if (!existingItem) {
    throw new ApplicationError("Billing voucher could not be found.", { voucherId }, 404)
  }

  assertVoucherIsMutable(existingItem)

  const nextItems = items.filter((item) => item.id !== voucherId)

  await replaceStorePayloads(
    database,
    billingTableNames.vouchers,
    nextItems.map((item, index) => ({
      id: item.id,
      moduleKey: "vouchers",
      sortOrder: index + 1,
      payload: item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  )

  await replaceBillingVoucherHeaders(database, nextItems)
  await replaceBillingVoucherLines(database, nextItems)
  await replaceBillingLedgerEntries(database, nextItems)
  await synchronizeBillingInventoryToCore(database, nextItems, config)

  await writeBillingVoucherAudit(database, config, user, {
    action: "voucher_delete",
    message: `Deleted draft billing voucher ${existingItem.voucherNumber}.`,
    voucher: existingItem,
  })

  return {
    deleted: true as const,
    id: voucherId,
  }
}

export async function reverseBillingVoucher(
  database: Kysely<unknown>,
  user: AuthUser,
  config: ServerConfig,
  voucherId: string,
  payload: unknown
) {
  assertBillingViewer(user)

  const parsedPayload = billingVoucherReversePayloadSchema.parse(payload)
  const items = await readVouchers(database)
  const existingItem = items.find((item) => item.id === voucherId)

  if (!existingItem) {
    throw new ApplicationError("Billing voucher could not be found.", { voucherId }, 404)
  }

  if (existingItem.reversedByVoucherId) {
    throw new ApplicationError(
      "Voucher has already been reversed.",
      { voucherId, reversedByVoucherId: existingItem.reversedByVoucherId },
      409
    )
  }

  if (existingItem.reversalOfVoucherId) {
    throw new ApplicationError(
      "A reversal voucher cannot be reversed again through the direct reverse action.",
      { voucherId, reversalOfVoucherId: existingItem.reversalOfVoucherId },
      409
    )
  }

  if (existingItem.status !== "posted") {
    throw new ApplicationError(
      "Only posted vouchers can be reversed.",
      { status: existingItem.status, voucherId },
      409
    )
  }

  const timestamp = new Date().toISOString()
  const reversalDate = parsedPayload.date ?? toTodayDate()
  try {
    assertBillingOperationDateAllowed(reversalDate, config, "Reversal")
  } catch (error) {
    throw new ApplicationError(
      error instanceof Error ? error.message : "Reversal date is blocked by billing period controls.",
      { date: reversalDate, voucherId },
      409
    )
  }
  const fyBase = resolveFinancialYear(reversalDate, config)
  const prefix = getConfiguredVoucherPrefix(existingItem.type, config)
  const sequenceNumber =
    items.filter(
      (voucher) =>
        voucher.financialYear.code === fyBase.code && voucher.type === existingItem.type
    ).length + 1
  const financialYear = {
    ...fyBase,
    sequenceNumber,
    prefix,
  }
  const reversalVoucherNumber = createVoucherNumber(
    existingItem.type,
    financialYear,
    prefix
  )

  const reversalItem = billingVoucherSchema.parse({
    ...existingItem,
    id: `voucher:${randomUUID()}`,
    voucherNumber: reversalVoucherNumber,
    status: "posted",
    reversalOfVoucherId: existingItem.id,
    reversalOfVoucherNumber: existingItem.voucherNumber,
    reversedByVoucherId: null,
    reversedByVoucherNumber: null,
    reversedAt: null,
    reversalReason: parsedPayload.reason,
    sourceDocument: null,
    review: buildVoucherReviewState(existingItem, config, undefined, timestamp),
    date: reversalDate,
    narration: `Reversal of ${existingItem.voucherNumber}. ${parsedPayload.reason}`,
    lines: existingItem.lines.map((line) => ({
      ...line,
      id: `voucher-line:${randomUUID()}`,
      side: line.side === "debit" ? "credit" : "debit",
      note: `Reversal of ${existingItem.voucherNumber}: ${line.note}`,
    })),
    billAllocations: [],
    eInvoice: {
      status: "not_applicable",
      irn: null,
      ackNo: null,
      ackDate: null,
      qrCodePayload: null,
      signedInvoice: null,
      generatedAt: null,
      errorMessage: null,
    },
    eWayBill: {
      status: "not_applicable",
      ewayBillNo: null,
      ewayBillDate: null,
      validUpto: null,
      distanceKm: null,
      vehicleNumber: null,
      transporterId: null,
      generatedAt: null,
      errorMessage: null,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
    createdByUserId: user.id,
  })

  const updatedOriginal = billingVoucherSchema.parse({
    ...existingItem,
    status: "reversed",
    reversedByVoucherId: reversalItem.id,
    reversedByVoucherNumber: reversalItem.voucherNumber,
    reversedAt: timestamp,
    reversalReason: parsedPayload.reason,
    updatedAt: timestamp,
  })

  const nextItems = items
    .map((item) => (item.id === existingItem.id ? updatedOriginal : item))
    .concat(reversalItem)
    .sort((left, right) =>
      right.date.localeCompare(left.date) || right.updatedAt.localeCompare(left.updatedAt)
    )

  await replaceStorePayloads(
    database,
    billingTableNames.vouchers,
    nextItems.map((item, index) => ({
      id: item.id,
      moduleKey: "vouchers",
      sortOrder: index + 1,
      payload: item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  )

  await replaceBillingVoucherHeaders(database, nextItems)
  await replaceBillingVoucherLines(database, nextItems)
  await replaceBillingLedgerEntries(database, nextItems)
  await synchronizeBillingInventoryToCore(database, nextItems, config)

  await writeBillingVoucherAudit(database, config, user, {
    action: "voucher_reverse",
    message: `Reversed billing voucher ${existingItem.voucherNumber} with ${reversalItem.voucherNumber}.`,
    voucher: updatedOriginal,
    details: {
      reversalVoucherId: reversalItem.id,
      reversalVoucherNumber: reversalItem.voucherNumber,
      reversalReason: parsedPayload.reason,
    },
  })

  return billingVoucherReverseResponseSchema.parse({
    item: updatedOriginal,
    reversalItem,
  })
}

export async function reconcileBillingVoucher(
  database: Kysely<unknown>,
  user: AuthUser,
  config: ServerConfig,
  voucherId: string,
  payload: unknown
) {
  assertBillingViewer(user)

  const parsedPayload = billingVoucherBankReconciliationPayloadSchema.parse(payload)
  const items = await readVouchers(database)
  const existingItem = items.find((item) => item.id === voucherId)

  if (!existingItem) {
    throw new ApplicationError("Billing voucher could not be found.", { voucherId }, 404)
  }

  if (existingItem.status !== "posted") {
    throw new ApplicationError(
      "Only posted vouchers can be reconciled.",
      { voucherId, status: existingItem.status },
      409
    )
  }

  const ledgers = await readLedgers(database)
  const ledgerMap = new Map(ledgers.map((ledger) => [ledger.id, ledger]))

  if (!hasBankLedgerLine(existingItem.lines, ledgerMap)) {
    throw new ApplicationError(
      "Only vouchers with bank-ledger movement can be reconciled.",
      { voucherId, voucherNumber: existingItem.voucherNumber },
      409
    )
  }

  const bankAmount = getBankLedgerSettlementAmount(existingItem.lines, ledgerMap)
  const statementAmount = parsedPayload.statementAmount
  const mismatchAmount =
    statementAmount === null ? null : roundCurrency(Math.abs(statementAmount - bankAmount))
  const timestamp = new Date().toISOString()

  if (parsedPayload.status === "pending") {
    const updatedItem = billingVoucherSchema.parse({
      ...existingItem,
      updatedAt: timestamp,
      bankReconciliation: {
        status: "pending",
        clearedDate: null,
        statementReference: null,
        statementAmount: null,
        mismatchAmount: null,
        note: parsedPayload.note,
      },
    })

    const nextItems = items.map((item) => (item.id === voucherId ? updatedItem : item))
    await replaceStorePayloads(
      database,
      billingTableNames.vouchers,
      nextItems.map((item, index) => ({
        id: item.id,
        moduleKey: "vouchers",
        sortOrder: index + 1,
        payload: item,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }))
    )
    await replaceBillingVoucherHeaders(database, nextItems)
    await replaceBillingVoucherLines(database, nextItems)
    await replaceBillingLedgerEntries(database, nextItems)
    await synchronizeBillingInventoryToCore(database, nextItems, config)

    await writeBillingVoucherAudit(database, config, user, {
      action: "voucher_reconcile",
      message: `Reset bank reconciliation for billing voucher ${updatedItem.voucherNumber} to pending.`,
      voucher: updatedItem,
      details: {
        reconciliationStatus: "pending",
      },
    })

    return billingVoucherBankReconciliationResponseSchema.parse({
      item: updatedItem,
    })
  }

  if (!parsedPayload.clearedDate || !parsedPayload.statementReference || statementAmount === null) {
    throw new ApplicationError(
      "Cleared date, statement reference, and statement amount are required for matched or mismatch reconciliation.",
      { voucherId, status: parsedPayload.status },
      400
    )
  }

  if (parsedPayload.status === "matched" && mismatchAmount !== null && mismatchAmount > 0) {
    throw new ApplicationError(
      "Matched reconciliation requires statement amount to equal the bank-book amount.",
      { voucherId, statementAmount, bankAmount, mismatchAmount },
      409
    )
  }

  const updatedItem = billingVoucherSchema.parse({
    ...existingItem,
    updatedAt: timestamp,
    bankReconciliation: {
      status: parsedPayload.status,
      clearedDate: parsedPayload.clearedDate,
      statementReference: parsedPayload.statementReference,
      statementAmount,
      mismatchAmount: parsedPayload.status === "mismatch" ? mismatchAmount : 0,
      note: parsedPayload.note,
    },
  })

  const nextItems = items.map((item) => (item.id === voucherId ? updatedItem : item))
  await replaceStorePayloads(
    database,
    billingTableNames.vouchers,
    nextItems.map((item, index) => ({
      id: item.id,
      moduleKey: "vouchers",
      sortOrder: index + 1,
      payload: item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  )
  await replaceBillingVoucherHeaders(database, nextItems)
  await replaceBillingVoucherLines(database, nextItems)
  await replaceBillingLedgerEntries(database, nextItems)
  await synchronizeBillingInventoryToCore(database, nextItems, config)

  await writeBillingVoucherAudit(database, config, user, {
    action: "voucher_reconcile",
    message: `Updated bank reconciliation for billing voucher ${updatedItem.voucherNumber} as ${parsedPayload.status}.`,
    voucher: updatedItem,
    details: {
      reconciliationStatus: parsedPayload.status,
      clearedDate: parsedPayload.clearedDate,
      statementReference: parsedPayload.statementReference,
      statementAmount,
      bankAmount,
      mismatchAmount: parsedPayload.status === "mismatch" ? mismatchAmount : 0,
    },
  })

  return billingVoucherBankReconciliationResponseSchema.parse({
    item: updatedItem,
  })
}

export async function reviewBillingVoucher(
  database: Kysely<unknown>,
  user: AuthUser,
  config: ServerConfig,
  voucherId: string,
  payload: unknown
) {
  assertBillingViewer(user)

  const parsedPayload = billingVoucherReviewPayloadSchema.parse(payload)
  const items = await readVouchers(database)
  const existingItem = items.find((item) => item.id === voucherId)

  if (!existingItem) {
    throw new ApplicationError("Billing voucher could not be found.", { voucherId }, 404)
  }

  if (existingItem.review.status === "not_required") {
    throw new ApplicationError(
      "This billing voucher does not require review under the current policy.",
      { voucherId, voucherNumber: existingItem.voucherNumber },
      409
    )
  }

  const timestamp = new Date().toISOString()
  const updatedItem = billingVoucherSchema.parse({
    ...existingItem,
    updatedAt: timestamp,
    review: {
      ...existingItem.review,
      status: parsedPayload.status,
      reviewedAt: timestamp,
      reviewedByUserId: user.id,
      note: parsedPayload.note,
    },
  })

  const nextItems = items.map((item) => (item.id === voucherId ? updatedItem : item))
  await replaceStorePayloads(
    database,
    billingTableNames.vouchers,
    nextItems.map((item, index) => ({
      id: item.id,
      moduleKey: "vouchers",
      sortOrder: index + 1,
      payload: item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  )
  await replaceBillingVoucherHeaders(database, nextItems)
  await replaceBillingVoucherLines(database, nextItems)
  await replaceBillingLedgerEntries(database, nextItems)
  await synchronizeBillingInventoryToCore(database, nextItems, config)

  await writeBillingVoucherAudit(database, config, user, {
    action: "voucher_review",
    message: `${parsedPayload.status === "approved" ? "Approved" : "Rejected"} billing voucher ${updatedItem.voucherNumber} for finance review.`,
    voucher: updatedItem,
    details: {
      reviewStatus: parsedPayload.status,
      reviewNote: parsedPayload.note,
    },
  })

  return billingVoucherReviewResponseSchema.parse({
    item: updatedItem,
  })
}

export async function getBillingVoucherDocument(
  database: Kysely<unknown>,
  user: AuthUser,
  voucherId: string,
  format: BillingVoucherDocumentFormat
) {
  assertBillingViewer(user)

  const item = await getStorePayloadById(
    database,
    billingTableNames.vouchers,
    voucherId,
    billingVoucherSchema
  )

  if (!item) {
    throw new ApplicationError("Billing voucher could not be found.", { voucherId }, 404)
  }

  const title = buildVoucherDocumentTitle(item)
  const safeBaseName = `${item.voucherNumber}`.replace(/[^A-Za-z0-9._-]+/g, "-")
  const documentItem =
    format === "print"
      ? billingVoucherDocumentTemplateSchema.parse({
          voucherId: item.id,
          voucherNumber: item.voucherNumber,
          title,
          format,
          fileName: `${safeBaseName}.html`,
          mimeType: "text/html",
          content: buildVoucherPrintDocument(item),
        })
      : format === "csv"
        ? billingVoucherDocumentTemplateSchema.parse({
            voucherId: item.id,
            voucherNumber: item.voucherNumber,
            title,
            format,
            fileName: `${safeBaseName}.csv`,
            mimeType: "text/csv",
            content: buildVoucherCsvDocument(item),
          })
        : billingVoucherDocumentTemplateSchema.parse({
            voucherId: item.id,
            voucherNumber: item.voucherNumber,
            title,
            format,
            fileName: `${safeBaseName}.json`,
            mimeType: "application/json",
            content: JSON.stringify(item, null, 2),
          })

  return billingVoucherDocumentResponseSchema.parse({
    item: documentItem,
  })
}
