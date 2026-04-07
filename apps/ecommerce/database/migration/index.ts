import { ecommerceStorefrontFoundationMigration } from "./01-storefront-foundation.js"
import { ecommerceCustomerPortalMigration } from "./02-customer-portal.js"
import { ecommerceCustomerSupportMigration } from "./03-customer-support.js"
import { ecommerceOrderRequestsMigration } from "./04-order-requests.js"

export const ecommerceDatabaseMigrations = [
  ecommerceStorefrontFoundationMigration,
  ecommerceCustomerPortalMigration,
  ecommerceCustomerSupportMigration,
  ecommerceOrderRequestsMigration,
]
