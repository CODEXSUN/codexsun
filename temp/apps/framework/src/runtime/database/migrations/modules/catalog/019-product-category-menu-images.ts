import { commonTableNames } from '../../../table-names'
import type { Migration } from '../../migration'

export const productCategoryMenuImagesMigration: Migration = {
  id: '019-product-category-menu-images',
  name: 'Product category menu images',
  async up({ db }) {
    await db.execute(`
      ALTER TABLE ${commonTableNames.productCategories}
      ADD COLUMN IF NOT EXISTS image VARCHAR(500) NULL AFTER description
    `)
  },
}


