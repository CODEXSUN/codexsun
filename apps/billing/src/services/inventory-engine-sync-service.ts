import type {
  BillingGoodsInward,
  BillingStockSaleAllocation,
} from "../../shared/index.js"
import {
  mapBillingGoodsInwardToInventoryTranslation,
  mapBillingSaleAllocationToInventoryMovement,
} from "../inventory-engine-mappers.js"
import type {
  InventoryMovementPostResult,
  InventoryMovementServicePort,
  InventoryPutawayExecutionResult,
  InventoryPutawayServicePort,
} from "../../../framework/engines/inventory-engine/services.js"

export type BillingInventoryEngineContext = {
  tenantId: string
  companyId: string | null
}

export type BillingGoodsInwardSyncResult = {
  movementResult: InventoryMovementPostResult | null
  putawayResults: InventoryPutawayExecutionResult[]
}

export async function syncBillingGoodsInwardToInventoryEngine(
  context: BillingInventoryEngineContext,
  inward: BillingGoodsInward,
  ports: {
    movementService: InventoryMovementServicePort
    putawayService?: InventoryPutawayServicePort
  }
): Promise<BillingGoodsInwardSyncResult> {
  const translation = mapBillingGoodsInwardToInventoryTranslation(context, inward)

  const movementResult =
    translation.movementEntries.length > 0
      ? await ports.movementService.postMovements({
          entries: translation.movementEntries,
        })
      : null

  const putawayResults =
    !ports.putawayService || !translation.putawayTasks || translation.putawayTasks.length === 0
      ? []
      : await Promise.all(
          translation.putawayTasks.map((task) =>
            ports.putawayService!.executePutaway({ task })
          )
        )

  return {
    movementResult,
    putawayResults,
  }
}

export async function syncBillingSalesIssueToInventoryEngine(
  tenantId: string,
  allocation: BillingStockSaleAllocation,
  movementService: InventoryMovementServicePort
): Promise<InventoryMovementPostResult> {
  return movementService.postMovements({
    entries: [mapBillingSaleAllocationToInventoryMovement(tenantId, allocation)],
  })
}
