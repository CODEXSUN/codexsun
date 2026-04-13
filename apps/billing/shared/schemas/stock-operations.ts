import { z } from "zod"

export const billingPurchaseReceiptStatusSchema = z.enum([
  "draft",
  "open",
  "partially_received",
  "fully_received",
  "cancelled",
])

export const billingGoodsInwardStatusSchema = z.enum([
  "draft",
  "pending_verification",
  "verified",
  "cancelled",
])

export const billingInwardPostingStatusSchema = z.enum([
  "not_posted",
  "blocked_until_verification",
  "posted",
])

export const billingStockUnitStatusSchema = z.enum([
  "received",
  "available",
  "allocated",
  "sold",
  "rejected",
  "damaged",
])

export const billingBarcodeAliasSourceSchema = z.enum([
  "internal_barcode",
  "batch_code",
  "serial_number",
  "manufacturer_barcode",
  "manufacturer_serial",
])

export const billingStickerTemplateSchema = z.enum([
  "inventory-sticker-25x50mm",
])

export const billingPurchaseReceiptLineSchema = z.object({
  id: z.string().trim().min(1),
  productId: z.string().trim().min(1),
  productName: z.string().trim().min(1),
  variantId: z.string().trim().min(1).nullable().default(null),
  variantName: z.string().trim().min(1).nullable().default(null),
  warehouseId: z.string().trim().min(1),
  quantity: z.number().positive(),
  receivedQuantity: z.number().nonnegative(),
  unit: z.string().trim().min(1),
  unitCost: z.number().nonnegative(),
  note: z.string().trim().default(""),
})

export const billingPurchaseReceiptSchema = z.object({
  id: z.string().trim().min(1),
  receiptNumber: z.string().trim().min(1),
  supplierName: z.string().trim().min(1),
  supplierLedgerId: z.string().trim().min(1).nullable().default(null),
  postingDate: z.string().trim().min(1),
  warehouseId: z.string().trim().min(1),
  warehouseName: z.string().trim().min(1),
  sourceVoucherId: z.string().trim().min(1).nullable().default(null),
  sourceFrappeReceiptId: z.string().trim().min(1).nullable().default(null),
  status: billingPurchaseReceiptStatusSchema,
  lines: z.array(billingPurchaseReceiptLineSchema).min(1),
  note: z.string().trim().default(""),
  createdAt: z.string().trim().min(1),
  updatedAt: z.string().trim().min(1),
  createdByUserId: z.string().trim().min(1).nullable().default(null),
})

export const billingGoodsInwardLineSchema = z.object({
  id: z.string().trim().min(1),
  purchaseReceiptLineId: z.string().trim().min(1),
  productId: z.string().trim().min(1),
  productName: z.string().trim().min(1),
  variantId: z.string().trim().min(1).nullable().default(null),
  variantName: z.string().trim().min(1).nullable().default(null),
  expectedQuantity: z.number().nonnegative(),
  acceptedQuantity: z.number().nonnegative(),
  rejectedQuantity: z.number().nonnegative(),
  damagedQuantity: z.number().nonnegative(),
  manufacturerBarcode: z.string().trim().nullable().default(null),
  manufacturerSerial: z.string().trim().nullable().default(null),
  note: z.string().trim().default(""),
})

export const billingGoodsInwardSchema = z.object({
  id: z.string().trim().min(1),
  inwardNumber: z.string().trim().min(1),
  purchaseReceiptId: z.string().trim().min(1),
  purchaseReceiptNumber: z.string().trim().min(1),
  supplierName: z.string().trim().min(1),
  postingDate: z.string().trim().min(1),
  warehouseId: z.string().trim().min(1),
  warehouseName: z.string().trim().min(1),
  status: billingGoodsInwardStatusSchema,
  stockPostingStatus: billingInwardPostingStatusSchema,
  lines: z.array(billingGoodsInwardLineSchema).min(1),
  note: z.string().trim().default(""),
  createdAt: z.string().trim().min(1),
  updatedAt: z.string().trim().min(1),
  createdByUserId: z.string().trim().min(1).nullable().default(null),
  stockUnitIds: z.array(z.string().trim().min(1)).default([]),
  postedAt: z.string().trim().min(1).nullable().default(null),
  postedByUserId: z.string().trim().min(1).nullable().default(null),
})

export const billingStockUnitSchema = z.object({
  id: z.string().trim().min(1),
  goodsInwardId: z.string().trim().min(1),
  goodsInwardNumber: z.string().trim().min(1),
  goodsInwardLineId: z.string().trim().min(1),
  purchaseReceiptId: z.string().trim().min(1),
  purchaseReceiptNumber: z.string().trim().min(1),
  productId: z.string().trim().min(1),
  productName: z.string().trim().min(1),
  productCode: z.string().trim().min(1),
  variantId: z.string().trim().min(1).nullable().default(null),
  variantName: z.string().trim().min(1).nullable().default(null),
  warehouseId: z.string().trim().min(1),
  warehouseName: z.string().trim().min(1),
  unitSequence: z.number().int().positive(),
  quantity: z.number().positive().default(1),
  batchCode: z.string().trim().min(1),
  serialNumber: z.string().trim().min(1),
  barcodeValue: z.string().trim().min(1),
  manufacturerBarcode: z.string().trim().min(1).nullable().default(null),
  manufacturerSerial: z.string().trim().min(1).nullable().default(null),
  attributeSummary: z.string().trim().min(1).nullable().default(null),
  variantSummary: z.string().trim().min(1).nullable().default(null),
  mrp: z.number().nonnegative().nullable().default(null),
  sellingPrice: z.number().nonnegative().nullable().default(null),
  status: billingStockUnitStatusSchema,
  receivedAt: z.string().trim().min(1),
  availableAt: z.string().trim().min(1).nullable().default(null),
  allocatedAt: z.string().trim().min(1).nullable().default(null),
  soldAt: z.string().trim().min(1).nullable().default(null),
  soldVoucherId: z.string().trim().min(1).nullable().default(null),
  soldVoucherNumber: z.string().trim().min(1).nullable().default(null),
  isActive: z.boolean().default(true),
  createdAt: z.string().trim().min(1),
  updatedAt: z.string().trim().min(1),
})

export const billingStockBarcodeAliasSchema = z.object({
  id: z.string().trim().min(1),
  stockUnitId: z.string().trim().min(1),
  productId: z.string().trim().min(1),
  warehouseId: z.string().trim().min(1),
  barcodeValue: z.string().trim().min(1),
  source: billingBarcodeAliasSourceSchema,
  isPrimary: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string().trim().min(1),
  updatedAt: z.string().trim().min(1),
})

export const billingStickerPrintItemSchema = z.object({
  stockUnitId: z.string().trim().min(1),
  productId: z.string().trim().min(1),
  productName: z.string().trim().min(1),
  productCode: z.string().trim().min(1),
  variantName: z.string().trim().min(1).nullable().default(null),
  attributeSummary: z.string().trim().min(1).nullable().default(null),
  barcodeValue: z.string().trim().min(1),
  batchCode: z.string().trim().min(1),
  serialNumber: z.string().trim().min(1),
  mrp: z.number().nonnegative().nullable().default(null),
  sellingPrice: z.number().nonnegative().nullable().default(null),
  companyName: z.string().trim().min(1),
  companyEmail: z.string().trim().min(1).nullable().default(null),
  companyPhone: z.string().trim().min(1).nullable().default(null),
  stickerHtml: z.string().trim().min(1),
})

export const billingStickerPrintBatchSchema = z.object({
  id: z.string().trim().min(1),
  goodsInwardId: z.string().trim().min(1),
  goodsInwardNumber: z.string().trim().min(1),
  template: billingStickerTemplateSchema,
  widthMm: z.number().positive(),
  heightMm: z.number().positive(),
  itemCount: z.number().int().nonnegative(),
  items: z.array(billingStickerPrintItemSchema),
  createdAt: z.string().trim().min(1),
  updatedAt: z.string().trim().min(1),
  createdByUserId: z.string().trim().min(1).nullable().default(null),
})

export const billingStockScanVerificationSchema = z.object({
  barcodeValue: z.string().trim().min(1),
  resolved: z.boolean(),
  matchedSource: billingBarcodeAliasSourceSchema.nullable().default(null),
  expectedGoodsInwardId: z.string().trim().min(1).nullable().default(null),
  expectedWarehouseId: z.string().trim().min(1).nullable().default(null),
  stockUnit: billingStockUnitSchema.nullable().default(null),
  warning: z.string().trim().min(1).nullable().default(null),
})

export const billingStockSaleAllocationSchema = z.object({
  id: z.string().trim().min(1),
  stockUnitId: z.string().trim().min(1),
  barcodeValue: z.string().trim().min(1),
  productId: z.string().trim().min(1),
  warehouseId: z.string().trim().min(1),
  salesVoucherId: z.string().trim().min(1).nullable().default(null),
  salesVoucherNumber: z.string().trim().min(1).nullable().default(null),
  salesItemIndex: z.number().int().nonnegative().nullable().default(null),
  status: z.enum(["allocated", "sold"]),
  allocatedAt: z.string().trim().min(1),
  soldAt: z.string().trim().min(1).nullable().default(null),
  createdAt: z.string().trim().min(1),
  updatedAt: z.string().trim().min(1),
  createdByUserId: z.string().trim().min(1).nullable().default(null),
})

export const billingPurchaseReceiptLineInputSchema = z.object({
  productId: z.string().trim().min(1),
  productName: z.string().trim().min(1),
  variantId: z.string().trim().min(1).nullable().default(null),
  variantName: z.string().trim().nullable().default(null),
  warehouseId: z.string().trim().min(1),
  quantity: z.number().positive(),
  unit: z.string().trim().min(1).default("Nos"),
  unitCost: z.number().nonnegative().default(0),
  note: z.string().trim().default(""),
})

export const billingPurchaseReceiptUpsertPayloadSchema = z.object({
  receiptNumber: z.string().trim().min(1),
  supplierName: z.string().trim().min(1),
  supplierLedgerId: z.string().trim().min(1).nullable().default(null),
  postingDate: z.string().trim().min(1),
  warehouseId: z.string().trim().min(1),
  warehouseName: z.string().trim().min(1),
  sourceVoucherId: z.string().trim().min(1).nullable().default(null),
  sourceFrappeReceiptId: z.string().trim().min(1).nullable().default(null),
  status: billingPurchaseReceiptStatusSchema.default("draft"),
  lines: z.array(billingPurchaseReceiptLineInputSchema).min(1),
  note: z.string().trim().default(""),
})

export const billingGoodsInwardLineInputSchema = z.object({
  purchaseReceiptLineId: z.string().trim().min(1),
  productId: z.string().trim().min(1),
  productName: z.string().trim().min(1),
  variantId: z.string().trim().min(1).nullable().default(null),
  variantName: z.string().trim().nullable().default(null),
  expectedQuantity: z.number().nonnegative(),
  acceptedQuantity: z.number().nonnegative(),
  rejectedQuantity: z.number().nonnegative().default(0),
  damagedQuantity: z.number().nonnegative().default(0),
  manufacturerBarcode: z.string().trim().nullable().default(null),
  manufacturerSerial: z.string().trim().nullable().default(null),
  note: z.string().trim().default(""),
})

export const billingGoodsInwardUpsertPayloadSchema = z.object({
  inwardNumber: z.string().trim().min(1),
  purchaseReceiptId: z.string().trim().min(1),
  purchaseReceiptNumber: z.string().trim().min(1),
  supplierName: z.string().trim().min(1),
  postingDate: z.string().trim().min(1),
  warehouseId: z.string().trim().min(1),
  warehouseName: z.string().trim().min(1),
  status: billingGoodsInwardStatusSchema.default("draft"),
  lines: z.array(billingGoodsInwardLineInputSchema).min(1),
  note: z.string().trim().default(""),
})

export const billingPurchaseReceiptResponseSchema = z.object({
  item: billingPurchaseReceiptSchema,
})

export const billingPurchaseReceiptListResponseSchema = z.object({
  items: z.array(billingPurchaseReceiptSchema),
})

export const billingGoodsInwardResponseSchema = z.object({
  item: billingGoodsInwardSchema,
})

export const billingGoodsInwardListResponseSchema = z.object({
  items: z.array(billingGoodsInwardSchema),
})

export const billingStockUnitResponseSchema = z.object({
  item: billingStockUnitSchema,
})

export const billingStockUnitListResponseSchema = z.object({
  items: z.array(billingStockUnitSchema),
})

export const billingBarcodeResolutionResponseSchema = z.object({
  item: billingStockScanVerificationSchema,
})

export const billingStickerPrintBatchResponseSchema = z.object({
  item: billingStickerPrintBatchSchema,
})

export const billingStockSaleAllocationResponseSchema = z.object({
  item: billingStockSaleAllocationSchema,
})

export const billingStockSaleAllocationListResponseSchema = z.object({
  items: z.array(billingStockSaleAllocationSchema),
})

export const billingGoodsInwardPostingResponseSchema = z.object({
  item: billingGoodsInwardSchema,
  unitsCreated: z.number().int().nonnegative(),
})

export const billingBarcodeResolutionPayloadSchema = z.object({
  barcodeValue: z.string().trim().min(1),
  expectedGoodsInwardId: z.string().trim().min(1).nullable().default(null),
  expectedWarehouseId: z.string().trim().min(1).nullable().default(null),
})

export const billingStickerPrintBatchPayloadSchema = z.object({
  goodsInwardId: z.string().trim().min(1),
  stockUnitIds: z.array(z.string().trim().min(1)).default([]),
  template: billingStickerTemplateSchema.default("inventory-sticker-25x50mm"),
})

export const billingStockSaleAllocationPayloadSchema = z.object({
  barcodeValue: z.string().trim().min(1),
  salesVoucherId: z.string().trim().min(1).nullable().default(null),
  salesVoucherNumber: z.string().trim().min(1).nullable().default(null),
  salesItemIndex: z.number().int().nonnegative().nullable().default(null),
  warehouseId: z.string().trim().min(1).nullable().default(null),
  markAsSold: z.boolean().default(true),
})

export type BillingPurchaseReceiptStatus = z.infer<
  typeof billingPurchaseReceiptStatusSchema
>
export type BillingGoodsInwardStatus = z.infer<
  typeof billingGoodsInwardStatusSchema
>
export type BillingInwardPostingStatus = z.infer<
  typeof billingInwardPostingStatusSchema
>
export type BillingPurchaseReceiptLine = z.infer<
  typeof billingPurchaseReceiptLineSchema
>
export type BillingPurchaseReceipt = z.infer<typeof billingPurchaseReceiptSchema>
export type BillingGoodsInwardLine = z.infer<typeof billingGoodsInwardLineSchema>
export type BillingGoodsInward = z.infer<typeof billingGoodsInwardSchema>
export type BillingStockUnitStatus = z.infer<typeof billingStockUnitStatusSchema>
export type BillingBarcodeAliasSource = z.infer<
  typeof billingBarcodeAliasSourceSchema
>
export type BillingStickerTemplate = z.infer<typeof billingStickerTemplateSchema>
export type BillingStockUnit = z.infer<typeof billingStockUnitSchema>
export type BillingStockBarcodeAlias = z.infer<
  typeof billingStockBarcodeAliasSchema
>
export type BillingStickerPrintItem = z.infer<
  typeof billingStickerPrintItemSchema
>
export type BillingStickerPrintBatch = z.infer<
  typeof billingStickerPrintBatchSchema
>
export type BillingStockScanVerification = z.infer<
  typeof billingStockScanVerificationSchema
>
export type BillingStockSaleAllocation = z.infer<
  typeof billingStockSaleAllocationSchema
>
export type BillingPurchaseReceiptLineInput = z.infer<
  typeof billingPurchaseReceiptLineInputSchema
>
export type BillingPurchaseReceiptUpsertPayload = z.infer<
  typeof billingPurchaseReceiptUpsertPayloadSchema
>
export type BillingGoodsInwardLineInput = z.infer<
  typeof billingGoodsInwardLineInputSchema
>
export type BillingGoodsInwardUpsertPayload = z.infer<
  typeof billingGoodsInwardUpsertPayloadSchema
>
export type BillingPurchaseReceiptResponse = z.infer<
  typeof billingPurchaseReceiptResponseSchema
>
export type BillingPurchaseReceiptListResponse = z.infer<
  typeof billingPurchaseReceiptListResponseSchema
>
export type BillingGoodsInwardResponse = z.infer<
  typeof billingGoodsInwardResponseSchema
>
export type BillingGoodsInwardListResponse = z.infer<
  typeof billingGoodsInwardListResponseSchema
>
export type BillingStockUnitResponse = z.infer<
  typeof billingStockUnitResponseSchema
>
export type BillingStockUnitListResponse = z.infer<
  typeof billingStockUnitListResponseSchema
>
export type BillingBarcodeResolutionResponse = z.infer<
  typeof billingBarcodeResolutionResponseSchema
>
export type BillingStickerPrintBatchResponse = z.infer<
  typeof billingStickerPrintBatchResponseSchema
>
export type BillingStockSaleAllocationResponse = z.infer<
  typeof billingStockSaleAllocationResponseSchema
>
export type BillingStockSaleAllocationListResponse = z.infer<
  typeof billingStockSaleAllocationListResponseSchema
>
export type BillingGoodsInwardPostingResponse = z.infer<
  typeof billingGoodsInwardPostingResponseSchema
>
export type BillingBarcodeResolutionPayload = z.infer<
  typeof billingBarcodeResolutionPayloadSchema
>
export type BillingStickerPrintBatchPayload = z.infer<
  typeof billingStickerPrintBatchPayloadSchema
>
export type BillingStockSaleAllocationPayload = z.infer<
  typeof billingStockSaleAllocationPayloadSchema
>
