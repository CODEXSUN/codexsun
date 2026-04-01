import { customerProfileMigration } from './015-customer-profile'
import { customerAccountRecoveryMigration } from './017-customer-account-recovery'
import { defineMigrationModule } from '../../migration'

export const customerMigrationModule = defineMigrationModule('customer', 'Customer', [
  customerProfileMigration,
  customerAccountRecoveryMigration,
])

