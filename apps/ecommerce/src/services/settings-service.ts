import {
  ecommercePricingSettingsResponseSchema,
  type EcommercePricingSettingsResponse,
} from "../../shared/index.js"

import { ecommercePricingSettings } from "../data/ecommerce-seed.js"

export function getEcommercePricingSettings(): EcommercePricingSettingsResponse {
  return ecommercePricingSettingsResponseSchema.parse({
    settings: ecommercePricingSettings,
  })
}
