import { mediaManagerMigration } from './006-media-manager'
import { defineMigrationModule } from '../../migration'

export const mediaMigrationModule = defineMigrationModule('media', 'Media', [
  mediaManagerMigration,
])

