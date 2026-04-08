import { ecommerceStorefrontFoundationMigration } from "./01-storefront-foundation.js"
import { ecommerceCustomerPortalMigration } from "./02-customer-portal.js"
import { ecommerceCustomerSupportMigration } from "./03-customer-support.js"
import { ecommerceOrderRequestsMigration } from "./04-order-requests.js"
import { ecommerceStorefrontSettingsRevisionsMigration } from "./05-storefront-settings-revisions.js"
import { ecommerceStorefrontSettingsDraftsMigration } from "./06-storefront-settings-drafts.js"
import { ecommerceSettingsMigration } from "./07-ecommerce-settings.js"

export const ecommerceDatabaseMigrations = [
  ecommerceStorefrontFoundationMigration,
  ecommerceCustomerPortalMigration,
  ecommerceCustomerSupportMigration,
  ecommerceOrderRequestsMigration,
  ecommerceStorefrontSettingsRevisionsMigration,
  ecommerceStorefrontSettingsDraftsMigration,
  ecommerceSettingsMigration,
]
