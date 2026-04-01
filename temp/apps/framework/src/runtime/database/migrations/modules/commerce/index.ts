import { commerceOperationsMigration } from './016-commerce-operations'
import { defineMigrationModule } from '../../migration'

export const commerceMigrationModule = defineMigrationModule('commerce', 'Commerce', [
  commerceOperationsMigration,
])

