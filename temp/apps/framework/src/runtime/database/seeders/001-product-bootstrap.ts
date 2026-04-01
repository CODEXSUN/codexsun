import type { RowDataPacket } from 'mysql2/promise'
import { environment } from '../../config/environment'
import { commonTableNames, productTableNames } from '../table-names'
import type { Seeder } from './seeder'

type SqlValue = string | number | boolean | null
type InsertRow = Record<string, SqlValue>

interface WarehouseRow extends RowDataPacket {
  id: string
}

interface TagRow extends RowDataPacket {
  id: string
}

const productId = 'product:codexsun-polo'
const productUuid = 'codexsun-polo'
const productSlug = 'codexsun-polo'

async function insertRows(
  execute: (sql: string, params?: SqlValue[]) => Promise<unknown>,
  tableName: string,
  rows: InsertRow[],
) {
  if (rows.length === 0) {
    return
  }

  const columns = Object.keys(rows[0])
  const placeholders = `(${columns.map(() => '?').join(', ')})`
  const valuesSql = rows.map(() => placeholders).join(', ')
  const params = rows.flatMap((row) => columns.map((column) => row[column] ?? null))

  await execute(
    `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${valuesSql}`,
    params,
  )
}

async function resolveWarehouseId(
  first: <T extends RowDataPacket = RowDataPacket>(sql: string, params?: SqlValue[]) => Promise<T | null>,
) {
  const warehouse = await first<WarehouseRow>(
    `
      SELECT id
      FROM ${commonTableNames.warehouses}
      WHERE is_active = 1
      ORDER BY
        CASE
          WHEN id = 'warehouse:main' THEN 0
          WHEN id = '1' THEN 1
          ELSE 2
        END,
        created_at ASC
      LIMIT 1
    `,
  )

  return warehouse?.id ?? null
}

export const productBootstrapSeeder: Seeder = {
  id: '001-product-bootstrap',
  name: 'Single product catalog bootstrap',
  isEnabled: () => environment.seed.products.enabled,
  async run({ db }) {
    await db.transaction(async (transaction) => {
      const warehouseId = await resolveWarehouseId(transaction.first.bind(transaction))
      const existing = await transaction.first<RowDataPacket>(
        `SELECT id FROM ${productTableNames.products} WHERE id = ? OR slug = ? OR sku = ? LIMIT 1`,
        [productId, productSlug, 'CDS-POLO-001'],
      )

      if (existing) {
        return
      }

      await transaction.execute(
        `
          INSERT INTO ${productTableNames.products} (
            id, uuid, name, slug, description, short_description, brand_id, category_id, product_group_id, product_type_id, unit_id, hsn_code_id, style_id, sku, has_variants, base_price, cost_price, tax_id, is_featured, is_active
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          productId,
          productUuid,
          'codexsun Polo',
          productSlug,
          'A Seeded apparel product used to bootstrap product, pricing, stock, and catalog flows.',
          'Seeded product with variants, images, stock, SEO, and tags.',
          'brand:codexsun',
          'product-category:menswear',
          'product-group:apparel',
          'product-type:finished-goods',
          'unit:pcs',
          'hsn:610910',
          'style:casual',
          'CDS-POLO-001',
          true,
          899,
          460,
          'tax:gst-12',
          true,
          true,
        ],
      )

      await insertRows(transaction.execute.bind(transaction), productTableNames.images, [
        {
          id: 'product-image:codexsun-polo-front',
          product_id: productId,
          image_url: 'https://placehold.co/1200x1200?text=codexsun+Polo+Front',
          is_primary: true,
          sort_order: 1,
        },
        {
          id: 'product-image:codexsun-polo-detail',
          product_id: productId,
          image_url: 'https://placehold.co/1200x1200?text=codexsun+Polo+Detail',
          is_primary: false,
          sort_order: 2,
        },
      ])

      await insertRows(transaction.execute.bind(transaction), productTableNames.attributes, [
        {
          id: 'product-attribute:codexsun-polo-size',
          product_id: productId,
          name: 'Size',
        },
        {
          id: 'product-attribute:codexsun-polo-colour',
          product_id: productId,
          name: 'Colour',
        },
      ])

      await insertRows(transaction.execute.bind(transaction), productTableNames.attributeValues, [
        {
          id: 'product-attribute-value:codexsun-polo-size-m',
          product_id: productId,
          attribute_id: 'product-attribute:codexsun-polo-size',
          value: 'M',
        },
        {
          id: 'product-attribute-value:codexsun-polo-size-l',
          product_id: productId,
          attribute_id: 'product-attribute:codexsun-polo-size',
          value: 'L',
        },
        {
          id: 'product-attribute-value:codexsun-polo-colour-navy',
          product_id: productId,
          attribute_id: 'product-attribute:codexsun-polo-colour',
          value: 'Navy',
        },
      ])

      await insertRows(transaction.execute.bind(transaction), productTableNames.variantMap, [
        {
          id: 'product-variant-map:codexsun-polo-size-m',
          product_id: productId,
          attribute_id: 'product-attribute:codexsun-polo-size',
          value_id: 'product-attribute-value:codexsun-polo-size-m',
        },
        {
          id: 'product-variant-map:codexsun-polo-size-l',
          product_id: productId,
          attribute_id: 'product-attribute:codexsun-polo-size',
          value_id: 'product-attribute-value:codexsun-polo-size-l',
        },
        {
          id: 'product-variant-map:codexsun-polo-colour-navy',
          product_id: productId,
          attribute_id: 'product-attribute:codexsun-polo-colour',
          value_id: 'product-attribute-value:codexsun-polo-colour-navy',
        },
      ])

      await insertRows(transaction.execute.bind(transaction), productTableNames.variants, [
        {
          id: 'product-variant:codexsun-polo-m',
          product_id: productId,
          sku: 'CDS-POLO-001-M',
          variant_name: 'Navy / M',
          price: 899,
          cost_price: 460,
          stock_quantity: 18,
          opening_stock: 18,
          weight: 0.35,
          barcode: '8901000000011',
          is_active: true,
        },
        {
          id: 'product-variant:codexsun-polo-l',
          product_id: productId,
          sku: 'CDS-POLO-001-L',
          variant_name: 'Navy / L',
          price: 929,
          cost_price: 480,
          stock_quantity: 12,
          opening_stock: 12,
          weight: 0.37,
          barcode: '8901000000012',
          is_active: true,
        },
      ])

      await insertRows(transaction.execute.bind(transaction), productTableNames.variantImages, [
        {
          id: 'product-variant-image:codexsun-polo-m',
          variant_id: 'product-variant:codexsun-polo-m',
          image_url: 'https://placehold.co/1200x1200?text=codexsun+Polo+M',
          is_primary: true,
        },
        {
          id: 'product-variant-image:codexsun-polo-l',
          variant_id: 'product-variant:codexsun-polo-l',
          image_url: 'https://placehold.co/1200x1200?text=codexsun+Polo+L',
          is_primary: true,
        },
      ])

      await insertRows(transaction.execute.bind(transaction), productTableNames.variantAttributes, [
        {
          id: 'product-variant-attribute:codexsun-polo-m-size',
          variant_id: 'product-variant:codexsun-polo-m',
          attribute_name: 'Size',
          attribute_value: 'M',
        },
        {
          id: 'product-variant-attribute:codexsun-polo-m-colour',
          variant_id: 'product-variant:codexsun-polo-m',
          attribute_name: 'Colour',
          attribute_value: 'Navy',
        },
        {
          id: 'product-variant-attribute:codexsun-polo-l-size',
          variant_id: 'product-variant:codexsun-polo-l',
          attribute_name: 'Size',
          attribute_value: 'L',
        },
        {
          id: 'product-variant-attribute:codexsun-polo-l-colour',
          variant_id: 'product-variant:codexsun-polo-l',
          attribute_name: 'Colour',
          attribute_value: 'Navy',
        },
      ])

      await insertRows(transaction.execute.bind(transaction), productTableNames.prices, [
        {
          id: 'product-price:codexsun-polo-base',
          product_id: productId,
          variant_id: null,
          mrp: 999,
          selling_price: 899,
          cost_price: 460,
        },
        {
          id: 'product-price:codexsun-polo-m',
          product_id: productId,
          variant_id: 'product-variant:codexsun-polo-m',
          mrp: 999,
          selling_price: 899,
          cost_price: 460,
        },
        {
          id: 'product-price:codexsun-polo-l',
          product_id: productId,
          variant_id: 'product-variant:codexsun-polo-l',
          mrp: 1029,
          selling_price: 929,
          cost_price: 480,
        },
      ])

      await insertRows(transaction.execute.bind(transaction), productTableNames.discounts, [
        {
          id: 'product-discount:codexsun-polo-launch',
          product_id: productId,
          variant_id: null,
          discount_type: 'PERCENTAGE',
          discount_value: 10,
          start_date: null,
          end_date: null,
        },
      ])

      await insertRows(transaction.execute.bind(transaction), productTableNames.offers, [
        {
          id: 'product-offer:codexsun-polo-bundle',
          product_id: productId,
          title: 'Launch offer',
          description: 'Launch offer for catalog preview and pricing workflows.',
          offer_price: 849,
          start_date: null,
          end_date: null,
        },
      ])

      await insertRows(transaction.execute.bind(transaction), productTableNames.seo, [
        {
          id: 'product-seo:codexsun-polo',
          product_id: productId,
          meta_title: 'codexsun Polo',
          meta_description: 'Seeded polo used to validate catalog, pricing, and stock experiences.',
          meta_keywords: 'codexsun,polo,apparel',
        },
      ])

      const tagDefinitions = [
        { id: 'product-tag:codexsun-seed', name: 'codexsun-seed' },
        { id: 'product-tag:codexsun-polo', name: 'codexsun-polo' },
        { id: 'product-tag:catalog-bootstrap', name: 'catalog-bootstrap' },
      ] as const

      const tagIdByName = new Map<string, string>()

      for (const tag of tagDefinitions) {
        const existingTag = await transaction.first<TagRow>(
          `SELECT id FROM ${productTableNames.tags} WHERE name = ? LIMIT 1`,
          [tag.name],
        )

        if (existingTag) {
          await transaction.execute(
            `UPDATE ${productTableNames.tags} SET is_active = 1 WHERE id = ?`,
            [existingTag.id],
          )
          tagIdByName.set(tag.name, existingTag.id)
          continue
        }

        await transaction.execute(
          `INSERT INTO ${productTableNames.tags} (id, name) VALUES (?, ?)`,
          [tag.id, tag.name],
        )
        tagIdByName.set(tag.name, tag.id)
      }

      await insertRows(transaction.execute.bind(transaction), productTableNames.tagMap, [
        {
          id: 'product-tag-map:codexsun-polo-seed',
          product_id: productId,
          tag_id: tagIdByName.get('codexsun-seed') ?? 'product-tag:codexsun-seed',
        },
        {
          id: 'product-tag-map:codexsun-polo-apparel',
          product_id: productId,
          tag_id: tagIdByName.get('codexsun-polo') ?? 'product-tag:codexsun-polo',
        },
        {
          id: 'product-tag-map:codexsun-polo-featured',
          product_id: productId,
          tag_id: tagIdByName.get('catalog-bootstrap') ?? 'product-tag:catalog-bootstrap',
        },
      ])

      await insertRows(transaction.execute.bind(transaction), productTableNames.reviews, [
        {
          id: 'product-review:codexsun-polo-primary',
          product_id: productId,
          user_id: null,
          rating: 5,
          review: 'Strong seeded sample for validating the product detail layout.',
          review_date: '2026-01-12 10:00:00',
        },
        {
          id: 'product-review:codexsun-polo-secondary',
          product_id: productId,
          user_id: null,
          rating: 4,
          review: 'Useful bootstrap record for testing tags, reviews, and inventory widgets.',
          review_date: '2026-01-14 15:30:00',
        },
      ])

      if (!warehouseId) {
        return
      }

      await insertRows(transaction.execute.bind(transaction), productTableNames.stockItems, [
        {
          id: 'stock-item:codexsun-polo-m',
          product_id: productId,
          variant_id: 'product-variant:codexsun-polo-m',
          warehouse_id: warehouseId,
          quantity: 18,
          reserved_quantity: 2,
        },
        {
          id: 'stock-item:codexsun-polo-l',
          product_id: productId,
          variant_id: 'product-variant:codexsun-polo-l',
          warehouse_id: warehouseId,
          quantity: 12,
          reserved_quantity: 1,
        },
      ])

      await insertRows(transaction.execute.bind(transaction), productTableNames.stockMovements, [
        {
          id: 'stock-movement:codexsun-polo-m-opening',
          product_id: productId,
          variant_id: 'product-variant:codexsun-polo-m',
          warehouse_id: warehouseId,
          movement_type: 'OPENING_STOCK',
          quantity: 18,
          reference_type: 'SEEDER',
          reference_id: '001-product-bootstrap',
          movement_at: '2026-01-01 09:00:00',
        },
        {
          id: 'stock-movement:codexsun-polo-l-opening',
          product_id: productId,
          variant_id: 'product-variant:codexsun-polo-l',
          warehouse_id: warehouseId,
          movement_type: 'OPENING_STOCK',
          quantity: 12,
          reference_type: 'SEEDER',
          reference_id: '001-product-bootstrap',
          movement_at: '2026-01-01 09:00:00',
        },
      ])
    })
  },
}
