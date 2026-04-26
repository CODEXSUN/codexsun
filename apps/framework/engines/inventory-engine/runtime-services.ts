import type { Kysely } from "kysely"

import type {
  InventoryAvailability,
  InventoryStockMovement,
  InventoryStockReservation,
  InventoryStockTransfer,
} from "./contracts/index.js"
import {
  inventoryEngineTableNames,
  listInventoryEngineRecords,
  replaceInventoryEngineRecords,
} from "./runtime-store.js"
import type {
  InventoryAvailabilityProjectionRequest,
  InventoryAvailabilityServicePort,
  InventoryMovementPostRequest,
  InventoryMovementPostResult,
  InventoryMovementServicePort,
  InventoryPutawayExecutionRequest,
  InventoryPutawayExecutionResult,
  InventoryPutawayServicePort,
  InventoryReservationRequest,
  InventoryReservationResult,
  InventoryReservationServicePort,
  InventoryTransferExecutionRequest,
  InventoryTransferExecutionResult,
  InventoryTransferServicePort,
} from "./services.js"

type StoredPutawayTask = InventoryPutawayExecutionRequest["task"] & {
  createdAt: string
  updatedAt: string
}

type StoredMovement = InventoryStockMovement & {
  createdAt: string
  updatedAt: string
}

type StoredTransfer = InventoryStockTransfer & {
  createdAt: string
  updatedAt: string
}

type StoredReservation = InventoryStockReservation & {
  createdAt: string
  updatedAt: string
}

function timestamp() {
  return new Date().toISOString()
}

function appendUniqueById<T extends { id: string }>(existing: T[], incoming: T[]) {
  const existingIds = new Set(existing.map((item) => item.id))
  const accepted = incoming.filter((item) => !existingIds.has(item.id))
  return {
    nextItems: [...existing, ...accepted],
    acceptedCount: accepted.length,
    rejectedCount: incoming.length - accepted.length,
  }
}

function upsertById<T extends { id: string }>(existing: T[], incoming: T[]) {
  const incomingMap = new Map(incoming.map((item) => [item.id, item]))
  const merged = existing.map((item) => incomingMap.get(item.id) ?? item)
  const existingIds = new Set(existing.map((item) => item.id))

  for (const item of incoming) {
    if (!existingIds.has(item.id)) {
      merged.push(item)
    }
  }

  return merged
}

function buildAvailabilityKey(item: {
  tenantId: string
  warehouseId: string
  locationId: string | null
  productId: string
  variantId: string | null
}) {
  return [
    item.tenantId,
    item.warehouseId,
    item.locationId ?? "",
    item.productId,
    item.variantId ?? "",
  ].join("::")
}

function matchesAvailabilityRequest(
  request: InventoryAvailabilityProjectionRequest,
  item: InventoryAvailability
) {
  if (item.tenantId !== request.tenantId) {
    return false
  }

  if (request.warehouseIds && !request.warehouseIds.includes(item.warehouseId)) {
    return false
  }

  if (request.productIds && !request.productIds.includes(item.productId)) {
    return false
  }

  if (request.variantIds && !request.variantIds.includes(item.variantId ?? "")) {
    return false
  }

  return true
}

export function createInventoryEngineRuntimeServices(database: Kysely<unknown>): {
  movementService: InventoryMovementServicePort
  putawayService: InventoryPutawayServicePort
  transferService: InventoryTransferServicePort
  reservationService: InventoryReservationServicePort
  availabilityService: InventoryAvailabilityServicePort
} {
  const movementService: InventoryMovementServicePort = {
    async postMovements(
      request: InventoryMovementPostRequest
    ): Promise<InventoryMovementPostResult> {
      const existing = await listInventoryEngineRecords<StoredMovement>(
        database,
        inventoryEngineTableNames.movements
      )
      const now = timestamp()
      const incoming = request.entries.map((entry) => ({
        ...entry,
        createdAt: now,
        updatedAt: now,
      }))
      const result = appendUniqueById(existing, incoming)

      await replaceInventoryEngineRecords(
        database,
        inventoryEngineTableNames.movements,
        "inventory-movements",
        result.nextItems
      )

      return {
        acceptedCount: result.acceptedCount,
        rejectedCount: result.rejectedCount,
        processedAt: now,
      }
    },
  }

  const putawayService: InventoryPutawayServicePort = {
    async executePutaway(
      request: InventoryPutawayExecutionRequest
    ): Promise<InventoryPutawayExecutionResult> {
      const existing = await listInventoryEngineRecords<StoredPutawayTask>(
        database,
        inventoryEngineTableNames.putawayTasks
      )
      const now = timestamp()
      const nextTask: StoredPutawayTask = {
        ...request.task,
        createdAt: existing.find((item) => item.id === request.task.id)?.createdAt ?? now,
        updatedAt: now,
      }
      const nextItems = upsertById(existing, [nextTask])

      await replaceInventoryEngineRecords(
        database,
        inventoryEngineTableNames.putawayTasks,
        "inventory-putaway-tasks",
        nextItems
      )

      return {
        taskId: request.task.id,
        status: request.task.status,
        processedAt: now,
      }
    },
  }

  const transferService: InventoryTransferServicePort = {
    async executeTransfer(
      request: InventoryTransferExecutionRequest
    ): Promise<InventoryTransferExecutionResult> {
      const existing = await listInventoryEngineRecords<StoredTransfer>(
        database,
        inventoryEngineTableNames.transfers
      )
      const now = timestamp()
      const nextTransfer: StoredTransfer = {
        ...request.transfer,
        createdAt: existing.find((item) => item.id === request.transfer.id)?.createdAt ?? now,
        updatedAt: now,
      }
      const nextItems = upsertById(existing, [nextTransfer])

      await replaceInventoryEngineRecords(
        database,
        inventoryEngineTableNames.transfers,
        "inventory-transfers",
        nextItems
      )

      return {
        transferId: request.transfer.id,
        status: request.transfer.status,
        processedAt: now,
      }
    },
  }

  const reservationService: InventoryReservationServicePort = {
    async applyReservations(
      request: InventoryReservationRequest
    ): Promise<InventoryReservationResult> {
      const existing = await listInventoryEngineRecords<StoredReservation>(
        database,
        inventoryEngineTableNames.reservations
      )
      const now = timestamp()
      const incoming = request.reservations.map((reservation) => ({
        ...reservation,
        createdAt: existing.find((item) => item.id === reservation.id)?.createdAt ?? now,
        updatedAt: now,
      }))
      const nextItems = upsertById(existing, incoming)

      await replaceInventoryEngineRecords(
        database,
        inventoryEngineTableNames.reservations,
        "inventory-reservations",
        nextItems
      )

      return {
        acceptedReservationIds: request.reservations.map((item) => item.id),
        rejectedReservationIds: [],
        processedAt: now,
      }
    },
  }

  const availabilityService: InventoryAvailabilityServicePort = {
    async projectAvailability(
      request: InventoryAvailabilityProjectionRequest
    ): Promise<InventoryAvailability[]> {
      const [movements, reservations, transfers] = await Promise.all([
        listInventoryEngineRecords<StoredMovement>(
          database,
          inventoryEngineTableNames.movements
        ),
        listInventoryEngineRecords<StoredReservation>(
          database,
          inventoryEngineTableNames.reservations
        ),
        listInventoryEngineRecords<StoredTransfer>(
          database,
          inventoryEngineTableNames.transfers
        ),
      ])

      const map = new Map<string, InventoryAvailability>()
      const now = timestamp()

      for (const movement of movements.filter((item) => item.tenantId === request.tenantId)) {
        const key = buildAvailabilityKey(movement)
        const current =
          map.get(key) ??
          {
            tenantId: movement.tenantId,
            warehouseId: movement.warehouseId,
            locationId: movement.locationId,
            productId: movement.productId,
            variantId: movement.variantId,
            onHandQuantity: 0,
            reservedQuantity: 0,
            allocatedQuantity: 0,
            inTransitQuantity: 0,
            damagedQuantity: 0,
            rejectedQuantity: 0,
            availableQuantity: 0,
            lastComputedAt: now,
          }

        const signedQuantity =
          movement.direction === "in"
            ? movement.quantity
            : movement.direction === "out"
              ? movement.quantity * -1
              : 0

        current.onHandQuantity += signedQuantity

        if (movement.movementType === "damage") {
          current.damagedQuantity += movement.quantity
        }

        if (movement.movementType === "rejection") {
          current.rejectedQuantity += movement.quantity
        }

        map.set(key, current)
      }

      for (const reservation of reservations.filter((item) => item.tenantId === request.tenantId)) {
        const key = buildAvailabilityKey({
          tenantId: reservation.tenantId,
          warehouseId: reservation.warehouseId ?? "warehouse:unassigned",
          locationId: reservation.locationId,
          productId: reservation.productId,
          variantId: reservation.variantId,
        })
        const current =
          map.get(key) ??
          {
            tenantId: reservation.tenantId,
            warehouseId: reservation.warehouseId ?? "warehouse:unassigned",
            locationId: reservation.locationId,
            productId: reservation.productId,
            variantId: reservation.variantId,
            onHandQuantity: 0,
            reservedQuantity: 0,
            allocatedQuantity: 0,
            inTransitQuantity: 0,
            damagedQuantity: 0,
            rejectedQuantity: 0,
            availableQuantity: 0,
            lastComputedAt: now,
          }

        const openQuantity = Math.max(
          reservation.quantity - reservation.consumedQuantity,
          0
        )

        if (
          reservation.status === "active" ||
          reservation.status === "allocated" ||
          reservation.status === "partially-consumed"
        ) {
          current.reservedQuantity += openQuantity
        }

        if (
          reservation.status === "allocated" ||
          reservation.status === "partially-consumed"
        ) {
          current.allocatedQuantity += openQuantity
        }

        map.set(key, current)
      }

      for (const transfer of transfers.filter((item) => item.tenantId === request.tenantId)) {
        if (transfer.status !== "in-transit") {
          continue
        }

        for (const line of transfer.lines) {
          const key = buildAvailabilityKey({
            tenantId: transfer.tenantId,
            warehouseId: transfer.destinationWarehouseId,
            locationId: transfer.destinationLocationId,
            productId: line.productId,
            variantId: line.variantId,
          })
          const current =
            map.get(key) ??
            {
              tenantId: transfer.tenantId,
              warehouseId: transfer.destinationWarehouseId,
              locationId: transfer.destinationLocationId,
              productId: line.productId,
              variantId: line.variantId,
              onHandQuantity: 0,
              reservedQuantity: 0,
              allocatedQuantity: 0,
              inTransitQuantity: 0,
              damagedQuantity: 0,
              rejectedQuantity: 0,
              availableQuantity: 0,
              lastComputedAt: now,
            }

          current.inTransitQuantity += line.quantity
          map.set(key, current)
        }
      }

      const items = [...map.values()].map((item) => ({
        ...item,
        availableQuantity: item.onHandQuantity - item.reservedQuantity,
        lastComputedAt: now,
      }))

      return items.filter((item) => matchesAvailabilityRequest(request, item))
    },
  }

  return {
    movementService,
    putawayService,
    transferService,
    reservationService,
    availabilityService,
  }
}
