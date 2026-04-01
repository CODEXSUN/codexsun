import { commonReferenceModulesMigration } from './002-common-reference-modules'
import { commonUnknownDefaultsMigration } from './007-common-unknown-defaults'
import { defineMigrationModule } from '../../migration'

export const commonMigrationModule = defineMigrationModule('common', 'Common References', [
  commonReferenceModulesMigration,
  commonUnknownDefaultsMigration,
])

