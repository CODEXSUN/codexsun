import { ecommercePricingSettingsMigration } from "./01-pricing-settings.js"
import { ecommerceProductsMigration } from "./02-products.js"
import { ecommerceStorefrontMigration } from "./03-storefront.js"
import { ecommerceOrdersMigration } from "./04-orders.js"
import { ecommerceCustomersMigration } from "./05-customers.js"

export const ecommerceDatabaseMigrations = [
  ecommercePricingSettingsMigration,
  ecommerceProductsMigration,
  ecommerceStorefrontMigration,
  ecommerceOrdersMigration,
  ecommerceCustomersMigration,
]
