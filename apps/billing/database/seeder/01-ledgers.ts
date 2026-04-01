import { replaceJsonStoreRecords } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseSeeder } from "../../../framework/src/runtime/database/process/types.js"

import { billingLedgers } from "../../src/data/billing-seed.js"

import { billingTableNames } from "../table-names.js"

export const billingLedgersSeeder = defineDatabaseSeeder({
  id: "billing:ledgers:01-ledgers",
  appId: "billing",
  moduleKey: "ledgers",
  name: "Seed billing ledgers",
  order: 10,
  run: async ({ database }) => {
    await replaceJsonStoreRecords(
      database,
      billingTableNames.ledgers,
      billingLedgers.map((ledger, index) => ({
        id: ledger.id,
        moduleKey: "ledgers",
        sortOrder: index + 1,
        payload: ledger,
      }))
    )
  },
})
