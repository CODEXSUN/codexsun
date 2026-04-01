import { randomUUID } from 'node:crypto'
import type { RowDataPacket } from 'mysql2'
import {
  frappePurchaseReceiptManagerResponseSchema,
  frappePurchaseReceiptResponseSchema,
  frappePurchaseReceiptSchema,
  frappePurchaseReceiptItemSchema,
  frappePurchaseReceiptSyncPayloadSchema,
  frappePurchaseReceiptSyncResponseSchema,
  frappeReferenceOptionSchema,
  type AuthUser,
} from '@shared/index'
import { ensureDatabaseSchema } from '@framework-core/runtime/database/database'
import { db } from '@framework-core/runtime/database/orm'
import { frappeTableNames, productTableNames } from '@framework-core/runtime/database/table-names'
import { assertFrappeViewer, assertSuperAdmin, requestFrappeJson } from './frappe-client'
import { syncFrappeItemsToProducts } from './frappe-item-service'

function toStringValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function toNumberValue(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsedValue = Number(value)
    return Number.isFinite(parsedValue) ? parsedValue : 0
  }

  return 0
}

function toBooleanValue(value: unknown) {
  return value === true || value === 1 || value === '1'
}

function extractRows(payload: Record<string, unknown> | null) {
  return Array.isArray(payload?.data)
    ? payload.data as Record<string, unknown>[]
    : []
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

function toReferenceOption(record: Record<string, unknown>, labelField?: string) {
  const label = toStringValue(labelField ? record[labelField] : record.name) || toStringValue(record.name)
  return frappeReferenceOptionSchema.parse({
    id: toStringValue(record.name),
    label,
    description: '',
    disabled: toBooleanValue(record.disabled) || !toBooleanValue(record.enabled ?? true),
    isGroup: toBooleanValue(record.is_group),
  })
}

interface ProductLinkRow extends RowDataPacket {
  id: string
  name: string
  slug: string
  sku: string
}

interface SyncedReceiptRow extends RowDataPacket {
  id: string
  frappe_receipt_id: string
  item_count: number
  product_count: number
  synced_at: Date | string
}

async function listLinkedProductsBySku(itemCodes: string[]) {
  await ensureDatabaseSchema()

  const uniqueCodes = [...new Set(itemCodes.map((value) => value.trim()).filter(Boolean))]
  if (uniqueCodes.length === 0) {
    return new Map<string, ProductLinkRow>()
  }

  const placeholders = uniqueCodes.map(() => '?').join(', ')
  const rows = await db.query<ProductLinkRow>(
    `SELECT id, name, slug, sku FROM ${productTableNames.products} WHERE sku IN (${placeholders})`,
    uniqueCodes,
  )

  return new Map(rows.map((row) => [row.sku.trim(), row] as const))
}

async function listSyncedReceiptsById(receiptIds: string[]) {
  await ensureDatabaseSchema()

  const uniqueIds = [...new Set(receiptIds.map((value) => value.trim()).filter(Boolean))]
  if (uniqueIds.length === 0) {
    return new Map<string, SyncedReceiptRow>()
  }

  const placeholders = uniqueIds.map(() => '?').join(', ')
  const rows = await db.query<SyncedReceiptRow>(
    `SELECT id, frappe_receipt_id, item_count, product_count, synced_at FROM ${frappeTableNames.purchaseReceipts} WHERE frappe_receipt_id IN (${placeholders})`,
    uniqueIds,
  )

  return new Map(rows.map((row) => [row.frappe_receipt_id.trim(), row] as const))
}

function readPurchaseItems(record: Record<string, unknown>) {
  return Array.isArray(record.items)
    ? record.items as Record<string, unknown>[]
    : []
}

async function readPurchaseReceiptRecordById(receiptId: string) {
  const payload = await requestFrappeJson(`/api/resource/Purchase Receipt/${encodeURIComponent(receiptId)}`)
  const record = payload && typeof payload.data === 'object' && payload.data
    ? payload.data as Record<string, unknown>
    : null

  if (!record) {
    throw new Error(`Purchase Receipt ${receiptId} could not be loaded.`)
  }

  return record
}

function toPurchaseReceiptItem(
  record: Record<string, unknown>,
  linkedProduct: ProductLinkRow | null,
) {
  return frappePurchaseReceiptItemSchema.parse({
    id: toStringValue(record.name) || `${toStringValue(record.item_code)}:${toStringValue(record.idx)}`,
    itemCode: toStringValue(record.item_code),
    itemName: toStringValue(record.item_name),
    description: stripHtml(toStringValue(record.description)),
    warehouse: toStringValue(record.warehouse),
    uom: toStringValue(record.uom),
    stockUom: toStringValue(record.stock_uom),
    quantity: toNumberValue(record.qty),
    receivedQuantity: toNumberValue(record.received_qty || record.qty),
    rejectedQuantity: toNumberValue(record.rejected_qty),
    rate: toNumberValue(record.rate),
    amount: toNumberValue(record.amount),
    productId: linkedProduct?.id ?? '',
    productName: linkedProduct?.name ?? '',
    productSlug: linkedProduct?.slug ?? '',
    isSyncedToProduct: Boolean(linkedProduct?.id),
  })
}

function toPurchaseReceipt(
  record: Record<string, unknown>,
  syncedReceipt: SyncedReceiptRow | null,
  linkedProductsBySku: Map<string, ProductLinkRow>,
) {
  const items = readPurchaseItems(record).map((item) => {
    const itemCode = toStringValue(item.item_code).trim()
    return toPurchaseReceiptItem(item, linkedProductsBySku.get(itemCode) ?? null)
  })

  return frappePurchaseReceiptSchema.parse({
    id: toStringValue(record.name),
    receiptNumber: toStringValue(record.name),
    supplier: toStringValue(record.supplier),
    supplierName: toStringValue(record.supplier_name || record.supplier),
    company: toStringValue(record.company),
    warehouse: toStringValue(record.set_warehouse),
    billNo: toStringValue(record.bill_no),
    currency: toStringValue(record.currency),
    postingDate: toStringValue(record.posting_date),
    postingTime: toStringValue(record.posting_time),
    status: toStringValue(record.status) || 'Draft',
    isReturn: toBooleanValue(record.is_return),
    grandTotal: toNumberValue(record.grand_total),
    roundedTotal: toNumberValue(record.rounded_total || record.grand_total),
    itemCount: items.length,
    linkedProductCount: items.filter((item) => item.isSyncedToProduct).length,
    modifiedAt: toStringValue(record.modified),
    syncedRecordId: syncedReceipt?.id ?? '',
    syncedAt: syncedReceipt?.synced_at instanceof Date
      ? syncedReceipt.synced_at.toISOString()
      : toStringValue(syncedReceipt?.synced_at),
    isSyncedLocally: Boolean(syncedReceipt?.id),
    items,
  })
}

function createStatusReferences(items: Array<{ status: string }>) {
  return [...new Set(items.map((item) => item.status.trim()).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right))
    .map((status) => (
      frappeReferenceOptionSchema.parse({
        id: status,
        label: status,
        description: '',
        disabled: false,
        isGroup: false,
      })
    ))
}

export async function listFrappePurchaseReceipts(user: AuthUser) {
  assertFrappeViewer(user)

  const [receipts, suppliers, companies, warehouses] = await Promise.all([
    listFrappeDoctype(
      'Purchase Receipt',
      ['name', 'modified'],
      { limitPageLength: 40, orderBy: 'modified desc' },
    ),
    listFrappeDoctype('Supplier', ['name', 'supplier_name'], { limitPageLength: 200, orderBy: 'modified desc' }),
    listFrappeDoctype('Company', ['name', 'abbr', 'default_currency'], { limitPageLength: 50, orderBy: 'modified desc' }),
    listFrappeDoctype('Warehouse', ['name', 'is_group'], { limitPageLength: 200, orderBy: 'modified desc' }),
  ])

  const detailedReceipts = await Promise.all(
    receipts.map((receipt) => readPurchaseReceiptRecordById(toStringValue(receipt.name))),
  )

  const receiptIds = detailedReceipts.map((receipt) => toStringValue(receipt.name))
  const itemCodes = detailedReceipts.flatMap((receipt) =>
    readPurchaseItems(receipt).map((item) => toStringValue(item.item_code)),
  )

  const [linkedProductsBySku, syncedReceiptsById] = await Promise.all([
    listLinkedProductsBySku(itemCodes),
    listSyncedReceiptsById(receiptIds),
  ])

  const items = detailedReceipts.map((receipt) =>
    toPurchaseReceipt(receipt, syncedReceiptsById.get(toStringValue(receipt.name)) ?? null, linkedProductsBySku),
  )

  return frappePurchaseReceiptManagerResponseSchema.parse({
    manager: {
      items,
      references: {
        suppliers: suppliers.map((record) => toReferenceOption(record, 'supplier_name')),
        companies: companies.map((record) => toReferenceOption(record, 'name')),
        warehouses: warehouses
          .map((record) => toReferenceOption(record, 'name'))
          .filter((option) => !option.isGroup),
        statuses: createStatusReferences(items),
        defaults: {
          company: '',
          warehouse: '',
        },
      },
      syncedAt: new Date().toISOString(),
    },
  })
}

export async function getFrappePurchaseReceipt(user: AuthUser, receiptId: string) {
  assertFrappeViewer(user)

  const record = await readPurchaseReceiptRecordById(receiptId)
  const receiptIds = [toStringValue(record.name)]
  const itemCodes = readPurchaseItems(record).map((item) => toStringValue(item.item_code))
  const [linkedProductsBySku, syncedReceiptsById] = await Promise.all([
    listLinkedProductsBySku(itemCodes),
    listSyncedReceiptsById(receiptIds),
  ])

  return frappePurchaseReceiptResponseSchema.parse({
    item: toPurchaseReceipt(
      record,
      syncedReceiptsById.get(toStringValue(record.name)) ?? null,
      linkedProductsBySku,
    ),
  })
}

async function upsertSyncedPurchaseReceipt(record: Record<string, unknown>, linkedProductsBySku: Map<string, ProductLinkRow>) {
  await ensureDatabaseSchema()

  const receiptId = toStringValue(record.name)
  const items = readPurchaseItems(record)
  const productCount = items.filter((item) => linkedProductsBySku.has(toStringValue(item.item_code).trim())).length

  return db.transaction(async (transaction) => {
    const existing = await transaction.first<{ id: string } & RowDataPacket>(
      `SELECT id FROM ${frappeTableNames.purchaseReceipts} WHERE frappe_receipt_id = ? LIMIT 1`,
      [receiptId],
    )

    const localId = existing?.id ?? `frappe-pr:${randomUUID()}`
    const syncedAt = new Date()

    if (existing) {
      await transaction.execute(
        `UPDATE ${frappeTableNames.purchaseReceipts}
         SET supplier = ?, supplier_name = ?, company = ?, warehouse = ?, bill_no = ?, currency = ?, posting_date = ?, posting_time = ?, status = ?, is_return = ?, grand_total = ?, rounded_total = ?, item_count = ?, product_count = ?, source_modified_at = ?, synced_at = ?
         WHERE id = ?`,
        [
          toStringValue(record.supplier),
          toStringValue(record.supplier_name || record.supplier),
          toStringValue(record.company),
          toStringValue(record.set_warehouse),
          toStringValue(record.bill_no),
          toStringValue(record.currency),
          toStringValue(record.posting_date) || null,
          toStringValue(record.posting_time),
          toStringValue(record.status) || 'Draft',
          toBooleanValue(record.is_return) ? 1 : 0,
          toNumberValue(record.grand_total),
          toNumberValue(record.rounded_total || record.grand_total),
          items.length,
          productCount,
          toStringValue(record.modified),
          syncedAt,
          localId,
        ],
      )
      await transaction.execute(
        `DELETE FROM ${frappeTableNames.purchaseReceiptItems} WHERE receipt_id = ?`,
        [localId],
      )
    } else {
      await transaction.insert(frappeTableNames.purchaseReceipts, {
        id: localId,
        frappe_receipt_id: receiptId,
        supplier: toStringValue(record.supplier),
        supplier_name: toStringValue(record.supplier_name || record.supplier),
        company: toStringValue(record.company),
        warehouse: toStringValue(record.set_warehouse),
        bill_no: toStringValue(record.bill_no),
        currency: toStringValue(record.currency),
        posting_date: toStringValue(record.posting_date) || null,
        posting_time: toStringValue(record.posting_time),
        status: toStringValue(record.status) || 'Draft',
        is_return: toBooleanValue(record.is_return),
        grand_total: toNumberValue(record.grand_total),
        rounded_total: toNumberValue(record.rounded_total || record.grand_total),
        item_count: items.length,
        product_count: productCount,
        source_modified_at: toStringValue(record.modified),
        synced_at: syncedAt,
      })
    }

    for (const item of items) {
      const itemCode = toStringValue(item.item_code).trim()
      const linkedProduct = linkedProductsBySku.get(itemCode) ?? null

      await transaction.insert(frappeTableNames.purchaseReceiptItems, {
        id: `frappe-pr-item:${randomUUID()}`,
        receipt_id: localId,
        frappe_row_id: toStringValue(item.name) || `${itemCode}:${toStringValue(item.idx)}`,
        item_code: itemCode,
        item_name: toStringValue(item.item_name),
        description: stripHtml(toStringValue(item.description)),
        warehouse: toStringValue(item.warehouse),
        uom: toStringValue(item.uom),
        stock_uom: toStringValue(item.stock_uom),
        quantity: toNumberValue(item.qty),
        received_quantity: toNumberValue(item.received_qty || item.qty),
        rejected_quantity: toNumberValue(item.rejected_qty),
        rate: toNumberValue(item.rate),
        amount: toNumberValue(item.amount),
        product_id: linkedProduct?.id ?? null,
      })
    }

    return {
      syncedRecordId: localId,
      mode: existing ? 'update' as const : 'create' as const,
      itemCount: items.length,
      linkedProductCount: productCount,
    }
  })
}

export async function syncFrappePurchaseReceipts(user: AuthUser, payload: unknown) {
  assertSuperAdmin(user)

  const parsedPayload = frappePurchaseReceiptSyncPayloadSchema.parse(payload)
  const uniqueReceiptIds = [...new Set(parsedPayload.receiptIds.map((value) => value.trim()).filter(Boolean))]
  const receiptRecords = await Promise.all(uniqueReceiptIds.map((receiptId) => readPurchaseReceiptRecordById(receiptId)))

  const itemCodes = [...new Set(
    receiptRecords.flatMap((record) => readPurchaseItems(record).map((item) => toStringValue(item.item_code).trim()).filter(Boolean)),
  )]

  if (itemCodes.length > 0) {
    await syncFrappeItemsToProducts(user, { itemIds: itemCodes })
  }

  const linkedProductsBySku = await listLinkedProductsBySku(itemCodes)
  const results = []

  for (const record of receiptRecords) {
    const syncResult = await upsertSyncedPurchaseReceipt(record, linkedProductsBySku)
    results.push({
      frappeReceiptId: toStringValue(record.name),
      receiptNumber: toStringValue(record.name),
      syncedRecordId: syncResult.syncedRecordId,
      itemCount: syncResult.itemCount,
      linkedProductCount: syncResult.linkedProductCount,
      mode: syncResult.mode,
    })
  }

  return frappePurchaseReceiptSyncResponseSchema.parse({
    sync: {
      items: results,
      syncedAt: new Date().toISOString(),
    },
  })
}
