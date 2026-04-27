import type { Kysely } from "kysely"

import {
  createBillingGoodsInwardNote,
  getBillingGoodsInwardNote,
  listBillingGoodsInwardNotes,
  updateBillingGoodsInwardNote,
} from "../../../billing/src/services/goods-inward-service.js"
import {
  createBillingDeliveryNote,
  getBillingDeliveryNote,
  listBillingDeliveryNotes,
  updateBillingDeliveryNote,
} from "../../../billing/src/services/delivery-note-service.js"
import {
  createBillingPurchaseReceipt,
  deleteBillingPurchaseReceipt,
  getBillingPurchaseReceipt,
  listBillingPurchaseReceipts,
  updateBillingPurchaseReceipt,
} from "../../../billing/src/services/purchase-receipt-service.js"
import {
  acceptBillingStockUnitsToInventory,
  createBillingPurchaseReceiptBarcodeBatch,
  createBillingStockSaleAllocation,
  getBillingStockUnit,
  listBillingStockAcceptanceVerifications,
  listBillingStockSaleAllocations,
  listBillingStockUnits,
  postBillingGoodsInwardToInventory,
  rollbackBillingPurchaseReceiptBarcodes,
  resolveBillingStockBarcode,
} from "./stock-lifecycle-service.js"
import type { AuthUser } from "../../../cxapp/shared/index.js"
import { resolveCxappTenantContext } from "../../../cxapp/src/services/tenant-context-service.js"
import {
  createInventoryEngineRuntimeDiagnostics,
} from "../../../framework/engines/inventory-engine/runtime-diagnostics.js"
import {
  createInventoryEngineRuntimeServices,
} from "../../../framework/engines/inventory-engine/runtime-services.js"
import type {
  InventoryStockReservation,
  InventoryStockTransfer,
} from "../../../framework/engines/inventory-engine/contracts/index.js"
import {
  billingGoodsInwardSchema,
  billingPurchaseReceiptSchema,
  billingStockBarcodeAliasSchema,
  type StockAvailabilityRequest,
  type StockReconciliationResponse,
  type StockReservationUpsertPayload,
  type StockTransferUpsertPayload,
  type StockVerificationSummary,
} from "../../shared/index.js"
import {
  billingStockUnitSchema,
  type BillingGoodsInward,
  type BillingPurchaseReceipt,
  type BillingStockBarcodeAlias,
  type BillingStockUnit,
} from "../../shared/schemas/stock-operations.js"
import { stockOperationsTableNames } from "../../database/table-names.js"
import { getStorePayloadById, listStorePayloads } from "../../../billing/src/services/store.js"
import {
  listLiveStockAvailability,
  listLiveStockBalances,
  listLiveStockMovements,
} from "./live-stock-service.js"

function toTransferRecord(
  tenantId: string,
  payload: StockTransferUpsertPayload
): InventoryStockTransfer {
  return {
    id: payload.id,
    tenantId,
    status: payload.status,
    sourceWarehouseId: payload.sourceWarehouseId,
    sourceLocationId: payload.sourceLocationId,
    destinationWarehouseId: payload.destinationWarehouseId,
    destinationLocationId: payload.destinationLocationId,
    requestedAt: payload.requestedAt,
    dispatchedAt: payload.dispatchedAt,
    receivedAt: payload.receivedAt,
    referenceType: payload.referenceType,
    referenceId: payload.referenceId,
    lines: payload.lines,
    notes: payload.notes,
  }
}

function toReservationRecord(
  tenantId: string,
  payload: StockReservationUpsertPayload
): InventoryStockReservation {
  return {
    id: payload.id,
    tenantId,
    warehouseId: payload.warehouseId,
    locationId: payload.locationId,
    productId: payload.productId,
    variantId: payload.variantId,
    referenceType: payload.referenceType,
    referenceId: payload.referenceId,
    quantity: payload.quantity,
    consumedQuantity: payload.consumedQuantity,
    status: payload.status,
    reservedAt: payload.reservedAt,
    expiresAt: payload.expiresAt,
    releasedAt: payload.releasedAt,
    notes: payload.notes,
  }
}

export async function listStockPurchaseReceipts(database: Kysely<unknown>, user: AuthUser) {
  return listBillingPurchaseReceipts(database, user)
}

export async function getStockPurchaseReceipt(
  database: Kysely<unknown>,
  user: AuthUser,
  receiptId: string
) {
  return getBillingPurchaseReceipt(database, user, receiptId)
}

export async function createStockPurchaseReceipt(
  database: Kysely<unknown>,
  user: AuthUser,
  payload: unknown
) {
  return createBillingPurchaseReceipt(database, user, payload)
}

export async function updateStockPurchaseReceipt(
  database: Kysely<unknown>,
  user: AuthUser,
  receiptId: string,
  payload: unknown
) {
  return updateBillingPurchaseReceipt(database, user, receiptId, payload)
}

export async function deleteStockPurchaseReceipt(
  database: Kysely<unknown>,
  user: AuthUser,
  receiptId: string
) {
  return deleteBillingPurchaseReceipt(database, user, receiptId)
}

export async function createStockPurchaseReceiptBarcodeBatch(
  database: Kysely<unknown>,
  user: AuthUser,
  receiptId: string,
  payload: unknown
) {
  return createBillingPurchaseReceiptBarcodeBatch(database, user, receiptId, payload)
}

export async function rollbackStockPurchaseReceiptBarcodes(
  database: Kysely<unknown>,
  user: AuthUser,
  receiptId: string,
  payload: unknown
) {
  return rollbackBillingPurchaseReceiptBarcodes(database, user, receiptId, payload)
}

export async function listStockGoodsInward(database: Kysely<unknown>, user: AuthUser) {
  return listBillingGoodsInwardNotes(database, user)
}

export async function getStockGoodsInward(
  database: Kysely<unknown>,
  user: AuthUser,
  inwardId: string
) {
  return getBillingGoodsInwardNote(database, user, inwardId)
}

export async function createStockGoodsInward(
  database: Kysely<unknown>,
  user: AuthUser,
  payload: unknown
) {
  return createBillingGoodsInwardNote(database, user, payload)
}

export async function updateStockGoodsInward(
  database: Kysely<unknown>,
  user: AuthUser,
  inwardId: string,
  payload: unknown
) {
  return updateBillingGoodsInwardNote(database, user, inwardId, payload)
}

export async function postStockGoodsInward(
  database: Kysely<unknown>,
  user: AuthUser,
  inwardId: string
) {
  return postBillingGoodsInwardToInventory(database, user, inwardId)
}

export async function listStockDeliveryNotes(database: Kysely<unknown>, user: AuthUser) {
  return listBillingDeliveryNotes(database, user)
}

export async function getStockDeliveryNote(
  database: Kysely<unknown>,
  user: AuthUser,
  deliveryNoteId: string
) {
  return getBillingDeliveryNote(database, user, deliveryNoteId)
}

export async function createStockDeliveryNote(
  database: Kysely<unknown>,
  user: AuthUser,
  payload: unknown
) {
  return createBillingDeliveryNote(database, user, payload)
}

export async function updateStockDeliveryNote(
  database: Kysely<unknown>,
  user: AuthUser,
  deliveryNoteId: string,
  payload: unknown
) {
  return updateBillingDeliveryNote(database, user, deliveryNoteId, payload)
}

export async function listStockUnits(database: Kysely<unknown>, user: AuthUser) {
  return listBillingStockUnits(database, user)
}

export async function listStockAcceptanceVerifications(
  database: Kysely<unknown>,
  user: AuthUser,
  filters?: {
    purchaseReceiptId?: string
    productId?: string
    status?: "verified" | "mismatch" | "rejected"
  }
) {
  return listBillingStockAcceptanceVerifications(database, user, filters)
}

export async function acceptStockUnitsToInventory(
  database: Kysely<unknown>,
  user: AuthUser,
  payload: unknown
) {
  return acceptBillingStockUnitsToInventory(database, user, payload)
}

export async function getStockUnit(
  database: Kysely<unknown>,
  user: AuthUser,
  stockUnitId: string
) {
  return getBillingStockUnit(database, user, stockUnitId)
}

export async function resolveStockBarcode(
  database: Kysely<unknown>,
  user: AuthUser,
  payload: unknown
) {
  return resolveBillingStockBarcode(database, user, payload)
}

export async function listStockBarcodeAliases(database: Kysely<unknown>) {
  const items = (await listStorePayloads(
    database,
    stockOperationsTableNames.stockBarcodeAliases,
    billingStockBarcodeAliasSchema
  )) as BillingStockBarcodeAlias[]
  return {
    items: items.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
  }
}

export async function getStockBarcodeAlias(database: Kysely<unknown>, barcodeAliasId: string) {
  const item = await getStorePayloadById(
    database,
    stockOperationsTableNames.stockBarcodeAliases,
    barcodeAliasId,
    billingStockBarcodeAliasSchema
  )

  return { item }
}

export async function listStockSaleAllocations(database: Kysely<unknown>, user: AuthUser) {
  return listBillingStockSaleAllocations(database, user)
}

export async function createStockSaleAllocation(
  database: Kysely<unknown>,
  user: AuthUser,
  payload: unknown
) {
  return createBillingStockSaleAllocation(database, user, payload)
}

export async function listStockMovements(database: Kysely<unknown>) {
  return {
    items: await listLiveStockMovements(database),
  }
}

export async function getStockPurchaseReceiptLookups(database: Kysely<unknown>) {
  const [purchaseReceipts, goodsInward] = (await Promise.all([
    listStorePayloads(
      database,
      stockOperationsTableNames.purchaseReceipts,
      billingPurchaseReceiptSchema
    ),
    listStorePayloads(
      database,
      stockOperationsTableNames.goodsInwardNotes,
      billingGoodsInwardSchema
    ),
  ])) as [BillingPurchaseReceipt[], BillingGoodsInward[]]

  return {
    purchaseReceiptOptions: purchaseReceipts.map((item) => ({
      id: item.id,
      label: [item.entryNumber, item.supplierId].join(" - "),
      warehouseId: item.warehouseId,
      warehouseName: item.warehouseId,
      status: item.status,
      lines: item.lines.map((line: BillingPurchaseReceipt["lines"][number]) => ({
        id: line.id,
        productId: line.productId,
        productName: line.productId,
        variantId: null,
        variantName: line.description,
        quantity: line.quantity ?? 0,
        receivedQuantity: 0,
      })),
    })),
    goodsInwardOptions: goodsInward.map((item) => ({
      id: item.id,
      label: [item.inwardNumber, item.purchaseReceiptNumber].join(" - "),
      status: item.status,
      stockPostingStatus: item.stockPostingStatus,
      stockUnitCount: item.stockUnitIds.length,
    })),
  }
}

export async function listStockAvailability(
  database: Kysely<unknown>,
  request: StockAvailabilityRequest
) {
  return {
    items: await listLiveStockAvailability(database, {
      warehouseIds: request.warehouseIds,
      productIds: request.productIds,
      variantIds: request.variantIds,
    }),
  }
}

export async function listStockTransfers(database: Kysely<unknown>) {
  const tenantContext = await resolveCxappTenantContext(database)
  const diagnostics = createInventoryEngineRuntimeDiagnostics(database)

  return {
    items: await diagnostics.listTransfers({ tenantId: tenantContext.tenantId }),
  }
}

export async function upsertStockTransfer(
  database: Kysely<unknown>,
  payload: StockTransferUpsertPayload
) {
  const tenantContext = await resolveCxappTenantContext(database)
  const runtime = createInventoryEngineRuntimeServices(database)
  const transfer = toTransferRecord(tenantContext.tenantId, payload)

  await runtime.transferService.executeTransfer({ transfer })

  return { item: transfer }
}

export async function listStockReservations(database: Kysely<unknown>) {
  const tenantContext = await resolveCxappTenantContext(database)
  const diagnostics = createInventoryEngineRuntimeDiagnostics(database)

  return {
    items: await diagnostics.listReservations({ tenantId: tenantContext.tenantId }),
  }
}

export async function upsertStockReservation(
  database: Kysely<unknown>,
  payload: StockReservationUpsertPayload
) {
  const tenantContext = await resolveCxappTenantContext(database)
  const runtime = createInventoryEngineRuntimeServices(database)
  const reservation = toReservationRecord(tenantContext.tenantId, payload)

  await runtime.reservationService.applyReservations({
    reservations: [reservation],
  })

  return { item: reservation }
}

export async function getStockVerificationSummary(
  database: Kysely<unknown>,
  user: AuthUser
): Promise<StockVerificationSummary> {
  const [goodsInward, units, movements] = await Promise.all([
    listBillingGoodsInwardNotes(database, user),
    listBillingStockUnits(database, user),
    listStockMovements(database),
  ])

  return {
    pendingVerificationCount:
      goodsInward.items.filter((item) => item.status !== "verified").length +
      units.items.filter((item) => item.status === "received").length,
    postedInwardCount: goodsInward.items.filter((item) => item.stockPostingStatus === "posted").length,
    availableUnitCount: units.items.filter((item) => item.status === "available").length,
    allocatedUnitCount: units.items.filter((item) => item.status === "allocated").length,
    soldUnitCount: units.items.filter((item) => item.status === "sold").length,
    movementCount: movements.items.length,
  }
}

export async function getStockReconciliation(
  database: Kysely<unknown>
): Promise<StockReconciliationResponse> {
  const [availability, units] = await Promise.all([
    listLiveStockBalances(database),
    listStorePayloads(
      database,
      stockOperationsTableNames.stockUnits,
      billingStockUnitSchema
    ) as Promise<BillingStockUnit[]>,
  ])

  const liveBalanceMap = new Map(
    availability.map((item) => [
      [item.warehouse_id, item.product_id, item.variant_id ?? ""].join("::"),
      item,
    ])
  )

  return {
    items: Array.from(
      units
      .filter((item) => item.isActive)
      .reduce((groups, item) => {
        const key = [item.warehouseId, item.productId, item.variantId ?? ""].join("::")
        const current = groups.get(key) ?? {
          warehouseId: item.warehouseId,
          productId: item.productId,
          variantId: item.variantId,
          stockUnitQuantity: 0,
        }
        current.stockUnitQuantity += item.status === "sold" ? 0 : item.quantity
        groups.set(key, current)
        return groups
      }, new Map<string, { warehouseId: string; productId: string; variantId: string | null; stockUnitQuantity: number }>())
      .values()
    )
      .map((item) => {
        const key = [item.warehouseId, item.productId, item.variantId ?? ""].join("::")
        const live = liveBalanceMap.get(key)
        const engineOnHandQuantity = live?.balance_quantity ?? 0
        const coreOnHandQuantity = Number(item.stockUnitQuantity.toFixed(4))

        return {
          warehouseId: item.warehouseId,
          productId: item.productId,
          variantId: item.variantId,
          engineOnHandQuantity,
          coreOnHandQuantity,
          mismatchQuantity: Number((engineOnHandQuantity - coreOnHandQuantity).toFixed(4)),
        }
      })
      .filter((item) => item.mismatchQuantity !== 0),
  }
}

