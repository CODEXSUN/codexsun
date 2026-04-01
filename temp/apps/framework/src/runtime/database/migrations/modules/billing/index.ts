import { defineMigrationModule } from '../../migration'
import { billingAccountingFoundationMigration } from './032-billing-accounting-foundation'

export const billingMigrationModule = defineMigrationModule('billing', 'Billing', [
  billingAccountingFoundationMigration,
])
