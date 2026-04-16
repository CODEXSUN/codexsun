import type { Kysely } from "kysely"

import type {
  InventoryAvailability,
  InventoryPutawayTask,
  InventoryStockMovement,
  InventoryStockReservation,
  InventoryStockTransfer,
} from "./contracts/index.js"
import {
  inventoryEngineTableNames,
  listInventoryEngineRecords,
} from "./runtime-store.js"
import type { InventoryAvailabilityProjectionRequest } from "./services.js"
import { createInventoryEngineRuntimeServices } from "./runtime-services.js"

type StoredRecord = {
  createdAt: string
  updatedAt: string
}

export type StoredInventoryMovement = InventoryStockMovement & StoredRecord
export type StoredInventoryPutawayTask = InventoryPutawayTask & StoredRecord
export type StoredInventoryTransfer = InventoryStockTransfer & StoredRecord
export type StoredInventoryReservation = InventoryStockReservation & StoredRecord

export type InventoryRuntimeTenantQuery = {
  tenantId?: string
  limit?: number
}

export type InventoryMovementDiagnosticsQuery = InventoryRuntimeTenantQuery & {
  warehouseIds?: string[]
  locationIds?: string[]
  productIds?: string[]
  variantIds?: string[]
  movementTypes?: InventoryStockMovement["movementType"][]
  referenceType?: string | null
  referenceId?: string | null
}

export type InventoryPutawayDiagnosticsQuery = InventoryRuntimeTenantQuery & {
  warehouseIds?: string[]
  statuses?: InventoryPutawayTask["status"][]
  assignedUserId?: string | null
  goodsInwardReferenceId?: string | null
}

export type InventoryTransferDiagnosticsQuery = InventoryRuntimeTenantQuery & {
  statuses?: InventoryStockTransfer["status"][]
  sourceWarehouseIds?: string[]
  destinationWarehouseIds?: string[]
  referenceType?: string | null
  referenceId?: string | null
}

export type InventoryReservationDiagnosticsQuery = InventoryRuntimeTenantQuery & {
  warehouseIds?: string[]
  locationIds?: string[]
  productIds?: string[]
  variantIds?: string[]
  statuses?: InventoryStockReservation["status"][]
  referenceType?: string
  referenceId?: string
}

export type InventoryRuntimeDiagnosticsSummary = {
  tenantId: string | null
  movementCount: number
  putawayTaskCount: number
  transferCount: number
  reservationCount: number
}

export interface InventoryRuntimeDiagnostics {
  listMovements(
    query?: InventoryMovementDiagnosticsQuery
  ): Promise<StoredInventoryMovement[]>
  listPutawayTasks(
    query?: InventoryPutawayDiagnosticsQuery
  ): Promise<StoredInventoryPutawayTask[]>
  listTransfers(
    query?: InventoryTransferDiagnosticsQuery
  ): Promise<StoredInventoryTransfer[]>
  listReservations(
    query?: InventoryReservationDiagnosticsQuery
  ): Promise<StoredInventoryReservation[]>
  projectAvailability(
    request: InventoryAvailabilityProjectionRequest
  ): Promise<InventoryAvailability[]>
  summarize(query?: InventoryRuntimeTenantQuery): Promise<InventoryRuntimeDiagnosticsSummary>
}

function applyLimit<T>(items: T[], limit?: number) {
  if (!limit || limit < 1) {
    return items
  }

  return items.slice(0, limit)
}

function sortByUpdatedAtDesc<T extends StoredRecord>(items: T[]) {
  return [...items].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt)
  )
}

function matchesTenant(
  query: InventoryRuntimeTenantQuery | undefined,
  itemTenantId: string
) {
  if (!query?.tenantId) {
    return true
  }

  return query.tenantId === itemTenantId
}

function matchesOptionalIds(
  expectedIds: string[] | undefined,
  value: string | null
) {
  if (!expectedIds || expectedIds.length === 0) {
    return true
  }

  if (!value) {
    return false
  }

  return expectedIds.includes(value)
}

function matchesOptionalStatuses<TStatus extends string>(
  expected: TStatus[] | undefined,
  value: TStatus
) {
  if (!expected || expected.length === 0) {
    return true
  }

  return expected.includes(value)
}

export function createInventoryEngineRuntimeDiagnostics(
  database: Kysely<unknown>
): InventoryRuntimeDiagnostics {
  const runtimeServices = createInventoryEngineRuntimeServices(database)

  async function listMovements(
    query?: InventoryMovementDiagnosticsQuery
  ): Promise<StoredInventoryMovement[]> {
    const records = await listInventoryEngineRecords<StoredInventoryMovement>(
      database,
      inventoryEngineTableNames.movements
    )

    return applyLimit(
      sortByUpdatedAtDesc(
        records.filter((item) => {
          if (!matchesTenant(query, item.tenantId)) {
            return false
          }

          if (!matchesOptionalIds(query?.warehouseIds, item.warehouseId)) {
            return false
          }

          if (!matchesOptionalIds(query?.locationIds, item.locationId)) {
            return false
          }

          if (!matchesOptionalIds(query?.productIds, item.productId)) {
            return false
          }

          if (!matchesOptionalIds(query?.variantIds, item.variantId)) {
            return false
          }

          if (
            query?.movementTypes &&
            !query.movementTypes.includes(item.movementType)
          ) {
            return false
          }

          if (query && "referenceType" in query && item.referenceType !== query.referenceType) {
            return false
          }

          if (query && "referenceId" in query && item.referenceId !== query.referenceId) {
            return false
          }

          return true
        })
      ),
      query?.limit
    )
  }

  async function listPutawayTasks(
    query?: InventoryPutawayDiagnosticsQuery
  ): Promise<StoredInventoryPutawayTask[]> {
    const records = await listInventoryEngineRecords<StoredInventoryPutawayTask>(
      database,
      inventoryEngineTableNames.putawayTasks
    )

    return applyLimit(
      sortByUpdatedAtDesc(
        records.filter((item) => {
          if (!matchesTenant(query, item.tenantId)) {
            return false
          }

          if (!matchesOptionalIds(query?.warehouseIds, item.warehouseId)) {
            return false
          }

          if (!matchesOptionalStatuses(query?.statuses, item.status)) {
            return false
          }

          if (query && "assignedUserId" in query && item.assignedUserId !== query.assignedUserId) {
            return false
          }

          if (
            query &&
            "goodsInwardReferenceId" in query &&
            item.goodsInwardReferenceId !== query.goodsInwardReferenceId
          ) {
            return false
          }

          return true
        })
      ),
      query?.limit
    )
  }

  async function listTransfers(
    query?: InventoryTransferDiagnosticsQuery
  ): Promise<StoredInventoryTransfer[]> {
    const records = await listInventoryEngineRecords<StoredInventoryTransfer>(
      database,
      inventoryEngineTableNames.transfers
    )

    return applyLimit(
      sortByUpdatedAtDesc(
        records.filter((item) => {
          if (!matchesTenant(query, item.tenantId)) {
            return false
          }

          if (!matchesOptionalStatuses(query?.statuses, item.status)) {
            return false
          }

          if (!matchesOptionalIds(query?.sourceWarehouseIds, item.sourceWarehouseId)) {
            return false
          }

          if (
            !matchesOptionalIds(
              query?.destinationWarehouseIds,
              item.destinationWarehouseId
            )
          ) {
            return false
          }

          if (query && "referenceType" in query && item.referenceType !== query.referenceType) {
            return false
          }

          if (query && "referenceId" in query && item.referenceId !== query.referenceId) {
            return false
          }

          return true
        })
      ),
      query?.limit
    )
  }

  async function listReservations(
    query?: InventoryReservationDiagnosticsQuery
  ): Promise<StoredInventoryReservation[]> {
    const records = await listInventoryEngineRecords<StoredInventoryReservation>(
      database,
      inventoryEngineTableNames.reservations
    )

    return applyLimit(
      sortByUpdatedAtDesc(
        records.filter((item) => {
          if (!matchesTenant(query, item.tenantId)) {
            return false
          }

          if (!matchesOptionalIds(query?.warehouseIds, item.warehouseId)) {
            return false
          }

          if (!matchesOptionalIds(query?.locationIds, item.locationId)) {
            return false
          }

          if (!matchesOptionalIds(query?.productIds, item.productId)) {
            return false
          }

          if (!matchesOptionalIds(query?.variantIds, item.variantId)) {
            return false
          }

          if (!matchesOptionalStatuses(query?.statuses, item.status)) {
            return false
          }

          if (query?.referenceType && item.referenceType !== query.referenceType) {
            return false
          }

          if (query?.referenceId && item.referenceId !== query.referenceId) {
            return false
          }

          return true
        })
      ),
      query?.limit
    )
  }

  async function summarize(
    query?: InventoryRuntimeTenantQuery
  ): Promise<InventoryRuntimeDiagnosticsSummary> {
    const countQuery = query ? { tenantId: query.tenantId } : undefined
    const [movements, putawayTasks, transfers, reservations] = await Promise.all([
      listMovements(countQuery),
      listPutawayTasks(countQuery),
      listTransfers(countQuery),
      listReservations(countQuery),
    ])

    return {
      tenantId: query?.tenantId ?? null,
      movementCount: movements.length,
      putawayTaskCount: putawayTasks.length,
      transferCount: transfers.length,
      reservationCount: reservations.length,
    }
  }

  return {
    listMovements,
    listPutawayTasks,
    listTransfers,
    listReservations,
    projectAvailability: runtimeServices.availabilityService.projectAvailability,
    summarize,
  }
}
