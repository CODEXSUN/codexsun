import { replaceJsonStoreRecords } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseSeeder } from "../../../framework/src/runtime/database/process/types.js"

import { bootstrapSnapshot } from "../../src/data/cxapp-seed.js"

import { cxappTableNames } from "../table-names.js"

export const coreBootstrapSeeder = defineDatabaseSeeder({
  id: "cxapp:bootstrap:01-bootstrap",
  appId: "cxapp",
  moduleKey: "bootstrap",
  name: "Seed cxapp bootstrap snapshot",
  order: 10,
  run: async ({ database }) => {
    await replaceJsonStoreRecords(database, cxappTableNames.bootstrapSnapshots, [
      {
        id: "bootstrap:default",
        moduleKey: "bootstrap",
        payload: bootstrapSnapshot,
      },
    ])
  },
})
