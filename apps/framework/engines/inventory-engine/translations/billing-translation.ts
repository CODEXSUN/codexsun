import type {
  InventoryPutawayTask,
  InventoryStockMovement,
  InventoryStockTransfer,
} from "../contracts/index.js"
import type { BillingInventoryCommandSource } from "../adapters/billing-adapter.js"

export type BillingInventoryDocumentHeader = {
  tenantId: string
  companyId: string | null
  warehouseId: string
  warehouseName: string | null
  documentId: string
  documentNumber: string
  documentDate: string
  source: BillingInventoryCommandSource
}

export type BillingInventoryDocumentLine = {
  lineId: string
  productId: string
  productName: string | null
  variantId: string | null
  quantity: number
  unitCost: number | null
  sourceLocationId: string | null
  destinationLocationId: string | null
  batchId: string | null
  serialId: string | null
  notes: string | null
}

export type BillingInventoryTranslation = {
  header: BillingInventoryDocumentHeader
  lines: BillingInventoryDocumentLine[]
  movementEntries: InventoryStockMovement[]
  transferEntries?: InventoryStockTransfer[]
  putawayTasks?: InventoryPutawayTask[]
}
