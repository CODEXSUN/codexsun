import { ecommercePricingSettingsSeeder } from "./01-pricing-settings.js"
import { ecommerceProductsSeeder } from "./02-products.js"
import { ecommerceStorefrontSeeder } from "./03-storefront.js"
import { ecommerceOrdersSeeder } from "./04-orders.js"
import { ecommerceCustomersSeeder } from "./05-customers.js"

export const ecommerceDatabaseSeeders = [
  ecommercePricingSettingsSeeder,
  ecommerceProductsSeeder,
  ecommerceStorefrontSeeder,
  ecommerceOrdersSeeder,
  ecommerceCustomersSeeder,
]
