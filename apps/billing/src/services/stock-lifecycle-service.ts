import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"
import { z } from "zod"

import type { AuthUser } from "../../../cxapp/shared/index.js"
import { listCompanies } from "../../../cxapp/src/services/company-service.js"
import { resolveCxappTenantContext } from "../../../cxapp/src/services/tenant-context-service.js"
import { coreTableNames } from "../../../core/database/table-names.js"
import { productSchema, type Product } from "../../../core/shared/index.js"
import { createInventoryEngineRuntimeServices } from "../../../framework/engines/inventory-engine/runtime-services.js"
import { applyLiveStockMovement } from "../../../stock/src/services/live-stock-service.js"
import {
  listJsonStorePayloads,
} from "../../../framework/src/runtime/database/process/json-store.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import {
  billingBarcodeResolutionPayloadSchema,
  billingBarcodeResolutionResponseSchema,
  billingStockAcceptancePayloadSchema,
  billingStockAcceptanceResponseSchema,
  billingStockAcceptanceVerificationListResponseSchema,
  billingStockAcceptanceVerificationSchema,
  billingGoodsInwardPostingResponseSchema,
  billingGoodsInwardSchema,
  billingPurchaseReceiptBarcodeGenerationPayloadSchema,
  billingPurchaseReceiptBarcodeGenerationResponseSchema,
  billingPurchaseReceiptBarcodeRollbackPayloadSchema,
  billingPurchaseReceiptBarcodeRollbackResponseSchema,
  billingStickerPrintBatchPayloadSchema,
  billingStickerPrintBatchResponseSchema,
  billingStickerPrintBatchSchema,
  billingStockBarcodeAliasSchema,
  billingStockSaleAllocationListResponseSchema,
  billingStockSaleAllocationPayloadSchema,
  billingStockSaleAllocationResponseSchema,
  billingStockSaleAllocationSchema,
  billingStockScanVerificationSchema,
  billingStockUnitListResponseSchema,
  billingStockUnitResponseSchema,
  billingStockUnitSchema,
  billingPurchaseReceiptSchema,
  billingVoucherSchema,
  type BillingGoodsInward,
  type BillingPurchaseReceipt,
  type BillingStockAcceptanceVerification,
  type BillingStockBarcodeAlias,
  type BillingStockSaleAllocation,
  type BillingStockUnit,
} from "../../shared/index.js"
import { billingTableNames } from "../../database/table-names.js"

import { assertBillingViewer } from "./access.js"
import {
  syncBillingSalesIssueToInventoryEngine,
} from "./inventory-engine-sync-service.js"
import { getStorePayloadById, listStorePayloads, replaceStorePayloads } from "./store.js"

function roundQuantity(value: number) {
  return Number(value.toFixed(4))
}

function normalizeBarcodeValue(value: string) {
  return value.trim().toUpperCase()
}

function sanitizeToken(value: string | null | undefined, fallback: string) {
  const base = (value ?? "").trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "")
  return base || fallback
}

async function readGoodsInwardNotes(database: Kysely<unknown>) {
  return listStorePayloads(
    database,
    billingTableNames.goodsInwardNotes,
    billingGoodsInwardSchema
  )
}

async function readPurchaseReceipts(database: Kysely<unknown>) {
  return listStorePayloads(
    database,
    billingTableNames.purchaseReceipts,
    billingPurchaseReceiptSchema
  )
}

async function readStockUnits(database: Kysely<unknown>) {
  return listStorePayloads(database, billingTableNames.stockUnits, billingStockUnitSchema)
}

async function readBarcodeAliases(database: Kysely<unknown>) {
  return listStorePayloads(
    database,
    billingTableNames.stockBarcodeAliases,
    billingStockBarcodeAliasSchema
  )
}

async function readStickerPrintBatches(database: Kysely<unknown>) {
  return listStorePayloads(
    database,
    billingTableNames.stickerPrintBatches,
    billingStickerPrintBatchSchema
  )
}

async function readSaleAllocations(database: Kysely<unknown>) {
  return listStorePayloads(
    database,
    billingTableNames.stockSaleAllocations,
    billingStockSaleAllocationSchema
  )
}

async function readStockAcceptanceVerifications(database: Kysely<unknown>) {
  return listStorePayloads(
    database,
    billingTableNames.stockAcceptanceVerifications,
    billingStockAcceptanceVerificationSchema
  )
}

async function readProducts(database: Kysely<unknown>) {
  const items = await listJsonStorePayloads<Product>(database, coreTableNames.products)
  return items.map((item) => productSchema.parse(item))
}

async function readCompanies(database: Kysely<unknown>) {
  const response = await listCompanies(database)
  return response.items
}

async function readVouchers(database: Kysely<unknown>) {
  return listStorePayloads(database, billingTableNames.vouchers, billingVoucherSchema)
}

function getPrimaryCompany(companies: Awaited<ReturnType<typeof readCompanies>>) {
  return companies.find((company) => company.isPrimary) ?? companies.find((company) => company.isActive) ?? companies[0] ?? null
}

function getVariantSummary(product: Product, variantId: string | null) {
  if (!variantId) {
    return null
  }

  const variant = product.variants.find((item) => item.id === variantId)

  if (!variant) {
    return null
  }

  return (
    variant.variantName ||
    variant.attributes
      .filter((item) => item.isActive)
      .map((item) => `${item.attributeName}: ${item.attributeValue}`)
      .join(", ") ||
    null
  )
}

function getAttributeSummary(product: Product, variantId: string | null) {
  if (variantId) {
    const variant = product.variants.find((item) => item.id === variantId)

    if (variant) {
      const summary = variant.attributes
        .filter((item) => item.isActive)
        .map((item) => `${item.attributeName}: ${item.attributeValue}`)
        .join(", ")

      if (summary) {
        return summary
      }
    }
  }

  const summary = product.attributes
    .filter((item) => item.isActive)
    .map((item) => item.name)
    .join(", ")

  return summary || null
}

function getPricing(product: Product, variantId: string | null) {
  const price =
    product.prices.find((item) => item.isActive && item.variantId === variantId) ??
    product.prices.find((item) => item.isActive && item.variantId == null) ??
    null

  return {
    mrp: price?.mrp ?? null,
    sellingPrice: price?.sellingPrice ?? product.basePrice ?? null,
  }
}

function buildBatchCode(product: Product, inward: BillingGoodsInward, lineIndex: number) {
  return sanitizeToken(
    `${product.code}-${inward.postingDate.replace(/-/g, "")}-${lineIndex + 1}`,
    `BATCH-${lineIndex + 1}`
  )
}

function buildSerialNumber(
  inward: BillingGoodsInward,
  lineIndex: number,
  unitSequence: number,
  manufacturerSerial: string | null
) {
  if (manufacturerSerial?.trim()) {
    return normalizeBarcodeValue(manufacturerSerial)
  }

  return sanitizeToken(
    `${inward.inwardNumber}-${lineIndex + 1}-${unitSequence}`,
    `SERIAL-${lineIndex + 1}-${unitSequence}`
  )
}

function buildInternalBarcode(
  product: Product,
  batchCode: string | null,
  serialNumber: string
) {
  const identityToken = batchCode?.trim()
    ? `CS-${product.code}-${batchCode}-${serialNumber}`
    : `CS-${product.code}-${serialNumber}`
  return sanitizeToken(identityToken, `CS-${product.id}`)
}

function renderStickerHtml(
  unit: BillingStockUnit,
  company: Awaited<ReturnType<typeof readCompanies>>[number] | null
) {
  const companyEmail = company?.primaryEmail ?? null
  const companyPhone = company?.primaryPhone ?? null
  const details = [
    `<div class="line product">${unit.productName}</div>`,
    `<div class="line code">${unit.productCode}</div>`,
    unit.variantSummary ? `<div class="line variant">${unit.variantSummary}</div>` : "",
    unit.attributeSummary ? `<div class="line attrs">${unit.attributeSummary}</div>` : "",
    `<div class="line barcode">${unit.barcodeValue}</div>`,
    unit.batchCode ? `<div class="line batch">Batch: ${unit.batchCode}</div>` : "",
    `<div class="line serial">Serial: ${unit.serialNumber}</div>`,
    unit.expiresAt ? `<div class="line expiry">Expiry: ${unit.expiresAt}</div>` : "",
    unit.mrp != null ? `<div class="line price">MRP: ${unit.mrp.toFixed(2)}</div>` : "",
    companyEmail ? `<div class="line email">${companyEmail}</div>` : "",
    companyPhone ? `<div class="line phone">${companyPhone}</div>` : "",
  ].filter(Boolean)

  return [
    `<article class="inventory-sticker" data-size="25x50mm">`,
    `<header>${company?.name ?? "Company"}</header>`,
    ...details,
    `</article>`,
  ].join("")
}

function ensureAvailableStockUnit(unit: BillingStockUnit) {
  if (unit.status !== "available") {
    throw new ApplicationError(
      "Stock unit is not available for sale allocation.",
      {
        stockUnitId: unit.id,
        status: unit.status,
      },
      409
    )
  }
}

async function writeGoodsInwardNotes(database: Kysely<unknown>, items: BillingGoodsInward[]) {
  await replaceStorePayloads(
    database,
    billingTableNames.goodsInwardNotes,
    items.map((item, index) => ({
      id: item.id,
      moduleKey: "goods-inward-notes",
      sortOrder: index + 1,
      payload: item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  )
}

async function writePurchaseReceipts(
  database: Kysely<unknown>,
  items: Awaited<ReturnType<typeof readPurchaseReceipts>>
) {
  await replaceStorePayloads(
    database,
    billingTableNames.purchaseReceipts,
    items.map((item, index) => ({
      id: item.id,
      moduleKey: "purchase-receipts",
      sortOrder: index + 1,
      payload: item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  )
}

async function writeStockUnits(database: Kysely<unknown>, items: BillingStockUnit[]) {
  await replaceStorePayloads(
    database,
    billingTableNames.stockUnits,
    items.map((item, index) => ({
      id: item.id,
      moduleKey: "stock-units",
      sortOrder: index + 1,
      payload: item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  )
}

async function writeBarcodeAliases(
  database: Kysely<unknown>,
  items: BillingStockBarcodeAlias[]
) {
  await replaceStorePayloads(
    database,
    billingTableNames.stockBarcodeAliases,
    items.map((item, index) => ({
      id: item.id,
      moduleKey: "stock-barcode-aliases",
      sortOrder: index + 1,
      payload: item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  )
}

async function writeStickerPrintBatches(
  database: Kysely<unknown>,
  items: Awaited<ReturnType<typeof readStickerPrintBatches>>
) {
  await replaceStorePayloads(
    database,
    billingTableNames.stickerPrintBatches,
    items.map((item, index) => ({
      id: item.id,
      moduleKey: "sticker-print-batches",
      sortOrder: index + 1,
      payload: item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  )
}

async function writeSaleAllocations(
  database: Kysely<unknown>,
  items: BillingStockSaleAllocation[]
) {
  await replaceStorePayloads(
    database,
    billingTableNames.stockSaleAllocations,
    items.map((item, index) => ({
      id: item.id,
      moduleKey: "stock-sale-allocations",
      sortOrder: index + 1,
      payload: item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  )
}

function recalculateReceiptStatus(
  receipt: Awaited<ReturnType<typeof readPurchaseReceipts>>[number],
  goodsInwards: BillingGoodsInward[]
) {
  const postedForReceipt = goodsInwards.filter(
    (item) =>
      item.purchaseReceiptId === receipt.id &&
      item.stockPostingStatus === "posted" &&
      item.status === "verified"
  )
  const receivedByLineId = new Map<string, number>()

  for (const inward of postedForReceipt) {
    for (const line of inward.lines) {
      receivedByLineId.set(
        line.purchaseReceiptLineId,
        roundQuantity(
          (receivedByLineId.get(line.purchaseReceiptLineId) ?? 0) + line.acceptedQuantity
        )
      )
    }
  }

  const totalOrdered = receipt.lines.reduce(
    (sum, item) => sum + roundQuantity(item.quantity ?? 0),
    0
  )
  const totalReceived = receipt.lines.reduce(
    (sum, item) =>
      sum + Math.min(roundQuantity(receivedByLineId.get(item.id) ?? 0), roundQuantity(item.quantity ?? 0)),
    0
  )
  const status =
    totalReceived <= 0 ? "open"
    : totalReceived >= totalOrdered ? "fully_received"
    : "partially_received"

  return billingPurchaseReceiptSchema.parse({
    ...receipt,
    status,
    updatedAt: new Date().toISOString(),
  })
}

function buildUnitCount(acceptedQuantity: number) {
  return Number.isInteger(acceptedQuantity) && acceptedQuantity > 0
    ? acceptedQuantity
    : 1
}

function buildInwardNumberForReceiptPosting(
  receipt: BillingPurchaseReceipt,
  goodsInwards: BillingGoodsInward[]
) {
  const sequence = goodsInwards.filter((item) => item.purchaseReceiptId === receipt.id).length + 1
  return sanitizeToken(`REC-${receipt.entryNumber}-${sequence}`, `REC-${receipt.id}`)
}

function getReceivedQuantityForReceiptLine(
  goodsInwards: BillingGoodsInward[],
  receiptId: string,
  lineId: string
) {
  return roundQuantity(
    goodsInwards
      .filter(
        (item) =>
          item.purchaseReceiptId === receiptId &&
          item.stockPostingStatus === "posted" &&
          item.status === "verified"
      )
      .reduce(
        (sum, item) =>
          sum +
          item.lines
            .filter((line) => line.purchaseReceiptLineId === lineId)
            .reduce((lineSum, line) => lineSum + line.acceptedQuantity, 0),
        0
      )
  )
}

async function writeStockAcceptanceVerifications(
  database: Kysely<unknown>,
  items: BillingStockAcceptanceVerification[]
) {
  await replaceStorePayloads(
    database,
    billingTableNames.stockAcceptanceVerifications,
    items.map((item, index) => ({
      id: item.id,
      moduleKey: "stock-acceptance-verifications",
      sortOrder: index + 1,
      payload: item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  )
}

function buildBatchCodeForReceiptPosting(
  product: Product,
  receipt: BillingPurchaseReceipt,
  lineIndex: number,
  providedBatchCode: string | null,
  identityMode: "batch-and-serial" | "serial-only"
) {
  if (identityMode === "batch-and-serial" && providedBatchCode?.trim()) {
    return sanitizeToken(providedBatchCode, `BATCH-${lineIndex + 1}`)
  }

  if (identityMode === "serial-only") {
    return null
  }

  return sanitizeToken(
    `${product.code}-${receipt.postingDate.replace(/-/g, "")}-${lineIndex + 1}`,
    `BATCH-${lineIndex + 1}`
  )
}

function buildSerialNumberForReceiptPosting(
  receipt: BillingPurchaseReceipt,
  lineIndex: number,
  unitSequence: number,
  serialPrefix: string | null
) {
  const sequenceToken = String(unitSequence).padStart(2, "0")

  if (serialPrefix?.trim()) {
    return sanitizeToken(`${serialPrefix}${sequenceToken}`, `SERIAL${lineIndex + 1}${sequenceToken}`)
  }

  return sanitizeToken(
    `${receipt.entryNumber}${lineIndex + 1}${sequenceToken}`,
    `SERIAL${lineIndex + 1}${sequenceToken}`
  )
}

function buildManufacturerBarcodeForReceiptPosting(
  manufacturerBarcodePrefix: string | null,
  unitSequence: number
) {
  if (!manufacturerBarcodePrefix?.trim()) {
    return null
  }

  const sequenceToken = String(unitSequence).padStart(2, "0")
  return normalizeBarcodeValue(`${manufacturerBarcodePrefix}${sequenceToken}`)
}

function buildReceiptBarcodeForReceiptPosting(
  batchCode: string | null,
  serialNumber: string,
  barcodePrefix: string | null
) {
  const normalizedPrefix = sanitizeToken(barcodePrefix, "")
  const normalizedBatchCode = batchCode?.trim() ? sanitizeToken(batchCode, "") : ""
  const normalizedSerialNumber = sanitizeToken(serialNumber, serialNumber)

  return `${normalizedPrefix}${normalizedBatchCode}${normalizedSerialNumber}`
}

function createStickerBatchRecord(
  inward: BillingGoodsInward,
  units: BillingStockUnit[],
  template: z.infer<typeof billingStickerPrintBatchPayloadSchema>["template"],
  userId: string | null,
  company: Awaited<ReturnType<typeof readCompanies>>[number] | null
) {
  const timestamp = new Date().toISOString()

  return billingStickerPrintBatchSchema.parse({
    id: `sticker-print-batch:${randomUUID()}`,
    goodsInwardId: inward.id,
    goodsInwardNumber: inward.inwardNumber,
    template,
    widthMm: 50,
    heightMm: 25,
    itemCount: units.length,
    items: units.map((unit) => ({
      stockUnitId: unit.id,
      productId: unit.productId,
      productName: unit.productName,
      productCode: unit.productCode,
      variantName: unit.variantName,
      attributeSummary: unit.attributeSummary,
      barcodeValue: unit.barcodeValue,
      batchCode: unit.batchCode,
      serialNumber: unit.serialNumber,
      expiresAt: unit.expiresAt,
      mrp: unit.mrp,
      sellingPrice: unit.sellingPrice,
      companyName: company?.name ?? "Company",
      companyEmail: company?.primaryEmail ?? null,
      companyPhone: company?.primaryPhone ?? null,
      stickerHtml: renderStickerHtml(unit, company),
    })),
    createdAt: timestamp,
    updatedAt: timestamp,
    createdByUserId: userId,
  })
}

export async function listBillingStockUnits(
  database: Kysely<unknown>,
  user: AuthUser
) {
  assertBillingViewer(user)

  const items = await readStockUnits(database)
  return billingStockUnitListResponseSchema.parse({
    items: items.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
  })
}

export async function getBillingStockUnit(
  database: Kysely<unknown>,
  user: AuthUser,
  stockUnitId: string
) {
  assertBillingViewer(user)

  const item = await getStorePayloadById(
    database,
    billingTableNames.stockUnits,
    stockUnitId,
    billingStockUnitSchema
  )

  if (!item) {
    throw new ApplicationError("Billing stock unit could not be found.", { stockUnitId }, 404)
  }

  return billingStockUnitResponseSchema.parse({ item })
}

export async function listBillingStockAcceptanceVerifications(
  database: Kysely<unknown>,
  user: AuthUser,
  filters?: {
    purchaseReceiptId?: string
    productId?: string
    status?: "verified" | "mismatch" | "rejected"
  }
) {
  assertBillingViewer(user)

  const items = await readStockAcceptanceVerifications(database)
  const filteredItems = items.filter((item) => {
    if (filters?.purchaseReceiptId && item.purchaseReceiptId !== filters.purchaseReceiptId) {
      return false
    }

    if (filters?.productId && item.productId !== filters.productId) {
      return false
    }

    if (filters?.status && item.status !== filters.status) {
      return false
    }

    return true
  })

  return billingStockAcceptanceVerificationListResponseSchema.parse({
    items: filteredItems.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
  })
}

export async function acceptBillingStockUnitsToInventory(
  database: Kysely<unknown>,
  user: AuthUser,
  payload: unknown
) {
  assertBillingViewer(user)

  const parsedPayload = billingStockAcceptancePayloadSchema.parse(payload)
  const [stockUnits, verifications] = await Promise.all([
    readStockUnits(database),
    readStockAcceptanceVerifications(database),
  ])
  const timestamp = new Date().toISOString()
  const scannedItemByUnitId = new Map(
    parsedPayload.items.map((item) => [item.stockUnitId, item] as const)
  )
  const candidateUnits = stockUnits.filter(
    (item) =>
      item.purchaseReceiptId === parsedPayload.purchaseReceiptId &&
      item.productId === parsedPayload.productId &&
      item.status === "received"
  )

  if (candidateUnits.length === 0) {
    throw new ApplicationError(
      "No temporary stock units are pending acceptance for this purchase receipt and product.",
      {
        purchaseReceiptId: parsedPayload.purchaseReceiptId,
        productId: parsedPayload.productId,
      },
      404
    )
  }

  const candidateUnitIds = new Set(candidateUnits.map((item) => item.id))

  for (const item of parsedPayload.items) {
    if (!candidateUnitIds.has(item.stockUnitId)) {
      throw new ApplicationError(
        "Acceptance payload includes a stock unit outside the current temporary receipt selection.",
        {
          purchaseReceiptId: parsedPayload.purchaseReceiptId,
          productId: parsedPayload.productId,
          stockUnitId: item.stockUnitId,
        },
        409
      )
    }
  }

  const verificationByUnitId = new Map(
    verifications.map((item) => [item.stockUnitId, item] as const)
  )
  const acceptedUnitIds = new Set<string>()
  const rejectedUnitIds = new Set<string>()
  const nextVerificationById = new Map(
    verifications.map((item) => [item.id, item] as const)
  )

  for (const unit of candidateUnits) {
    const scannedItem = scannedItemByUnitId.get(unit.id)

    if (!scannedItem) {
      continue
    }

    const scannedBarcodeValue = normalizeBarcodeValue(scannedItem.scannedBarcodeValue)
    const rejectionReason = scannedItem.rejected
      ? scannedItem.rejectionReason?.trim() || "rejected"
      : null
    const rejectionNote = scannedItem.rejected ? scannedItem.rejectionNote?.trim() || null : null

    if (scannedItem.rejected && !rejectionNote) {
      throw new ApplicationError(
        "Rejected stock units require a note before confirmation.",
        {
          purchaseReceiptId: parsedPayload.purchaseReceiptId,
          productId: parsedPayload.productId,
          stockUnitId: unit.id,
        },
        409
      )
    }

    const status = scannedItem.rejected
      ? "rejected"
      : scannedBarcodeValue === normalizeBarcodeValue(unit.barcodeValue)
        ? "verified"
        : "mismatch"
    const existingVerification = verificationByUnitId.get(unit.id)
    const verification = billingStockAcceptanceVerificationSchema.parse({
      id: existingVerification?.id ?? `stock-acceptance-verification:${randomUUID()}`,
      purchaseReceiptId: unit.purchaseReceiptId,
      goodsInwardId: unit.goodsInwardId,
      productId: unit.productId,
      productName: unit.productName,
      productCode: unit.productCode,
      warehouseId: unit.warehouseId,
      warehouseName: unit.warehouseName,
      stockUnitId: unit.id,
      expectedBarcodeValue: unit.barcodeValue,
      scannedBarcodeValue,
      quantityAccepted: status === "verified" ? unit.quantity : 0,
      quantityRejected: status === "rejected" ? unit.quantity : 0,
      status,
      rejectionReason,
      rejectionNote,
      verifiedAt: status === "verified" ? timestamp : null,
      createdAt: existingVerification?.createdAt ?? timestamp,
      updatedAt: timestamp,
      verifiedByUserId: user.id,
    })

    nextVerificationById.set(verification.id, verification)

    if (status === "verified") {
      acceptedUnitIds.add(unit.id)
      continue
    }

    if (status === "rejected") {
      rejectedUnitIds.add(unit.id)
    }
  }

  const updatedUnits = stockUnits.map((item) => {
    if (acceptedUnitIds.has(item.id)) {
      return billingStockUnitSchema.parse({
        ...item,
        status: "available",
        availableAt: timestamp,
        updatedAt: timestamp,
      })
    }

    if (rejectedUnitIds.has(item.id)) {
      return billingStockUnitSchema.parse({
        ...item,
        status: "rejected",
        updatedAt: timestamp,
      })
    }

    return item
  })

  await writeStockAcceptanceVerifications(
    database,
    Array.from(nextVerificationById.values()).sort(
      (left, right) => right.updatedAt.localeCompare(left.updatedAt)
    )
  )
  await writeStockUnits(database, updatedUnits)

  const acceptedUnits = updatedUnits.filter((item) => acceptedUnitIds.has(item.id))
  for (const unit of acceptedUnits) {
    await applyLiveStockMovement(database, {
      productId: unit.productId,
      variantId: unit.variantId,
      warehouseId: unit.warehouseId,
      direction: "in",
      quantity: unit.quantity,
      referenceType: "billing_stock_acceptance",
      referenceId: unit.id,
      occurredAt: timestamp,
    })
  }

  const acceptedQuantity = roundQuantity(
    acceptedUnits.reduce((sum, item) => sum + item.quantity, 0)
  )
  const rejectedUnits = updatedUnits.filter((item) => rejectedUnitIds.has(item.id))
  const rejectedQuantity = roundQuantity(
    rejectedUnits.reduce((sum, item) => sum + item.quantity, 0)
  )
  const responseItems = Array.from(nextVerificationById.values())
    .filter(
      (item) =>
        item.purchaseReceiptId === parsedPayload.purchaseReceiptId &&
        item.productId === parsedPayload.productId
    )
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))

  return billingStockAcceptanceResponseSchema.parse({
    acceptedCount: acceptedUnits.length,
    acceptedQuantity,
    rejectedCount: rejectedUnits.length,
    rejectedQuantity,
    mismatchCount: parsedPayload.items.length - acceptedUnits.length - rejectedUnits.length,
    remainingCount: candidateUnits.length - acceptedUnits.length - rejectedUnits.length,
    items: responseItems,
  })
}

export async function postBillingGoodsInwardToInventory(
  database: Kysely<unknown>,
  user: AuthUser,
  inwardId: string
) {
  assertBillingViewer(user)

  const [goodsInwards, stockUnits, barcodeAliases, purchaseReceipts, products] =
    await Promise.all([
      readGoodsInwardNotes(database),
      readStockUnits(database),
      readBarcodeAliases(database),
      readPurchaseReceipts(database),
      readProducts(database),
    ])
  const inward = goodsInwards.find((item) => item.id === inwardId)

  if (!inward) {
    throw new ApplicationError("Billing goods inward note could not be found.", { inwardId }, 404)
  }

  if (inward.status !== "verified") {
    throw new ApplicationError(
      "Only verified goods inward notes can be posted into inventory.",
      {
        inwardId,
        status: inward.status,
      },
      409
    )
  }

  if (inward.stockPostingStatus === "posted") {
    return billingGoodsInwardPostingResponseSchema.parse({
      item: inward,
      unitsCreated: 0,
    })
  }

  const existingUnitIds = new Set(inward.stockUnitIds)
  if (existingUnitIds.size > 0) {
    throw new ApplicationError(
      "Goods inward note already carries stock-unit references but is not marked as posted.",
      {
        inwardId,
        stockUnitIds: inward.stockUnitIds,
      },
      409
    )
  }

  const productMap = new Map(products.map((item) => [item.id, item]))
  const timestamp = new Date().toISOString()
  const newUnits: BillingStockUnit[] = []
  const newAliases: BillingStockBarcodeAlias[] = []

  inward.lines.forEach((line, lineIndex) => {
    if (line.acceptedQuantity <= 0) {
      return
    }

    const product = productMap.get(line.productId)

    if (!product) {
      throw new ApplicationError(
        "Goods inward line references a missing core product.",
        {
          inwardId: inward.id,
          productId: line.productId,
        },
        404
      )
    }

    const unitCount = buildUnitCount(line.acceptedQuantity)
    const quantityPerUnit = roundQuantity(line.acceptedQuantity / unitCount)
    const batchCode = buildBatchCode(product, inward, lineIndex)
    const variantSummary = getVariantSummary(product, line.variantId)
    const attributeSummary = getAttributeSummary(product, line.variantId)
    const pricing = getPricing(product, line.variantId)

    for (let unitSequence = 1; unitSequence <= unitCount; unitSequence += 1) {
      const serialNumber = buildSerialNumber(
        inward,
        lineIndex,
        unitSequence,
        unitCount === 1 ? line.manufacturerSerial : null
      )
      const barcodeValue = buildInternalBarcode(product, batchCode, serialNumber)
      const unit = billingStockUnitSchema.parse({
        id: `stock-unit:${randomUUID()}`,
        goodsInwardId: inward.id,
        goodsInwardNumber: inward.inwardNumber,
        goodsInwardLineId: line.id,
        purchaseReceiptId: inward.purchaseReceiptId,
        purchaseReceiptNumber: inward.purchaseReceiptNumber,
        productId: line.productId,
        productName: line.productName,
        productCode: product.code,
        variantId: line.variantId,
        variantName: line.variantName,
        warehouseId: inward.warehouseId,
        warehouseName: inward.warehouseName,
        unitSequence,
        quantity: quantityPerUnit,
        batchCode,
        serialNumber,
        barcodeValue,
        manufacturerBarcode: unitCount === 1 ? line.manufacturerBarcode : null,
        manufacturerSerial: unitCount === 1 ? line.manufacturerSerial : null,
        attributeSummary,
        variantSummary,
        mrp: pricing.mrp,
        sellingPrice: pricing.sellingPrice,
        status: "received",
        receivedAt: timestamp,
        availableAt: null,
        allocatedAt: null,
        soldAt: null,
        soldVoucherId: null,
        soldVoucherNumber: null,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      })

      newUnits.push(unit)
      newAliases.push(
        billingStockBarcodeAliasSchema.parse({
          id: `stock-barcode-alias:${randomUUID()}`,
          stockUnitId: unit.id,
          productId: unit.productId,
          warehouseId: unit.warehouseId,
          barcodeValue: unit.barcodeValue,
          source: "internal_barcode",
          isPrimary: true,
          isActive: true,
          createdAt: timestamp,
          updatedAt: timestamp,
        }),
        billingStockBarcodeAliasSchema.parse({
          id: `stock-barcode-alias:${randomUUID()}`,
          stockUnitId: unit.id,
          productId: unit.productId,
          warehouseId: unit.warehouseId,
          barcodeValue: unit.batchCode,
          source: "batch_code",
          isPrimary: false,
          isActive: true,
          createdAt: timestamp,
          updatedAt: timestamp,
        }),
        billingStockBarcodeAliasSchema.parse({
          id: `stock-barcode-alias:${randomUUID()}`,
          stockUnitId: unit.id,
          productId: unit.productId,
          warehouseId: unit.warehouseId,
          barcodeValue: unit.serialNumber,
          source: "serial_number",
          isPrimary: false,
          isActive: true,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
      )

      if (unit.manufacturerBarcode) {
        newAliases.push(
          billingStockBarcodeAliasSchema.parse({
            id: `stock-barcode-alias:${randomUUID()}`,
            stockUnitId: unit.id,
            productId: unit.productId,
            warehouseId: unit.warehouseId,
            barcodeValue: normalizeBarcodeValue(unit.manufacturerBarcode),
            source: "manufacturer_barcode",
            isPrimary: false,
            isActive: true,
            createdAt: timestamp,
            updatedAt: timestamp,
          })
        )
      }

      if (unit.manufacturerSerial) {
        newAliases.push(
          billingStockBarcodeAliasSchema.parse({
            id: `stock-barcode-alias:${randomUUID()}`,
            stockUnitId: unit.id,
            productId: unit.productId,
            warehouseId: unit.warehouseId,
            barcodeValue: normalizeBarcodeValue(unit.manufacturerSerial),
            source: "manufacturer_serial",
            isPrimary: false,
            isActive: true,
            createdAt: timestamp,
            updatedAt: timestamp,
          })
        )
      }
    }

  })

  const nextInward = billingGoodsInwardSchema.parse({
    ...inward,
    stockPostingStatus: "posted",
    stockUnitIds: newUnits.map((item) => item.id),
    postedAt: timestamp,
    postedByUserId: user.id,
    updatedAt: timestamp,
  })
  const nextGoodsInwards = goodsInwards.map((item) => (item.id === inwardId ? nextInward : item))
  const nextPurchaseReceipts = purchaseReceipts.map((item) =>
    item.id === inward.purchaseReceiptId ? recalculateReceiptStatus(item, nextGoodsInwards) : item
  )

  await writeGoodsInwardNotes(database, nextGoodsInwards)
  await writeStockUnits(database, [...stockUnits, ...newUnits])
  await writeBarcodeAliases(database, [...barcodeAliases, ...newAliases])
  await writePurchaseReceipts(database, nextPurchaseReceipts)

  return billingGoodsInwardPostingResponseSchema.parse({
    item: nextInward,
    unitsCreated: newUnits.length,
  })
}

export async function resolveBillingStockBarcode(
  database: Kysely<unknown>,
  user: AuthUser,
  payload: unknown
) {
  assertBillingViewer(user)

  const parsedPayload = billingBarcodeResolutionPayloadSchema.parse(payload)
  const [aliases, units] = await Promise.all([
    readBarcodeAliases(database),
    readStockUnits(database),
  ])
  const normalizedValue = normalizeBarcodeValue(parsedPayload.barcodeValue)
  const alias = aliases.find(
    (item) => item.isActive && normalizeBarcodeValue(item.barcodeValue) === normalizedValue
  )
  const unit =
    units.find((item) => item.id === alias?.stockUnitId) ??
    units.find((item) => normalizeBarcodeValue(item.barcodeValue) === normalizedValue) ??
    null
  const warning =
    !unit ? "Scanned code did not match any known stock unit."
    : parsedPayload.expectedGoodsInwardId && unit.goodsInwardId !== parsedPayload.expectedGoodsInwardId
      ? "Scanned code resolved to a different goods inward record."
    : parsedPayload.expectedWarehouseId && unit.warehouseId !== parsedPayload.expectedWarehouseId
      ? "Scanned code resolved to a different warehouse."
    : unit.status !== "available"
      ? `Scanned stock unit is ${unit.status} and not ready for a fresh sale issue.`
      : null

  return billingBarcodeResolutionResponseSchema.parse({
    item: billingStockScanVerificationSchema.parse({
      barcodeValue: normalizedValue,
      resolved: Boolean(unit),
      matchedSource: alias?.source ?? (unit ? "internal_barcode" : null),
      expectedGoodsInwardId: parsedPayload.expectedGoodsInwardId,
      expectedWarehouseId: parsedPayload.expectedWarehouseId,
      stockUnit: unit,
      warning,
    }),
  })
}

export async function createBillingStickerPrintBatch(
  database: Kysely<unknown>,
  user: AuthUser,
  payload: unknown
) {
  assertBillingViewer(user)

  const parsedPayload = billingStickerPrintBatchPayloadSchema.parse(payload)
  const [goodsInwards, stockUnits, stickerBatches, companies] = await Promise.all([
    readGoodsInwardNotes(database),
    readStockUnits(database),
    readStickerPrintBatches(database),
    readCompanies(database),
  ])
  const inward = goodsInwards.find((item) => item.id === parsedPayload.goodsInwardId)

  if (!inward) {
    throw new ApplicationError("Billing goods inward note could not be found.", { goodsInwardId: parsedPayload.goodsInwardId }, 404)
  }

  if (inward.stockPostingStatus !== "posted") {
    throw new ApplicationError(
      "Sticker printing is available only after inward stock has been posted.",
      {
        goodsInwardId: inward.id,
        stockPostingStatus: inward.stockPostingStatus,
      },
      409
    )
  }

  const selectedIds =
    parsedPayload.stockUnitIds.length > 0 ? new Set(parsedPayload.stockUnitIds) : null
  const units = stockUnits.filter(
    (item) =>
      inward.stockUnitIds.includes(item.id) && (!selectedIds || selectedIds.has(item.id))
  )

  if (units.length === 0) {
    throw new ApplicationError(
      "No posted stock units were available for sticker printing.",
      {
        goodsInwardId: inward.id,
        requestedStockUnitIds: parsedPayload.stockUnitIds,
      },
      404
    )
  }

  const company = getPrimaryCompany(companies)
  const batch = createStickerBatchRecord(inward, units, parsedPayload.template, user.id, company)

  await writeStickerPrintBatches(database, [batch, ...stickerBatches])

  return billingStickerPrintBatchResponseSchema.parse({ item: batch })
}

export async function createBillingPurchaseReceiptBarcodeBatch(
  database: Kysely<unknown>,
  user: AuthUser,
  receiptId: string,
  payload: unknown
) {
  assertBillingViewer(user)

  const parsedPayload = billingPurchaseReceiptBarcodeGenerationPayloadSchema.parse(payload)
  const [purchaseReceipts, goodsInwards, stockUnits, barcodeAliases, stickerBatches, companies, products] =
    await Promise.all([
      readPurchaseReceipts(database),
      readGoodsInwardNotes(database),
      readStockUnits(database),
      readBarcodeAliases(database),
      readStickerPrintBatches(database),
      readCompanies(database),
      readProducts(database),
    ])

  const receipt = purchaseReceipts.find((item) => item.id === receiptId)

  if (!receipt) {
    throw new ApplicationError("Billing purchase receipt could not be found.", { receiptId }, 404)
  }

  const productMap = new Map(products.map((item) => [item.id, item]))
  const lineMap = new Map(receipt.lines.map((line) => [line.id, line]))
  const timestamp = new Date().toISOString()
  const inwardNumber = buildInwardNumberForReceiptPosting(receipt, goodsInwards)
  const createdLineIds: string[] = []
  const newUnits: BillingStockUnit[] = []
  const newAliases: BillingStockBarcodeAlias[] = []

  const inwardLines = parsedPayload.lines.map((lineConfig, lineIndex) => {
    const receiptLine = lineMap.get(lineConfig.purchaseReceiptLineId)

    if (!receiptLine) {
      throw new ApplicationError(
        "Receipt line could not be found for barcode generation.",
        { receiptId, purchaseReceiptLineId: lineConfig.purchaseReceiptLineId },
        404
      )
    }

    const orderedQuantity = roundQuantity(receiptLine.quantity ?? 0)
    const receivedQuantity = getReceivedQuantityForReceiptLine(
      goodsInwards,
      receipt.id,
      lineConfig.purchaseReceiptLineId
    )
    const remainingQuantity = roundQuantity(Math.max(orderedQuantity - receivedQuantity, 0))

    if (lineConfig.inwardQuantity > remainingQuantity) {
      throw new ApplicationError(
        "Inward quantity exceeds the remaining purchase receipt quantity.",
        {
          receiptId,
          purchaseReceiptLineId: lineConfig.purchaseReceiptLineId,
          inwardQuantity: lineConfig.inwardQuantity,
          remainingQuantity,
        },
        409
      )
    }

    if (lineConfig.barcodeQuantity > Math.ceil(lineConfig.inwardQuantity)) {
      throw new ApplicationError(
        "Barcode quantity cannot exceed the inward quantity.",
        {
          receiptId,
          purchaseReceiptLineId: lineConfig.purchaseReceiptLineId,
          barcodeQuantity: lineConfig.barcodeQuantity,
          inwardQuantity: lineConfig.inwardQuantity,
        },
        409
      )
    }

    const product = productMap.get(receiptLine.productId)

    if (!product) {
      throw new ApplicationError(
        "Receipt line references a missing core product.",
        { receiptId, productId: receiptLine.productId },
        404
      )
    }

    const createdLineId = `goods-inward-line:${randomUUID()}`
    createdLineIds.push(createdLineId)
    const unitCount = lineConfig.barcodeQuantity
    const quantityPerUnit = roundQuantity(lineConfig.inwardQuantity / unitCount)
    const batchCode = buildBatchCodeForReceiptPosting(
      product,
      receipt,
      lineIndex,
      lineConfig.batchCode,
      lineConfig.identityMode
    )
    const variantSummary = getVariantSummary(product, null)
    const attributeSummary = getAttributeSummary(product, null)
    const pricing = getPricing(product, null)

    for (let unitSequence = 1; unitSequence <= unitCount; unitSequence += 1) {
      const serialNumber = buildSerialNumberForReceiptPosting(
        receipt,
        lineIndex,
        unitSequence,
        lineConfig.serialPrefix
      )
      const barcodeValue = buildReceiptBarcodeForReceiptPosting(
        batchCode,
        serialNumber,
        lineConfig.barcodePrefix
      )
      const manufacturerBarcode = buildManufacturerBarcodeForReceiptPosting(
        lineConfig.manufacturerBarcodePrefix,
        unitSequence
      )

      const unit = billingStockUnitSchema.parse({
        id: `stock-unit:${randomUUID()}`,
        goodsInwardId: `goods-inward:${receipt.id}:${timestamp}`,
        goodsInwardNumber: inwardNumber,
        goodsInwardLineId: createdLineId,
        purchaseReceiptId: receipt.id,
        purchaseReceiptNumber: receipt.entryNumber,
        productId: receiptLine.productId,
        productName: receiptLine.productId,
        productCode: product.code,
        variantId: null,
        variantName: receiptLine.description ?? null,
        warehouseId: receipt.warehouseId,
        warehouseName: receipt.warehouseId,
        unitSequence,
        quantity: quantityPerUnit,
        batchCode,
        serialNumber,
        barcodeValue,
        expiresAt: lineConfig.expiresAt,
        manufacturerBarcode,
        manufacturerSerial: null,
        attributeSummary,
        variantSummary,
        mrp: pricing.mrp,
        sellingPrice: pricing.sellingPrice,
        status: "received",
        receivedAt: timestamp,
        availableAt: null,
        allocatedAt: null,
        soldAt: null,
        soldVoucherId: null,
        soldVoucherNumber: null,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      })

      newUnits.push(unit)
      newAliases.push(
        billingStockBarcodeAliasSchema.parse({
          id: `stock-barcode-alias:${randomUUID()}`,
          stockUnitId: unit.id,
          productId: unit.productId,
          warehouseId: unit.warehouseId,
          barcodeValue: unit.barcodeValue,
          source: "internal_barcode",
          isPrimary: true,
          isActive: true,
          createdAt: timestamp,
          updatedAt: timestamp,
        }),
        billingStockBarcodeAliasSchema.parse({
          id: `stock-barcode-alias:${randomUUID()}`,
          stockUnitId: unit.id,
          productId: unit.productId,
          warehouseId: unit.warehouseId,
          barcodeValue: unit.serialNumber,
          source: "serial_number",
          isPrimary: false,
          isActive: true,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
      )

      if (unit.batchCode) {
        newAliases.push(
          billingStockBarcodeAliasSchema.parse({
            id: `stock-barcode-alias:${randomUUID()}`,
            stockUnitId: unit.id,
            productId: unit.productId,
            warehouseId: unit.warehouseId,
            barcodeValue: unit.batchCode,
            source: "batch_code",
            isPrimary: false,
            isActive: true,
            createdAt: timestamp,
            updatedAt: timestamp,
          })
        )
      }

      if (manufacturerBarcode) {
        newAliases.push(
          billingStockBarcodeAliasSchema.parse({
            id: `stock-barcode-alias:${randomUUID()}`,
            stockUnitId: unit.id,
            productId: unit.productId,
            warehouseId: unit.warehouseId,
            barcodeValue: manufacturerBarcode,
            source: "manufacturer_barcode",
            isPrimary: false,
            isActive: true,
            createdAt: timestamp,
            updatedAt: timestamp,
          })
        )
      }
    }

    return billingGoodsInwardSchema.shape.lines.element.parse({
      id: createdLineId,
      purchaseReceiptLineId: receiptLine.id,
      productId: receiptLine.productId,
      productName: receiptLine.productId,
      variantId: null,
      variantName: receiptLine.description ?? null,
      expectedQuantity: remainingQuantity,
      acceptedQuantity: lineConfig.inwardQuantity,
      rejectedQuantity: 0,
      damagedQuantity: 0,
      manufacturerBarcode: lineConfig.manufacturerBarcodePrefix,
      manufacturerSerial: lineConfig.serialPrefix,
      serializationMode: lineConfig.identityMode,
      serializationBatchCode: batchCode,
      serializationSerialPrefix: lineConfig.serialPrefix,
      serializationBarcodePrefix: lineConfig.barcodePrefix,
      serializationManufacturerBarcodePrefix: lineConfig.manufacturerBarcodePrefix,
      serializationBarcodeQuantity: lineConfig.barcodeQuantity,
      serializationExpiresAt: lineConfig.expiresAt,
      note: lineConfig.note,
    })
  })

  const inwardId = `goods-inward:${receipt.id}:${timestamp}`
  const inward = billingGoodsInwardSchema.parse({
    id: inwardId,
    inwardNumber,
    purchaseReceiptId: receipt.id,
    purchaseReceiptNumber: receipt.entryNumber,
    supplierName: receipt.supplierId,
    postingDate: parsedPayload.postingDate,
    warehouseId: receipt.warehouseId,
    warehouseName: receipt.warehouseId,
    status: "verified",
    stockPostingStatus: "posted",
    lines: inwardLines,
    note: parsedPayload.note,
    createdAt: timestamp,
    updatedAt: timestamp,
    createdByUserId: user.id,
    stockUnitIds: newUnits.map((item) => item.id),
    postedAt: timestamp,
    postedByUserId: user.id,
  })

  const nextGoodsInwards = [inward, ...goodsInwards]
  const nextPurchaseReceipts = purchaseReceipts.map((item) =>
    item.id === receipt.id ? recalculateReceiptStatus(item, nextGoodsInwards) : item
  )

  await writeGoodsInwardNotes(database, nextGoodsInwards)
  await writeStockUnits(database, [...stockUnits, ...newUnits])
  await writeBarcodeAliases(database, [...barcodeAliases, ...newAliases])
  await writePurchaseReceipts(database, nextPurchaseReceipts)

  const company = getPrimaryCompany(companies)
  const batch = createStickerBatchRecord(inward, newUnits, parsedPayload.template, user.id, company)
  await writeStickerPrintBatches(database, [batch, ...stickerBatches])

  return billingPurchaseReceiptBarcodeGenerationResponseSchema.parse({
    goodsInward: inward,
    stickerBatch: batch,
    unitsCreated: newUnits.length,
  })
}

export async function rollbackBillingPurchaseReceiptBarcodes(
  database: Kysely<unknown>,
  user: AuthUser,
  receiptId: string,
  payload: unknown
) {
  assertBillingViewer(user)

  const parsedPayload = billingPurchaseReceiptBarcodeRollbackPayloadSchema.parse(payload)
  const [purchaseReceipts, goodsInwards, stockUnits, barcodeAliases, stickerBatches, verifications] =
    await Promise.all([
      readPurchaseReceipts(database),
      readGoodsInwardNotes(database),
      readStockUnits(database),
      readBarcodeAliases(database),
      readStickerPrintBatches(database),
      readStockAcceptanceVerifications(database),
    ])

  const receipt = purchaseReceipts.find((item) => item.id === receiptId)

  if (!receipt) {
    throw new ApplicationError("Billing purchase receipt could not be found.", { receiptId }, 404)
  }

  const selectedStockUnitIds = new Set(parsedPayload.stockUnitIds)
  const selectedUnits = stockUnits.filter(
    (item) => item.purchaseReceiptId === receipt.id && selectedStockUnitIds.has(item.id)
  )
  const foundStockUnitIds = new Set(selectedUnits.map((item) => item.id))
  const missingStockUnitIds = [...selectedStockUnitIds].filter((item) => !foundStockUnitIds.has(item))

  if (selectedUnits.length === 0 || missingStockUnitIds.length > 0) {
    throw new ApplicationError(
      "One or more selected generated barcodes could not be found on this purchase receipt.",
      {
        receiptId,
        missingStockUnitIds,
      },
      404
    )
  }

  const lockedUnits = selectedUnits.filter((item) => item.status !== "received")

  if (lockedUnits.length > 0) {
    throw new ApplicationError(
      "Generated barcodes can be deleted only before stock acceptance.",
      {
        receiptId,
        stockUnitIds: lockedUnits.map((item) => item.id),
        statuses: lockedUnits.map((item) => item.status),
      },
      409
    )
  }

  const timestamp = new Date().toISOString()
  const removedQuantityByGoodsInwardLineId = new Map<
    string,
    {
      count: number
      quantity: number
    }
  >()

  for (const unit of selectedUnits) {
    const current = removedQuantityByGoodsInwardLineId.get(unit.goodsInwardLineId) ?? {
      count: 0,
      quantity: 0,
    }
    removedQuantityByGoodsInwardLineId.set(unit.goodsInwardLineId, {
      count: current.count + 1,
      quantity: roundQuantity(current.quantity + unit.quantity),
    })
  }

  const removedGoodsInwardIds = new Set<string>()
  const nextGoodsInwards = goodsInwards.flatMap((inward) => {
    if (!inward.stockUnitIds.some((item) => selectedStockUnitIds.has(item))) {
      return [inward]
    }

    const nextLines = inward.lines.flatMap((line) => {
      const removedSummary = removedQuantityByGoodsInwardLineId.get(line.id)

      if (!removedSummary) {
        return [line]
      }

      const acceptedQuantity = roundQuantity(
        Math.max(line.acceptedQuantity - removedSummary.quantity, 0)
      )

      if (acceptedQuantity <= 0) {
        return []
      }

      const serializationBarcodeQuantity =
        line.serializationBarcodeQuantity == null
          ? null
          : Math.max(line.serializationBarcodeQuantity - removedSummary.count, 0)

      return [
        billingGoodsInwardSchema.shape.lines.element.parse({
          ...line,
          acceptedQuantity,
          serializationBarcodeQuantity:
            serializationBarcodeQuantity > 0 ? serializationBarcodeQuantity : null,
        }),
      ]
    })
    const nextStockUnitIds = inward.stockUnitIds.filter((item) => !selectedStockUnitIds.has(item))

    if (nextLines.length === 0 || nextStockUnitIds.length === 0) {
      removedGoodsInwardIds.add(inward.id)
      return []
    }

    return [
      billingGoodsInwardSchema.parse({
        ...inward,
        lines: nextLines,
        stockUnitIds: nextStockUnitIds,
        updatedAt: timestamp,
      }),
    ]
  })

  const nextPurchaseReceipts = purchaseReceipts.map((item) =>
    item.id === receipt.id ? recalculateReceiptStatus(item, nextGoodsInwards) : item
  )
  const nextStockUnits = stockUnits.filter((item) => !selectedStockUnitIds.has(item.id))
  const nextBarcodeAliases = barcodeAliases.filter(
    (item) => !selectedStockUnitIds.has(item.stockUnitId)
  )
  const nextVerifications = verifications.filter(
    (item) => !selectedStockUnitIds.has(item.stockUnitId)
  )
  const nextStickerBatches = stickerBatches.flatMap((batch) => {
    if (!batch.items.some((item) => selectedStockUnitIds.has(item.stockUnitId))) {
      return [batch]
    }

    const nextItems = batch.items.filter((item) => !selectedStockUnitIds.has(item.stockUnitId))

    if (nextItems.length === 0) {
      return []
    }

    return [
      billingStickerPrintBatchSchema.parse({
        ...batch,
        itemCount: nextItems.length,
        items: nextItems,
        updatedAt: timestamp,
      }),
    ]
  })

  await writeGoodsInwardNotes(database, nextGoodsInwards)
  await writeStockUnits(database, nextStockUnits)
  await writeBarcodeAliases(database, nextBarcodeAliases)
  await writeStockAcceptanceVerifications(database, nextVerifications)
  await writePurchaseReceipts(database, nextPurchaseReceipts)
  await writeStickerPrintBatches(database, nextStickerBatches)

  return billingPurchaseReceiptBarcodeRollbackResponseSchema.parse({
    purchaseReceiptId: receipt.id,
    rolledBackCount: selectedUnits.length,
    deletedStockUnitIds: [...selectedStockUnitIds],
    removedGoodsInwardIds: [...removedGoodsInwardIds],
  })
}

export async function listBillingStockSaleAllocations(
  database: Kysely<unknown>,
  user: AuthUser
) {
  assertBillingViewer(user)

  const items = await readSaleAllocations(database)
  return billingStockSaleAllocationListResponseSchema.parse({
    items: items.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
  })
}

export async function createBillingStockSaleAllocation(
  database: Kysely<unknown>,
  user: AuthUser,
  payload: unknown
) {
  assertBillingViewer(user)

  const parsedPayload = billingStockSaleAllocationPayloadSchema.parse(payload)
  const [resolution, allocations, units, vouchers] = await Promise.all([
    resolveBillingStockBarcode(database, user, {
      barcodeValue: parsedPayload.barcodeValue,
      expectedWarehouseId: parsedPayload.warehouseId,
    }),
    readSaleAllocations(database),
    readStockUnits(database),
    readVouchers(database),
  ])
  const unit = resolution.item.stockUnit

  if (!unit) {
    throw new ApplicationError(
      "Scanned barcode could not be resolved to an available stock unit.",
      {
        barcodeValue: parsedPayload.barcodeValue,
      },
      404
    )
  }

  ensureAvailableStockUnit(unit)

  const voucher =
    parsedPayload.salesVoucherId
      ? vouchers.find((item) => item.id === parsedPayload.salesVoucherId)
      : null

  if (parsedPayload.salesVoucherId && !voucher) {
    throw new ApplicationError("Sales voucher could not be found.", { salesVoucherId: parsedPayload.salesVoucherId }, 404)
  }

  if (voucher && voucher.type !== "sales") {
    throw new ApplicationError(
      "Stock sale allocation can only be linked to a sales voucher.",
      {
        salesVoucherId: voucher.id,
        voucherType: voucher.type,
      },
      409
    )
  }

  const timestamp = new Date().toISOString()
  const allocation = billingStockSaleAllocationSchema.parse({
    id: `stock-sale-allocation:${randomUUID()}`,
    stockUnitId: unit.id,
    barcodeValue: unit.barcodeValue,
    productId: unit.productId,
    warehouseId: unit.warehouseId,
    salesVoucherId: voucher?.id ?? parsedPayload.salesVoucherId,
    salesVoucherNumber: voucher?.voucherNumber ?? parsedPayload.salesVoucherNumber,
    salesItemIndex: parsedPayload.salesItemIndex,
    status: parsedPayload.markAsSold ? "sold" : "allocated",
    allocatedAt: timestamp,
    soldAt: parsedPayload.markAsSold ? timestamp : null,
    createdAt: timestamp,
    updatedAt: timestamp,
    createdByUserId: user.id,
  })

  const nextUnits = units.map((item) =>
    item.id === unit.id
      ? billingStockUnitSchema.parse({
          ...item,
          status: parsedPayload.markAsSold ? "sold" : "allocated",
          allocatedAt: timestamp,
          soldAt: parsedPayload.markAsSold ? timestamp : null,
          soldVoucherId: allocation.salesVoucherId,
          soldVoucherNumber: allocation.salesVoucherNumber,
          updatedAt: timestamp,
        })
      : item
  )
  await writeStockUnits(database, nextUnits)
  await writeSaleAllocations(database, [allocation, ...allocations])

  if (parsedPayload.markAsSold) {
    await applyLiveStockMovement(database, {
      productId: unit.productId,
      variantId: unit.variantId,
      warehouseId: unit.warehouseId,
      direction: "out",
      quantity: unit.quantity,
      referenceType: "billing_stock_sale_allocation",
      referenceId: allocation.id,
      occurredAt: timestamp,
    })
  }

  if (parsedPayload.markAsSold) {
    const inventoryEngineServices = createInventoryEngineRuntimeServices(database)
    const tenantContext = await resolveCxappTenantContext(database)

    await syncBillingSalesIssueToInventoryEngine(
      tenantContext.tenantId,
      allocation,
      inventoryEngineServices.movementService
    )
  }

  return billingStockSaleAllocationResponseSchema.parse({
    item: allocation,
  })
}
