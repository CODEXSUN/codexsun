import type { ProductListResponse } from "@core/shared"
import type {
  BillingGoodsInward,
  BillingDeliveryNote,
  BillingPurchaseReceipt,
  BillingPurchaseReceiptSerializationMode,
  BillingStockAcceptanceVerification,
  BillingStockUnit,
  StockAvailability,
  StockReconciliationResponse,
  StockReservation,
  StockTransfer,
  StockVerificationSummary,
} from "../../../shared/index.ts"

export type ResourceState<T> = {
  data: T | null
  error: string | null
  isLoading: boolean
}

export type PurchaseReceiptListResponse = { items: BillingPurchaseReceipt[] }
export type PurchaseReceiptResponse = { item: BillingPurchaseReceipt }
export type GoodsInwardListResponse = { items: BillingGoodsInward[] }
export type GoodsInwardResponse = { item: BillingGoodsInward }
export type GoodsInwardPostingResponse = { item: BillingGoodsInward; unitsCreated: number }
export type DeliveryNoteListResponse = { items: BillingDeliveryNote[] }
export type DeliveryNoteResponse = { item: BillingDeliveryNote }
export type StockUnitListResponse = { items: BillingStockUnit[] }
export type StockAcceptanceVerificationListResponse = {
  items: BillingStockAcceptanceVerification[]
}
export type StockAcceptanceResponse = {
  acceptedCount: number
  acceptedQuantity: number
  rejectedCount: number
  rejectedQuantity: number
  mismatchCount: number
  remainingCount: number
  items: BillingStockAcceptanceVerification[]
}
export type BarcodeAliasListResponse = {
  items: Array<{
    id: string
    stockUnitId: string
    barcodeValue: string
    source: string
    updatedAt: string
  }>
}
export type BarcodeResolutionResponse = {
  item: {
    barcodeValue: string
    resolved: boolean
    matchedSource: string | null
    warning: string | null
    stockUnit: BillingStockUnit | null
  }
}
export type SaleAllocationListResponse = {
  items: Array<{
    id: string
    stockUnitId: string
    barcodeValue: string
    productId: string
    warehouseId: string
    salesVoucherNumber: string | null
    status: string
    allocatedAt: string
    soldAt: string | null
  }>
}
export type MovementListResponse = {
  items: Array<{
    id: string
    movementType: string
    direction: string
    warehouseId: string
    locationId: string | null
    productId: string
    variantId: string | null
    quantity: number
    referenceType: string | null
    referenceId: string | null
    updatedAt: string
  }>
}
export type AvailabilityListResponse = { items: StockAvailability[] }
export type TransferListResponse = { items: StockTransfer[] }
export type ReservationListResponse = { items: StockReservation[] }
export type LookupsResponse = {
  purchaseReceiptOptions: Array<{
    id: string
    label: string
    warehouseId: string
    warehouseName: string
    status: string
    lines: Array<{
      id: string
      productId: string
      productName: string
      variantId: string | null
      variantName: string | null
      quantity: number
      receivedQuantity: number
    }>
  }>
  goodsInwardOptions: Array<{
    id: string
    label: string
    status: string
    stockPostingStatus: string
    stockUnitCount: number
  }>
}

export type PurchaseReceiptLineForm = {
  productId: string
  productName: string
  variantId: string
  variantName: string
  warehouseId: string
  quantity: string
  unit: string
  unitCost: string
  note: string
}

export type PurchaseReceiptView = {
  id: string
  entryNumber: string
  supplierId: string
  supplierReferenceNumber: string | null
  supplierReferenceDate: string | null
  postingDate: string
  warehouseId: string
  status: BillingPurchaseReceipt["status"]
  createdAt: string
  updatedAt: string
  createdByUserId: string | null
  lines: Array<{
    id: string
    productId: string
    description: string | null
    quantity: number | null
    rate: number | null
    amount: number | null
    notes: string
  }>
}

export type GoodsInwardLineForm = {
  purchaseReceiptLineId: string
  productId: string
  productName: string
  variantId: string
  variantName: string
  expectedQuantity: string
  acceptedQuantity: string
  rejectedQuantity: string
  damagedQuantity: string
  damageReceived: boolean
  returnToVendor: boolean
  damageRemark: string
  manufacturerBarcode: string
  manufacturerSerial: string
  note: string
}

export type PurchaseReceiptSerializationLineForm = {
  purchaseReceiptLineId: string
  productId: string
  description: string
  orderedQuantity: number
  receivedQuantity: number
  remainingQuantity: number
  inwardQuantity: string
  barcodeQuantity: string
  identityMode: BillingPurchaseReceiptSerializationMode
  batchCode: string
  serialPrefix: string
  barcodePrefix: string
  manufacturerBarcodePrefix: string
  expiresAt: string
  selected: boolean
}

export type ProductLookupItem = ProductListResponse["items"][number]
export type ProductLookupOption = {
  label: string
  value: string
}

export type SupplierContactDraft = {
  contactPerson: string
  gstin: string
  name: string
  phone: string
}

export type {
  BillingGoodsInward,
  BillingDeliveryNote,
  BillingPurchaseReceipt,
  BillingPurchaseReceiptSerializationMode,
  BillingStockAcceptanceVerification,
  BillingStockUnit,
  StockAvailability,
  StockReconciliationResponse,
  StockReservation,
  StockTransfer,
  StockVerificationSummary,
}
