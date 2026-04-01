import { commonTableNames } from '../../../table-names'
import type { Migration } from '../../migration'

type SeedRow = Record<string, string | number | boolean | null>

function lifecycleColumnsSql() {
  return `
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  `
}

async function seedRows(
  execute: (sql: string, params?: (string | number | boolean | null)[]) => Promise<unknown>,
  table: string,
  columns: string[],
  rows: SeedRow[],
) {
  const updateColumns = columns.filter((column) => column !== 'id')
  const upsertSql = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES (${columns.map(() => '?').join(', ')})
    ON DUPLICATE KEY UPDATE
      ${updateColumns.map((column) => `${column} = VALUES(${column})`).join(', ')},
      is_active = 1
  `

  for (const row of rows) {
    await execute(
      upsertSql,
      columns.map((column) => {
        const value = row[column]
        return value === undefined ? null : value
      }),
    )
  }
}

export const storefrontTemplatesMigration: Migration = {
  id: '010-storefront-templates',
  name: 'Storefront home design templates',
  async up({ db }) {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${commonTableNames.storefrontTemplates} (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(64) NOT NULL UNIQUE,
        name VARCHAR(160) NOT NULL UNIQUE,
        sort_order INT NOT NULL DEFAULT 0,
        badge_text VARCHAR(160) NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        cta_primary_label VARCHAR(120) NULL,
        cta_primary_href VARCHAR(255) NULL,
        cta_secondary_label VARCHAR(120) NULL,
        cta_secondary_href VARCHAR(255) NULL,
        icon_key VARCHAR(64) NULL,
        theme_key VARCHAR(64) NULL,
        ${lifecycleColumnsSql()}
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await seedRows(db.execute.bind(db), commonTableNames.storefrontTemplates, [
      'id',
      'code',
      'name',
      'sort_order',
      'badge_text',
      'title',
      'description',
      'cta_primary_label',
      'cta_primary_href',
      'cta_secondary_label',
      'cta_secondary_href',
      'icon_key',
      'theme_key',
    ], [
      {
        id: 'storefront-template:home-category',
        code: 'home-category',
        name: 'Home Category Section',
        sort_order: 10,
        badge_text: 'Shop by Category',
        title: 'Category groupings now come from the live product catalog.',
        description: 'The store navigation, category rail, and category cards derive from active backend product and storefront profile records.',
        cta_primary_label: 'Explore the full catalog',
        cta_primary_href: '/search',
        cta_secondary_label: null,
        cta_secondary_href: null,
        icon_key: null,
        theme_key: 'neutral',
      },
      {
        id: 'storefront-template:home-featured',
        code: 'home-featured',
        name: 'Home Featured Section',
        sort_order: 20,
        badge_text: 'Featured Edit',
        title: 'Feature-section products curated in the product publishing profile.',
        description: 'These cards stay fully backend-driven, including category mapping, prices, inventory, and real product imagery.',
        cta_primary_label: null,
        cta_primary_href: null,
        cta_secondary_label: null,
        cta_secondary_href: null,
        icon_key: null,
        theme_key: 'neutral',
      },
      {
        id: 'storefront-template:home-new-arrivals',
        code: 'home-new-arrivals',
        name: 'Home New Arrivals Section',
        sort_order: 30,
        badge_text: 'New Arrivals',
        title: 'New arrivals curated directly from publishing options.',
        description: 'Fresh storefront introductions are driven by active backend publishing rows rather than static page content.',
        cta_primary_label: null,
        cta_primary_href: null,
        cta_secondary_label: null,
        cta_secondary_href: null,
        icon_key: null,
        theme_key: 'sand',
      },
      {
        id: 'storefront-template:home-bestsellers',
        code: 'home-bestsellers',
        name: 'Home Best Sellers Section',
        sort_order: 40,
        badge_text: 'Bestsellers',
        title: 'Best sellers highlighted through backend storefront flags.',
        description: 'This section groups products using the real storefront best-seller flag and live inventory-ready products.',
        cta_primary_label: null,
        cta_primary_href: null,
        cta_secondary_label: null,
        cta_secondary_href: null,
        icon_key: null,
        theme_key: 'mist',
      },
      {
        id: 'storefront-template:home-featured-labels',
        code: 'home-featured-labels',
        name: 'Home Featured Labels Section',
        sort_order: 50,
        badge_text: 'Featured Labels',
        title: 'Brand labels assembled from flagged live products.',
        description: 'This area groups brands from the actual catalog instead of fixed sample content.',
        cta_primary_label: null,
        cta_primary_href: null,
        cta_secondary_label: null,
        cta_secondary_href: null,
        icon_key: null,
        theme_key: 'neutral',
      },
      {
        id: 'storefront-template:home-cta',
        code: 'home-cta',
        name: 'Home CTA Section',
        sort_order: 60,
        badge_text: 'Storefront Ready',
        title: 'Storefront browsing is now running on the backend product catalog.',
        description: 'Home sections, category browsing, product detail, brand highlights, and catalog filters derive from backend storefront data with a safe fallback copy path.',
        cta_primary_label: 'Start browsing',
        cta_primary_href: '/search',
        cta_secondary_label: 'Review cart',
        cta_secondary_href: '/cart',
        icon_key: null,
        theme_key: 'cta',
      },
      {
        id: 'storefront-template:trust-editorial',
        code: 'trust-editorial',
        name: 'Trust Note Editorial',
        sort_order: 70,
        badge_text: null,
        title: 'Editorial curation',
        description: 'Built as a premium storefront with backend-driven product curation, polished hierarchy, and campaign-style entry sections.',
        cta_primary_label: null,
        cta_primary_href: null,
        cta_secondary_label: null,
        cta_secondary_href: null,
        icon_key: 'sparkles',
        theme_key: 'trust',
      },
      {
        id: 'storefront-template:trust-delivery',
        code: 'trust-delivery',
        name: 'Trust Note Delivery',
        sort_order: 80,
        badge_text: null,
        title: 'Design-first flow',
        description: 'Cart and checkout stay styled for the shopper journey while product discovery and merchandising run on live catalog data.',
        cta_primary_label: null,
        cta_primary_href: null,
        cta_secondary_label: null,
        cta_secondary_href: null,
        icon_key: 'truck',
        theme_key: 'trust',
      },
      {
        id: 'storefront-template:trust-shell',
        code: 'trust-shell',
        name: 'Trust Note Shell',
        sort_order: 90,
        badge_text: null,
        title: 'Shell preserved',
        description: 'The menu, category rail, footer, and storefront sections stay aligned while reading dynamic copy and product data from the backend.',
        cta_primary_label: null,
        cta_primary_href: null,
        cta_secondary_label: null,
        cta_secondary_href: null,
        icon_key: 'shield',
        theme_key: 'trust',
      },
    ])
  },
}


