import { contactFoundationMigration } from './004-contact-foundation'
import { defineMigrationModule } from '../../migration'

export const contactMigrationModule = defineMigrationModule('contact', 'Contact', [
  contactFoundationMigration,
])

