import { z } from "zod"

import {
  billingBarcodeResolutionPayloadSchema,
  billingGoodsInwardListResponseSchema,
  billingGoodsInwardPostingResponseSchema,
  billingGoodsInwardResponseSchema,
  billingGoodsInwardSchema,
  billingGoodsInwardUpsertPayloadSchema,
  billingPurchaseReceiptListResponseSchema,
  billingPurchaseReceiptResponseSchema,
  billingPurchaseReceiptSchema,
  billingPurchaseReceiptUpsertPayloadSchema,
  billingStickerPrintBatchPayloadSchema,
  billingStickerPrintBatchResponseSchema,
  billingStickerPrintBatchSchema,
  billingStockBarcodeAliasSchema,
  billingStockAcceptancePayloadSchema,
  billingStockAcceptanceResponseSchema,
  billingStockAcceptanceVerificationListResponseSchema,
  billingStockSaleAllocationListResponseSchema,
  billingStockSaleAllocationPayloadSchema,
  billingStockSaleAllocationResponseSchema,
  billingStockScanVerificationSchema,
  billingStockUnitListResponseSchema,
  billingStockUnitResponseSchema,
  type BillingBarcodeResolutionPayload,
  type BillingStockAcceptancePayload,
  type BillingStockAcceptanceResponse,
  type BillingGoodsInward,
  type BillingGoodsInwardUpsertPayload,
  type BillingPurchaseReceipt,
  type BillingPurchaseReceiptUpsertPayload,
} from "../../billing/shared/index.js"
import type {
  InventoryAvailability,
  InventoryStockReservation,
  InventoryStockTransfer,
} from "../../../framework/engines/inventory-engine/contracts/index.js"

export const stockTransferLineInputSchema = z.object({
  id: z.string().trim().min(1),
  productId: z.string().trim().min(1),
  variantId: z.string().trim().nullable().default(null),
  batchId: z.string().trim().nullable().default(null),
  serialId: z.string().trim().nullable().default(null),
  quantity: z.number().positive(),
  sourceLocationId: z.string().trim().nullable().default(null),
  destinationLocationId: z.string().trim().nullable().default(null),
})

export const stockTransferUpsertPayloadSchema = z.object({
  id: z.string().trim().min(1),
  status: z.enum([
    "draft",
    "requested",
    "approved",
    "in-transit",
    "partially-received",
    "received",
    "cancelled",
  ]),
  sourceWarehouseId: z.string().trim().min(1),
  sourceLocationId: z.string().trim().nullable().default(null),
  destinationWarehouseId: z.string().trim().min(1),
  destinationLocationId: z.string().trim().nullable().default(null),
  requestedAt: z.string().trim().min(1),
  dispatchedAt: z.string().trim().nullable().default(null),
  receivedAt: z.string().trim().nullable().default(null),
  referenceType: z.string().trim().nullable().default(null),
  referenceId: z.string().trim().nullable().default(null),
  notes: z.string().trim().nullable().default(null),
  lines: z.array(stockTransferLineInputSchema).min(1),
})

export const stockReservationUpsertPayloadSchema = z.object({
  id: z.string().trim().min(1),
  warehouseId: z.string().trim().nullable().default(null),
  locationId: z.string().trim().nullable().default(null),
  productId: z.string().trim().min(1),
  variantId: z.string().trim().nullable().default(null),
  referenceType: z.string().trim().min(1),
  referenceId: z.string().trim().min(1),
  quantity: z.number().positive(),
  consumedQuantity: z.number().nonnegative().default(0),
  status: z.enum([
    "draft",
    "active",
    "allocated",
    "partially-consumed",
    "consumed",
    "released",
    "expired",
    "cancelled",
  ]),
  reservedAt: z.string().trim().min(1),
  expiresAt: z.string().trim().nullable().default(null),
  releasedAt: z.string().trim().nullable().default(null),
  notes: z.string().trim().nullable().default(null),
})

export const stockAvailabilityRequestSchema = z.object({
  warehouseIds: z.array(z.string().trim().min(1)).optional(),
  productIds: z.array(z.string().trim().min(1)).optional(),
  variantIds: z.array(z.string().trim().min(1)).optional(),
})

export const stockVerificationSummarySchema = z.object({
  pendingVerificationCount: z.number().int().nonnegative(),
  postedInwardCount: z.number().int().nonnegative(),
  availableUnitCount: z.number().int().nonnegative(),
  allocatedUnitCount: z.number().int().nonnegative(),
  soldUnitCount: z.number().int().nonnegative(),
  movementCount: z.number().int().nonnegative(),
})

export const stockReconciliationItemSchema = z.object({
  warehouseId: z.string().trim().min(1),
  productId: z.string().trim().min(1),
  variantId: z.string().trim().nullable(),
  engineOnHandQuantity: z.number(),
  coreOnHandQuantity: z.number(),
  mismatchQuantity: z.number(),
})

export const stockReconciliationResponseSchema = z.object({
  items: z.array(stockReconciliationItemSchema),
})

export type StockPurchaseReceipt = BillingPurchaseReceipt
export type StockPurchaseReceiptUpsertPayload = BillingPurchaseReceiptUpsertPayload
export type StockGoodsInward = BillingGoodsInward
export type StockGoodsInwardUpsertPayload = BillingGoodsInwardUpsertPayload
export type StockBarcodeResolutionPayload = BillingBarcodeResolutionPayload
export type StockAcceptancePayload = BillingStockAcceptancePayload
export type StockAcceptanceResponse = BillingStockAcceptanceResponse
export type StockTransferUpsertPayload = z.infer<typeof stockTransferUpsertPayloadSchema>
export type StockReservationUpsertPayload = z.infer<typeof stockReservationUpsertPayloadSchema>
export type StockAvailabilityRequest = z.infer<typeof stockAvailabilityRequestSchema>
export type StockVerificationSummary = z.infer<typeof stockVerificationSummarySchema>
export type StockReconciliationItem = z.infer<typeof stockReconciliationItemSchema>
export type StockReconciliationResponse = z.infer<typeof stockReconciliationResponseSchema>
export type StockTransfer = InventoryStockTransfer
export type StockReservation = InventoryStockReservation
export type StockAvailability = InventoryAvailability

export {
  billingBarcodeResolutionPayloadSchema,
  billingGoodsInwardListResponseSchema,
  billingGoodsInwardPostingResponseSchema,
  billingGoodsInwardResponseSchema,
  billingGoodsInwardSchema,
  billingGoodsInwardUpsertPayloadSchema,
  billingPurchaseReceiptListResponseSchema,
  billingPurchaseReceiptResponseSchema,
  billingPurchaseReceiptSchema,
  billingPurchaseReceiptUpsertPayloadSchema,
  billingStickerPrintBatchPayloadSchema,
  billingStickerPrintBatchResponseSchema,
  billingStickerPrintBatchSchema,
  billingStockBarcodeAliasSchema,
  billingStockAcceptancePayloadSchema,
  billingStockAcceptanceResponseSchema,
  billingStockAcceptanceVerificationListResponseSchema,
  billingStockSaleAllocationListResponseSchema,
  billingStockSaleAllocationPayloadSchema,
  billingStockSaleAllocationResponseSchema,
  billingStockScanVerificationSchema,
  billingStockUnitListResponseSchema,
  billingStockUnitResponseSchema,
}
