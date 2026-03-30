import type { Kysely } from "kysely"

import { getFirstJsonStorePayload } from "../../../framework/src/runtime/database/process/json-store.js"
import {
  ecommercePricingSettingsResponseSchema,
  type EcommercePricingSettings,
  type EcommercePricingSettingsResponse,
} from "../../shared/index.js"

import { ecommerceTableNames } from "../../database/table-names.js"

export async function getEcommercePricingSettings(
  database: Kysely<unknown>
): Promise<EcommercePricingSettingsResponse> {
  const settings = await getFirstJsonStorePayload<EcommercePricingSettings>(
    database,
    ecommerceTableNames.pricingSettings
  )

  if (!settings) {
    throw new Error("Ecommerce pricing settings have not been seeded yet.")
  }

  return ecommercePricingSettingsResponseSchema.parse({
    settings,
  })
}
