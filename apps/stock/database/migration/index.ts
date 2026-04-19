import type { DatabaseProcessMigration } from "../../../framework/src/runtime/database/process/types.js"
import { stockLiveStockMigration } from "./01-live-stock.js"

export const stockDatabaseMigrations: DatabaseProcessMigration[] = [
  stockLiveStockMigration,
]
