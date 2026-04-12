import { replaceJsonStoreRecords } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseSeeder } from "../../../framework/src/runtime/database/process/types.js"

import { frappeVerificationStateSeed } from "../../src/data/frappe-seed.js"

import { frappeTableNames } from "../table-names.js"

export const frappeSettingsSeeder = defineDatabaseSeeder({
  id: "frappe:settings:01-settings",
  appId: "frappe",
  moduleKey: "settings",
  name: "Seed frappe settings",
  order: 10,
  run: async ({ database }) => {
    await replaceJsonStoreRecords(database, frappeTableNames.settings, [
      {
        id: "frappe-settings:verification",
        moduleKey: "settings",
        sortOrder: 1,
        payload: frappeVerificationStateSeed,
      },
    ])
  },
})
