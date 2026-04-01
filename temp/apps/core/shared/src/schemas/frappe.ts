import { z } from 'zod'

export const frappeSettingsSchema = z.object({
  enabled: z.boolean(),
  baseUrl: z.string().trim(),
  siteName: z.string().trim(),
  apiKey: z.string().trim(),
  apiSecret: z.string().trim(),
  timeoutSeconds: z.number().int().min(1).max(120),
  defaultCompany: z.string().trim(),
  defaultWarehouse: z.string().trim(),
  defaultPriceList: z.string().trim(),
  defaultCustomerGroup: z.string().trim(),
  defaultItemGroup: z.string().trim(),
  isConfigured: z.boolean(),
})

export const frappeSettingsResponseSchema = z.object({
  settings: frappeSettingsSchema,
})

export const frappeSettingsUpdatePayloadSchema = z.object({
  enabled: z.boolean(),
  baseUrl: z.string().trim(),
  siteName: z.string().trim(),
  apiKey: z.string().trim(),
  apiSecret: z.string().trim(),
  timeoutSeconds: z.number().int().min(1).max(120),
  defaultCompany: z.string().trim(),
  defaultWarehouse: z.string().trim(),
  defaultPriceList: z.string().trim(),
  defaultCustomerGroup: z.string().trim(),
  defaultItemGroup: z.string().trim(),
})

export const frappeConnectionVerificationSchema = z.object({
  ok: z.boolean(),
  message: z.string().min(1),
  detail: z.string().trim(),
  serverUrl: z.string().trim(),
  siteName: z.string().trim(),
  connectedUser: z.string().trim(),
})

export const frappeConnectionVerificationResponseSchema = z.object({
  verification: frappeConnectionVerificationSchema,
})

export const frappeTodoStatusSchema = z.enum(['Open', 'Closed', 'Cancelled'])
export const frappeTodoPrioritySchema = z.enum(['Low', 'Medium', 'High'])

export const frappeTodoSchema = z.object({
  id: z.string().trim().min(1),
  description: z.string().trim(),
  status: frappeTodoStatusSchema,
  priority: frappeTodoPrioritySchema,
  dueDate: z.string().trim(),
  allocatedTo: z.string().trim(),
  owner: z.string().trim(),
  modifiedAt: z.string().trim(),
})

export const frappeTodoListSchema = z.object({
  items: z.array(frappeTodoSchema),
  syncedAt: z.string().trim().min(1),
})

export const frappeTodoListResponseSchema = z.object({
  todos: frappeTodoListSchema,
})

export const frappeTodoUpsertPayloadSchema = z.object({
  description: z.string().trim().min(1),
  status: frappeTodoStatusSchema,
  priority: frappeTodoPrioritySchema,
  dueDate: z.string().trim(),
  allocatedTo: z.string().trim(),
})

export const frappeTodoResponseSchema = z.object({
  item: frappeTodoSchema,
})

export const frappeReferenceOptionSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1),
  description: z.string().trim(),
  disabled: z.boolean(),
  isGroup: z.boolean(),
})

export const frappeItemSchema = z.object({
  id: z.string().trim().min(1),
  itemCode: z.string().trim().min(1),
  itemName: z.string().trim().min(1),
  description: z.string().trim(),
  itemGroup: z.string().trim(),
  stockUom: z.string().trim(),
  brand: z.string().trim(),
  gstHsnCode: z.string().trim(),
  defaultCompany: z.string().trim(),
  defaultWarehouse: z.string().trim(),
  disabled: z.boolean(),
  isStockItem: z.boolean(),
  hasVariants: z.boolean(),
  modifiedAt: z.string().trim(),
  syncedProductId: z.string().trim(),
  syncedProductName: z.string().trim(),
  syncedProductSlug: z.string().trim(),
  isSyncedToProduct: z.boolean(),
})

export const frappeItemReferencesSchema = z.object({
  itemGroups: z.array(frappeReferenceOptionSchema),
  stockUoms: z.array(frappeReferenceOptionSchema),
  warehouses: z.array(frappeReferenceOptionSchema),
  brands: z.array(frappeReferenceOptionSchema),
  gstHsnCodes: z.array(frappeReferenceOptionSchema),
  defaults: z.object({
    company: z.string().trim(),
    warehouse: z.string().trim(),
    itemGroup: z.string().trim(),
    priceList: z.string().trim(),
  }),
})

export const frappeItemManagerSchema = z.object({
  items: z.array(frappeItemSchema),
  references: frappeItemReferencesSchema,
  syncedAt: z.string().trim().min(1),
})

export const frappeItemManagerResponseSchema = z.object({
  manager: frappeItemManagerSchema,
})

export const frappeItemUpsertPayloadSchema = z.object({
  itemCode: z.string().trim().min(1),
  itemName: z.string().trim().min(1),
  description: z.string().trim(),
  itemGroup: z.string().trim().min(1),
  stockUom: z.string().trim().min(1),
  brand: z.string().trim().min(1),
  gstHsnCode: z.string().trim().min(1),
  defaultWarehouse: z.string().trim(),
  disabled: z.boolean(),
  isStockItem: z.boolean(),
})

export const frappeItemResponseSchema = z.object({
  item: frappeItemSchema,
})

export const frappeItemProductSyncPayloadSchema = z.object({
  itemIds: z.array(z.string().trim().min(1)).min(1),
  duplicateMode: z.enum(['overwrite', 'skip']).default('overwrite'),
})

export const frappeItemProductSyncResultSchema = z.object({
  frappeItemId: z.string().trim().min(1),
  frappeItemCode: z.string().trim().min(1),
  productId: z.string().trim().min(1),
  productName: z.string().trim().min(1),
  productSlug: z.string().trim().min(1),
  mode: z.enum(['create', 'update', 'skipped']),
})

export const frappeItemProductSyncLogItemSchema = z.object({
  frappeItemId: z.string().trim().min(1),
  frappeItemCode: z.string().trim().min(1),
  productId: z.string().trim().nullable(),
  productName: z.string().trim().nullable(),
  productSlug: z.string().trim().nullable(),
  mode: z.enum(['create', 'update', 'skipped', 'failed']),
  reason: z.string().trim(),
})

export const frappeItemProductSyncLogSchema = z.object({
  id: z.string().trim().min(1),
  duplicateMode: z.enum(['overwrite', 'skip']),
  requestedCount: z.number().int().nonnegative(),
  successCount: z.number().int().nonnegative(),
  skippedCount: z.number().int().nonnegative(),
  failureCount: z.number().int().nonnegative(),
  startedAt: z.string().trim().min(1),
  finishedAt: z.string().trim().min(1),
  syncedAt: z.string().trim().min(1),
  createdByUserId: z.string().trim().nullable(),
  summary: z.string().trim(),
  items: z.array(frappeItemProductSyncLogItemSchema),
})

export const frappeItemProductSyncLogManagerSchema = z.object({
  items: z.array(frappeItemProductSyncLogSchema),
  syncedAt: z.string().trim().min(1),
})

export const frappeItemProductSyncLogManagerResponseSchema = z.object({
  manager: frappeItemProductSyncLogManagerSchema,
})

export const frappeItemProductSyncResponseSchema = z.object({
  sync: z.object({
    items: z.array(frappeItemProductSyncResultSchema),
    summary: z.object({
      logId: z.string().trim().min(1),
      requestedCount: z.number().int().nonnegative(),
      successCount: z.number().int().nonnegative(),
      skippedCount: z.number().int().nonnegative(),
      failureCount: z.number().int().nonnegative(),
    }),
    syncedAt: z.string().trim().min(1),
  }),
})

export const frappePurchaseReceiptItemSchema = z.object({
  id: z.string().trim().min(1),
  itemCode: z.string().trim().min(1),
  itemName: z.string().trim().min(1),
  description: z.string().trim(),
  warehouse: z.string().trim(),
  uom: z.string().trim(),
  stockUom: z.string().trim(),
  quantity: z.number(),
  receivedQuantity: z.number(),
  rejectedQuantity: z.number(),
  rate: z.number(),
  amount: z.number(),
  productId: z.string().trim(),
  productName: z.string().trim(),
  productSlug: z.string().trim(),
  isSyncedToProduct: z.boolean(),
})

export const frappePurchaseReceiptSchema = z.object({
  id: z.string().trim().min(1),
  receiptNumber: z.string().trim().min(1),
  supplier: z.string().trim(),
  supplierName: z.string().trim(),
  company: z.string().trim(),
  warehouse: z.string().trim(),
  billNo: z.string().trim(),
  currency: z.string().trim(),
  postingDate: z.string().trim(),
  postingTime: z.string().trim(),
  status: z.string().trim(),
  isReturn: z.boolean(),
  grandTotal: z.number(),
  roundedTotal: z.number(),
  itemCount: z.number().int().nonnegative(),
  linkedProductCount: z.number().int().nonnegative(),
  modifiedAt: z.string().trim(),
  syncedRecordId: z.string().trim(),
  syncedAt: z.string().trim(),
  isSyncedLocally: z.boolean(),
  items: z.array(frappePurchaseReceiptItemSchema),
})

export const frappePurchaseReceiptReferencesSchema = z.object({
  suppliers: z.array(frappeReferenceOptionSchema),
  companies: z.array(frappeReferenceOptionSchema),
  warehouses: z.array(frappeReferenceOptionSchema),
  statuses: z.array(frappeReferenceOptionSchema),
  defaults: z.object({
    company: z.string().trim(),
    warehouse: z.string().trim(),
  }),
})

export const frappePurchaseReceiptManagerSchema = z.object({
  items: z.array(frappePurchaseReceiptSchema),
  references: frappePurchaseReceiptReferencesSchema,
  syncedAt: z.string().trim().min(1),
})

export const frappePurchaseReceiptManagerResponseSchema = z.object({
  manager: frappePurchaseReceiptManagerSchema,
})

export const frappePurchaseReceiptResponseSchema = z.object({
  item: frappePurchaseReceiptSchema,
})

export const frappePurchaseReceiptSyncPayloadSchema = z.object({
  receiptIds: z.array(z.string().trim().min(1)).min(1),
})

export const frappePurchaseReceiptSyncResultSchema = z.object({
  frappeReceiptId: z.string().trim().min(1),
  receiptNumber: z.string().trim().min(1),
  syncedRecordId: z.string().trim().min(1),
  itemCount: z.number().int().nonnegative(),
  linkedProductCount: z.number().int().nonnegative(),
  mode: z.enum(['create', 'update']),
})

export const frappePurchaseReceiptSyncResponseSchema = z.object({
  sync: z.object({
    items: z.array(frappePurchaseReceiptSyncResultSchema),
    syncedAt: z.string().trim().min(1),
  }),
})

export type FrappeSettings = z.infer<typeof frappeSettingsSchema>
export type FrappeSettingsResponse = z.infer<typeof frappeSettingsResponseSchema>
export type FrappeSettingsUpdatePayload = z.infer<typeof frappeSettingsUpdatePayloadSchema>
export type FrappeConnectionVerification = z.infer<typeof frappeConnectionVerificationSchema>
export type FrappeConnectionVerificationResponse = z.infer<typeof frappeConnectionVerificationResponseSchema>
export type FrappeTodoStatus = z.infer<typeof frappeTodoStatusSchema>
export type FrappeTodoPriority = z.infer<typeof frappeTodoPrioritySchema>
export type FrappeTodo = z.infer<typeof frappeTodoSchema>
export type FrappeTodoList = z.infer<typeof frappeTodoListSchema>
export type FrappeTodoListResponse = z.infer<typeof frappeTodoListResponseSchema>
export type FrappeTodoUpsertPayload = z.infer<typeof frappeTodoUpsertPayloadSchema>
export type FrappeTodoResponse = z.infer<typeof frappeTodoResponseSchema>
export type FrappeReferenceOption = z.infer<typeof frappeReferenceOptionSchema>
export type FrappeItem = z.infer<typeof frappeItemSchema>
export type FrappeItemReferences = z.infer<typeof frappeItemReferencesSchema>
export type FrappeItemManager = z.infer<typeof frappeItemManagerSchema>
export type FrappeItemManagerResponse = z.infer<typeof frappeItemManagerResponseSchema>
export type FrappeItemUpsertPayload = z.infer<typeof frappeItemUpsertPayloadSchema>
export type FrappeItemResponse = z.infer<typeof frappeItemResponseSchema>
export type FrappeItemProductSyncPayload = z.infer<typeof frappeItemProductSyncPayloadSchema>
export type FrappeItemProductSyncResult = z.infer<typeof frappeItemProductSyncResultSchema>
export type FrappeItemProductSyncLogItem = z.infer<typeof frappeItemProductSyncLogItemSchema>
export type FrappeItemProductSyncLog = z.infer<typeof frappeItemProductSyncLogSchema>
export type FrappeItemProductSyncLogManager = z.infer<typeof frappeItemProductSyncLogManagerSchema>
export type FrappeItemProductSyncLogManagerResponse = z.infer<typeof frappeItemProductSyncLogManagerResponseSchema>
export type FrappeItemProductSyncResponse = z.infer<typeof frappeItemProductSyncResponseSchema>
export type FrappePurchaseReceiptItem = z.infer<typeof frappePurchaseReceiptItemSchema>
export type FrappePurchaseReceipt = z.infer<typeof frappePurchaseReceiptSchema>
export type FrappePurchaseReceiptReferences = z.infer<typeof frappePurchaseReceiptReferencesSchema>
export type FrappePurchaseReceiptManager = z.infer<typeof frappePurchaseReceiptManagerSchema>
export type FrappePurchaseReceiptManagerResponse = z.infer<typeof frappePurchaseReceiptManagerResponseSchema>
export type FrappePurchaseReceiptResponse = z.infer<typeof frappePurchaseReceiptResponseSchema>
export type FrappePurchaseReceiptSyncPayload = z.infer<typeof frappePurchaseReceiptSyncPayloadSchema>
export type FrappePurchaseReceiptSyncResult = z.infer<typeof frappePurchaseReceiptSyncResultSchema>
export type FrappePurchaseReceiptSyncResponse = z.infer<typeof frappePurchaseReceiptSyncResponseSchema>
