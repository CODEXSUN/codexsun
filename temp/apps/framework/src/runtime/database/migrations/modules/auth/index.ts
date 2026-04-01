import { authFoundationMigration } from './001-auth-foundation'
import { authContactVerificationsMigration } from './012-auth-contact-verifications'
import { defineMigrationModule } from '../../migration'

export const authMigrationModule = defineMigrationModule('auth', 'Auth', [
  authFoundationMigration,
  authContactVerificationsMigration,
])

