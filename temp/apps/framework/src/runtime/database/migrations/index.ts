import { buildMigrationPlan } from './migration'
import { authMigrationModule } from './modules/auth'
import { commonMigrationModule } from './modules/common'
import { companyMigrationModule } from './modules/company'
import { contactMigrationModule } from './modules/contact'
import { catalogMigrationModule } from './modules/catalog'
import { mediaMigrationModule } from './modules/media'
import { storefrontMigrationModule } from './modules/storefront'
import { mailboxMigrationModule } from './modules/mailbox'
import { customerMigrationModule } from './modules/customer'
import { commerceMigrationModule } from './modules/commerce'
import { billingMigrationModule } from './modules/billing'
import { frappeMigrationModule } from './modules/frappe'
import { notificationMigrationModule } from './modules/notification'
import { taskMigrationModule } from './modules/task'

export const migrationModules = [
  authMigrationModule,
  commonMigrationModule,
  companyMigrationModule,
  contactMigrationModule,
  catalogMigrationModule,
  mediaMigrationModule,
  storefrontMigrationModule,
  mailboxMigrationModule,
  customerMigrationModule,
  commerceMigrationModule,
  billingMigrationModule,
  frappeMigrationModule,
  notificationMigrationModule,
  taskMigrationModule,
] as const

export const migrations = buildMigrationPlan(migrationModules)
