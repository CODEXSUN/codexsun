import {
  frappeItemManagerResponseSchema,
  frappeItemProductSyncPayloadSchema,
  frappeItemProductSyncLogManagerResponseSchema,
  frappeItemProductSyncLogSchema,
  frappeItemProductSyncResponseSchema,
  frappeItemResponseSchema,
  frappeItemSchema,
  frappeItemUpsertPayloadSchema,
  frappeReferenceOptionSchema,
  type AuthUser,
  type FrappeItemProductSyncLog,
  type FrappeItemProductSyncLogItem,
  type Product,
  type ProductUpsertPayload,
  type StorefrontDepartment,
} from '@shared/index'
import { randomUUID } from 'node:crypto'
import type { RowDataPacket } from 'mysql2'
import { ZodError } from 'zod'
import { ApplicationError } from '@framework-core/runtime/errors/application-error'
import { environment } from '@framework-core/runtime/config/environment'
import { ensureDatabaseSchema } from '@framework-core/runtime/database/database'
import { commonTableNames, frappeTableNames, productTableNames } from '@framework-core/runtime/database/table-names'
import { db } from '@framework-core/runtime/database/orm'
import { ProductService } from '@ecommerce-api/features/product/application/product-service'
import { ProductRepository } from '@ecommerce-api/features/product/data/product-repository'
import { assertFrappeViewer, assertSuperAdmin, requestFrappeJson } from './frappe-client'

function toStringValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

const productService = new ProductService(new ProductRepository())
const productRepository = new ProductRepository()

interface ProductSyncRow extends RowDataPacket {
  id: string
  name: string
  slug: string
  sku: string
}

interface ProductSyncLogRow extends RowDataPacket {
  id: string
  duplicate_mode: 'overwrite' | 'skip'
  requested_count: number
  success_count: number
  skipped_count: number
  failure_count: number
  started_at: Date
  finished_at: Date
  synced_at: Date
  created_by_user_id: string | null
  summary: string
  items_json: string
  failure_json: string
  created_at: Date
  updated_at: Date
}

interface CommonNameRow extends RowDataPacket {
  id: string
  code?: string | null
  name?: string | null
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildFrappeItemSku(record: Record<string, unknown>) {
  return toStringValue(record.item_code || record.name).trim() || 'FRAPPE-ITEM'
}

function buildFrappeItemSlug(record: Record<string, unknown>) {
  const itemName = toStringValue(record.item_name || record.name).trim()
  const itemCode = buildFrappeItemSku(record)

  return slugify(itemName) || slugify(itemCode) || 'frappe-item'
}

function normalizeMatchValue(value: string) {
  return value.trim().toLowerCase()
}

function toLookupCode(value: string, fallback: string) {
  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || fallback
}

function stripHtml(value: string) {
  const trimmedValue = value.trim()
  if (!trimmedValue.includes('<')) {
    return trimmedValue
  }

  return trimmedValue
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

function toBooleanValue(value: unknown) {
  return value === true || value === 1 || value === '1'
}

function extractRows(payload: Record<string, unknown> | null) {
  return Array.isArray(payload?.data)
    ? payload.data as Record<string, unknown>[]
    : []
}

function toErrorDetail(error: unknown) {
  if (error instanceof ZodError) {
    return JSON.stringify(error.issues, null, 2)
  }

  if (error instanceof ApplicationError) {
    const detail = error.context?.detail
    if (typeof detail === 'string' && detail.trim()) {
      return detail.trim()
    }

    return error.message.trim()
  }

  if (error instanceof Error) {
    return error.message.trim()
  }

  return 'Unknown sync error'
}

function parseJsonArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[]
  }

  if (typeof value !== 'string' || value.trim().length === 0) {
    return []
  }

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed as T[] : []
  } catch {
    return []
  }
}

async function listFrappeDoctype(
  doctype: string,
  fields: string[],
  options?: {
    limitPageLength?: number
    orderBy?: string
  },
) {
  const query = new URLSearchParams({
    fields: JSON.stringify(fields),
    limit_page_length: String(options?.limitPageLength ?? 200),
  })

  if (options?.orderBy) {
    query.set('order_by', options.orderBy)
  }

  return extractRows(await requestFrappeJson(`/api/resource/${encodeURIComponent(doctype)}?${query.toString()}`))
}

function toReferenceOption(record: Record<string, unknown>, options?: { description?: string }) {
  return frappeReferenceOptionSchema.parse({
    id: toStringValue(record.name),
    label: toStringValue(record.name),
    description: options?.description ?? '',
    disabled: toBooleanValue(record.disabled) || !toBooleanValue(record.enabled ?? true),
    isGroup: toBooleanValue(record.is_group),
  })
}

function readItemDefault(record: Record<string, unknown>, field: 'company' | 'default_warehouse') {
  const itemDefaults = Array.isArray(record.item_defaults)
    ? record.item_defaults as Record<string, unknown>[]
    : []

  return toStringValue(itemDefaults[0]?.[field])
}

function toFrappeItem(record: Record<string, unknown>, syncedProduct?: ProductSyncRow | null) {
  return frappeItemSchema.parse({
    id: toStringValue(record.name),
    itemCode: toStringValue(record.item_code || record.name),
    itemName: toStringValue(record.item_name),
    description: toStringValue(record.description),
    itemGroup: toStringValue(record.item_group),
    stockUom: toStringValue(record.stock_uom),
    brand: toStringValue(record.brand),
    gstHsnCode: toStringValue(record.gst_hsn_code),
    defaultCompany: readItemDefault(record, 'company'),
    defaultWarehouse: readItemDefault(record, 'default_warehouse'),
    disabled: toBooleanValue(record.disabled),
    isStockItem: toBooleanValue(record.is_stock_item),
    hasVariants: toBooleanValue(record.has_variants),
    modifiedAt: toStringValue(record.modified),
    syncedProductId: syncedProduct?.id ?? '',
    syncedProductName: syncedProduct?.name ?? '',
    syncedProductSlug: syncedProduct?.slug ?? '',
    isSyncedToProduct: Boolean(syncedProduct?.id),
  })
}

async function readFrappeItemRecordById(itemId: string) {
  const payload = await requestFrappeJson(`/api/resource/Item/${encodeURIComponent(itemId)}`)
  const record = payload && typeof payload.data === 'object' && payload.data
    ? payload.data as Record<string, unknown>
    : null

  if (!record) {
    throw new ApplicationError('Frappe Item could not be loaded.', { itemId }, 502)
  }

  return record
}

async function listSyncedProductsBySku(itemCodes: string[]) {
  await ensureDatabaseSchema()

  const uniqueItemCodes = [...new Set(itemCodes.map((value) => value.trim()).filter(Boolean))]
  if (uniqueItemCodes.length === 0) {
    return new Map<string, ProductSyncRow>()
  }

  const placeholders = uniqueItemCodes.map(() => '?').join(', ')
  const rows = await db.query<ProductSyncRow>(
    `SELECT id, name, slug, sku FROM ${productTableNames.products} WHERE sku IN (${placeholders})`,
    uniqueItemCodes,
  )

  return new Map(rows.map((row) => [row.sku.trim(), row] as const))
}

function toSyncLogSummary(
  requestedCount: number,
  successCount: number,
  skippedCount: number,
  failureCount: number,
) {
  return `Synced ${successCount} of ${requestedCount} item${requestedCount === 1 ? '' : 's'}${skippedCount > 0 ? `, skipped ${skippedCount}` : ''}${failureCount > 0 ? `, failed ${failureCount}` : ''}.`
}

function toSyncLogItemOutcomes(items: FrappeItemProductSyncLogItem[]) {
  return JSON.stringify(items)
}

async function createFrappeItemProductSyncLog(entry: {
  duplicateMode: 'overwrite' | 'skip'
  requestedCount: number
  successCount: number
  skippedCount: number
  failureCount: number
  startedAt: Date
  finishedAt: Date
  syncedAt: Date
  createdByUserId: string | null
  items: FrappeItemProductSyncLogItem[]
  failures: Array<Pick<FrappeItemProductSyncLogItem, 'frappeItemId' | 'frappeItemCode' | 'mode' | 'reason'>>
}) {
  await ensureDatabaseSchema()

  const id = `frappe-item-sync-log:${randomUUID()}`
  await db.execute(
    `INSERT INTO ${frappeTableNames.itemProductSyncLogs} (
      id,
      duplicate_mode,
      requested_count,
      success_count,
      skipped_count,
      failure_count,
      started_at,
      finished_at,
      synced_at,
      created_by_user_id,
      summary,
      items_json,
      failure_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      entry.duplicateMode,
      entry.requestedCount,
      entry.successCount,
      entry.skippedCount,
      entry.failureCount,
      entry.startedAt,
      entry.finishedAt,
      entry.syncedAt,
      entry.createdByUserId,
      toSyncLogSummary(entry.requestedCount, entry.successCount, entry.skippedCount, entry.failureCount),
      toSyncLogItemOutcomes(entry.items),
      JSON.stringify(entry.failures),
    ],
  )

  return id
}

function toSyncLogRow(row: ProductSyncLogRow): FrappeItemProductSyncLog {
  return frappeItemProductSyncLogSchema.parse({
    id: row.id,
    duplicateMode: row.duplicate_mode,
    requestedCount: Number(row.requested_count),
    successCount: Number(row.success_count),
    skippedCount: Number(row.skipped_count),
    failureCount: Number(row.failure_count),
    startedAt: row.started_at.toISOString(),
    finishedAt: row.finished_at.toISOString(),
    syncedAt: row.synced_at.toISOString(),
    createdByUserId: row.created_by_user_id,
    summary: row.summary,
    items: parseJsonArray<FrappeItemProductSyncLogItem>(row.items_json),
  })
}

async function readFrappeItemProductSyncLogs(limit = 20) {
  await ensureDatabaseSchema()

  const rows = await db.query<ProductSyncLogRow>(
    `SELECT
      id,
      duplicate_mode,
      requested_count,
      success_count,
      skipped_count,
      failure_count,
      started_at,
      finished_at,
      synced_at,
      created_by_user_id,
      summary,
      items_json,
      failure_json,
      created_at,
      updated_at
    FROM ${frappeTableNames.itemProductSyncLogs}
    ORDER BY synced_at DESC, created_at DESC
    LIMIT ?`,
    [limit],
  )

  return rows.map(toSyncLogRow)
}

async function findCommonRecordIdByCodeOrName(
  tableName: string,
  primaryValue: string,
  secondaryValue?: string,
) {
  await ensureDatabaseSchema()

  const normalizedPrimary = normalizeMatchValue(primaryValue)
  const normalizedSecondary = secondaryValue ? normalizeMatchValue(secondaryValue) : null

  if (!normalizedPrimary) {
    return null
  }

  const row = await db.first<CommonNameRow>(
    `SELECT id, code, name FROM ${tableName} WHERE LOWER(code) = ? OR LOWER(name) = ? OR LOWER(name) = ? LIMIT 1`,
    [normalizedPrimary, normalizedPrimary, normalizedSecondary ?? normalizedPrimary],
  )

  return row?.id ?? null
}

async function ensureCommonRecord(
  tableName: string,
  idPrefix: string,
  values: Record<string, string | number | null>,
  matchValue: string,
  secondaryMatchValue?: string,
) {
  const existingId = await findCommonRecordIdByCodeOrName(tableName, matchValue, secondaryMatchValue)
  if (existingId) {
    return existingId
  }

  if (!matchValue.trim()) {
    return '1'
  }

  const id = `${idPrefix}:${randomUUID()}`
  const columns = ['id', ...Object.keys(values)]
  const params = [id, ...Object.values(values)]
  await db.execute(
    `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
    params,
  )
  return id
}

function inferStorefrontDepartment(itemGroup: string, itemName: string): StorefrontDepartment {
  const content = `${itemGroup} ${itemName}`.toLowerCase()
  if (content.includes('women') || content.includes('ladies') || content.includes('girls')) {
    return 'women'
  }
  if (content.includes('men') || content.includes('gents') || content.includes('boys')) {
    return 'men'
  }
  if (content.includes('kids') || content.includes('kid') || content.includes('baby') || content.includes('child')) {
    return 'kids'
  }
  return 'accessories'
}

function truncateText(value: string, length: number) {
  const trimmed = value.trim()
  if (trimmed.length <= length) {
    return trimmed
  }
  return `${trimmed.slice(0, Math.max(0, length - 3)).trimEnd()}...`
}

function productToUpsertPayload(product: Product): ProductUpsertPayload {
  const variantClientKeyById = new Map<string, string>()

  product.variants.forEach((variant) => {
    variantClientKeyById.set(variant.id, variant.id)
  })

  return {
    name: product.name,
    slug: product.slug,
    description: product.description ?? '-',
    shortDescription: product.shortDescription ?? '-',
    brandId: product.brandId ?? '1',
    categoryId: product.categoryId ?? '1',
    productGroupId: product.productGroupId ?? '1',
    productTypeId: product.productTypeId ?? '1',
    unitId: product.unitId ?? '1',
    hsnCodeId: product.hsnCodeId ?? '1',
    styleId: product.styleId ?? '1',
    sku: product.sku,
    hasVariants: product.hasVariants,
    basePrice: product.basePrice,
    costPrice: product.costPrice,
    taxId: product.taxId ?? '1',
    isFeatured: product.isFeatured,
    isActive: product.isActive,
    images: product.images.map((image) => ({
      imageUrl: image.imageUrl,
      isPrimary: image.isPrimary,
      sortOrder: image.sortOrder,
    })),
    variants: product.variants.map((variant) => ({
      clientKey: variant.id,
      sku: variant.sku,
      variantName: variant.variantName,
      price: variant.price,
      costPrice: variant.costPrice,
      stockQuantity: variant.stockQuantity,
      openingStock: variant.openingStock,
      weight: variant.weight,
      barcode: variant.barcode,
      isActive: variant.isActive,
      images: variant.images.map((image) => ({
        imageUrl: image.imageUrl,
        isPrimary: image.isPrimary,
      })),
      attributes: variant.attributes.map((attribute) => ({
        attributeName: attribute.attributeName,
        attributeValue: attribute.attributeValue,
      })),
    })),
    prices: product.prices.map((price) => ({
      variantClientKey: price.variantId ? variantClientKeyById.get(price.variantId) ?? null : null,
      mrp: price.mrp,
      sellingPrice: price.sellingPrice,
      costPrice: price.costPrice,
    })),
    discounts: product.discounts.map((discount) => ({
      variantClientKey: discount.variantId ? variantClientKeyById.get(discount.variantId) ?? null : null,
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      startDate: discount.startDate,
      endDate: discount.endDate,
    })),
    offers: product.offers.map((offer) => ({
      title: offer.title,
      description: offer.description,
      offerPrice: offer.offerPrice,
      startDate: offer.startDate,
      endDate: offer.endDate,
    })),
    attributes: product.attributes.map((attribute) => ({
      clientKey: attribute.id,
      name: attribute.name,
    })),
    attributeValues: product.attributeValues.map((value) => ({
      clientKey: value.id,
      attributeClientKey: value.attributeId,
      value: value.value,
    })),
    stockItems: product.stockItems.map((item) => ({
      variantClientKey: item.variantId ? variantClientKeyById.get(item.variantId) ?? null : null,
      warehouseId: item.warehouseId,
      quantity: item.quantity,
      reservedQuantity: item.reservedQuantity,
    })),
    stockMovements: product.stockMovements.map((movement) => ({
      variantClientKey: movement.variantId ? variantClientKeyById.get(movement.variantId) ?? null : null,
      warehouseId: movement.warehouseId,
      movementType: movement.movementType,
      quantity: movement.quantity,
      referenceType: movement.referenceType,
      referenceId: movement.referenceId,
      movementAt: movement.movementAt.slice(0, 16),
    })),
    seo: product.seo
      ? {
          metaTitle: product.seo.metaTitle,
          metaDescription: product.seo.metaDescription,
          metaKeywords: product.seo.metaKeywords,
        }
      : null,
    storefront: product.storefront
      ? {
          department: product.storefront.department,
          homeSliderEnabled: product.storefront.homeSliderEnabled,
          homeSliderOrder: product.storefront.homeSliderOrder,
          promoSliderEnabled: product.storefront.promoSliderEnabled,
          promoSliderOrder: product.storefront.promoSliderOrder,
          featureSectionEnabled: product.storefront.featureSectionEnabled,
          featureSectionOrder: product.storefront.featureSectionOrder,
          isNewArrival: product.storefront.isNewArrival,
          isBestSeller: product.storefront.isBestSeller,
          isFeaturedLabel: product.storefront.isFeaturedLabel,
          catalogBadge: product.storefront.catalogBadge,
          fabric: product.storefront.fabric,
          fit: product.storefront.fit,
          sleeve: product.storefront.sleeve,
          occasion: product.storefront.occasion,
          shippingNote: product.storefront.shippingNote,
        }
      : null,
    tags: product.tags.map((tag) => ({ name: tag.name })),
    reviews: product.reviews.map((review) => ({
      userId: review.userId,
      rating: review.rating,
      review: review.review,
      reviewDate: review.reviewDate.slice(0, 16),
    })),
  }
}

async function ensureProductReferenceIds(record: Record<string, unknown>) {
  const itemGroup = toStringValue(record.item_group)
  const stockUom = toStringValue(record.stock_uom)
  const brand = toStringValue(record.brand)
  const gstHsnCode = toStringValue(record.gst_hsn_code)
  const defaultWarehouse = readItemDefault(record, 'default_warehouse')

  const categoryId = itemGroup
    ? await ensureCommonRecord(
        commonTableNames.productCategories,
        'product-category',
        {
          code: toLookupCode(itemGroup, 'FRAPPE-CATEGORY'),
          name: itemGroup,
          description: 'Imported from Frappe Item Group.',
        },
        itemGroup,
      )
    : '1'

  const productGroupId = itemGroup
    ? await ensureCommonRecord(
        commonTableNames.productGroups,
        'product-group',
        {
          code: toLookupCode(itemGroup, 'FRAPPE-GROUP'),
          name: itemGroup,
          description: 'Imported from Frappe Item Group.',
        },
        itemGroup,
      )
    : '1'

  const unitId = stockUom
    ? await ensureCommonRecord(
        commonTableNames.units,
        'unit',
        {
          code: toLookupCode(stockUom, 'FRAPPE-UOM'),
          name: stockUom,
          symbol: stockUom,
          description: 'Imported from Frappe UOM.',
        },
        stockUom,
      )
    : '1'

  const brandId = brand
    ? await ensureCommonRecord(
        commonTableNames.brands,
        'brand',
        {
          code: toLookupCode(brand, 'FRAPPE-BRAND'),
          name: brand,
          description: 'Imported from Frappe Brand.',
        },
        brand,
      )
    : '1'

  const hsnCodeId = gstHsnCode
    ? await ensureCommonRecord(
        commonTableNames.hsnCodes,
        'hsn',
        {
          code: gstHsnCode,
          name: `HSN ${gstHsnCode}`,
          description: 'Imported from Frappe GST HSN Code.',
        },
        gstHsnCode,
      )
    : '1'

  const warehouseId = defaultWarehouse
    ? await ensureCommonRecord(
        commonTableNames.warehouses,
        'warehouse',
        {
          code: toLookupCode(defaultWarehouse, 'FRAPPE-WAREHOUSE'),
          name: defaultWarehouse,
          country_id: '1',
          state_id: '1',
          district_id: '1',
          city_id: '1',
          pincode_id: '1',
          address_line1: '-',
          address_line2: '-',
          description: 'Imported from Frappe default warehouse.',
        },
        defaultWarehouse,
      )
    : '1'

  return {
    brandId,
    categoryId,
    productGroupId,
    unitId,
    hsnCodeId,
    warehouseId,
  }
}

function buildTagInputs(record: Record<string, unknown>, existingTags: ProductUpsertPayload['tags']) {
  const tagNames = new Set<string>(
    existingTags
      .map((tag) => tag.name.trim())
      .filter(Boolean),
  )

  tagNames.add('frappe')

  const itemGroup = toStringValue(record.item_group).trim()
  const brand = toStringValue(record.brand).trim()
  const itemCode = toStringValue(record.item_code || record.name).trim()

  if (itemGroup) {
    tagNames.add(itemGroup)
  }
  if (brand) {
    tagNames.add(brand)
  }
  if (itemCode) {
    tagNames.add(`frappe:${itemCode}`)
  }

  return [...tagNames].map((name) => ({ name }))
}

function buildProductPayloadFromFrappe(
  record: Record<string, unknown>,
  refs: Awaited<ReturnType<typeof ensureProductReferenceIds>>,
  existingProduct?: Product | null,
) {
  const basePayload = existingProduct ? productToUpsertPayload(existingProduct) : {
    name: '',
    slug: '',
    description: '-',
    shortDescription: '-',
    brandId: '1',
    categoryId: '1',
    productGroupId: '1',
    productTypeId: '1',
    unitId: '1',
    hsnCodeId: '1',
    styleId: '1',
    sku: '',
    hasVariants: false,
    basePrice: 0,
    costPrice: 0,
    taxId: '1',
    isFeatured: false,
    isActive: true,
    images: [],
    variants: [],
    prices: [],
    discounts: [],
    offers: [],
    attributes: [],
    attributeValues: [],
    stockItems: [],
    stockMovements: [],
    seo: null,
    storefront: null,
    tags: [],
    reviews: [],
  } satisfies ProductUpsertPayload

  const itemName = toStringValue(record.item_name || record.name).trim() || 'Frappe Item'
  const itemCode = buildFrappeItemSku(record)
  const description = stripHtml(toStringValue(record.description)) || itemName
  const basePrice = Number(record.standard_rate ?? basePayload.basePrice ?? 0) || 0
  const costPrice = Number(record.valuation_rate ?? basePayload.costPrice ?? 0) || 0
  const stockQuantity = Number(record.opening_stock ?? 0) || 0
  const department = inferStorefrontDepartment(toStringValue(record.item_group), itemName)
  const shouldPreserveVariantStructure = Boolean(existingProduct?.hasVariants)

  return {
    ...basePayload,
    name: itemName,
    slug: buildFrappeItemSlug(record),
    description,
    shortDescription: truncateText(description, 160) || itemName,
    brandId: refs.brandId,
    categoryId: refs.categoryId,
    productGroupId: refs.productGroupId,
    productTypeId: basePayload.productTypeId || '1',
    unitId: refs.unitId,
    hsnCodeId: refs.hsnCodeId,
    styleId: basePayload.styleId || '1',
    sku: itemCode,
    hasVariants: shouldPreserveVariantStructure,
    basePrice,
    costPrice,
    taxId: basePayload.taxId || '1',
    isFeatured: basePayload.isFeatured,
    isActive: !toBooleanValue(record.disabled),
    prices: shouldPreserveVariantStructure
      ? basePayload.prices
      : [{
          variantClientKey: null,
          mrp: basePrice,
          sellingPrice: basePrice,
          costPrice,
        }],
    stockItems: shouldPreserveVariantStructure
      ? basePayload.stockItems
      : [{
          variantClientKey: null,
          warehouseId: refs.warehouseId,
          quantity: stockQuantity,
          reservedQuantity: 0,
        }],
    stockMovements: shouldPreserveVariantStructure
      ? basePayload.stockMovements
      : stockQuantity > 0 ? [{
          variantClientKey: null,
          warehouseId: refs.warehouseId,
          movementType: 'frappe-sync',
          quantity: stockQuantity,
          referenceType: 'frappe-item',
          referenceId: itemCode,
          movementAt: new Date().toISOString().slice(0, 16),
        }] : [],
    seo: {
      metaTitle: existingProduct?.seo?.metaTitle ?? itemName,
      metaDescription: existingProduct?.seo?.metaDescription ?? (truncateText(description, 160) || description),
      metaKeywords: existingProduct?.seo?.metaKeywords ?? [toStringValue(record.brand), toStringValue(record.item_group), itemCode].filter(Boolean).join(', '),
    },
    storefront: {
      department: existingProduct?.storefront?.department ?? department,
      homeSliderEnabled: existingProduct?.storefront?.homeSliderEnabled ?? false,
      homeSliderOrder: existingProduct?.storefront?.homeSliderOrder ?? 0,
      promoSliderEnabled: existingProduct?.storefront?.promoSliderEnabled ?? false,
      promoSliderOrder: existingProduct?.storefront?.promoSliderOrder ?? 0,
      featureSectionEnabled: existingProduct?.storefront?.featureSectionEnabled ?? false,
      featureSectionOrder: existingProduct?.storefront?.featureSectionOrder ?? 0,
      isNewArrival: existingProduct?.storefront?.isNewArrival ?? true,
      isBestSeller: existingProduct?.storefront?.isBestSeller ?? false,
      isFeaturedLabel: existingProduct?.storefront?.isFeaturedLabel ?? false,
      catalogBadge: existingProduct?.storefront?.catalogBadge ?? 'ERP',
      fabric: existingProduct?.storefront?.fabric ?? null,
      fit: existingProduct?.storefront?.fit ?? null,
      sleeve: existingProduct?.storefront?.sleeve ?? null,
      occasion: existingProduct?.storefront?.occasion ?? null,
      shippingNote: existingProduct?.storefront?.shippingNote ?? 'Synced from Frappe ERPNext.',
    },
    tags: buildTagInputs(record, basePayload.tags),
    reviews: basePayload.reviews,
  } satisfies ProductUpsertPayload
}

function buildItemDefaults(defaultWarehouse: string) {
  const company = environment.frappe.defaultCompany.trim()
  const warehouse = defaultWarehouse.trim()

  if (!company || !warehouse) {
    return undefined
  }

  return [
    {
      company,
      default_warehouse: warehouse,
    },
  ]
}

function toItemRequestBody(payload: {
  itemCode: string
  itemName: string
  description: string
  itemGroup: string
  stockUom: string
  brand: string
  gstHsnCode: string
  defaultWarehouse: string
  disabled: boolean
  isStockItem: boolean
}) {
  const itemDefaults = buildItemDefaults(payload.defaultWarehouse)

  return JSON.stringify({
    item_code: payload.itemCode,
    item_name: payload.itemName,
    custom_print_name: payload.itemName,
    description: payload.description || null,
    item_group: payload.itemGroup,
    stock_uom: payload.stockUom,
    brand: payload.brand || null,
    gst_hsn_code: payload.gstHsnCode,
    disabled: payload.disabled ? 1 : 0,
    is_stock_item: payload.isStockItem ? 1 : 0,
    is_sales_item: 1,
    is_purchase_item: 1,
    uoms: [
      {
        uom: payload.stockUom,
        conversion_factor: 1,
      },
    ],
    item_defaults: itemDefaults,
  })
}

async function readFrappeItemReferences() {
  const [itemGroups, stockUoms, warehouses, brands, gstHsnCodes] = await Promise.all([
    listFrappeDoctype('Item Group', ['name', 'is_group'], {
      limitPageLength: 1000,
      orderBy: 'name asc',
    }),
    listFrappeDoctype('UOM', ['name', 'enabled'], {
      limitPageLength: 1000,
      orderBy: 'name asc',
    }),
    listFrappeDoctype('Warehouse', ['name', 'company', 'is_group', 'disabled'], {
      limitPageLength: 1000,
      orderBy: 'name asc',
    }),
    listFrappeDoctype('Brand', ['name'], {
      limitPageLength: 1000,
      orderBy: 'name asc',
    }),
    listFrappeDoctype('GST HSN Code', ['name', 'description'], {
      limitPageLength: 500,
      orderBy: 'name asc',
    }),
  ])

  return {
    itemGroups: itemGroups.map((record) =>
      toReferenceOption(record, {
        description: toBooleanValue(record.is_group) ? 'Group node' : '',
      })),
    stockUoms: stockUoms.map((record) => toReferenceOption(record)),
    warehouses: warehouses.map((record) =>
      toReferenceOption(record, {
        description: toStringValue(record.company),
      })),
    brands: brands.map((record) => toReferenceOption(record)),
    gstHsnCodes: gstHsnCodes.map((record) =>
      toReferenceOption(record, {
        description: toStringValue(record.description),
      })),
    defaults: {
      company: environment.frappe.defaultCompany.trim(),
      warehouse: environment.frappe.defaultWarehouse.trim(),
      itemGroup: environment.frappe.defaultItemGroup.trim(),
      priceList: environment.frappe.defaultPriceList.trim(),
    },
  }
}

export async function listFrappeItems(user: AuthUser) {
  assertFrappeViewer(user)

  const [items, references] = await Promise.all([
    listFrappeDoctype(
      'Item',
      ['name', 'item_code', 'item_name', 'description', 'item_group', 'stock_uom', 'brand', 'gst_hsn_code', 'disabled', 'is_stock_item', 'has_variants', 'modified'],
      {
        limitPageLength: 1000,
        orderBy: 'name asc',
      },
    ),
    readFrappeItemReferences(),
  ])
  const productsBySku = await listSyncedProductsBySku(
    items.map((record) => toStringValue(record.item_code || record.name)),
  )

  return frappeItemManagerResponseSchema.parse({
    manager: {
      items: items.map((record) => toFrappeItem(
        record,
        productsBySku.get(toStringValue(record.item_code || record.name).trim()) ?? null,
      )),
      references,
      syncedAt: new Date().toISOString(),
    },
  })
}

export async function getFrappeItem(user: AuthUser, itemId: string) {
  assertSuperAdmin(user)

  const record = await readFrappeItemRecordById(itemId)
  const productsBySku = await listSyncedProductsBySku([toStringValue(record.item_code || record.name)])

  return frappeItemResponseSchema.parse({
    item: toFrappeItem(
      record,
      productsBySku.get(toStringValue(record.item_code || record.name).trim()) ?? null,
    ),
  })
}

export async function createFrappeItem(user: AuthUser, payload: unknown) {
  assertSuperAdmin(user)

  const parsedPayload = frappeItemUpsertPayloadSchema.parse(payload)
  const createdPayload = await requestFrappeJson('/api/resource/Item', {
    method: 'POST',
    body: toItemRequestBody(parsedPayload),
  })
  const createdRecord = createdPayload && typeof createdPayload.data === 'object' && createdPayload.data
    ? createdPayload.data as Record<string, unknown>
    : null
  const itemId = toStringValue(createdRecord?.name)

  if (!itemId) {
    throw new ApplicationError('Frappe Item create response did not include a document id.', {}, 502)
  }

  return getFrappeItem(user, itemId)
}

export async function updateFrappeItem(user: AuthUser, itemId: string, payload: unknown) {
  assertSuperAdmin(user)

  const parsedPayload = frappeItemUpsertPayloadSchema.parse(payload)
  await requestFrappeJson(`/api/resource/Item/${encodeURIComponent(itemId)}`, {
    method: 'PUT',
    body: toItemRequestBody(parsedPayload),
  })

  return getFrappeItem(user, itemId)
}

export async function syncFrappeItemsToProducts(user: AuthUser, payload: unknown) {
  assertSuperAdmin(user)

  const parsedPayload = frappeItemProductSyncPayloadSchema.parse(payload)
  const startedAt = new Date()
  const results: Array<{
    frappeItemId: string
    frappeItemCode: string
    productId: string
    productName: string
    productSlug: string
    mode: 'create' | 'update' | 'skipped'
  }> = []
  const logItems: FrappeItemProductSyncLogItem[] = []
  const failureEntries: Array<Pick<FrappeItemProductSyncLogItem, 'frappeItemId' | 'frappeItemCode' | 'mode' | 'reason'>> = []
  let successCount = 0
  let skippedCount = 0
  let failureCount = 0

  for (const itemId of parsedPayload.itemIds) {
    let itemCode = itemId
    let itemName = itemId

    try {
      const record = await readFrappeItemRecordById(itemId)
      itemCode = toStringValue(record.item_code || record.name).trim() || itemId
      itemName = toStringValue(record.item_name || record.name).trim() || itemCode
      const existingProduct = await productRepository.findBySku(itemCode)

      if (existingProduct && parsedPayload.duplicateMode === 'skip') {
        skippedCount += 1
        const skippedResult = {
          frappeItemId: itemId,
          frappeItemCode: itemCode,
          productId: existingProduct.id,
          productName: existingProduct.name,
          productSlug: existingProduct.slug,
          mode: 'skipped' as const,
        }

        results.push(skippedResult)
        logItems.push({
          ...skippedResult,
          reason: 'Duplicate product exists and overwrite was skipped.',
        })
        continue
      }

      const refs = await ensureProductReferenceIds(record)
      const productPayload = buildProductPayloadFromFrappe(record, refs, existingProduct)
      const response = existingProduct
        ? await productService.update(existingProduct.id, productPayload)
        : await productService.create(productPayload)

      successCount += 1
      const syncedResult = {
        frappeItemId: itemId,
        frappeItemCode: itemCode,
        productId: response.item.id,
        productName: response.item.name,
        productSlug: response.item.slug,
        mode: existingProduct ? 'update' as const : 'create' as const,
      }

      results.push(syncedResult)
      logItems.push({
        ...syncedResult,
        reason: '',
      })
    } catch (error) {
      failureCount += 1
      const reason = toErrorDetail(error)
      const failedEntry = {
        frappeItemId: itemId,
        frappeItemCode: itemCode,
        mode: 'failed' as const,
        reason,
      }

      failureEntries.push(failedEntry)
      logItems.push({
        frappeItemId: itemId,
        frappeItemCode: itemCode,
        productId: null,
        productName: itemName,
        productSlug: null,
        mode: 'failed',
        reason,
      })
    }
  }

  const finishedAt = new Date()
  const logId = await createFrappeItemProductSyncLog({
    duplicateMode: parsedPayload.duplicateMode,
    requestedCount: parsedPayload.itemIds.length,
    successCount,
    skippedCount,
    failureCount,
    startedAt,
    finishedAt,
    syncedAt: finishedAt,
    createdByUserId: user.id,
    items: logItems,
    failures: failureEntries,
  })

  return frappeItemProductSyncResponseSchema.parse({
    sync: {
      items: results,
      summary: {
        logId,
        requestedCount: parsedPayload.itemIds.length,
        successCount,
        skippedCount,
        failureCount,
      },
      syncedAt: finishedAt.toISOString(),
    },
  })
}

export async function listFrappeItemProductSyncLogs(user: AuthUser) {
  assertSuperAdmin(user)

  const logs = await readFrappeItemProductSyncLogs(20)

  return frappeItemProductSyncLogManagerResponseSchema.parse({
    manager: {
      items: logs,
      syncedAt: new Date().toISOString(),
    },
  })
}
