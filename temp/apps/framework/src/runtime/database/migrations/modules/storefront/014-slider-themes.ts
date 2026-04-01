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

export const sliderThemesMigration: Migration = {
  id: '014-slider-themes',
  name: 'Slider themes',
  async up({ db }) {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${commonTableNames.sliderThemes} (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(64) NOT NULL UNIQUE,
        name VARCHAR(160) NOT NULL UNIQUE,
        sort_order INT NOT NULL DEFAULT 0,
        add_to_cart_label VARCHAR(120) NULL,
        view_details_label VARCHAR(120) NULL,
        background_from VARCHAR(16) NOT NULL,
        background_via VARCHAR(16) NOT NULL,
        background_to VARCHAR(16) NOT NULL,
        text_color VARCHAR(16) NULL,
        muted_text_color VARCHAR(16) NULL,
        badge_background VARCHAR(16) NULL,
        badge_text_color VARCHAR(16) NULL,
        primary_button_background VARCHAR(16) NULL,
        primary_button_text_color VARCHAR(16) NULL,
        secondary_button_background VARCHAR(16) NULL,
        secondary_button_text_color VARCHAR(16) NULL,
        nav_background VARCHAR(16) NULL,
        nav_text_color VARCHAR(16) NULL,
        ${lifecycleColumnsSql()}
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await seedRows(db.execute.bind(db), commonTableNames.sliderThemes, [
      'id',
      'code',
      'name',
      'sort_order',
      'add_to_cart_label',
      'view_details_label',
      'background_from',
      'background_via',
      'background_to',
      'text_color',
      'muted_text_color',
      'badge_background',
      'badge_text_color',
      'primary_button_background',
      'primary_button_text_color',
      'secondary_button_background',
      'secondary_button_text_color',
      'nav_background',
      'nav_text_color',
    ], [
      { id: 'slider-theme:signature-01', code: 'signature-01', name: 'Signature Ember', sort_order: 10, add_to_cart_label: 'Add to cart', view_details_label: 'View details', background_from: '#2b1a14', background_via: '#6b4633', background_to: '#f2ddc8', text_color: '#ffffff', muted_text_color: '#eadfd5', badge_background: '#ffffff33', badge_text_color: '#ffffff', primary_button_background: '#ffffff', primary_button_text_color: '#1a120f', secondary_button_background: '#a78f82', secondary_button_text_color: '#ffffff', nav_background: '#ffffffcc', nav_text_color: '#1a120f' },
      { id: 'slider-theme:signature-02', code: 'signature-02', name: 'Espresso Sand', sort_order: 20, add_to_cart_label: 'Add to cart', view_details_label: 'View details', background_from: '#241913', background_via: '#7a523d', background_to: '#f0dcc8', text_color: '#ffffff', muted_text_color: '#efe3d7', badge_background: '#ffffff30', badge_text_color: '#ffffff', primary_button_background: '#ffffff', primary_button_text_color: '#1b120f', secondary_button_background: '#b59f93', secondary_button_text_color: '#ffffff', nav_background: '#ffffffcc', nav_text_color: '#1b120f' },
      { id: 'slider-theme:signature-03', code: 'signature-03', name: 'Walnut Glow', sort_order: 30, add_to_cart_label: 'Add to cart', view_details_label: 'View details', background_from: '#201611', background_via: '#5f4334', background_to: '#e9d6c3', text_color: '#ffffff', muted_text_color: '#e9ded4', badge_background: '#ffffff30', badge_text_color: '#ffffff', primary_button_background: '#ffffff', primary_button_text_color: '#18100c', secondary_button_background: '#927567', secondary_button_text_color: '#ffffff', nav_background: '#ffffffcc', nav_text_color: '#18100c' },
      { id: 'slider-theme:signature-04', code: 'signature-04', name: 'Mocha Bronze', sort_order: 40, add_to_cart_label: 'Add to cart', view_details_label: 'View details', background_from: '#2f1e18', background_via: '#8a5a40', background_to: '#efcfac', text_color: '#ffffff', muted_text_color: '#f0e4d8', badge_background: '#ffffff36', badge_text_color: '#ffffff', primary_button_background: '#ffffff', primary_button_text_color: '#201612', secondary_button_background: '#c1a18d', secondary_button_text_color: '#201612', nav_background: '#ffffffd9', nav_text_color: '#201612' },
      { id: 'slider-theme:signature-05', code: 'signature-05', name: 'Cocoa Linen', sort_order: 50, add_to_cart_label: 'Add to cart', view_details_label: 'View details', background_from: '#311f19', background_via: '#7a503c', background_to: '#f6e6d3', text_color: '#ffffff', muted_text_color: '#efe5dd', badge_background: '#ffffff33', badge_text_color: '#ffffff', primary_button_background: '#ffffff', primary_button_text_color: '#201613', secondary_button_background: '#f6e6d3', secondary_button_text_color: '#2c1d17', nav_background: '#ffffffd9', nav_text_color: '#201613' },
      { id: 'slider-theme:signature-06', code: 'signature-06', name: 'Sienna Cream', sort_order: 60, add_to_cart_label: 'Add to cart', view_details_label: 'View details', background_from: '#3b241b', background_via: '#965f43', background_to: '#f7dcc0', text_color: '#ffffff', muted_text_color: '#f6e8dc', badge_background: '#ffffff38', badge_text_color: '#ffffff', primary_button_background: '#1d1511', primary_button_text_color: '#ffffff', secondary_button_background: '#ffffff55', secondary_button_text_color: '#ffffff', nav_background: '#ffffffd6', nav_text_color: '#241712' },
      { id: 'slider-theme:signature-07', code: 'signature-07', name: 'Toffee Mist', sort_order: 70, add_to_cart_label: 'Add to cart', view_details_label: 'View details', background_from: '#4b2f22', background_via: '#9e684c', background_to: '#f3e3d4', text_color: null, muted_text_color: null, badge_background: null, badge_text_color: null, primary_button_background: null, primary_button_text_color: null, secondary_button_background: null, secondary_button_text_color: null, nav_background: null, nav_text_color: null },
      { id: 'slider-theme:signature-08', code: 'signature-08', name: 'Roast Almond', sort_order: 80, add_to_cart_label: 'Add to cart', view_details_label: 'View details', background_from: '#352119', background_via: '#8f5a41', background_to: '#eed4ba', text_color: '#ffffff', muted_text_color: '#f5e7dc', badge_background: '#ffffff30', badge_text_color: '#ffffff', primary_button_background: '#ffffff', primary_button_text_color: '#1b120f', secondary_button_background: '#ffffff30', secondary_button_text_color: '#ffffff', nav_background: '#ffffffd4', nav_text_color: '#1b120f' },
      { id: 'slider-theme:signature-09', code: 'signature-09', name: 'Vintage Copper', sort_order: 90, add_to_cart_label: 'Shop now', view_details_label: 'Explore details', background_from: '#281913', background_via: '#794b37', background_to: '#e6c9af', text_color: '#ffffff', muted_text_color: '#efe1d5', badge_background: '#ffffff33', badge_text_color: '#ffffff', primary_button_background: '#ffffff', primary_button_text_color: '#1b120f', secondary_button_background: '#9f7d69', secondary_button_text_color: '#ffffff', nav_background: '#ffffffd9', nav_text_color: '#1b120f' },
      { id: 'slider-theme:signature-10', code: 'signature-10', name: 'Noir Beige', sort_order: 100, add_to_cart_label: 'Add to cart', view_details_label: 'View details', background_from: '#1e1410', background_via: '#604031', background_to: '#ddc1aa', text_color: '#ffffff', muted_text_color: '#eadace', badge_background: '#ffffff2e', badge_text_color: '#ffffff', primary_button_background: '#ffffff', primary_button_text_color: '#18100d', secondary_button_background: '#ffffff28', secondary_button_text_color: '#ffffff', nav_background: '#ffffffd6', nav_text_color: '#18100d' },
    ])
  },
}


