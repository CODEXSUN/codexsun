import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import type { AuthUser } from "../../../cxapp/shared/index.js"
import { listCompanies } from "../../../cxapp/src/services/company-service.js"
import { resolveCxappTenantContext } from "../../../cxapp/src/services/tenant-context-service.js"
import { coreTableNames } from "../../../core/database/table-names.js"
import { productSchema, type Product } from "../../../core/shared/index.js"
import { createInventoryEngineRuntimeServices } from "../../../../framework/engines/inventory-engine/runtime-services.js"
import {
  listJsonStorePayloads,
  replaceJsonStoreRecords,
} from "../../../framework/src/runtime/database/process/json-store.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import {
  billingBarcodeResolutionPayloadSchema,
  billingBarcodeResolutionResponseSchema,
  billingGoodsInwardPostingResponseSchema,
  billingGoodsInwardResponseSchema,
  billingGoodsInwardSchema,
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
  type BillingStockBarcodeAlias,
  type BillingStockSaleAllocation,
  type BillingStockUnit,
} from "../../shared/index.js"
import { billingTableNames } from "../../database/table-names.js"

import { assertBillingViewer } from "./access.js"
import {
  syncBillingGoodsInwardToInventoryEngine,
  syncBillingSalesIssueToInventoryEngine,
} from "./inventory-engine-sync-service.js"
import { getStorePayloadById, listStorePayloads, replaceStorePayloads } from "./store.js"

function roundQuantity(value: number) {
  return Number(value.toFixed(4))
}

function roundCurrency(value: number) {
  return Number(value.toFixed(2))
}

function normalizeBarcodeValue(value: string) {
  return value.trim().toUpperCase()
}

function sanitizeToken(value: string | null | undefined, fallback: string) {
  const base = (value ?? "").trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "")
  return base || fallback
}

function toTimestamp(date: string) {
  return `${date}T00:00:00.000Z`
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

async function readProducts(database: Kysely<unknown>) {
  const items = await listJsonStorePayloads<Product>(database, coreTableNames.products)
  return items.map((item) => productSchema.parse(item))
}

async function writeProducts(database: Kysely<unknown>, items: Product[]) {
  await replaceJsonStoreRecords(
    database,
    coreTableNames.products,
    items.map((item, index) => ({
      id: item.id,
      moduleKey: "products",
      sortOrder: index + 1,
      payload: item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  )
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
  batchCode: string,
  serialNumber: string
) {
  return sanitizeToken(`CS-${product.code}-${batchCode}-${serialNumber}`, `CS-${product.id}`)
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
    `<div class="line batch">Batch: ${unit.batchCode}</div>`,
    `<div class="line serial">Serial: ${unit.serialNumber}</div>`,
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

function getStockItemIndex(product: Product, warehouseId: string, variantId: string | null) {
  return product.stockItems.findIndex(
    (item) =>
      item.isActive &&
      item.warehouseId === warehouseId &&
      item.variantId === variantId
  )
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

function updateProductInventoryFromMovement(
  product: Product,
  warehouseId: string,
  variantId: string | null,
  quantityDelta: number,
  movementType: string,
  referenceType: string,
  referenceId: string,
  movementAt: string
) {
  const timestamp = new Date().toISOString()
  const stockItems: Product["stockItems"] = [...product.stockItems]
  const stockItemIndex = getStockItemIndex(product, warehouseId, variantId)

  if (stockItemIndex >= 0) {
    const current = stockItems[stockItemIndex]!
    stockItems[stockItemIndex] = {
      ...current,
      quantity: roundQuantity(current.quantity + quantityDelta),
      updatedAt: timestamp,
    }
  } else {
    stockItems.push({
      id: `product-stock-item:${randomUUID()}`,
      productId: product.id,
      variantId,
      warehouseId,
      quantity: roundQuantity(quantityDelta),
      reservedQuantity: 0,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  }

  const stockMovements = [
    ...product.stockMovements,
    {
      id: `product-stock-movement:${randomUUID()}`,
      productId: product.id,
      variantId,
      warehouseId,
      movementType,
      quantity: roundQuantity(quantityDelta),
      referenceType,
      referenceId,
      movementAt,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ]
  const totalStockQuantity = roundQuantity(
    stockItems.reduce((sum, item) => sum + item.quantity, 0) +
      product.variants.reduce((sum, item) => sum + item.stockQuantity, 0)
  )

  return productSchema.parse({
    ...product,
    stockItems,
    stockMovements,
    totalStockQuantity,
    updatedAt: timestamp,
  })
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

  const lines = receipt.lines.map((line) => ({
    ...line,
    receivedQuantity: Math.min(
      roundQuantity(receivedByLineId.get(line.id) ?? 0),
      line.quantity
    ),
  }))

  const totalOrdered = lines.reduce((sum, item) => sum + item.quantity, 0)
  const totalReceived = lines.reduce((sum, item) => sum + item.receivedQuantity, 0)
  const status =
    totalReceived <= 0 ? "open"
    : totalReceived >= totalOrdered ? "fully_received"
    : "partially_received"

  return billingPurchaseReceiptSchema.parse({
    ...receipt,
    lines,
    status,
    updatedAt: new Date().toISOString(),
  })
}

function buildUnitCount(acceptedQuantity: number) {
  return Number.isInteger(acceptedQuantity) && acceptedQuantity > 0
    ? acceptedQuantity
    : 1
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
  const updatedProducts = new Map(products.map((item) => [item.id, item]))

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
        status: "available",
        receivedAt: timestamp,
        availableAt: timestamp,
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

    const currentProduct = updatedProducts.get(product.id)

    if (!currentProduct) {
      throw new ApplicationError("Core product inventory update could not be resolved.", { productId: product.id }, 404)
    }

    updatedProducts.set(
      product.id,
      updateProductInventoryFromMovement(
        currentProduct,
        inward.warehouseId,
        line.variantId,
        line.acceptedQuantity,
        "billing_goods_inward_receipt",
        "billing_goods_inward_note",
        inward.id,
        toTimestamp(inward.postingDate)
      )
    )
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
  await writeProducts(database, [...updatedProducts.values()])

  const inventoryEngineServices = createInventoryEngineRuntimeServices(database)
  const tenantContext = await resolveCxappTenantContext(database)

  await syncBillingGoodsInwardToInventoryEngine(
    {
      tenantId: tenantContext.tenantId,
      companyId: tenantContext.companyId,
    },
    nextInward,
    {
      movementService: inventoryEngineServices.movementService,
      putawayService: inventoryEngineServices.putawayService,
    }
  )

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
  const timestamp = new Date().toISOString()
  const batch = billingStickerPrintBatchSchema.parse({
    id: `sticker-print-batch:${randomUUID()}`,
    goodsInwardId: inward.id,
    goodsInwardNumber: inward.inwardNumber,
    template: parsedPayload.template,
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
      mrp: unit.mrp,
      sellingPrice: unit.sellingPrice,
      companyName: company?.name ?? "Company",
      companyEmail: company?.primaryEmail ?? null,
      companyPhone: company?.primaryPhone ?? null,
      stickerHtml: renderStickerHtml(unit, company),
    })),
    createdAt: timestamp,
    updatedAt: timestamp,
    createdByUserId: user.id,
  })

  await writeStickerPrintBatches(database, [batch, ...stickerBatches])

  return billingStickerPrintBatchResponseSchema.parse({ item: batch })
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
  const [resolution, allocations, units, products, vouchers] = await Promise.all([
    resolveBillingStockBarcode(database, user, {
      barcodeValue: parsedPayload.barcodeValue,
      expectedWarehouseId: parsedPayload.warehouseId,
    }),
    readSaleAllocations(database),
    readStockUnits(database),
    readProducts(database),
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
  const nextProducts = products.map((product) =>
    product.id !== unit.productId
      ? product
      : updateProductInventoryFromMovement(
          product,
          unit.warehouseId,
          unit.variantId,
          parsedPayload.markAsSold ? unit.quantity * -1 : 0,
          "billing_sales_issue_scan",
          "billing_stock_sale_allocation",
          allocation.id,
          timestamp
        )
  )

  await writeStockUnits(database, nextUnits)
  await writeSaleAllocations(database, [allocation, ...allocations])

  if (parsedPayload.markAsSold) {
    await writeProducts(database, nextProducts)
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
