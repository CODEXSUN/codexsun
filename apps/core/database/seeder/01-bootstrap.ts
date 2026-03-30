import { replaceJsonStoreRecords } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseSeeder } from "../../../framework/src/runtime/database/process/types.js"

import { bootstrapSnapshot } from "../../src/data/core-seed.js"

import { coreTableNames } from "../table-names.js"

export const coreBootstrapSeeder = defineDatabaseSeeder({
  id: "core:bootstrap:01-bootstrap",
  appId: "core",
  moduleKey: "bootstrap",
  name: "Seed core bootstrap snapshot",
  order: 10,
  run: async ({ database }) => {
    await replaceJsonStoreRecords(database, coreTableNames.bootstrapSnapshots, [
      {
        id: "bootstrap:default",
        moduleKey: "bootstrap",
        payload: bootstrapSnapshot,
      },
    ])
  },
})
