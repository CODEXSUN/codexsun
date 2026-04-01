import type {
  Product,
  ProductAttribute,
  ProductAttributeInput,
  ProductAttributeValue,
  ProductAttributeValueInput,
  ProductDiscount,
  ProductDiscountInput,
  ProductImage,
  ProductImageInput,
  ProductOffer,
  ProductOfferInput,
  ProductPrice,
  ProductPriceInput,
  ProductReview,
  ProductReviewInput,
  ProductSeo,
  ProductStorefront,
  ProductStockItem,
  ProductStockItemInput,
  ProductStockMovement,
  ProductStockMovementInput,
  ProductSummary,
  ProductTag,
  ProductTagInput,
  ProductUpsertPayload,
  ProductVariant,
  ProductVariantInput,
  ProductVariantMap,
  StorefrontBrand,
  StorefrontCatalogResponse,
  StorefrontCategory,
  StorefrontProduct,
  StorefrontReview,
} from '@shared/index'
import type { RowDataPacket } from 'mysql2'
import { randomUUID } from 'node:crypto'
import { ensureDatabaseSchema } from '@framework-core/runtime/database/database'
import { db } from '@framework-core/runtime/database/orm'
import { commonTableNames, productTableNames } from '@framework-core/runtime/database/table-names'
import { ApplicationError } from '@framework-core/runtime/errors/application-error'

interface ProductSummaryRow extends RowDataPacket {
  id: string
  uuid: string
  name: string
  slug: string
  description: string | null
  short_description: string | null
  brand_id: string | null
  brand_name: string | null
  category_id: string | null
  category_name: string | null
  product_group_id: string | null
  product_group_name: string | null
  product_type_id: string | null
  product_type_name: string | null
  unit_id: string | null
  hsn_code_id: string | null
  style_id: string | null
  sku: string
  has_variants: number
  base_price: number | string
  cost_price: number | string
  tax_id: string | null
  is_featured: number
  is_active: number
  storefront_department: string | null
  home_slider_enabled: number | null
  promo_slider_enabled: number | null
  feature_section_enabled: number | null
  is_new_arrival: number | null
  is_best_seller: number | null
  is_featured_label: number | null
  primary_image_url: string | null
  variant_count: number
  tag_count: number
  tag_names: string | null
  created_at: Date
  updated_at: Date
}

type ProductRow = ProductSummaryRow
interface ProductImageRow extends RowDataPacket { id: string; product_id: string; image_url: string; is_primary: number; sort_order: number; is_active: number; created_at: Date; updated_at: Date }
interface ProductVariantRow extends RowDataPacket { id: string; product_id: string; sku: string; variant_name: string; price: number | string; cost_price: number | string; stock_quantity: number | string; opening_stock: number | string; weight: number | string | null; barcode: string | null; is_active: number; created_at: Date; updated_at: Date }
interface ProductVariantImageRow extends RowDataPacket { id: string; variant_id: string; image_url: string; is_primary: number; is_active: number; created_at: Date; updated_at: Date }
interface ProductVariantAttributeRow extends RowDataPacket { id: string; variant_id: string; attribute_name: string; attribute_value: string; is_active: number; created_at: Date; updated_at: Date }
interface ProductPriceRow extends RowDataPacket { id: string; product_id: string; variant_id: string | null; mrp: number | string; selling_price: number | string; cost_price: number | string; is_active: number; created_at: Date; updated_at: Date }
interface ProductDiscountRow extends RowDataPacket { id: string; product_id: string; variant_id: string | null; discount_type: string; discount_value: number | string; start_date: Date | null; end_date: Date | null; is_active: number; created_at: Date; updated_at: Date }
interface ProductOfferRow extends RowDataPacket { id: string; product_id: string; title: string; description: string | null; offer_price: number | string; start_date: Date | null; end_date: Date | null; is_active: number; created_at: Date; updated_at: Date }
interface ProductAttributeRow extends RowDataPacket { id: string; product_id: string; name: string; is_active: number; created_at: Date; updated_at: Date }
interface ProductAttributeValueRow extends RowDataPacket { id: string; product_id: string; attribute_id: string; value: string; is_active: number; created_at: Date; updated_at: Date }
interface ProductVariantMapRow extends RowDataPacket { id: string; product_id: string; attribute_id: string; value_id: string; is_active: number; created_at: Date; updated_at: Date }
interface ProductStockItemRow extends RowDataPacket { id: string; product_id: string; variant_id: string | null; warehouse_id: string; quantity: number | string; reserved_quantity: number | string; is_active: number; created_at: Date; updated_at: Date }
interface ProductStockMovementRow extends RowDataPacket { id: string; product_id: string; variant_id: string | null; warehouse_id: string | null; movement_type: string; quantity: number | string; reference_type: string | null; reference_id: string | null; movement_at: Date; is_active: number; created_at: Date; updated_at: Date }
interface ProductSeoRow extends RowDataPacket { id: string; product_id: string; meta_title: string | null; meta_description: string | null; meta_keywords: string | null; is_active: number; created_at: Date; updated_at: Date }
interface ProductStorefrontRow extends RowDataPacket { id: string; product_id: string; department: string | null; home_slider_enabled: number; home_slider_order: number; promo_slider_enabled: number; promo_slider_order: number; feature_section_enabled: number; feature_section_order: number; is_new_arrival: number; is_best_seller: number; is_featured_label: number; catalog_badge: string | null; fabric: string | null; fit: string | null; sleeve: string | null; occasion: string | null; shipping_note: string | null; is_active: number; created_at: Date; updated_at: Date }
interface ProductTagRow extends RowDataPacket { id: string; name: string; is_active: number; created_at: Date; updated_at: Date }
interface ProductReviewRow extends RowDataPacket { id: string; product_id: string; user_id: string | null; rating: number; review: string | null; review_date: Date; is_active: number; created_at: Date; updated_at: Date }
interface StorefrontVariantAttributeRow extends RowDataPacket { product_id: string; attribute_name: string; attribute_value: string }
interface StorefrontCatalogRow extends RowDataPacket {
  id: string
  slug: string
  sku: string
  name: string
  description: string | null
  short_description: string | null
  created_at: Date
  updated_at: Date
  brand_id: string | null
  brand_name: string | null
  brand_description: string | null
  category_id: string | null
  category_name: string | null
  category_description: string | null
  category_menu_image: string | null
  category_position_order: number | string | null
  category_show_on_storefront_top_menu: number | null
  category_show_on_storefront_catalog: number | null
  base_price: number | string
  compare_at_price: number | string | null
  rating: number | string | null
  review_count: number
  inventory: number | string | null
  department: string | null
  home_slider_enabled: number | null
  home_slider_order: number | null
  promo_slider_enabled: number | null
  promo_slider_order: number | null
  feature_section_enabled: number | null
  feature_section_order: number | null
  is_new_arrival: number | null
  is_best_seller: number | null
  is_featured_label: number | null
  catalog_badge: string | null
  fabric: string | null
  fit: string | null
  sleeve: string | null
  occasion: string | null
  shipping_note: string | null
  primary_image_url: string | null
}

type SqlExecutor = (sql: string, params?: (string | number | boolean | null)[]) => Promise<unknown>
type SqlFirst = <T extends RowDataPacket = RowDataPacket>(sql: string, params?: (string | number | boolean | null)[]) => Promise<T | null>

const asTimestamp = (value: Date) => value.toISOString()
const asDateOnly = (value: Date | null) => value ? value.toISOString().slice(0, 10) : null
const asDateTimeInput = (value: string | null) => value ? value.replace('T', ' ').slice(0, 19) : new Date().toISOString().slice(0, 19).replace('T', ' ')
const storefrontDepartments = new Set(['women', 'men', 'kids', 'accessories'])

function isPlaceholderValue(value: string | null | undefined) {
  const trimmed = value?.trim() ?? ''
  return trimmed.length === 0 || trimmed === '-'
}

function normalizeCatalogText(value: string | null | undefined, fallback: string) {
  return isPlaceholderValue(value) ? fallback : value!.trim()
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function toCatalogSlug(value: string | null | undefined, fallback: string) {
  const normalized = normalizeCatalogText(value, fallback)
  return slugify(normalized) || slugify(fallback) || 'catalog-item'
}

function toOptionalCatalogText(value: string | null | undefined) {
  return isPlaceholderValue(value) ? null : value!.trim()
}

function toProductSummary(row: ProductSummaryRow): ProductSummary {
  return {
    id: row.id,
    uuid: row.uuid,
    name: row.name,
    slug: row.slug,
    description: row.description,
    shortDescription: row.short_description,
    brandId: row.brand_id,
    brandName: row.brand_name,
    categoryId: row.category_id,
    categoryName: row.category_name,
    productGroupId: row.product_group_id,
    productGroupName: row.product_group_name,
    productTypeId: row.product_type_id,
    productTypeName: row.product_type_name,
    unitId: row.unit_id,
    hsnCodeId: row.hsn_code_id,
    styleId: row.style_id,
    sku: row.sku,
    hasVariants: Boolean(row.has_variants),
    basePrice: Number(row.base_price),
    costPrice: Number(row.cost_price),
    taxId: row.tax_id,
    isFeatured: Boolean(row.is_featured),
    isActive: Boolean(row.is_active),
    storefrontDepartment:
      row.storefront_department && storefrontDepartments.has(row.storefront_department)
        ? row.storefront_department as ProductSummary['storefrontDepartment']
        : null,
    homeSliderEnabled: Boolean(row.home_slider_enabled),
    promoSliderEnabled: Boolean(row.promo_slider_enabled),
    featureSectionEnabled: Boolean(row.feature_section_enabled),
    isNewArrival: Boolean(row.is_new_arrival),
    isBestSeller: Boolean(row.is_best_seller),
    isFeaturedLabel: Boolean(row.is_featured_label),
    primaryImageUrl: row.primary_image_url,
    variantCount: Number(row.variant_count),
    tagCount: Number(row.tag_count),
    tagNames: row.tag_names
      ? row.tag_names.split('||').map((tag) => tag.trim()).filter(Boolean)
      : [],
    createdAt: asTimestamp(row.created_at),
    updatedAt: asTimestamp(row.updated_at),
  }
}

function toProductImage(row: ProductImageRow): ProductImage {
  return {
    id: row.id,
    productId: row.product_id,
    imageUrl: row.image_url,
    isPrimary: Boolean(row.is_primary),
    sortOrder: Number(row.sort_order),
    isActive: Boolean(row.is_active),
    createdAt: asTimestamp(row.created_at),
    updatedAt: asTimestamp(row.updated_at),
  }
}

function toProductPrice(row: ProductPriceRow): ProductPrice {
  return {
    id: row.id,
    productId: row.product_id,
    variantId: row.variant_id,
    mrp: Number(row.mrp),
    sellingPrice: Number(row.selling_price),
    costPrice: Number(row.cost_price),
    isActive: Boolean(row.is_active),
    createdAt: asTimestamp(row.created_at),
    updatedAt: asTimestamp(row.updated_at),
  }
}

function toProductDiscount(row: ProductDiscountRow): ProductDiscount {
  return {
    id: row.id,
    productId: row.product_id,
    variantId: row.variant_id,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    startDate: asDateOnly(row.start_date),
    endDate: asDateOnly(row.end_date),
    isActive: Boolean(row.is_active),
    createdAt: asTimestamp(row.created_at),
    updatedAt: asTimestamp(row.updated_at),
  }
}

function toProductOffer(row: ProductOfferRow): ProductOffer {
  return {
    id: row.id,
    productId: row.product_id,
    title: row.title,
    description: row.description,
    offerPrice: Number(row.offer_price),
    startDate: asDateOnly(row.start_date),
    endDate: asDateOnly(row.end_date),
    isActive: Boolean(row.is_active),
    createdAt: asTimestamp(row.created_at),
    updatedAt: asTimestamp(row.updated_at),
  }
}

function toProductAttribute(row: ProductAttributeRow): ProductAttribute {
  return {
    id: row.id,
    productId: row.product_id,
    name: row.name,
    isActive: Boolean(row.is_active),
    createdAt: asTimestamp(row.created_at),
    updatedAt: asTimestamp(row.updated_at),
  }
}

function toProductAttributeValue(row: ProductAttributeValueRow): ProductAttributeValue {
  return {
    id: row.id,
    productId: row.product_id,
    attributeId: row.attribute_id,
    value: row.value,
    isActive: Boolean(row.is_active),
    createdAt: asTimestamp(row.created_at),
    updatedAt: asTimestamp(row.updated_at),
  }
}

function toProductVariantMap(row: ProductVariantMapRow): ProductVariantMap {
  return {
    id: row.id,
    productId: row.product_id,
    attributeId: row.attribute_id,
    valueId: row.value_id,
    isActive: Boolean(row.is_active),
    createdAt: asTimestamp(row.created_at),
    updatedAt: asTimestamp(row.updated_at),
  }
}

function toProductStockItem(row: ProductStockItemRow): ProductStockItem {
  return {
    id: row.id,
    productId: row.product_id,
    variantId: row.variant_id,
    warehouseId: row.warehouse_id,
    quantity: Number(row.quantity),
    reservedQuantity: Number(row.reserved_quantity),
    isActive: Boolean(row.is_active),
    createdAt: asTimestamp(row.created_at),
    updatedAt: asTimestamp(row.updated_at),
  }
}

function toProductStockMovement(row: ProductStockMovementRow): ProductStockMovement {
  return {
    id: row.id,
    productId: row.product_id,
    variantId: row.variant_id,
    warehouseId: row.warehouse_id,
    movementType: row.movement_type,
    quantity: Number(row.quantity),
    referenceType: row.reference_type,
    referenceId: row.reference_id,
    movementAt: asTimestamp(row.movement_at),
    isActive: Boolean(row.is_active),
    createdAt: asTimestamp(row.created_at),
    updatedAt: asTimestamp(row.updated_at),
  }
}

function toProductSeo(row: ProductSeoRow): ProductSeo {
  return {
    id: row.id,
    productId: row.product_id,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    metaKeywords: row.meta_keywords,
    isActive: Boolean(row.is_active),
    createdAt: asTimestamp(row.created_at),
    updatedAt: asTimestamp(row.updated_at),
  }
}

function toProductStorefront(row: ProductStorefrontRow): ProductStorefront {
  return {
    id: row.id,
    productId: row.product_id,
    department: row.department && storefrontDepartments.has(row.department) ? row.department as ProductStorefront['department'] : null,
    homeSliderEnabled: Boolean(row.home_slider_enabled),
    homeSliderOrder: Number(row.home_slider_order),
    promoSliderEnabled: Boolean(row.promo_slider_enabled),
    promoSliderOrder: Number(row.promo_slider_order),
    featureSectionEnabled: Boolean(row.feature_section_enabled),
    featureSectionOrder: Number(row.feature_section_order),
    isNewArrival: Boolean(row.is_new_arrival),
    isBestSeller: Boolean(row.is_best_seller),
    isFeaturedLabel: Boolean(row.is_featured_label),
    catalogBadge: row.catalog_badge,
    fabric: row.fabric,
    fit: row.fit,
    sleeve: row.sleeve,
    occasion: row.occasion,
    shippingNote: row.shipping_note,
    isActive: Boolean(row.is_active),
    createdAt: asTimestamp(row.created_at),
    updatedAt: asTimestamp(row.updated_at),
  }
}

function toStorefrontReview(row: ProductReviewRow): StorefrontReview {
  const reviewText = row.review?.trim() ?? ''
  const title = reviewText ? reviewText.split(/[.!?]/)[0]?.trim().slice(0, 72) ?? null : null

  return {
    id: row.id,
    productId: row.product_id,
    username: row.user_id?.trim() || 'Guest Shopper',
    rating: Number(row.rating),
    title: title || null,
    review: reviewText || null,
    createdAt: asTimestamp(row.review_date),
    verifiedPurchase: false,
  }
}

function toProductTag(row: ProductTagRow): ProductTag {
  return {
    id: row.id,
    name: row.name,
    isActive: Boolean(row.is_active),
    createdAt: asTimestamp(row.created_at),
    updatedAt: asTimestamp(row.updated_at),
  }
}

function toProductReview(row: ProductReviewRow): ProductReview {
  return {
    id: row.id,
    productId: row.product_id,
    userId: row.user_id,
    rating: Number(row.rating),
    review: row.review,
    reviewDate: asTimestamp(row.review_date),
    isActive: Boolean(row.is_active),
    createdAt: asTimestamp(row.created_at),
    updatedAt: asTimestamp(row.updated_at),
  }
}

export class ProductRepository {
  async list() {
    await ensureDatabaseSchema()

    const rows = await db.query<ProductSummaryRow>(`
      SELECT
        p.*,
        brand.name AS brand_name,
        category.name AS category_name,
        product_group.name AS product_group_name,
        product_type.name AS product_type_name,
        sf.department AS storefront_department,
        sf.home_slider_enabled,
        sf.promo_slider_enabled,
        sf.feature_section_enabled,
        sf.is_new_arrival,
        sf.is_best_seller,
        sf.is_featured_label,
        (
          SELECT pi.image_url
          FROM ${productTableNames.images} pi
          WHERE pi.product_id = p.id AND pi.is_active = 1
          ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.created_at ASC
          LIMIT 1
        ) AS primary_image_url,
        (
          SELECT COUNT(*)
          FROM ${productTableNames.variants} pv
          WHERE pv.product_id = p.id AND pv.is_active = 1
        ) AS variant_count,
        (
          SELECT COUNT(*)
          FROM ${productTableNames.tagMap} ptm
          WHERE ptm.product_id = p.id AND ptm.is_active = 1
        ) AS tag_count,
        (
          SELECT GROUP_CONCAT(DISTINCT pt.name ORDER BY pt.name SEPARATOR '||')
          FROM ${productTableNames.tagMap} ptm
          INNER JOIN ${productTableNames.tags} pt ON pt.id = ptm.tag_id
          WHERE ptm.product_id = p.id
            AND ptm.is_active = 1
            AND pt.is_active = 1
        ) AS tag_names
      FROM ${productTableNames.products} p
      LEFT JOIN ${productTableNames.storefront} sf ON sf.product_id = p.id AND sf.is_active = 1
      LEFT JOIN ${commonTableNames.brands} brand ON brand.id = p.brand_id
      LEFT JOIN ${commonTableNames.productCategories} category ON category.id = p.category_id
      LEFT JOIN ${commonTableNames.productGroups} product_group ON product_group.id = p.product_group_id
      LEFT JOIN ${commonTableNames.productTypes} product_type ON product_type.id = p.product_type_id
      ORDER BY p.created_at DESC
    `)

    return rows.map(toProductSummary)
  }

  async findById(id: string) {
    await ensureDatabaseSchema()

    const row = await db.first<ProductRow>(`
      SELECT
        p.*,
        brand.name AS brand_name,
        category.name AS category_name,
        product_group.name AS product_group_name,
        product_type.name AS product_type_name,
        sf.department AS storefront_department,
        sf.home_slider_enabled,
        sf.promo_slider_enabled,
        sf.feature_section_enabled,
        sf.is_new_arrival,
        sf.is_best_seller,
        sf.is_featured_label,
        (
          SELECT pi.image_url
          FROM ${productTableNames.images} pi
          WHERE pi.product_id = p.id AND pi.is_active = 1
          ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.created_at ASC
          LIMIT 1
        ) AS primary_image_url,
        (
          SELECT COUNT(*)
          FROM ${productTableNames.variants} pv
          WHERE pv.product_id = p.id AND pv.is_active = 1
        ) AS variant_count,
        (
          SELECT COUNT(*)
          FROM ${productTableNames.tagMap} ptm
          WHERE ptm.product_id = p.id AND ptm.is_active = 1
        ) AS tag_count,
        (
          SELECT GROUP_CONCAT(DISTINCT pt.name ORDER BY pt.name SEPARATOR '||')
          FROM ${productTableNames.tagMap} ptm
          INNER JOIN ${productTableNames.tags} pt ON pt.id = ptm.tag_id
          WHERE ptm.product_id = p.id
            AND ptm.is_active = 1
            AND pt.is_active = 1
        ) AS tag_names
      FROM ${productTableNames.products} p
      LEFT JOIN ${productTableNames.storefront} sf ON sf.product_id = p.id AND sf.is_active = 1
      LEFT JOIN ${commonTableNames.brands} brand ON brand.id = p.brand_id
      LEFT JOIN ${commonTableNames.productCategories} category ON category.id = p.category_id
      LEFT JOIN ${commonTableNames.productGroups} product_group ON product_group.id = p.product_group_id
      LEFT JOIN ${commonTableNames.productTypes} product_type ON product_type.id = p.product_type_id
      WHERE p.id = ?
      LIMIT 1
    `, [id])

    if (!row) {
      return null
    }

    const [
      images,
      variants,
      variantImages,
      variantAttributes,
      prices,
      discounts,
      offers,
      attributes,
      attributeValues,
      variantMap,
      stockItems,
      stockMovements,
      seo,
      storefront,
      tags,
      reviews,
    ] = await Promise.all([
      db.query<ProductImageRow>(`SELECT * FROM ${productTableNames.images} WHERE product_id = ? AND is_active = 1 ORDER BY is_primary DESC, sort_order ASC, created_at ASC`, [id]),
      db.query<ProductVariantRow>(`SELECT * FROM ${productTableNames.variants} WHERE product_id = ? AND is_active = 1 ORDER BY created_at ASC`, [id]),
      db.query<ProductVariantImageRow>(`
        SELECT pvi.*
        FROM ${productTableNames.variantImages} pvi
        INNER JOIN ${productTableNames.variants} pv ON pv.id = pvi.variant_id
        WHERE pv.product_id = ? AND pvi.is_active = 1 AND pv.is_active = 1
        ORDER BY pvi.is_primary DESC, pvi.created_at ASC
      `, [id]),
      db.query<ProductVariantAttributeRow>(`
        SELECT pva.*
        FROM ${productTableNames.variantAttributes} pva
        INNER JOIN ${productTableNames.variants} pv ON pv.id = pva.variant_id
        WHERE pv.product_id = ? AND pva.is_active = 1 AND pv.is_active = 1
        ORDER BY pva.created_at ASC
      `, [id]),
      db.query<ProductPriceRow>(`SELECT * FROM ${productTableNames.prices} WHERE product_id = ? AND is_active = 1 ORDER BY created_at ASC`, [id]),
      db.query<ProductDiscountRow>(`SELECT * FROM ${productTableNames.discounts} WHERE product_id = ? AND is_active = 1 ORDER BY created_at ASC`, [id]),
      db.query<ProductOfferRow>(`SELECT * FROM ${productTableNames.offers} WHERE product_id = ? AND is_active = 1 ORDER BY created_at ASC`, [id]),
      db.query<ProductAttributeRow>(`SELECT * FROM ${productTableNames.attributes} WHERE product_id = ? AND is_active = 1 ORDER BY created_at ASC`, [id]),
      db.query<ProductAttributeValueRow>(`SELECT * FROM ${productTableNames.attributeValues} WHERE product_id = ? AND is_active = 1 ORDER BY created_at ASC`, [id]),
      db.query<ProductVariantMapRow>(`SELECT * FROM ${productTableNames.variantMap} WHERE product_id = ? AND is_active = 1 ORDER BY created_at ASC`, [id]),
      db.query<ProductStockItemRow>(`SELECT * FROM ${productTableNames.stockItems} WHERE product_id = ? AND is_active = 1 ORDER BY created_at ASC`, [id]),
      db.query<ProductStockMovementRow>(`SELECT * FROM ${productTableNames.stockMovements} WHERE product_id = ? AND is_active = 1 ORDER BY movement_at DESC, created_at DESC`, [id]),
      db.first<ProductSeoRow>(`SELECT * FROM ${productTableNames.seo} WHERE product_id = ? AND is_active = 1 LIMIT 1`, [id]),
      db.first<ProductStorefrontRow>(`SELECT * FROM ${productTableNames.storefront} WHERE product_id = ? AND is_active = 1 LIMIT 1`, [id]),
      db.query<ProductTagRow>(`
        SELECT pt.*
        FROM ${productTableNames.tags} pt
        INNER JOIN ${productTableNames.tagMap} ptm ON ptm.tag_id = pt.id
        WHERE ptm.product_id = ? AND ptm.is_active = 1 AND pt.is_active = 1
        ORDER BY pt.name ASC
      `, [id]),
      db.query<ProductReviewRow>(`SELECT * FROM ${productTableNames.reviews} WHERE product_id = ? AND is_active = 1 ORDER BY review_date DESC, created_at DESC`, [id]),
    ])

    const variantImagesByVariantId = new Map<string, ProductVariantImageRow[]>()
    const variantAttributesByVariantId = new Map<string, ProductVariantAttributeRow[]>()

    for (const image of variantImages) {
      const collection = variantImagesByVariantId.get(image.variant_id) ?? []
      collection.push(image)
      variantImagesByVariantId.set(image.variant_id, collection)
    }

    for (const attribute of variantAttributes) {
      const collection = variantAttributesByVariantId.get(attribute.variant_id) ?? []
      collection.push(attribute)
      variantAttributesByVariantId.set(attribute.variant_id, collection)
    }

    const mappedVariants: ProductVariant[] = variants.map((variant) => ({
      id: variant.id,
      productId: variant.product_id,
      sku: variant.sku,
      variantName: variant.variant_name,
      price: Number(variant.price),
      costPrice: Number(variant.cost_price),
      stockQuantity: Number(variant.stock_quantity),
      openingStock: Number(variant.opening_stock),
      weight: variant.weight == null ? null : Number(variant.weight),
      barcode: variant.barcode,
      isActive: Boolean(variant.is_active),
      createdAt: asTimestamp(variant.created_at),
      updatedAt: asTimestamp(variant.updated_at),
      images: (variantImagesByVariantId.get(variant.id) ?? []).map((image) => ({
        id: image.id,
        variantId: image.variant_id,
        imageUrl: image.image_url,
        isPrimary: Boolean(image.is_primary),
        isActive: Boolean(image.is_active),
        createdAt: asTimestamp(image.created_at),
        updatedAt: asTimestamp(image.updated_at),
      })),
      attributes: (variantAttributesByVariantId.get(variant.id) ?? []).map((attribute) => ({
        id: attribute.id,
        variantId: attribute.variant_id,
        attributeName: attribute.attribute_name,
        attributeValue: attribute.attribute_value,
        isActive: Boolean(attribute.is_active),
        createdAt: asTimestamp(attribute.created_at),
        updatedAt: asTimestamp(attribute.updated_at),
      })),
    }))

    return {
      ...toProductSummary(row),
      images: images.map(toProductImage),
      variants: mappedVariants,
      prices: prices.map(toProductPrice),
      discounts: discounts.map(toProductDiscount),
      offers: offers.map(toProductOffer),
      attributes: attributes.map(toProductAttribute),
      attributeValues: attributeValues.map(toProductAttributeValue),
      variantMap: variantMap.map(toProductVariantMap),
      stockItems: stockItems.map(toProductStockItem),
      stockMovements: stockMovements.map(toProductStockMovement),
      seo: seo ? toProductSeo(seo) : null,
      storefront: storefront ? toProductStorefront(storefront) : null,
      tags: tags.map(toProductTag),
      reviews: reviews.map(toProductReview),
    } satisfies Product
  }

  async create(payload: ProductUpsertPayload) {
    await ensureDatabaseSchema()
    const id = randomUUID()
    const uuid = randomUUID()

    await db.transaction(async (transaction) => {
      await transaction.execute(
        `
          INSERT INTO ${productTableNames.products} (
            id, uuid, name, slug, description, short_description, brand_id, category_id, product_group_id, product_type_id, unit_id, hsn_code_id, style_id, sku, has_variants, base_price, cost_price, tax_id, is_featured, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          id,
          uuid,
          payload.name,
          payload.slug,
          payload.description,
          payload.shortDescription,
          payload.brandId,
          payload.categoryId,
          payload.productGroupId,
          payload.productTypeId,
          payload.unitId,
          payload.hsnCodeId,
          payload.styleId,
          payload.sku,
          payload.hasVariants,
          payload.basePrice,
          payload.costPrice,
          payload.taxId,
          payload.isFeatured,
          payload.isActive,
        ],
      )

      await this.replaceChildren(transaction.execute.bind(transaction), transaction.first.bind(transaction), id, payload)
    })

    const item = await this.findById(id)
    if (!item) {
      throw new ApplicationError('Expected created product to be retrievable.', { id }, 500)
    }

    return item
  }

  async update(id: string, payload: ProductUpsertPayload) {
    await ensureDatabaseSchema()

    await db.transaction(async (transaction) => {
      const existing = await transaction.first<RowDataPacket>(`SELECT id FROM ${productTableNames.products} WHERE id = ? LIMIT 1`, [id])
      if (!existing) {
        throw new ApplicationError('Product not found.', { id }, 404)
      }

      await transaction.execute(
        `
          UPDATE ${productTableNames.products}
          SET
            name = ?,
            slug = ?,
            description = ?,
            short_description = ?,
            brand_id = ?,
            category_id = ?,
            product_group_id = ?,
            product_type_id = ?,
            unit_id = ?,
            hsn_code_id = ?,
            style_id = ?,
            sku = ?,
            has_variants = ?,
            base_price = ?,
            cost_price = ?,
            tax_id = ?,
            is_featured = ?,
            is_active = ?
          WHERE id = ?
        `,
        [
          payload.name,
          payload.slug,
          payload.description,
          payload.shortDescription,
          payload.brandId,
          payload.categoryId,
          payload.productGroupId,
          payload.productTypeId,
          payload.unitId,
          payload.hsnCodeId,
          payload.styleId,
          payload.sku,
          payload.hasVariants,
          payload.basePrice,
          payload.costPrice,
          payload.taxId,
          payload.isFeatured,
          payload.isActive,
          id,
        ],
      )

      await this.replaceChildren(transaction.execute.bind(transaction), transaction.first.bind(transaction), id, payload)
    })

    const item = await this.findById(id)
    if (!item) {
      throw new ApplicationError('Expected updated product to be retrievable.', { id }, 500)
    }

    return item
  }

  async setActiveState(id: string, isActive: boolean) {
    await ensureDatabaseSchema()

    const result = await db.execute(`UPDATE ${productTableNames.products} SET is_active = ? WHERE id = ?`, [isActive, id])
    if (result.affectedRows === 0) {
      throw new ApplicationError('Product not found.', { id }, 404)
    }

    const item = await this.findById(id)
    if (!item) {
      throw new ApplicationError('Expected product to be retrievable after state update.', { id }, 500)
    }

    return item
  }

  async listStorefrontCatalog() {
    await ensureDatabaseSchema()

    const rows = await db.query<StorefrontCatalogRow>(`
      SELECT
        p.id,
        p.slug,
        p.sku,
        p.name,
        p.description,
        p.short_description,
        p.base_price,
        p.created_at,
        p.updated_at,
        p.brand_id,
        brand.name AS brand_name,
        brand.description AS brand_description,
        p.category_id,
        category.name AS category_name,
        category.description AS category_description,
        category.image AS category_menu_image,
        category.position_order AS category_position_order,
        category.show_on_storefront_top_menu AS category_show_on_storefront_top_menu,
        category.show_on_storefront_catalog AS category_show_on_storefront_catalog,
        sf.department,
        sf.home_slider_enabled,
        sf.home_slider_order,
        sf.promo_slider_enabled,
        sf.promo_slider_order,
        sf.feature_section_enabled,
        sf.feature_section_order,
        sf.is_new_arrival,
        sf.is_best_seller,
        sf.is_featured_label,
        sf.catalog_badge,
        sf.fabric,
        sf.fit,
        sf.sleeve,
        sf.occasion,
        sf.shipping_note,
        (
          SELECT MAX(pp.mrp)
          FROM ${productTableNames.prices} pp
          WHERE pp.product_id = p.id AND pp.is_active = 1
        ) AS compare_at_price,
        (
          SELECT AVG(pr.rating)
          FROM ${productTableNames.reviews} pr
          WHERE pr.product_id = p.id AND pr.is_active = 1
        ) AS rating,
        (
          SELECT COUNT(*)
          FROM ${productTableNames.reviews} pr
          WHERE pr.product_id = p.id AND pr.is_active = 1
        ) AS review_count,
        COALESCE(
          (
            SELECT SUM(si.quantity - si.reserved_quantity)
            FROM ${productTableNames.stockItems} si
            WHERE si.product_id = p.id AND si.is_active = 1
          ),
          (
            SELECT SUM(pv.stock_quantity)
            FROM ${productTableNames.variants} pv
            WHERE pv.product_id = p.id AND pv.is_active = 1
          ),
          0
        ) AS inventory,
        (
          SELECT pi.image_url
          FROM ${productTableNames.images} pi
          WHERE pi.product_id = p.id AND pi.is_active = 1
          ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.created_at ASC
          LIMIT 1
        ) AS primary_image_url
      FROM ${productTableNames.products} p
      INNER JOIN ${productTableNames.storefront} sf ON sf.product_id = p.id AND sf.is_active = 1
      LEFT JOIN ${commonTableNames.brands} brand ON brand.id = p.brand_id
      LEFT JOIN ${commonTableNames.productCategories} category ON category.id = p.category_id
      WHERE p.is_active = 1 AND p.id <> 'product:default'
      ORDER BY
        sf.home_slider_enabled DESC,
        sf.home_slider_order ASC,
        sf.feature_section_enabled DESC,
        sf.feature_section_order ASC,
        p.created_at DESC
    `)

    const productIds = rows.map((row) => row.id)
    if (productIds.length === 0) {
      return {
        brands: [],
        categories: [],
        products: [],
        reviews: [],
      } satisfies StorefrontCatalogResponse
    }

    const placeholders = productIds.map(() => '?').join(', ')
    const [images, variantAttributes, reviews] = await Promise.all([
      db.query<ProductImageRow>(
        `SELECT * FROM ${productTableNames.images} WHERE product_id IN (${placeholders}) AND is_active = 1 ORDER BY is_primary DESC, sort_order ASC, created_at ASC`,
        productIds,
      ),
      db.query<StorefrontVariantAttributeRow>(
        `SELECT pv.product_id, pva.attribute_name, pva.attribute_value
         FROM ${productTableNames.variantAttributes} pva
         INNER JOIN ${productTableNames.variants} pv ON pv.id = pva.variant_id
         WHERE pv.product_id IN (${placeholders}) AND pv.is_active = 1 AND pva.is_active = 1
         ORDER BY pv.created_at ASC, pva.created_at ASC`,
        productIds,
      ),
      db.query<ProductReviewRow>(
        `SELECT * FROM ${productTableNames.reviews}
         WHERE product_id IN (${placeholders}) AND is_active = 1
         ORDER BY review_date DESC, created_at DESC`,
        productIds,
      ),
    ])

    const imagesByProductId = new Map<string, string[]>()
    for (const image of images) {
      const collection = imagesByProductId.get(image.product_id) ?? []
      collection.push(image.image_url)
      imagesByProductId.set(image.product_id, collection)
    }

    const sizesByProductId = new Map<string, Set<string>>()
    const colorsByProductId = new Map<string, Map<string, string | null>>()
    for (const attribute of variantAttributes) {
      const attributeName = attribute.attribute_name.trim().toLowerCase()
      const attributeValue = attribute.attribute_value.trim()
      if (!attributeValue) {
        continue
      }

      if (attributeName.includes('size')) {
        const collection = sizesByProductId.get(attribute.product_id) ?? new Set<string>()
        collection.add(attributeValue)
        sizesByProductId.set(attribute.product_id, collection)
      }

      if (attributeName.includes('color') || attributeName.includes('colour')) {
        const collection = colorsByProductId.get(attribute.product_id) ?? new Map<string, string | null>()
        collection.set(attributeValue, null)
        colorsByProductId.set(attribute.product_id, collection)
      }
    }

    const products: StorefrontProduct[] = rows.map((row) => {
      const imagesForProduct = imagesByProductId.get(row.id) ?? []
      const productImages = imagesForProduct.length > 0
        ? imagesForProduct
        : row.primary_image_url
          ? [row.primary_image_url]
          : []
      const sizeValues = [...(sizesByProductId.get(row.id) ?? new Set<string>())]
      const colorValues = [...(colorsByProductId.get(row.id) ?? new Map<string, string | null>()).entries()]
      const productName = normalizeCatalogText(row.name, `Product ${row.id.slice(-6)}`)
      const productSlug = toCatalogSlug(row.slug, `${productName}-${row.id.slice(-6)}`)
      const brandName = normalizeCatalogText(row.brand_name, 'Unbranded')
      const brandSlug = toCatalogSlug(row.brand_name, `brand-${row.brand_id ?? row.id}`)
      const categoryName = normalizeCatalogText(row.category_name, 'Catalog')
      const categorySlug = toCatalogSlug(row.category_name, productSlug)

      return {
        id: row.id,
        slug: productSlug,
        sku: normalizeCatalogText(row.sku, `SKU-${row.id.slice(-6)}`),
        name: productName,
        brand: brandName,
        brandSlug,
        categorySlug,
        categoryName,
        department: row.department && storefrontDepartments.has(row.department) ? row.department as StorefrontProduct['department'] : 'women',
        price: Number(row.base_price),
        compareAtPrice: row.compare_at_price == null ? null : Number(row.compare_at_price),
        rating: row.rating == null ? 0 : Number(row.rating),
        reviewCount: Number(row.review_count),
        inventory: row.inventory == null ? 0 : Number(row.inventory),
        homeSlider: Boolean(row.home_slider_enabled),
        homeSliderOrder: Number(row.home_slider_order ?? 0),
        promoSlider: Boolean(row.promo_slider_enabled),
        promoSliderOrder: Number(row.promo_slider_order ?? 0),
        featureSection: Boolean(row.feature_section_enabled),
        featureSectionOrder: Number(row.feature_section_order ?? 0),
        featured: Boolean(row.feature_section_enabled),
        newArrival: Boolean(row.is_new_arrival),
        bestseller: Boolean(row.is_best_seller),
        featuredLabel: Boolean(row.is_featured_label),
        catalogBadge: toOptionalCatalogText(row.catalog_badge),
        images: productImages,
        colors: colorValues.map(([name, swatch]) => ({ name, swatch })),
        sizes: sizeValues,
        fabric: toOptionalCatalogText(row.fabric),
        fit: toOptionalCatalogText(row.fit),
        sleeve: toOptionalCatalogText(row.sleeve),
        occasion: toOptionalCatalogText(row.occasion),
        shortDescription: toOptionalCatalogText(row.short_description),
        description: toOptionalCatalogText(row.description),
        shippingNote: toOptionalCatalogText(row.shipping_note),
        createdAt: asTimestamp(row.created_at),
        updatedAt: asTimestamp(row.updated_at),
      }
    })

    const productsByBrandId = new Map<string, StorefrontProduct[]>()
    const productsByCategoryKey = new Map<string, StorefrontProduct[]>()
    for (const product of products) {
      const brandId = rows.find((row) => row.id === product.id)?.brand_id
      const categoryId = rows.find((row) => row.id === product.id)?.category_id

      if (brandId) {
        const brandProducts = productsByBrandId.get(brandId) ?? []
        brandProducts.push(product)
        productsByBrandId.set(brandId, brandProducts)
      }

      if (categoryId) {
        const categoryProducts = productsByCategoryKey.get(categoryId) ?? []
        categoryProducts.push(product)
        productsByCategoryKey.set(categoryId, categoryProducts)
      }
    }

    const brands: StorefrontBrand[] = []
    const seenBrandIds = new Set<string>()
    for (const row of rows) {
      if (!row.brand_id || row.brand_id === '1' || seenBrandIds.has(row.brand_id)) {
        continue
      }
      seenBrandIds.add(row.brand_id)
      const brandProducts = productsByBrandId.get(row.brand_id) ?? []
      brands.push({
        id: row.brand_id,
        name: normalizeCatalogText(row.brand_name, 'Unbranded'),
        slug: toCatalogSlug(row.brand_name, `brand-${row.brand_id}`),
        description: toOptionalCatalogText(row.brand_description),
        image: brandProducts[0]?.images[0] ?? null,
        productCount: brandProducts.length,
        featuredLabel: brandProducts.some((product) => product.featuredLabel),
      })
    }

    const categories: StorefrontCategory[] = []
    const seenCategoryIds = new Set<string>()
    for (const row of rows) {
      if (!row.category_id || row.category_id === '1' || seenCategoryIds.has(row.category_id)) {
        continue
      }
      seenCategoryIds.add(row.category_id)
      const categoryProducts = productsByCategoryKey.get(row.category_id) ?? []
      categories.push({
        id: row.category_id,
        name: normalizeCatalogText(row.category_name, 'Catalog'),
        slug: toCatalogSlug(row.category_name, `category-${row.category_id}`),
        department: categoryProducts[0]?.department ?? 'women',
        description: toOptionalCatalogText(row.category_description),
        image: categoryProducts[0]?.images[0] ?? null,
        menuImage: toOptionalCatalogText(row.category_menu_image),
        positionOrder: Number(row.category_position_order ?? 0),
        showInTopMenu: Boolean(row.category_show_on_storefront_top_menu),
        showInCatalogSection: Boolean(row.category_show_on_storefront_catalog),
        productCount: categoryProducts.length,
      })
    }

    categories.sort((left, right) =>
      left.positionOrder - right.positionOrder
      || left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }),
    )

    return {
      brands,
      categories,
      products,
      reviews: reviews.map(toStorefrontReview),
    } satisfies StorefrontCatalogResponse
  }

  private async replaceChildren(execute: SqlExecutor, first: SqlFirst, productId: string, payload: ProductUpsertPayload) {
    await this.replaceProductImages(execute, productId, payload.images)
    await this.replaceAttributes(execute, first, productId, payload.attributes, payload.attributeValues)
    const variantIdByClientKey = await this.replaceVariants(execute, first, productId, payload.variants)
    await this.replacePrices(execute, productId, payload.prices, variantIdByClientKey)
    await this.replaceDiscounts(execute, productId, payload.discounts, variantIdByClientKey)
    await this.replaceOffers(execute, productId, payload.offers)
    await this.replaceStockItems(execute, productId, payload.stockItems, variantIdByClientKey)
    await this.replaceStockMovements(execute, productId, payload.stockMovements, variantIdByClientKey)
    await this.replaceSeo(execute, first, productId, payload.seo)
    await this.replaceStorefront(execute, first, productId, payload.storefront)
    await this.replaceTags(execute, first, productId, payload.tags)
    await this.replaceReviews(execute, productId, payload.reviews)
  }

  private async replaceProductImages(execute: SqlExecutor, productId: string, images: ProductImageInput[]) {
    await execute(`UPDATE ${productTableNames.images} SET is_active = 0 WHERE product_id = ? AND is_active = 1`, [productId])
    for (const image of images) {
      await execute(
        `INSERT INTO ${productTableNames.images} (id, product_id, image_url, is_primary, sort_order) VALUES (?, ?, ?, ?, ?)`,
        [randomUUID(), productId, image.imageUrl, image.isPrimary, image.sortOrder],
      )
    }
  }

  async findBySku(sku: string) {
    await ensureDatabaseSchema()

    const row = await db.first<{ id: string } & RowDataPacket>(
      `SELECT id FROM ${productTableNames.products} WHERE sku = ? LIMIT 1`,
      [sku],
    )

    if (!row) {
      return null
    }

    return this.findById(row.id)
  }

  private async replaceAttributes(
    execute: SqlExecutor,
    first: SqlFirst,
    productId: string,
    attributes: ProductAttributeInput[],
    attributeValues: ProductAttributeValueInput[],
  ) {
    await execute(`UPDATE ${productTableNames.variantMap} SET is_active = 0 WHERE product_id = ? AND is_active = 1`, [productId])
    await execute(`UPDATE ${productTableNames.attributeValues} SET is_active = 0 WHERE product_id = ? AND is_active = 1`, [productId])
    await execute(`UPDATE ${productTableNames.attributes} SET is_active = 0 WHERE product_id = ? AND is_active = 1`, [productId])

    const attributeIdByClientKey = new Map<string, string>()

    for (const attribute of attributes) {
      const existingAttribute = await first<ProductAttributeRow>(
        `SELECT * FROM ${productTableNames.attributes} WHERE product_id = ? AND name = ? LIMIT 1`,
        [productId, attribute.name],
      )
      const attributeId = existingAttribute?.id ?? randomUUID()
      attributeIdByClientKey.set(attribute.clientKey, attributeId)

      if (existingAttribute) {
        await execute(
          `UPDATE ${productTableNames.attributes} SET name = ?, is_active = 1 WHERE id = ?`,
          [attribute.name, attributeId],
        )
      } else {
        await execute(`INSERT INTO ${productTableNames.attributes} (id, product_id, name) VALUES (?, ?, ?)`, [attributeId, productId, attribute.name])
      }
    }

    for (const attributeValue of attributeValues) {
      const attributeId = attributeIdByClientKey.get(attributeValue.attributeClientKey)
      if (!attributeId) {
        throw new ApplicationError('Attribute value references an unknown attribute.', { attributeClientKey: attributeValue.attributeClientKey }, 400)
      }

      const existingValue = await first<ProductAttributeValueRow>(
        `SELECT * FROM ${productTableNames.attributeValues} WHERE attribute_id = ? AND value = ? LIMIT 1`,
        [attributeId, attributeValue.value],
      )
      const valueId = existingValue?.id ?? randomUUID()

      if (existingValue) {
        await execute(
          `UPDATE ${productTableNames.attributeValues} SET product_id = ?, value = ?, is_active = 1 WHERE id = ?`,
          [productId, attributeValue.value, valueId],
        )
      } else {
        await execute(
          `INSERT INTO ${productTableNames.attributeValues} (id, product_id, attribute_id, value) VALUES (?, ?, ?, ?)`,
          [valueId, productId, attributeId, attributeValue.value],
        )
      }

      await execute(
        `INSERT INTO ${productTableNames.variantMap} (id, product_id, attribute_id, value_id) VALUES (?, ?, ?, ?)`,
        [randomUUID(), productId, attributeId, valueId],
      )
    }
  }

  private async replaceVariants(execute: SqlExecutor, first: SqlFirst, productId: string, variants: ProductVariantInput[]) {
    await execute(`
      UPDATE ${productTableNames.variantImages} pvi
      INNER JOIN ${productTableNames.variants} pv ON pv.id = pvi.variant_id
      SET pvi.is_active = 0
      WHERE pv.product_id = ? AND pvi.is_active = 1
    `, [productId])
    await execute(`
      UPDATE ${productTableNames.variantAttributes} pva
      INNER JOIN ${productTableNames.variants} pv ON pv.id = pva.variant_id
      SET pva.is_active = 0
      WHERE pv.product_id = ? AND pva.is_active = 1
    `, [productId])
    await execute(`UPDATE ${productTableNames.variants} SET is_active = 0 WHERE product_id = ? AND is_active = 1`, [productId])

    const variantIdByClientKey = new Map<string, string>()

    for (const variant of variants) {
      const existingVariant = await first<ProductVariantRow>(
        `SELECT * FROM ${productTableNames.variants} WHERE product_id = ? AND sku = ? LIMIT 1`,
        [productId, variant.sku],
      )
      const variantId = existingVariant?.id ?? randomUUID()
      variantIdByClientKey.set(variant.clientKey, variantId)

      if (existingVariant) {
        await execute(
          `UPDATE ${productTableNames.variants}
           SET sku = ?, variant_name = ?, price = ?, cost_price = ?, stock_quantity = ?, opening_stock = ?, weight = ?, barcode = ?, is_active = ?
           WHERE id = ?`,
          [variant.sku, variant.variantName, variant.price, variant.costPrice, variant.stockQuantity, variant.openingStock, variant.weight, variant.barcode, variant.isActive, variantId],
        )
      } else {
        await execute(
          `INSERT INTO ${productTableNames.variants} (id, product_id, sku, variant_name, price, cost_price, stock_quantity, opening_stock, weight, barcode, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [variantId, productId, variant.sku, variant.variantName, variant.price, variant.costPrice, variant.stockQuantity, variant.openingStock, variant.weight, variant.barcode, variant.isActive],
        )
      }

      for (const image of variant.images) {
        await execute(
          `INSERT INTO ${productTableNames.variantImages} (id, variant_id, image_url, is_primary) VALUES (?, ?, ?, ?)`,
          [randomUUID(), variantId, image.imageUrl, image.isPrimary],
        )
      }

      for (const attribute of variant.attributes) {
        await execute(
          `INSERT INTO ${productTableNames.variantAttributes} (id, variant_id, attribute_name, attribute_value) VALUES (?, ?, ?, ?)`,
          [randomUUID(), variantId, attribute.attributeName, attribute.attributeValue],
        )
      }
    }

    return variantIdByClientKey
  }

  private async replacePrices(execute: SqlExecutor, productId: string, prices: ProductPriceInput[], variantIdByClientKey: Map<string, string>) {
    await execute(`UPDATE ${productTableNames.prices} SET is_active = 0 WHERE product_id = ? AND is_active = 1`, [productId])
    for (const price of prices) {
      await execute(
        `INSERT INTO ${productTableNames.prices} (id, product_id, variant_id, mrp, selling_price, cost_price) VALUES (?, ?, ?, ?, ?, ?)`,
        [randomUUID(), productId, price.variantClientKey ? variantIdByClientKey.get(price.variantClientKey) ?? null : null, price.mrp, price.sellingPrice, price.costPrice],
      )
    }
  }

  private async replaceDiscounts(execute: SqlExecutor, productId: string, discounts: ProductDiscountInput[], variantIdByClientKey: Map<string, string>) {
    await execute(`UPDATE ${productTableNames.discounts} SET is_active = 0 WHERE product_id = ? AND is_active = 1`, [productId])
    for (const discount of discounts) {
      await execute(
        `INSERT INTO ${productTableNames.discounts} (id, product_id, variant_id, discount_type, discount_value, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [randomUUID(), productId, discount.variantClientKey ? variantIdByClientKey.get(discount.variantClientKey) ?? null : null, discount.discountType, discount.discountValue, discount.startDate, discount.endDate],
      )
    }
  }

  private async replaceOffers(execute: SqlExecutor, productId: string, offers: ProductOfferInput[]) {
    await execute(`UPDATE ${productTableNames.offers} SET is_active = 0 WHERE product_id = ? AND is_active = 1`, [productId])
    for (const offer of offers) {
      await execute(
        `INSERT INTO ${productTableNames.offers} (id, product_id, title, description, offer_price, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [randomUUID(), productId, offer.title, offer.description, offer.offerPrice, offer.startDate, offer.endDate],
      )
    }
  }

  private async replaceStockItems(execute: SqlExecutor, productId: string, stockItems: ProductStockItemInput[], variantIdByClientKey: Map<string, string>) {
    await execute(`UPDATE ${productTableNames.stockItems} SET is_active = 0 WHERE product_id = ? AND is_active = 1`, [productId])
    for (const stockItem of stockItems) {
      await execute(
        `INSERT INTO ${productTableNames.stockItems} (id, product_id, variant_id, warehouse_id, quantity, reserved_quantity) VALUES (?, ?, ?, ?, ?, ?)`,
        [randomUUID(), productId, stockItem.variantClientKey ? variantIdByClientKey.get(stockItem.variantClientKey) ?? null : null, stockItem.warehouseId, stockItem.quantity, stockItem.reservedQuantity],
      )
    }
  }

  private async replaceStockMovements(execute: SqlExecutor, productId: string, stockMovements: ProductStockMovementInput[], variantIdByClientKey: Map<string, string>) {
    await execute(`UPDATE ${productTableNames.stockMovements} SET is_active = 0 WHERE product_id = ? AND is_active = 1`, [productId])
    for (const movement of stockMovements) {
      await execute(
        `INSERT INTO ${productTableNames.stockMovements} (id, product_id, variant_id, warehouse_id, movement_type, quantity, reference_type, reference_id, movement_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [randomUUID(), productId, movement.variantClientKey ? variantIdByClientKey.get(movement.variantClientKey) ?? null : null, movement.warehouseId, movement.movementType, movement.quantity, movement.referenceType, movement.referenceId, asDateTimeInput(movement.movementAt)],
      )
    }
  }

  private async replaceSeo(execute: SqlExecutor, first: SqlFirst, productId: string, seo: ProductUpsertPayload['seo']) {
    await execute(`UPDATE ${productTableNames.seo} SET is_active = 0 WHERE product_id = ? AND is_active = 1`, [productId])
    if (!seo) {
      return
    }
    const existingSeo = await first<ProductSeoRow>(
      `SELECT * FROM ${productTableNames.seo} WHERE product_id = ? LIMIT 1`,
      [productId],
    )
    if (existingSeo) {
      await execute(
        `UPDATE ${productTableNames.seo}
         SET meta_title = ?, meta_description = ?, meta_keywords = ?, is_active = 1
         WHERE id = ?`,
        [seo.metaTitle, seo.metaDescription, seo.metaKeywords, existingSeo.id],
      )
      return
    }
    await execute(
      `INSERT INTO ${productTableNames.seo} (id, product_id, meta_title, meta_description, meta_keywords) VALUES (?, ?, ?, ?, ?)`,
      [randomUUID(), productId, seo.metaTitle, seo.metaDescription, seo.metaKeywords],
    )
  }

  private async replaceStorefront(
    execute: SqlExecutor,
    first: SqlFirst,
    productId: string,
    storefront: ProductUpsertPayload['storefront'],
  ) {
    await execute(`UPDATE ${productTableNames.storefront} SET is_active = 0 WHERE product_id = ? AND is_active = 1`, [productId])
    if (!storefront) {
      return
    }

    const existingStorefront = await first<ProductStorefrontRow>(
      `SELECT * FROM ${productTableNames.storefront} WHERE product_id = ? LIMIT 1`,
      [productId],
    )

    const values = [
      storefront.department,
      storefront.homeSliderEnabled,
      storefront.homeSliderOrder,
      storefront.promoSliderEnabled,
      storefront.promoSliderOrder,
      storefront.featureSectionEnabled,
      storefront.featureSectionOrder,
      storefront.isNewArrival,
      storefront.isBestSeller,
      storefront.isFeaturedLabel,
      storefront.catalogBadge,
      storefront.fabric,
      storefront.fit,
      storefront.sleeve,
      storefront.occasion,
      storefront.shippingNote,
    ] as const

    if (existingStorefront) {
      await execute(
        `UPDATE ${productTableNames.storefront}
         SET
           department = ?,
           home_slider_enabled = ?,
           home_slider_order = ?,
           promo_slider_enabled = ?,
           promo_slider_order = ?,
           feature_section_enabled = ?,
           feature_section_order = ?,
           is_new_arrival = ?,
           is_best_seller = ?,
           is_featured_label = ?,
           catalog_badge = ?,
           fabric = ?,
           fit = ?,
           sleeve = ?,
           occasion = ?,
           shipping_note = ?,
           is_active = 1
         WHERE id = ?`,
        [...values, existingStorefront.id],
      )
      return
    }

    await execute(
      `INSERT INTO ${productTableNames.storefront} (
        id,
        product_id,
        department,
        home_slider_enabled,
        home_slider_order,
        promo_slider_enabled,
        promo_slider_order,
        feature_section_enabled,
        feature_section_order,
        is_new_arrival,
        is_best_seller,
        is_featured_label,
        catalog_badge,
        fabric,
        fit,
        sleeve,
        occasion,
        shipping_note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), productId, ...values],
    )
  }

  private async replaceTags(execute: SqlExecutor, first: SqlFirst, productId: string, tags: ProductTagInput[]) {
    await execute(`UPDATE ${productTableNames.tagMap} SET is_active = 0 WHERE product_id = ? AND is_active = 1`, [productId])
    const uniqueNames = [...new Set(tags.map((tag) => tag.name.trim()).filter(Boolean))]

    for (const name of uniqueNames) {
      const existing = await first<ProductTagRow>(`SELECT * FROM ${productTableNames.tags} WHERE name = ? LIMIT 1`, [name])
      const tagId = existing?.id ?? randomUUID()

      if (existing) {
        await execute(`UPDATE ${productTableNames.tags} SET is_active = 1 WHERE id = ?`, [tagId])
      } else {
        await execute(`INSERT INTO ${productTableNames.tags} (id, name) VALUES (?, ?)`, [tagId, name])
      }

      const existingTagMap = await first<ProductVariantMapRow>(
        `SELECT * FROM ${productTableNames.tagMap} WHERE product_id = ? AND tag_id = ? LIMIT 1`,
        [productId, tagId],
      )

      if (existingTagMap) {
        await execute(`UPDATE ${productTableNames.tagMap} SET is_active = 1 WHERE id = ?`, [existingTagMap.id])
      } else {
        await execute(`INSERT INTO ${productTableNames.tagMap} (id, product_id, tag_id) VALUES (?, ?, ?)`, [randomUUID(), productId, tagId])
      }
    }
  }

  private async replaceReviews(execute: SqlExecutor, productId: string, reviews: ProductReviewInput[]) {
    await execute(`UPDATE ${productTableNames.reviews} SET is_active = 0 WHERE product_id = ? AND is_active = 1`, [productId])
    for (const review of reviews) {
      await execute(
        `INSERT INTO ${productTableNames.reviews} (id, product_id, user_id, rating, review, review_date) VALUES (?, ?, ?, ?, ?, ?)`,
        [randomUUID(), productId, review.userId, review.rating, review.review, asDateTimeInput(review.reviewDate)],
      )
    }
  }
}
