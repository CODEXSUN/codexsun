import type { Kysely } from "kysely"

import {
  billingGoodsInwardSchema,
  billingStockSaleAllocationSchema,
  billingStockUnitSchema,
} from "../../shared/schemas/stock-operations.js"
import { listStorePayloads } from "../../../billing/src/services/store.js"
import { defineDatabaseMigration } from "../../../framework/src/runtime/database/process/types.js"
import { stockOperationsTableNames, stockTableNames } from "../table-names.js"
import { applyLiveStockMovement } from "../../src/services/live-stock-service.js"

type DynamicDatabase = Record<string, Record<string, unknown>>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

export const stockLiveStockMigration = defineDatabaseMigration({
  id: "stock:live:01-live-stock",
  appId: "stock",
  moduleKey: "live-stock",
  name: "Create stock live balance and movement ledger tables",
  order: 10,
  up: async ({ database }) => {
    const queryDatabase = asQueryDatabase(database)

    await queryDatabase.schema
      .createTable(stockTableNames.liveBalances)
      .ifNotExists()
      .addColumn("balance_key", "varchar(191)", (column) => column.primaryKey())
      .addColumn("product_id", "varchar(191)", (column) => column.notNull())
      .addColumn("variant_id", "varchar(191)")
      .addColumn("warehouse_id", "varchar(191)", (column) => column.notNull())
      .addColumn("inward_quantity", "real", (column) => column.notNull().defaultTo(0))
      .addColumn("outward_quantity", "real", (column) => column.notNull().defaultTo(0))
      .addColumn("reserved_quantity", "real", (column) => column.notNull().defaultTo(0))
      .addColumn("balance_quantity", "real", (column) => column.notNull().defaultTo(0))
      .addColumn("available_quantity", "real", (column) => column.notNull().defaultTo(0))
      .addColumn("last_inward_at", "varchar(40)")
      .addColumn("last_outward_at", "varchar(40)")
      .addColumn("last_verified_at", "varchar(40)")
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .execute()

    await queryDatabase.schema
      .createIndex("stock_live_balances_product_variant_warehouse_idx")
      .ifNotExists()
      .on(stockTableNames.liveBalances)
      .columns(["product_id", "variant_id", "warehouse_id"])
      .execute()

    await queryDatabase.schema
      .createIndex("stock_live_balances_product_available_idx")
      .ifNotExists()
      .on(stockTableNames.liveBalances)
      .columns(["product_id", "available_quantity"])
      .execute()

    await queryDatabase.schema
      .createTable(stockTableNames.movementLedger)
      .ifNotExists()
      .addColumn("movement_id", "varchar(191)", (column) => column.primaryKey())
      .addColumn("product_id", "varchar(191)", (column) => column.notNull())
      .addColumn("variant_id", "varchar(191)")
      .addColumn("warehouse_id", "varchar(191)", (column) => column.notNull())
      .addColumn("direction", "varchar(20)", (column) => column.notNull())
      .addColumn("quantity", "real", (column) => column.notNull())
      .addColumn("balance_key", "varchar(191)", (column) => column.notNull())
      .addColumn("reference_type", "varchar(191)")
      .addColumn("reference_id", "varchar(191)")
      .addColumn("verification_state", "varchar(40)", (column) => column.notNull().defaultTo("verified"))
      .addColumn("occurred_at", "varchar(40)", (column) => column.notNull())
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull())
      .execute()

    await queryDatabase.schema
      .createIndex("stock_movement_ledger_product_occurred_idx")
      .ifNotExists()
      .on(stockTableNames.movementLedger)
      .columns(["product_id", "occurred_at"])
      .execute()

    await queryDatabase.schema
      .createIndex("stock_movement_ledger_reference_idx")
      .ifNotExists()
      .on(stockTableNames.movementLedger)
      .columns(["reference_type", "reference_id"])
      .execute()

    const existingMovement = await queryDatabase
      .selectFrom(stockTableNames.movementLedger)
      .select("movement_id")
      .executeTakeFirst()

    if (existingMovement) {
      return
    }

    const [goodsInwards, saleAllocations, stockUnits] = await Promise.all([
      listStorePayloads(database, stockOperationsTableNames.goodsInwardNotes, billingGoodsInwardSchema),
      listStorePayloads(
        database,
        stockOperationsTableNames.stockSaleAllocations,
        billingStockSaleAllocationSchema
      ),
      listStorePayloads(database, stockOperationsTableNames.stockUnits, billingStockUnitSchema),
    ])

    for (const inward of goodsInwards) {
      if (inward.status !== "verified" || inward.stockPostingStatus !== "posted") {
        continue
      }

      for (const line of inward.lines) {
        if (line.acceptedQuantity <= 0) {
          continue
        }

        await applyLiveStockMovement(database, {
          productId: line.productId,
          variantId: line.variantId,
          warehouseId: inward.warehouseId,
          direction: "in",
          quantity: line.acceptedQuantity,
          referenceType: "billing_goods_inward_note",
          referenceId: inward.id,
          occurredAt: `${inward.postingDate}T00:00:00.000Z`,
        })
      }
    }

    const stockUnitMap = new Map(stockUnits.map((item) => [item.id, item]))

    for (const allocation of saleAllocations) {
      if (allocation.status !== "sold" || !allocation.soldAt) {
        continue
      }

      const stockUnit = stockUnitMap.get(allocation.stockUnitId)

      if (!stockUnit) {
        continue
      }

      await applyLiveStockMovement(database, {
        productId: allocation.productId,
        variantId: stockUnit.variantId,
        warehouseId: allocation.warehouseId,
        direction: "out",
        quantity: stockUnit.quantity,
        referenceType: "billing_stock_sale_allocation",
        referenceId: allocation.id,
        occurredAt: allocation.soldAt,
      })
    }
  },
})
