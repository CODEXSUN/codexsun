import { productFoundationMigration } from './005-product-foundation'
import { productStorefrontMigration } from './008-product-storefront'
import { productCategoryMenuImagesMigration } from './019-product-category-menu-images'
import { productCategoryStorefrontFlagsMigration } from './020-product-category-storefront-flags'
import { defineMigrationModule } from '../../migration'

export const catalogMigrationModule = defineMigrationModule('catalog', 'Catalog', [
  productFoundationMigration,
  productStorefrontMigration,
  productCategoryMenuImagesMigration,
  productCategoryStorefrontFlagsMigration,
])

