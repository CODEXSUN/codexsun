import { ecommerceStorefrontSettingsSeeder } from "./01-storefront-settings.js"
import { ecommerceSettingsSeeder } from "./02-ecommerce-settings.js"

export const ecommerceDatabaseSeeders = [
  ecommerceStorefrontSettingsSeeder,
  ecommerceSettingsSeeder,
]
