import { ecommerceStorefrontFoundationMigration } from "./01-storefront-foundation.js"
import { ecommerceCustomerPortalMigration } from "./02-customer-portal.js"

export const ecommerceDatabaseMigrations = [
  ecommerceStorefrontFoundationMigration,
  ecommerceCustomerPortalMigration,
]
