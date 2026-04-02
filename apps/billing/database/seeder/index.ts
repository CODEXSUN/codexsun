import { billingCategoriesSeeder } from "./01-categories.js"
import { billingLedgersSeeder } from "./01-ledgers.js"
import { billingVoucherGroupsSeeder } from "./02-voucher-groups.js"
import { billingVoucherTypesSeeder } from "./03-voucher-types.js"
import { billingVouchersSeeder } from "./02-vouchers.js"

export const billingDatabaseSeeders = [
  billingCategoriesSeeder,
  billingLedgersSeeder,
  billingVoucherGroupsSeeder,
  billingVoucherTypesSeeder,
  billingVouchersSeeder,
]
