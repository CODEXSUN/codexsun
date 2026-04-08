import type { Kysely } from "kysely"

import {
  getFirstJsonStorePayload,
  replaceJsonStoreRecords,
} from "../../../framework/src/runtime/database/process/json-store.js"
import {
  ecommerceSettingsSchema,
  ecommerceSettingsUpdatePayloadSchema,
  type EcommerceSettings,
} from "../../shared/index.js"

import { ecommerceTableNames } from "../../database/table-names.js"
import { defaultEcommerceSettings } from "../data/ecommerce-settings-seed.js"

async function writeEcommerceSettings(database: Kysely<unknown>, settings: EcommerceSettings) {
  await replaceJsonStoreRecords(database, ecommerceTableNames.settings, [
    {
      id: settings.id,
      moduleKey: "ecommerce-settings",
      sortOrder: 1,
      payload: settings,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    },
  ])
}

export async function getEcommerceSettings(database: Kysely<unknown>) {
  const stored = await getFirstJsonStorePayload<EcommerceSettings>(
    database,
    ecommerceTableNames.settings
  )

  return ecommerceSettingsSchema.parse(stored ?? defaultEcommerceSettings)
}

export async function saveEcommerceSettings(database: Kysely<unknown>, payload: unknown) {
  const parsed = ecommerceSettingsUpdatePayloadSchema.parse(payload ?? {})
  const current = await getEcommerceSettings(database)
  const nextSettings = ecommerceSettingsSchema.parse({
    ...current,
    automation: {
      ...current.automation,
      ...parsed.automation,
    },
    updatedAt: new Date().toISOString(),
  })

  await writeEcommerceSettings(database, nextSettings)

  return nextSettings
}
