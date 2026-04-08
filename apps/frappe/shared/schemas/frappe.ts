import { z } from "zod"

export const frappeSettingsSchema = z.object({
  enabled: z.boolean(),
  baseUrl: z.string().trim(),
  siteName: z.string().trim(),
  apiKey: z.string().trim(),
  apiSecret: z.string().trim(),
  hasApiKey: z.boolean(),
  hasApiSecret: z.boolean(),
  timeoutSeconds: z.number().int().min(1).max(120),
  defaultCompany: z.string().trim(),
  defaultWarehouse: z.string().trim(),
  defaultPriceList: z.string().trim(),
  defaultCustomerGroup: z.string().trim(),
  defaultItemGroup: z.string().trim(),
  isConfigured: z.boolean(),
  lastVerifiedAt: z.string().trim(),
  lastVerificationStatus: z.enum(["idle", "passed", "failed"]),
  lastVerificationMessage: z.string().trim(),
  lastVerificationDetail: z.string().trim(),
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

export const frappeSettingsVerificationPayloadSchema =
  frappeSettingsUpdatePayloadSchema.partial()

export const frappeConnectionVerificationSchema = z.object({
  ok: z.boolean(),
  message: z.string().min(1),
  detail: z.string().trim(),
  serverUrl: z.string().trim(),
  siteName: z.string().trim(),
  connectedUser: z.string().trim(),
  verifiedAt: z.string().trim(),
  usedSavedCredentials: z.boolean(),
  persistedToSettings: z.boolean(),
})

export const frappeConnectionVerificationResponseSchema = z.object({
  verification: frappeConnectionVerificationSchema,
})

export const frappeSyncOperationPolicySchema = z.object({
  operationKey: z.enum([
    "erp-read",
    "snapshot-refresh",
    "projection-write",
    "manual-replay",
  ]),
  label: z.string().trim().min(1),
  retryable: z.boolean(),
  maxAttempts: z.number().int().min(1),
  backoffSeconds: z.array(z.number().int().nonnegative()),
  timeoutSeconds: z.number().int().min(1).max(120),
  retryOn: z.array(z.string().trim().min(1)),
  failureDisposition: z.string().trim().min(1),
})

export const frappeSyncPolicySchema = z.object({
  generatedAt: z.string().trim().min(1),
  connectorEnabled: z.boolean(),
  verificationStatus: z.enum(["idle", "passed", "failed"]),
  policies: z.array(frappeSyncOperationPolicySchema).min(1),
  operatorRules: z.array(z.string().trim().min(1)).min(1),
})

export const frappeSyncPolicyResponseSchema = z.object({
  policy: frappeSyncPolicySchema,
})

export const frappeConnectorExceptionSchema = z.object({
  id: z.string().trim().min(1),
  action: z.string().trim().min(1),
  level: z.enum(["info", "warn", "error"]),
  message: z.string().trim().min(1),
  actorEmail: z.string().trim().nullable(),
  referenceId: z.string().trim().nullable(),
  createdAt: z.string().trim().min(1),
})

export const frappeObservabilityReportSchema = z.object({
  generatedAt: z.string().trim().min(1),
  summary: z.object({
    connectorFailureCount: z.number().int().nonnegative(),
    connectorSuccessCount: z.number().int().nonnegative(),
    alertState: z.enum(["healthy", "breached"]),
    threshold: z.number().int().positive(),
    lastFailureAt: z.string().trim().nullable(),
    lastSuccessAt: z.string().trim().nullable(),
  }),
  recentExceptions: z.array(frappeConnectorExceptionSchema),
})

export const frappeObservabilityReportResponseSchema = z.object({
  report: frappeObservabilityReportSchema,
})

export const frappeProjectionFieldMappingSchema = z.object({
  sourceField: z.string().trim().min(1),
  targetField: z.string().trim().min(1),
  rule: z.string().trim().min(1),
})

export const frappeItemProjectionContractSchema = z.object({
  generatedAt: z.string().trim().min(1),
  sourceEntity: z.literal("frappe_item_snapshot"),
  targetEntity: z.literal("core_product"),
  ownershipRule: z.string().trim().min(1),
  identityRules: z.array(z.string().trim().min(1)).min(1),
  fieldMappings: z.array(frappeProjectionFieldMappingSchema).min(1),
  lifecycleRules: z.array(z.string().trim().min(1)).min(1),
  outOfScopeRules: z.array(z.string().trim().min(1)).min(1),
})

export const frappeItemProjectionContractResponseSchema = z.object({
  contract: frappeItemProjectionContractSchema,
})

export const frappePriceProjectionContractSchema = z.object({
  generatedAt: z.string().trim().min(1),
  sourceEntity: z.literal("frappe_item_price_snapshot"),
  targetEntity: z.literal("core_product_price"),
  ownershipRule: z.string().trim().min(1),
  identityRules: z.array(z.string().trim().min(1)).min(1),
  fieldMappings: z.array(frappeProjectionFieldMappingSchema).min(1),
  lifecycleRules: z.array(z.string().trim().min(1)).min(1),
  outOfScopeRules: z.array(z.string().trim().min(1)).min(1),
})

export const frappePriceProjectionContractResponseSchema = z.object({
  contract: frappePriceProjectionContractSchema,
})

export const frappeStockProjectionContractSchema = z.object({
  generatedAt: z.string().trim().min(1),
  sourceEntity: z.literal("frappe_stock_snapshot"),
  targetEntity: z.literal("core_product_stock"),
  ownershipRule: z.string().trim().min(1),
  identityRules: z.array(z.string().trim().min(1)).min(1),
  fieldMappings: z.array(frappeProjectionFieldMappingSchema).min(1),
  lifecycleRules: z.array(z.string().trim().min(1)).min(1),
  outOfScopeRules: z.array(z.string().trim().min(1)).min(1),
})

export const frappeStockProjectionContractResponseSchema = z.object({
  contract: frappeStockProjectionContractSchema,
})

export const frappeCustomerCommercialProfileContractSchema = z.object({
  generatedAt: z.string().trim().min(1),
  sourceEntity: z.literal("frappe_customer_commercial_snapshot"),
  targetEntity: z.literal("ecommerce_customer_commercial_profile"),
  ownershipRule: z.string().trim().min(1),
  identityRules: z.array(z.string().trim().min(1)).min(1),
  fieldMappings: z.array(frappeProjectionFieldMappingSchema).min(1),
  lifecycleRules: z.array(z.string().trim().min(1)).min(1),
  outOfScopeRules: z.array(z.string().trim().min(1)).min(1),
})

export const frappeCustomerCommercialProfileContractResponseSchema = z.object({
  contract: frappeCustomerCommercialProfileContractSchema,
})

export const frappeSalesOrderSyncStatusSchema = z.enum(["synced", "failed"])

export const frappeSalesOrderSyncLineSchema = z.object({
  itemCode: z.string().trim().min(1),
  itemName: z.string().trim().min(1),
  quantity: z.number().finite().positive(),
  rate: z.number().finite().nonnegative(),
  amount: z.number().finite().nonnegative(),
})

export const frappeSalesOrderSyncRecordSchema = z.object({
  id: z.string().trim().min(1),
  storefrontOrderId: z.string().trim().min(1),
  storefrontOrderNumber: z.string().trim().min(1),
  providerPaymentId: z.string().trim().nullable(),
  source: z.string().trim().min(1),
  status: frappeSalesOrderSyncStatusSchema,
  erpSalesOrderId: z.string().trim().nullable(),
  erpSalesOrderName: z.string().trim().nullable(),
  customerCode: z.string().trim().min(1),
  customerName: z.string().trim().min(1),
  company: z.string().trim().min(1),
  currency: z.string().trim().min(1),
  grandTotal: z.number().finite().nonnegative(),
  itemLines: z.array(frappeSalesOrderSyncLineSchema).min(1),
  attemptCount: z.number().int().positive(),
  lastAttemptedAt: z.string().trim().min(1),
  syncedAt: z.string().trim().nullable(),
  failureMessage: z.string().trim().nullable(),
  createdAt: z.string().trim().min(1),
  updatedAt: z.string().trim().min(1),
})

export const frappeSalesOrderPushGateSchema = z.object({
  gateKey: z.enum([
    "connector_ready",
    "payment_committed",
    "manual_approval_scope",
    "duplicate_guard",
    "retry_policy",
  ]),
  label: z.string().trim().min(1),
  rule: z.string().trim().min(1),
})

export const frappeSalesOrderPushPolicySchema = z.object({
  generatedAt: z.string().trim().min(1),
  connectorEnabled: z.boolean(),
  verificationStatus: z.enum(["idle", "passed", "failed"]),
  approvalMode: z.enum(["auto_for_paid_orders", "manual_replay_after_failure"]),
  autoPushSources: z
    .array(z.enum(["checkout_verify", "razorpay_webhook", "payment_reconcile"]))
    .min(1),
  retryMode: z.enum(["no_auto_retry", "manual_replay_only"]),
  gates: z.array(frappeSalesOrderPushGateSchema).min(1),
  operatorRules: z.array(z.string().trim().min(1)).min(1),
})

export const frappeSalesOrderPushPolicyResponseSchema = z.object({
  policy: frappeSalesOrderPushPolicySchema,
})

export const frappeTransactionSyncStatusSchema = z.enum(["synced", "failed"])
export const frappeDeliveryStatusSchema = z.enum([
  "fulfilment_pending",
  "shipped",
  "delivered",
])
export const frappeReturnWorkflowStatusSchema = z.enum([
  "requested",
  "approved",
  "received",
  "completed",
  "rejected",
])

export const frappeDeliveryNoteSyncRecordSchema = z.object({
  id: z.string().trim().min(1),
  storefrontOrderId: z.string().trim().min(1),
  storefrontOrderNumber: z.string().trim().min(1),
  source: z.string().trim().min(1),
  status: frappeTransactionSyncStatusSchema,
  deliveryNoteId: z.string().trim().nullable(),
  deliveryNoteName: z.string().trim().nullable(),
  shipmentReference: z.string().trim().nullable(),
  carrierName: z.string().trim().nullable(),
  trackingId: z.string().trim().nullable(),
  trackingUrl: z.string().trim().nullable(),
  deliveryStatus: frappeDeliveryStatusSchema,
  note: z.string().trim().nullable(),
  lastAttemptedAt: z.string().trim().min(1),
  syncedAt: z.string().trim().nullable(),
  failureMessage: z.string().trim().nullable(),
  createdAt: z.string().trim().min(1),
  updatedAt: z.string().trim().min(1),
})

export const frappeDeliveryNoteSyncPayloadSchema = z.object({
  storefrontOrderId: z.string().trim().min(1),
  deliveryNoteId: z.string().trim().nullable().optional().default(null),
  deliveryNoteName: z.string().trim().nullable().optional().default(null),
  shipmentReference: z.string().trim().nullable().optional().default(null),
  carrierName: z.string().trim().nullable().optional().default(null),
  trackingId: z.string().trim().nullable().optional().default(null),
  trackingUrl: z.string().trim().nullable().optional().default(null),
  deliveryStatus: frappeDeliveryStatusSchema,
  note: z.string().trim().nullable().optional().default(null),
  status: frappeTransactionSyncStatusSchema.optional().default("synced"),
  failureMessage: z.string().trim().nullable().optional().default(null),
})

export const frappeDeliveryNoteSyncResponseSchema = z.object({
  sync: frappeDeliveryNoteSyncRecordSchema,
})

export const frappeInvoiceSyncRecordSchema = z.object({
  id: z.string().trim().min(1),
  storefrontOrderId: z.string().trim().min(1),
  storefrontOrderNumber: z.string().trim().min(1),
  source: z.string().trim().min(1),
  status: frappeTransactionSyncStatusSchema,
  invoiceId: z.string().trim().nullable(),
  invoiceName: z.string().trim().nullable(),
  invoiceNumber: z.string().trim().nullable(),
  invoiceStatus: z.string().trim().nullable(),
  lastAttemptedAt: z.string().trim().min(1),
  syncedAt: z.string().trim().nullable(),
  failureMessage: z.string().trim().nullable(),
  createdAt: z.string().trim().min(1),
  updatedAt: z.string().trim().min(1),
})

export const frappeInvoiceSyncPayloadSchema = z.object({
  storefrontOrderId: z.string().trim().min(1),
  invoiceId: z.string().trim().nullable().optional().default(null),
  invoiceName: z.string().trim().nullable().optional().default(null),
  invoiceNumber: z.string().trim().nullable().optional().default(null),
  invoiceStatus: z.string().trim().nullable().optional().default(null),
  status: frappeTransactionSyncStatusSchema.optional().default("synced"),
  failureMessage: z.string().trim().nullable().optional().default(null),
})

export const frappeInvoiceSyncResponseSchema = z.object({
  sync: frappeInvoiceSyncRecordSchema,
})

export const frappeReturnSyncRecordSchema = z.object({
  id: z.string().trim().min(1),
  storefrontOrderId: z.string().trim().min(1),
  storefrontOrderNumber: z.string().trim().min(1),
  source: z.string().trim().min(1),
  status: frappeTransactionSyncStatusSchema,
  returnId: z.string().trim().nullable(),
  returnName: z.string().trim().nullable(),
  creditNoteId: z.string().trim().nullable(),
  creditNoteName: z.string().trim().nullable(),
  returnStatus: frappeReturnWorkflowStatusSchema.nullable(),
  refundStatus: z.enum(["none", "requested", "queued", "processing", "refunded", "failed", "rejected"]),
  refundAmount: z.number().finite().nonnegative().nullable(),
  currency: z.string().trim().nullable(),
  reason: z.string().trim().nullable(),
  providerRefundId: z.string().trim().nullable(),
  lastAttemptedAt: z.string().trim().min(1),
  syncedAt: z.string().trim().nullable(),
  failureMessage: z.string().trim().nullable(),
  createdAt: z.string().trim().min(1),
  updatedAt: z.string().trim().min(1),
})

export const frappeReturnSyncPayloadSchema = z.object({
  storefrontOrderId: z.string().trim().min(1),
  returnId: z.string().trim().nullable().optional().default(null),
  returnName: z.string().trim().nullable().optional().default(null),
  creditNoteId: z.string().trim().nullable().optional().default(null),
  creditNoteName: z.string().trim().nullable().optional().default(null),
  returnStatus: frappeReturnWorkflowStatusSchema.nullable().optional().default(null),
  refundStatus: z.enum(["none", "requested", "queued", "processing", "refunded", "failed", "rejected"]),
  refundAmount: z.number().finite().nonnegative().nullable().optional().default(null),
  currency: z.string().trim().nullable().optional().default(null),
  reason: z.string().trim().nullable().optional().default(null),
  providerRefundId: z.string().trim().nullable().optional().default(null),
  status: frappeTransactionSyncStatusSchema.optional().default("synced"),
  failureMessage: z.string().trim().nullable().optional().default(null),
})

export const frappeReturnSyncResponseSchema = z.object({
  sync: frappeReturnSyncRecordSchema,
})

export const frappeTransactionReconciliationQueueTypeSchema = z.enum([
  "sales_order",
  "delivery_note",
  "invoice",
  "return_refund",
])

export const frappeTransactionReconciliationQueueStatusSchema = z.enum([
  "pending_sync",
  "sync_failed",
  "replay_ready",
])

export const frappeTransactionReconciliationQueueItemSchema = z.object({
  id: z.string().trim().min(1),
  queueType: frappeTransactionReconciliationQueueTypeSchema,
  status: frappeTransactionReconciliationQueueStatusSchema,
  storefrontOrderId: z.string().trim().min(1),
  storefrontOrderNumber: z.string().trim().min(1),
  severity: z.enum(["warn", "error"]),
  summary: z.string().trim().min(1),
  erpReference: z.string().trim().nullable(),
  lastAttemptedAt: z.string().trim().nullable(),
  replayAvailable: z.boolean(),
})

export const frappeTransactionReconciliationQueueResponseSchema = z.object({
  generatedAt: z.string().trim().min(1),
  items: z.array(frappeTransactionReconciliationQueueItemSchema),
})

export const frappeTransactionReplayPayloadSchema = z.object({
  storefrontOrderId: z.string().trim().min(1),
  queueType: frappeTransactionReconciliationQueueTypeSchema,
})

export const frappeTransactionReplayResponseSchema = z.object({
  replayed: z.boolean(),
  queueType: frappeTransactionReconciliationQueueTypeSchema,
  storefrontOrderId: z.string().trim().min(1),
  summary: z.string().trim().min(1),
})

export const frappeTodoStatusSchema = z.enum(["Open", "Closed", "Cancelled"])
export const frappeTodoPrioritySchema = z.enum(["Low", "Medium", "High"])

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
  duplicateMode: z.enum(["overwrite", "skip"]).default("overwrite"),
})

export const frappeItemProductSyncResultSchema = z.object({
  frappeItemId: z.string().trim().min(1),
  frappeItemCode: z.string().trim().min(1),
  productId: z.string().trim().min(1),
  productName: z.string().trim().min(1),
  productSlug: z.string().trim().min(1),
  mode: z.enum(["create", "update", "skipped"]),
})

export const frappeItemProductSyncLogItemSchema = z.object({
  frappeItemId: z.string().trim().min(1),
  frappeItemCode: z.string().trim().min(1),
  productId: z.string().trim().nullable(),
  productName: z.string().trim().nullable(),
  productSlug: z.string().trim().nullable(),
  mode: z.enum(["create", "update", "skipped", "failed"]),
  reason: z.string().trim(),
})

export const frappeItemProductSyncLogSchema = z.object({
  id: z.string().trim().min(1),
  duplicateMode: z.enum(["overwrite", "skip"]),
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
  mode: z.enum(["create", "update"]),
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
export type FrappeSettingsVerificationPayload = z.infer<
  typeof frappeSettingsVerificationPayloadSchema
>
export type FrappeConnectionVerification = z.infer<typeof frappeConnectionVerificationSchema>
export type FrappeConnectionVerificationResponse = z.infer<typeof frappeConnectionVerificationResponseSchema>
export type FrappeSyncOperationPolicy = z.infer<typeof frappeSyncOperationPolicySchema>
export type FrappeSyncPolicy = z.infer<typeof frappeSyncPolicySchema>
export type FrappeSyncPolicyResponse = z.infer<typeof frappeSyncPolicyResponseSchema>
export type FrappeConnectorException = z.infer<typeof frappeConnectorExceptionSchema>
export type FrappeObservabilityReport = z.infer<typeof frappeObservabilityReportSchema>
export type FrappeObservabilityReportResponse = z.infer<
  typeof frappeObservabilityReportResponseSchema
>
export type FrappeProjectionFieldMapping = z.infer<
  typeof frappeProjectionFieldMappingSchema
>
export type FrappeItemProjectionContract = z.infer<
  typeof frappeItemProjectionContractSchema
>
export type FrappeItemProjectionContractResponse = z.infer<
  typeof frappeItemProjectionContractResponseSchema
>
export type FrappePriceProjectionContract = z.infer<
  typeof frappePriceProjectionContractSchema
>
export type FrappePriceProjectionContractResponse = z.infer<
  typeof frappePriceProjectionContractResponseSchema
>
export type FrappeStockProjectionContract = z.infer<
  typeof frappeStockProjectionContractSchema
>
export type FrappeStockProjectionContractResponse = z.infer<
  typeof frappeStockProjectionContractResponseSchema
>
export type FrappeCustomerCommercialProfileContract = z.infer<
  typeof frappeCustomerCommercialProfileContractSchema
>
export type FrappeCustomerCommercialProfileContractResponse = z.infer<
  typeof frappeCustomerCommercialProfileContractResponseSchema
>
export type FrappeSalesOrderSyncStatus = z.infer<
  typeof frappeSalesOrderSyncStatusSchema
>
export type FrappeSalesOrderSyncLine = z.infer<
  typeof frappeSalesOrderSyncLineSchema
>
export type FrappeSalesOrderSyncRecord = z.infer<
  typeof frappeSalesOrderSyncRecordSchema
>
export type FrappeSalesOrderPushGate = z.infer<
  typeof frappeSalesOrderPushGateSchema
>
export type FrappeSalesOrderPushPolicy = z.infer<
  typeof frappeSalesOrderPushPolicySchema
>
export type FrappeSalesOrderPushPolicyResponse = z.infer<
  typeof frappeSalesOrderPushPolicyResponseSchema
>
export type FrappeTransactionSyncStatus = z.infer<
  typeof frappeTransactionSyncStatusSchema
>
export type FrappeDeliveryStatus = z.infer<typeof frappeDeliveryStatusSchema>
export type FrappeReturnWorkflowStatus = z.infer<
  typeof frappeReturnWorkflowStatusSchema
>
export type FrappeDeliveryNoteSyncRecord = z.infer<
  typeof frappeDeliveryNoteSyncRecordSchema
>
export type FrappeDeliveryNoteSyncPayload = z.infer<
  typeof frappeDeliveryNoteSyncPayloadSchema
>
export type FrappeDeliveryNoteSyncResponse = z.infer<
  typeof frappeDeliveryNoteSyncResponseSchema
>
export type FrappeInvoiceSyncRecord = z.infer<typeof frappeInvoiceSyncRecordSchema>
export type FrappeInvoiceSyncPayload = z.infer<typeof frappeInvoiceSyncPayloadSchema>
export type FrappeInvoiceSyncResponse = z.infer<typeof frappeInvoiceSyncResponseSchema>
export type FrappeReturnSyncRecord = z.infer<typeof frappeReturnSyncRecordSchema>
export type FrappeReturnSyncPayload = z.infer<typeof frappeReturnSyncPayloadSchema>
export type FrappeReturnSyncResponse = z.infer<typeof frappeReturnSyncResponseSchema>
export type FrappeTransactionReconciliationQueueType = z.infer<
  typeof frappeTransactionReconciliationQueueTypeSchema
>
export type FrappeTransactionReconciliationQueueStatus = z.infer<
  typeof frappeTransactionReconciliationQueueStatusSchema
>
export type FrappeTransactionReconciliationQueueItem = z.infer<
  typeof frappeTransactionReconciliationQueueItemSchema
>
export type FrappeTransactionReconciliationQueueResponse = z.infer<
  typeof frappeTransactionReconciliationQueueResponseSchema
>
export type FrappeTransactionReplayPayload = z.infer<
  typeof frappeTransactionReplayPayloadSchema
>
export type FrappeTransactionReplayResponse = z.infer<
  typeof frappeTransactionReplayResponseSchema
>
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
