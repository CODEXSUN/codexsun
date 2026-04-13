export type StockWorkflowStageId =
  | "purchase-receipt"
  | "goods-inward"
  | "identity-assignment"
  | "barcode-print"
  | "scan-verification"
  | "warehouse-putaway"
  | "sales-issue"
  | "delivery-handoff"

export type StockIdentityMode = "none" | "batch" | "serial" | "batch-and-serial"

export type StockBarcodeSource = "internal" | "manufacturer" | "hybrid"

export type StockStickerField =
  | "productName"
  | "productCode"
  | "variantName"
  | "attributeSummary"
  | "mrp"
  | "batchNumber"
  | "serialNumber"
  | "barcodeValue"
  | "manufacturerBarcode"
  | "manufacturerSerial"
  | "companyEmail"
  | "companyPhone"
  | "warehouseName"

export type StockStickerLayout = {
  id: string
  label: string
  widthMm: number
  heightMm: number
  fields: StockStickerField[]
}

export type StockWorkflowStage = {
  id: StockWorkflowStageId
  label: string
  owner:
    | "billing"
    | "core"
    | "ecommerce"
    | "frappe"
    | "cxapp-company"
    | "future-inventory-app"
  summary: string
}

export const stockWorkflowStages: StockWorkflowStage[] = [
  {
    id: "purchase-receipt",
    label: "Purchase Receipt",
    owner: "billing",
    summary: "Supplier-facing receipt and voucher stage that records expected inward items and warehouse destination.",
  },
  {
    id: "goods-inward",
    label: "Goods Inward",
    owner: "future-inventory-app",
    summary: "Physical inward verification stage that confirms received quantity, condition, and accepted units before stock becomes sellable.",
  },
  {
    id: "identity-assignment",
    label: "Identity Assignment",
    owner: "core",
    summary: "Assign internal stock identity such as batch, serial, and product-unit barcode mappings, including manufacturer references.",
  },
  {
    id: "barcode-print",
    label: "Barcode Print",
    owner: "future-inventory-app",
    summary: "Generate and print stock stickers using product, company, price, and identity data.",
  },
  {
    id: "scan-verification",
    label: "Scan Verification",
    owner: "future-inventory-app",
    summary: "Verify that the printed or manufacturer barcode resolves back to the expected stock unit before putaway or sale.",
  },
  {
    id: "warehouse-putaway",
    label: "Warehouse Putaway",
    owner: "billing",
    summary: "Move verified inward stock into the destination warehouse position and make it available for downstream issue.",
  },
  {
    id: "sales-issue",
    label: "Sales Issue",
    owner: "billing",
    summary: "Scan sellable units into the sales document, reserve or issue stock, and reduce available quantity on posting.",
  },
  {
    id: "delivery-handoff",
    label: "Delivery Handoff",
    owner: "ecommerce",
    summary: "Prepare picked stock for customer handoff, shipment, or pickup while preserving traceability back to the issued stock unit.",
  },
]

export const stockStickerLayouts: StockStickerLayout[] = [
  {
    id: "inventory-sticker-25x50",
    label: "Inventory Sticker 25 mm x 50 mm",
    widthMm: 25,
    heightMm: 50,
    fields: [
      "productName",
      "productCode",
      "variantName",
      "attributeSummary",
      "mrp",
      "batchNumber",
      "serialNumber",
      "barcodeValue",
      "manufacturerBarcode",
      "manufacturerSerial",
      "companyEmail",
      "companyPhone",
    ],
  },
]
