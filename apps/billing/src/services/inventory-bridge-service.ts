import type { Kysely } from "kysely"

import type { ServerConfig } from "../../../framework/src/runtime/config/index.js"
import {
  listJsonStorePayloads,
  replaceJsonStoreRecords,
} from "../../../framework/src/runtime/database/process/json-store.js"
import {
  productSchema,
  type Product,
} from "../../../core/shared/index.js"
import { coreTableNames } from "../../../core/database/table-names.js"
import type {
  BillingVoucher,
  BillingStockValuationMethod,
} from "../../shared/index.js"

function roundQuantity(value: number) {
  return Number(value.toFixed(4))
}

function roundCurrency(value: number) {
  return Number(value.toFixed(2))
}

function toTimestamp(date: string) {
  return `${date}T00:00:00.000Z`
}

function isBillingManagedMovement(
  movement: Product["stockMovements"][number]
) {
  return movement.referenceType === "billing_voucher"
}

function getDefaultWarehouseId(product: Product) {
  return (
    product.stockItems.find((item) => item.isActive)?.warehouseId ??
    product.stockMovements.find((item) => item.isActive && item.warehouseId)?.warehouseId ??
    "warehouse:default"
  )
}

type InventoryTransaction = {
  productId: string
  warehouseId: string
  movementDate: string
  movementType: string
  quantity: number
  unitCost: number | null
  landedCostAmount: number
  referenceType: string
  referenceId: string
  narration: string
}

type InventoryWarehouseState = {
  quantity: number
  reservedQuantity: number
  inventoryValue: number
  unitCost: number
}

type InventoryReplayEntry = {
  entryId: string
  productId: string
  productName: string
  warehouseId: string
  movementDate: string
  movementType: string
  quantity: number
  quantityIn: number
  quantityOut: number
  balanceQuantity: number
  reservedQuantity: number
  availableQuantity: number
  unitCost: number
  movementValue: number
  balanceValue: number
  referenceType: string | null
  referenceId: string | null
  sourceApp: "core" | "billing"
  narration: string
}

type InventoryProjection = {
  entries: InventoryReplayEntry[]
  products: Product[]
}

async function readProducts(database: Kysely<unknown>) {
  const items = await listJsonStorePayloads<Product>(database, coreTableNames.products)
  return items.map((item) => productSchema.parse(item))
}

function buildInventoryTransactions(
  voucher: BillingVoucher,
  productMap: Map<string, Product>
): InventoryTransaction[] {
  const multiplier = voucher.reversalOfVoucherId ? -1 : 1
  const transactions: InventoryTransaction[] = []

  if (voucher.type === "sales" && voucher.sales) {
    for (const item of voucher.sales.items) {
      if (!item.productId) {
        continue
      }

      const product = productMap.get(item.productId)
      const warehouseId = item.warehouseId ?? (product ? getDefaultWarehouseId(product) : null)

      if (!product || !warehouseId) {
        continue
      }

      transactions.push({
        productId: product.id,
        warehouseId,
        movementDate: voucher.date,
        movementType: "billing_sales_issue",
        quantity: roundQuantity(item.quantity * -1 * multiplier),
        unitCost: null,
        landedCostAmount: 0,
        referenceType: "billing_voucher",
        referenceId: voucher.id,
        narration: `Sales issue from ${voucher.voucherNumber}.`,
      })
    }

    return transactions
  }

  const stock = voucher.stock

  if (!stock) {
    return transactions
  }

  const baseDirectionByType: Record<BillingVoucher["type"], number> = {
    payment: 0,
    receipt: 0,
    sales: -1,
    sales_return: 1,
    credit_note: 0,
    purchase: 1,
    purchase_return: -1,
    debit_note: 0,
    contra: 0,
    journal: 0,
    stock_adjustment: 1,
    landed_cost: 0,
  }

  const direction = baseDirectionByType[voucher.type] * multiplier

  for (const item of stock.items) {
    const product = productMap.get(item.productId)

    if (!product) {
      continue
    }

    const quantity =
      voucher.type === "stock_adjustment"
        ? roundQuantity(item.quantity * multiplier)
        : roundQuantity(item.quantity * direction)
    const landedCostAmount = roundCurrency(item.landedCostAmount * multiplier)

    transactions.push({
      productId: product.id,
      warehouseId: item.warehouseId,
      movementDate: voucher.date,
      movementType:
        voucher.type === "purchase"
          ? "billing_purchase_receipt"
          : voucher.type === "purchase_return"
            ? "billing_purchase_return"
            : voucher.type === "sales_return"
              ? "billing_sales_return"
              : voucher.type === "stock_adjustment"
                ? "billing_stock_adjustment"
                : "billing_landed_cost",
      quantity,
      unitCost: item.unitCost > 0 ? item.unitCost : null,
      landedCostAmount,
      referenceType: "billing_voucher",
      referenceId: voucher.id,
      narration:
        voucher.type === "landed_cost"
          ? `Landed cost allocation from ${voucher.voucherNumber}.`
          : `${voucher.type.replace(/_/g, " ")} movement from ${voucher.voucherNumber}.`,
    })
  }

  return transactions
}

export function projectBillingInventory(
  products: Product[],
  vouchers: BillingVoucher[],
  valuationMethod: BillingStockValuationMethod
): InventoryProjection {
  const productMap = new Map(products.map((product) => [product.id, product]))
  const transactions = vouchers
    .filter((voucher) => voucher.status === "posted")
    .sort(
      (left, right) =>
        left.date.localeCompare(right.date) ||
        left.voucherNumber.localeCompare(right.voucherNumber)
    )
    .flatMap((voucher) => buildInventoryTransactions(voucher, productMap))

  const transactionsByProduct = new Map<string, InventoryTransaction[]>()

  for (const transaction of transactions) {
    const current = transactionsByProduct.get(transaction.productId) ?? []
    current.push(transaction)
    transactionsByProduct.set(transaction.productId, current)
  }

  const allEntries: InventoryReplayEntry[] = []
  const projectedProducts = products.map((product) => {
    const billingQuantityByWarehouse = new Map<string, number>()

    for (const movement of product.stockMovements.filter(isBillingManagedMovement)) {
      const warehouseId = movement.warehouseId ?? "warehouse:default"
      billingQuantityByWarehouse.set(
        warehouseId,
        roundQuantity(
          (billingQuantityByWarehouse.get(warehouseId) ?? 0) + movement.quantity
        )
      )
    }

    const warehouseState = new Map<string, InventoryWarehouseState>()
    const stockItemByWarehouse = new Map(
      product.stockItems.map((item) => [item.warehouseId, item])
    )
    const managedTransactions = transactionsByProduct.get(product.id) ?? []

    for (const stockItem of product.stockItems.filter((item) => item.isActive)) {
      const baseQuantity = roundQuantity(
        stockItem.quantity - (billingQuantityByWarehouse.get(stockItem.warehouseId) ?? 0)
      )
      const unitCost = roundCurrency(product.costPrice)
      warehouseState.set(stockItem.warehouseId, {
        quantity: baseQuantity,
        reservedQuantity: stockItem.reservedQuantity,
        inventoryValue: roundCurrency(baseQuantity * unitCost),
        unitCost,
      })
    }

    const replayEntries: InventoryReplayEntry[] = []

    for (const [warehouseId, state] of warehouseState.entries()) {
      replayEntries.push({
        entryId: `${product.id}:${warehouseId}:opening`,
        productId: product.id,
        productName: product.name,
        warehouseId,
        movementDate: product.createdAt.slice(0, 10),
        movementType: "opening_balance",
        quantity: state.quantity,
        quantityIn: state.quantity > 0 ? state.quantity : 0,
        quantityOut: 0,
        balanceQuantity: state.quantity,
        reservedQuantity: state.reservedQuantity,
        availableQuantity: roundQuantity(state.quantity - state.reservedQuantity),
        unitCost: state.unitCost,
        movementValue: roundCurrency(state.inventoryValue),
        balanceValue: roundCurrency(state.inventoryValue),
        referenceType: "core_stock_item",
        referenceId: stockItemByWarehouse.get(warehouseId)?.id ?? null,
        sourceApp: "core",
        narration: "Opening stock carried from core product master.",
      })
    }

    managedTransactions.sort(
      (left, right) =>
        left.movementDate.localeCompare(right.movementDate) ||
        left.referenceId.localeCompare(right.referenceId) ||
        left.movementType.localeCompare(right.movementType)
    )

    managedTransactions.forEach((transaction, index) => {
      const current =
        warehouseState.get(transaction.warehouseId) ?? {
          quantity: 0,
          reservedQuantity: 0,
          inventoryValue: 0,
          unitCost: roundCurrency(product.costPrice),
        }

      let nextQuantity = current.quantity
      let nextInventoryValue = current.inventoryValue
      let appliedUnitCost = current.unitCost || roundCurrency(product.costPrice)
      let movementValue = 0

      if (transaction.quantity > 0) {
        appliedUnitCost =
          transaction.unitCost && transaction.unitCost > 0
            ? transaction.unitCost
            : current.unitCost || roundCurrency(product.costPrice)
        movementValue = roundCurrency(
          transaction.quantity * appliedUnitCost + transaction.landedCostAmount
        )
        nextQuantity = roundQuantity(current.quantity + transaction.quantity)
        nextInventoryValue = roundCurrency(current.inventoryValue + movementValue)
      } else if (transaction.quantity < 0) {
        appliedUnitCost =
          transaction.unitCost && transaction.unitCost > 0
            ? transaction.unitCost
            : current.unitCost || roundCurrency(product.costPrice)
        const issueQuantity = Math.abs(transaction.quantity)
        movementValue = roundCurrency(issueQuantity * appliedUnitCost * -1)
        nextQuantity = roundQuantity(current.quantity - issueQuantity)
        nextInventoryValue = roundCurrency(current.inventoryValue + movementValue)
      } else {
        movementValue = roundCurrency(transaction.landedCostAmount)
        nextInventoryValue = roundCurrency(current.inventoryValue + movementValue)
      }

      const nextUnitCost =
        nextQuantity > 0
          ? roundCurrency(nextInventoryValue / nextQuantity)
          : valuationMethod === "fifo"
            ? appliedUnitCost
            : current.unitCost

      const nextState = {
        quantity: nextQuantity,
        reservedQuantity: current.reservedQuantity,
        inventoryValue: nextInventoryValue,
        unitCost: nextUnitCost,
      }

      warehouseState.set(transaction.warehouseId, nextState)
      replayEntries.push({
        entryId: `${transaction.referenceId}:${transaction.warehouseId}:${index + 1}`,
        productId: product.id,
        productName: product.name,
        warehouseId: transaction.warehouseId,
        movementDate: transaction.movementDate,
        movementType: transaction.movementType,
        quantity: transaction.quantity,
        quantityIn: transaction.quantity > 0 ? transaction.quantity : 0,
        quantityOut: transaction.quantity < 0 ? Math.abs(transaction.quantity) : 0,
        balanceQuantity: nextState.quantity,
        reservedQuantity: nextState.reservedQuantity,
        availableQuantity: roundQuantity(
          nextState.quantity - nextState.reservedQuantity
        ),
        unitCost:
          transaction.quantity === 0 && nextState.quantity > 0
            ? nextState.unitCost
            : appliedUnitCost,
        movementValue,
        balanceValue: nextState.inventoryValue,
        referenceType: transaction.referenceType,
        referenceId: transaction.referenceId,
        sourceApp: "billing",
        narration: transaction.narration,
      })
    })

    const existingMovements = product.stockMovements.filter(
      (movement) => !isBillingManagedMovement(movement)
    )
    const nextBillingMovements = replayEntries
      .filter((entry) => entry.sourceApp === "billing")
      .map((entry, index) => ({
        id: `product-stock-movement:billing:${product.id}:${index + 1}`,
        productId: product.id,
        variantId: null,
        warehouseId: entry.warehouseId,
        movementType: entry.movementType,
        quantity: entry.quantity,
        referenceType: "billing_voucher",
        referenceId: entry.referenceId,
        movementAt: toTimestamp(entry.movementDate),
        isActive: true,
        createdAt: toTimestamp(entry.movementDate),
        updatedAt: toTimestamp(entry.movementDate),
      }))

    const nextStockItems = [...warehouseState.entries()]
      .filter(([, state]) => state.quantity !== 0 || state.reservedQuantity !== 0)
      .map(([warehouseId, state], index) => {
        const existing = stockItemByWarehouse.get(warehouseId)
        return {
          id:
            existing?.id ?? `product-stock-item:billing:${product.id}:${index + 1}`,
          productId: product.id,
          variantId: existing?.variantId ?? null,
          warehouseId,
          quantity: roundQuantity(state.quantity),
          reservedQuantity: roundQuantity(state.reservedQuantity),
          isActive: existing?.isActive ?? true,
          createdAt: existing?.createdAt ?? product.createdAt,
          updatedAt: product.updatedAt,
        }
      })

    allEntries.push(...replayEntries)

    return {
      ...product,
      stockItems: nextStockItems,
      stockMovements: [...existingMovements, ...nextBillingMovements],
      totalStockQuantity: roundQuantity(
        nextStockItems.reduce((sum, item) => sum + item.quantity, 0) +
          product.variants.reduce((sum, item) => sum + item.stockQuantity, 0)
      ),
    }
  })

  return {
    entries: allEntries
      .sort(
        (left, right) =>
          left.movementDate.localeCompare(right.movementDate) ||
          left.productName.localeCompare(right.productName) ||
          left.warehouseId.localeCompare(right.warehouseId) ||
          left.entryId.localeCompare(right.entryId)
      ),
    products: projectedProducts,
  }
}

export async function synchronizeBillingInventoryToCore(
  database: Kysely<unknown>,
  vouchers: BillingVoucher[],
  config: ServerConfig
) {
  const products = await readProducts(database)
  const projection = projectBillingInventory(
    products,
    vouchers,
    config.billing.compliance.stock.valuationMethod
  )

  await replaceJsonStoreRecords(
    database,
    coreTableNames.products,
    projection.products.map((product, index) => ({
      id: product.id,
      moduleKey: "products",
      sortOrder: index + 1,
      payload: product,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }))
  )
}
