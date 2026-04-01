import { companyFoundationMigration } from './003-company-foundation'
import { companyTaglineMigration } from './021-company-tagline'
import { companySocialLinksMigration } from './022-company-social-links'
import { defineMigrationModule } from '../../migration'

export const companyMigrationModule = defineMigrationModule('company', 'Company', [
  companyFoundationMigration,
  companyTaglineMigration,
  companySocialLinksMigration,
])

