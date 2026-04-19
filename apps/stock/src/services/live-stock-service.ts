import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import { stockTableNames } from "../../database/table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

type QueryDatabase = Kysely<DynamicDatabase>

type StockLiveBalanceRow = {
  balance_key: string
  product_id: string
  variant_id: string | null
  warehouse_id: string
  inward_quantity: number
  outward_quantity: number
  reserved_quantity: number
  balance_quantity: number
  available_quantity: number
  last_inward_at: string | null
  last_outward_at: string | null
  last_verified_at: string | null
  created_at: string
  updated_at: string
}

type StockMovementLedgerRow = {
  movement_id: string
  product_id: string
  variant_id: string | null
  warehouse_id: string
  direction: "in" | "out"
  quantity: number
  balance_key: string
  reference_type: string | null
  reference_id: string | null
  verification_state: "verified"
  occurred_at: string
  created_at: string
  updated_at: string
}

export type LiveStockMovementInput = {
  productId: string
  variantId: string | null
  warehouseId: string
  direction: "in" | "out"
  quantity: number
  referenceType: string | null
  referenceId: string | null
  occurredAt: string
  verificationState?: "verified"
}

export type LiveStockReservationInput = {
  productId: string
  quantity: number
}

export type LiveStockReservationItem = {
  productId: string
  stockItemId: string
  warehouseId: string
  quantity: number
}

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as QueryDatabase
}

function roundQuantity(value: number) {
  return Number(value.toFixed(4))
}

function buildBalanceKey(input: {
  productId: string
  variantId: string | null
  warehouseId: string
}) {
  return [input.productId, input.variantId ?? "-", input.warehouseId].join("::")
}

function toBalanceAvailability(row: StockLiveBalanceRow) {
  return {
    warehouseId: row.warehouse_id,
    productId: row.product_id,
    variantId: row.variant_id,
    onHandQuantity: row.balance_quantity,
    reservedQuantity: row.reserved_quantity,
    allocatedQuantity: 0,
    inTransitQuantity: 0,
    availableQuantity: row.available_quantity,
  }
}

async function getBalanceRow(
  database: Kysely<unknown>,
  input: { productId: string; variantId: string | null; warehouseId: string }
) {
  const queryDatabase = asQueryDatabase(database)
  const balanceKey = buildBalanceKey(input)

  const row = await queryDatabase
    .selectFrom(stockTableNames.liveBalances)
    .selectAll()
    .where("balance_key", "=", balanceKey)
    .executeTakeFirst()

  return (row ?? null) as StockLiveBalanceRow | null
}

async function upsertBalanceRow(
  database: Kysely<unknown>,
  row: StockLiveBalanceRow
) {
  const queryDatabase = asQueryDatabase(database)
  const existing = await queryDatabase
    .selectFrom(stockTableNames.liveBalances)
    .select("balance_key")
    .where("balance_key", "=", row.balance_key)
    .executeTakeFirst()

  if (existing) {
    await queryDatabase
      .updateTable(stockTableNames.liveBalances)
      .set({
        inward_quantity: row.inward_quantity,
        outward_quantity: row.outward_quantity,
        reserved_quantity: row.reserved_quantity,
        balance_quantity: row.balance_quantity,
        available_quantity: row.available_quantity,
        last_inward_at: row.last_inward_at,
        last_outward_at: row.last_outward_at,
        last_verified_at: row.last_verified_at,
        updated_at: row.updated_at,
      })
      .where("balance_key", "=", row.balance_key)
      .execute()
    return
  }

  await queryDatabase.insertInto(stockTableNames.liveBalances).values(row).execute()
}

async function insertMovementLedgerRow(
  database: Kysely<unknown>,
  row: StockMovementLedgerRow
) {
  const queryDatabase = asQueryDatabase(database)
  await queryDatabase.insertInto(stockTableNames.movementLedger).values(row).execute()
}

function validateComputedBalance(next: Pick<StockLiveBalanceRow, "balance_quantity" | "available_quantity" | "reserved_quantity">, context: Record<string, unknown>) {
  if (next.balance_quantity < 0) {
    throw new ApplicationError("Live stock balance cannot drop below zero.", context, 409)
  }

  if (next.reserved_quantity < 0) {
    throw new ApplicationError("Live reserved stock cannot drop below zero.", context, 409)
  }

  if (next.available_quantity < 0) {
    throw new ApplicationError("Live available stock cannot drop below zero.", context, 409)
  }
}

export async function applyLiveStockMovement(
  database: Kysely<unknown>,
  input: LiveStockMovementInput
) {
  const quantity = roundQuantity(input.quantity)

  if (!(quantity > 0)) {
    throw new ApplicationError("Live stock movement quantity must be greater than zero.", input, 400)
  }

  const timestamp = new Date().toISOString()
  const balanceKey = buildBalanceKey(input)
  const current =
    (await getBalanceRow(database, input)) ??
    ({
      balance_key: balanceKey,
      product_id: input.productId,
      variant_id: input.variantId,
      warehouse_id: input.warehouseId,
      inward_quantity: 0,
      outward_quantity: 0,
      reserved_quantity: 0,
      balance_quantity: 0,
      available_quantity: 0,
      last_inward_at: null,
      last_outward_at: null,
      last_verified_at: null,
      created_at: timestamp,
      updated_at: timestamp,
    } satisfies StockLiveBalanceRow)

  const inwardQuantity =
    input.direction === "in"
      ? roundQuantity(current.inward_quantity + quantity)
      : current.inward_quantity
  const outwardQuantity =
    input.direction === "out"
      ? roundQuantity(current.outward_quantity + quantity)
      : current.outward_quantity
  const balanceQuantity = roundQuantity(inwardQuantity - outwardQuantity)
  const availableQuantity = roundQuantity(balanceQuantity - current.reserved_quantity)
  const next: StockLiveBalanceRow = {
    ...current,
    inward_quantity: inwardQuantity,
    outward_quantity: outwardQuantity,
    balance_quantity: balanceQuantity,
    available_quantity: availableQuantity,
    last_inward_at: input.direction === "in" ? input.occurredAt : current.last_inward_at,
    last_outward_at: input.direction === "out" ? input.occurredAt : current.last_outward_at,
    last_verified_at: input.occurredAt,
    updated_at: timestamp,
  }

  validateComputedBalance(next, {
    balanceKey,
    direction: input.direction,
    quantity,
    productId: input.productId,
    variantId: input.variantId,
    warehouseId: input.warehouseId,
  })

  await upsertBalanceRow(database, next)
  await insertMovementLedgerRow(database, {
    movement_id: `stock-movement:${randomUUID()}`,
    product_id: input.productId,
    variant_id: input.variantId,
    warehouse_id: input.warehouseId,
    direction: input.direction,
    quantity,
    balance_key: balanceKey,
    reference_type: input.referenceType,
    reference_id: input.referenceId,
    verification_state: input.verificationState ?? "verified",
    occurred_at: input.occurredAt,
    created_at: timestamp,
    updated_at: timestamp,
  })
}

export async function listLiveStockBalances(
  database: Kysely<unknown>,
  filters?: {
    productIds?: string[]
    variantIds?: string[]
    warehouseIds?: string[]
  }
) {
  const queryDatabase = asQueryDatabase(database)
  let query = queryDatabase.selectFrom(stockTableNames.liveBalances).selectAll()

  if (filters?.productIds && filters.productIds.length > 0) {
    query = query.where("product_id", "in", filters.productIds)
  }
  if (filters?.variantIds && filters.variantIds.length > 0) {
    query = query.where("variant_id", "in", filters.variantIds)
  }
  if (filters?.warehouseIds && filters.warehouseIds.length > 0) {
    query = query.where("warehouse_id", "in", filters.warehouseIds)
  }

  const rows = (await query.orderBy("updated_at", "desc").execute()) as StockLiveBalanceRow[]
  return rows
}

export async function listLiveStockAvailability(
  database: Kysely<unknown>,
  filters?: {
    productIds?: string[]
    variantIds?: string[]
    warehouseIds?: string[]
  }
) {
  const rows = await listLiveStockBalances(database, filters)
  return rows.map(toBalanceAvailability)
}

export async function listLiveStockMovements(database: Kysely<unknown>) {
  const queryDatabase = asQueryDatabase(database)
  const rows = await queryDatabase
    .selectFrom(stockTableNames.movementLedger)
    .selectAll()
    .orderBy("occurred_at", "desc")
    .orderBy("updated_at", "desc")
    .execute()

  return rows.map((row) => ({
    id: String(row.movement_id),
    movementType: String(row.reference_type ?? "stock_live_movement"),
    direction: String(row.direction),
    warehouseId: String(row.warehouse_id),
    locationId: null,
    productId: String(row.product_id),
    variantId: row.variant_id == null ? null : String(row.variant_id),
    quantity: Number(row.quantity),
    referenceType: row.reference_type == null ? null : String(row.reference_type),
    referenceId: row.reference_id == null ? null : String(row.reference_id),
    updatedAt: String(row.updated_at),
  }))
}

export async function getAvailableQuantityByProductIds(
  database: Kysely<unknown>,
  productIds: string[]
) {
  if (productIds.length === 0) {
    return new Map<string, number>()
  }

  const rows = await listLiveStockBalances(database, { productIds })
  const quantities = new Map<string, number>()

  for (const row of rows) {
    quantities.set(
      row.product_id,
      roundQuantity((quantities.get(row.product_id) ?? 0) + row.available_quantity)
    )
  }

  return quantities
}

export async function reserveLiveStock(
  database: Kysely<unknown>,
  items: LiveStockReservationInput[],
  timestamp: string
) {
  const reservationItems: LiveStockReservationItem[] = []

  for (const item of items) {
    let remainingQuantity = item.quantity
    const candidateRows = (await listLiveStockBalances(database, { productIds: [item.productId] }))
      .filter((row) => row.available_quantity > 0)
      .sort(
        (left, right) =>
          right.available_quantity - left.available_quantity ||
          left.updated_at.localeCompare(right.updated_at)
      )

    for (const row of candidateRows) {
      if (remainingQuantity <= 0) {
        break
      }

      const allocatedQuantity = Math.min(remainingQuantity, Math.floor(row.available_quantity))

      if (allocatedQuantity <= 0) {
        continue
      }

      const nextReservedQuantity = roundQuantity(row.reserved_quantity + allocatedQuantity)
      const nextAvailableQuantity = roundQuantity(row.balance_quantity - nextReservedQuantity)
      validateComputedBalance(
        {
          balance_quantity: row.balance_quantity,
          reserved_quantity: nextReservedQuantity,
          available_quantity: nextAvailableQuantity,
        },
        {
          balanceKey: row.balance_key,
          productId: row.product_id,
          warehouseId: row.warehouse_id,
          requestedQuantity: item.quantity,
        }
      )

      await upsertBalanceRow(database, {
        ...row,
        reserved_quantity: nextReservedQuantity,
        available_quantity: nextAvailableQuantity,
        updated_at: timestamp,
      })

      reservationItems.push({
        productId: row.product_id,
        stockItemId: row.balance_key,
        warehouseId: row.warehouse_id,
        quantity: allocatedQuantity,
      })
      remainingQuantity -= allocatedQuantity
    }

    if (remainingQuantity > 0) {
      throw new ApplicationError(
        "Requested quantity is not available for checkout.",
        {
          productId: item.productId,
          requestedQuantity: item.quantity,
          availableQuantity: item.quantity - remainingQuantity,
        },
        409
      )
    }
  }

  return reservationItems
}

export async function releaseLiveStockReservation(
  database: Kysely<unknown>,
  items: LiveStockReservationItem[],
  timestamp: string
) {
  for (const item of items) {
    const row = await asQueryDatabase(database)
      .selectFrom(stockTableNames.liveBalances)
      .selectAll()
      .where("balance_key", "=", item.stockItemId)
      .executeTakeFirst() as StockLiveBalanceRow | undefined

    if (!row) {
      continue
    }

    const nextReservedQuantity = roundQuantity(Math.max(0, row.reserved_quantity - item.quantity))
    const nextAvailableQuantity = roundQuantity(row.balance_quantity - nextReservedQuantity)

    validateComputedBalance(
      {
        balance_quantity: row.balance_quantity,
        reserved_quantity: nextReservedQuantity,
        available_quantity: nextAvailableQuantity,
      },
      {
        balanceKey: row.balance_key,
        productId: row.product_id,
        warehouseId: row.warehouse_id,
        releaseQuantity: item.quantity,
      }
    )

    await upsertBalanceRow(database, {
      ...row,
      reserved_quantity: nextReservedQuantity,
      available_quantity: nextAvailableQuantity,
      updated_at: timestamp,
    })
  }
}
