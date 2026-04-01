import { billingProductManifest } from '@shared/index'

import { billingAccountsCapability } from './accounts'
import { billingDocumentCapability } from './billing'
import { billingInventoryCapability } from './inventory'

export const billingCoreManifest = {
  product: billingProductManifest,
  domain: {
    accounts: billingAccountsCapability,
    inventory: billingInventoryCapability,
    billing: billingDocumentCapability,
  },
} as const
