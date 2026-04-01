import { commonTableNames } from '../../../table-names'
import type { Migration } from '../../migration'

export const productCategoryStorefrontFlagsMigration: Migration = {
  id: '020-product-category-storefront-flags',
  name: 'Product category storefront flags and position order',
  async up({ db }) {
    await db.execute(`
      ALTER TABLE ${commonTableNames.productCategories}
      ADD COLUMN IF NOT EXISTS position_order INT NOT NULL DEFAULT 0 AFTER image
    `)

    await db.execute(`
      ALTER TABLE ${commonTableNames.productCategories}
      ADD COLUMN IF NOT EXISTS show_on_storefront_top_menu TINYINT(1) NOT NULL DEFAULT 1 AFTER position_order
    `)

    await db.execute(`
      ALTER TABLE ${commonTableNames.productCategories}
      ADD COLUMN IF NOT EXISTS show_on_storefront_catalog TINYINT(1) NOT NULL DEFAULT 1 AFTER show_on_storefront_top_menu
    `)
  },
}


