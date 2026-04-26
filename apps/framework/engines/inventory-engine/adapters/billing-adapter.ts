import type {
  InventoryPutawayTask,
  InventoryStockMovement,
  InventoryStockTransfer,
} from "../contracts/index.js"

export type BillingInventoryCommandSource =
  | "purchase-receipt"
  | "goods-inward"
  | "sales-voucher"
  | "purchase-return"
  | "sales-return"
  | "stock-adjustment"

export type BillingInventorySyncPayload = {
  source: BillingInventoryCommandSource
  movementEntries: InventoryStockMovement[]
  transferEntries?: InventoryStockTransfer[]
  putawayTasks?: InventoryPutawayTask[]
}

export interface BillingInventoryAdapter {
  syncBillingInventory(payload: BillingInventorySyncPayload): Promise<void>
}
