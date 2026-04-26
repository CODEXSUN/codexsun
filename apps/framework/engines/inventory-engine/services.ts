import type {
  InventoryAvailability,
  InventoryPutawayTask,
  InventoryStockMovement,
  InventoryStockReservation,
  InventoryStockTransfer,
} from "./contracts/index.js"

export type InventoryMovementPostRequest = {
  entries: InventoryStockMovement[]
}

export type InventoryMovementPostResult = {
  acceptedCount: number
  rejectedCount: number
  processedAt: string
}

export type InventoryTransferExecutionRequest = {
  transfer: InventoryStockTransfer
}

export type InventoryTransferExecutionResult = {
  transferId: string
  status: string
  processedAt: string
}

export type InventoryPutawayExecutionRequest = {
  task: InventoryPutawayTask
}

export type InventoryPutawayExecutionResult = {
  taskId: string
  status: string
  processedAt: string
}

export type InventoryReservationRequest = {
  reservations: InventoryStockReservation[]
}

export type InventoryReservationResult = {
  acceptedReservationIds: string[]
  rejectedReservationIds: string[]
  processedAt: string
}

export type InventoryAvailabilityProjectionRequest = {
  tenantId: string
  warehouseIds?: string[]
  productIds?: string[]
  variantIds?: string[]
}

export interface InventoryMovementServicePort {
  postMovements(
    request: InventoryMovementPostRequest
  ): Promise<InventoryMovementPostResult>
}

export interface InventoryTransferServicePort {
  executeTransfer(
    request: InventoryTransferExecutionRequest
  ): Promise<InventoryTransferExecutionResult>
}

export interface InventoryPutawayServicePort {
  executePutaway(
    request: InventoryPutawayExecutionRequest
  ): Promise<InventoryPutawayExecutionResult>
}

export interface InventoryReservationServicePort {
  applyReservations(
    request: InventoryReservationRequest
  ): Promise<InventoryReservationResult>
}

export interface InventoryAvailabilityServicePort {
  projectAvailability(
    request: InventoryAvailabilityProjectionRequest
  ): Promise<InventoryAvailability[]>
}
