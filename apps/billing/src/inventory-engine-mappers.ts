import type {
  BillingGoodsInward,
  BillingPurchaseReceipt,
  BillingStockSaleAllocation,
} from "../shared/index.js"
import type {
  BillingInventoryTranslation,
} from "../../../framework/engines/inventory-engine/translations/index.js"
import type {
  InventoryPutawayTask,
  InventoryStockMovement,
} from "../../../framework/engines/inventory-engine/contracts/index.js"

type BillingInventoryMapperContext = {
  tenantId: string
  companyId: string | null
}

function toTimestamp(date: string) {
  return `${date}T00:00:00.000Z`
}

export function mapBillingPurchaseReceiptToInventoryDraft(
  context: BillingInventoryMapperContext,
  receipt: BillingPurchaseReceipt
): BillingInventoryTranslation {
  return {
    header: {
      tenantId: context.tenantId,
      companyId: context.companyId,
      warehouseId: receipt.warehouseId,
      warehouseName: receipt.warehouseName,
      documentId: receipt.id,
      documentNumber: receipt.receiptNumber,
      documentDate: receipt.postingDate,
      source: "purchase-receipt",
    },
    lines: receipt.lines.map((line) => ({
      lineId: line.id,
      productId: line.productId,
      productName: line.productName,
      variantId: line.variantId,
      quantity: line.quantity,
      unitCost: line.unitCost,
      sourceLocationId: null,
      destinationLocationId: null,
      batchId: null,
      serialId: null,
      notes: line.note,
    })),
    movementEntries: [],
  }
}

export function mapBillingGoodsInwardToInventoryTranslation(
  context: BillingInventoryMapperContext,
  inward: BillingGoodsInward
): BillingInventoryTranslation {
  const movementEntries: InventoryStockMovement[] = []
  const putawayLines: InventoryPutawayTask["lines"] = []

  for (const line of inward.lines) {
    if (line.acceptedQuantity > 0) {
      movementEntries.push({
        id: `inventory-movement:${inward.id}:${line.id}:purchase-inward`,
        tenantId: context.tenantId,
        warehouseId: inward.warehouseId,
        locationId: null,
        productId: line.productId,
        variantId: line.variantId,
        unitId: null,
        batchId: null,
        serialId: null,
        movementType: "purchase-inward",
        direction: "in",
        quantity: line.acceptedQuantity,
        referenceType: "billing_goods_inward",
        referenceId: inward.id,
        occurredAt: toTimestamp(inward.postingDate),
        notes: line.note,
      })

      putawayLines.push({
        id: `putaway-line:${inward.id}:${line.id}`,
        productId: line.productId,
        variantId: line.variantId,
        unitId: null,
        batchId: null,
        serialId: null,
        quantity: line.acceptedQuantity,
        inboundLocationId: null,
        targetLocationId: inward.warehouseId,
      })
    }
  }

  const putawayTasks: InventoryPutawayTask[] =
    putawayLines.length === 0
      ? []
      : [
          {
            id: `putaway-task:${inward.id}`,
            tenantId: context.tenantId,
            warehouseId: inward.warehouseId,
            goodsInwardReferenceId: inward.id,
            status: "planned",
            plannedAt: inward.updatedAt,
            startedAt: null,
            completedAt: null,
            assignedUserId: inward.createdByUserId,
            lines: putawayLines,
            notes: inward.note,
          },
        ]

  return {
    header: {
      tenantId: context.tenantId,
      companyId: context.companyId,
      warehouseId: inward.warehouseId,
      warehouseName: inward.warehouseName,
      documentId: inward.id,
      documentNumber: inward.inwardNumber,
      documentDate: inward.postingDate,
      source: "goods-inward",
    },
    lines: inward.lines.map((line) => ({
      lineId: line.id,
      productId: line.productId,
      productName: line.productName,
      variantId: line.variantId,
      quantity: line.acceptedQuantity,
      unitCost: null,
      sourceLocationId: null,
      destinationLocationId: null,
      batchId: null,
      serialId: null,
      notes: line.note,
    })),
    movementEntries,
    putawayTasks,
  }
}

export function mapBillingSaleAllocationToInventoryMovement(
  tenantId: string,
  allocation: BillingStockSaleAllocation
): InventoryStockMovement {
  return {
    id: `inventory-movement:${allocation.id}:sales-issue`,
    tenantId,
    warehouseId: allocation.warehouseId,
    locationId: null,
    productId: allocation.productId,
    variantId: null,
    unitId: allocation.stockUnitId,
    batchId: null,
    serialId: null,
    movementType: "sales-issue",
    direction: "out",
    quantity: 1,
    referenceType: "billing_stock_sale_allocation",
    referenceId: allocation.id,
    occurredAt: allocation.soldAt ?? allocation.allocatedAt,
    notes: allocation.salesVoucherNumber,
  }
}
