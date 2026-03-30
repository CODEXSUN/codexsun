import { replaceJsonStoreRecords } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseSeeder } from "../../../framework/src/runtime/database/process/types.js"

import { contacts } from "../../src/data/core-seed.js"

import { coreTableNames } from "../table-names.js"

export const coreContactsSeeder = defineDatabaseSeeder({
  id: "core:contacts:03-contacts",
  appId: "core",
  moduleKey: "contacts",
  name: "Seed core contacts",
  order: 30,
  run: async ({ database }) => {
    await replaceJsonStoreRecords(
      database,
      coreTableNames.contacts,
      contacts.map((contact, index) => ({
        id: contact.id,
        moduleKey: "contacts",
        sortOrder: index + 1,
        payload: contact,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
      }))
    )
  },
})
