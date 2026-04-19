/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from "react"
import type { ReactNode } from "react"

import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { formatHttpErrorMessage } from "@cxapp/web/src/lib/http-error"
import type {
  BillingGoodsInward,
  BillingPurchaseReceipt,
  BillingPurchaseReceiptSerializationMode,
  BillingStockAcceptanceVerification,
  BillingStockUnit,
} from "@billing/shared"
import type {
  ContactSummary,
  ContactUpsertPayload,
  CommonModuleItem,
  ProductListResponse,
} from "@core/shared"
import type {
  StockAvailability,
  StockReconciliationResponse,
  StockReservation,
  StockTransfer,
  StockVerificationSummary,
} from "../../../shared/index.ts"
import { loadBarcodePrintDesignerSettings } from "./stock-print-designer"
import { showAppToast } from "@/components/ui/app-toast"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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
export type StockUnitListResponse = { items: BillingStockUnit[] }
export type StockAcceptanceVerificationListResponse = {
  items: BillingStockAcceptanceVerification[]
}
export type StockAcceptanceResponse = {
  acceptedCount: number
  acceptedQuantity: number
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

export const voucherInlineInputClassName =
  "h-8 rounded-none border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"

export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = getStoredAccessToken()
  const response = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string; message?: string; detail?: string }
      | null
    throw new Error(formatHttpErrorMessage(payload, response.status))
  }

  if (response.status === 204) {
    return null as T
  }

  return (await response.json()) as T
}

export function useJsonResource<T>(path: string, deps: readonly unknown[] = []) {
  const [state, setState] = useState<ResourceState<T>>({
    data: null,
    error: null,
    isLoading: Boolean(path),
  })
  const dependencyKey = JSON.stringify(deps)

  useEffect(() => {
    if (!path) {
      return
    }

    let cancelled = false

    async function load() {
      setState({ data: null, error: null, isLoading: true })

      try {
        const data = await requestJson<T>(path)
        if (!cancelled) {
          setState({ data, error: null, isLoading: false })
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            data: null,
            error: error instanceof Error ? error.message : "Request failed.",
            isLoading: false,
          })
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [dependencyKey, path])

  return path ? state : { data: null, error: null, isLoading: false }
}

export function createTransferForm() {
  return {
    id: `transfer:${Date.now()}`,
    status: "requested",
    sourceWarehouseId: "",
    sourceLocationId: "",
    destinationWarehouseId: "",
    destinationLocationId: "",
    requestedAt: new Date().toISOString(),
    dispatchedAt: "",
    receivedAt: "",
    referenceType: "manual_transfer",
    referenceId: "",
    notes: "",
    productId: "",
    quantity: "1",
  }
}

export function createReservationForm() {
  return {
    id: `reservation:${Date.now()}`,
    warehouseId: "",
    locationId: "",
    productId: "",
    referenceType: "pre_sale",
    referenceId: "",
    quantity: "1",
    consumedQuantity: "0",
    status: "active",
    reservedAt: new Date().toISOString(),
    expiresAt: "",
    releasedAt: "",
    notes: "",
  }
}

export function SectionIntro({
  title,
  description,
  actions,
}: {
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <Card className="border-border/70 bg-background/90 shadow-sm">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription className="max-w-3xl text-sm leading-6">
            {description}
          </CardDescription>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </CardHeader>
    </Card>
  )
}

export function LoadingCard({ message }: { message: string }) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="p-5 text-sm text-muted-foreground">{message}</CardContent>
    </Card>
  )
}

export function StateCard({ message }: { message: string }) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="p-5 text-sm text-muted-foreground">{message}</CardContent>
    </Card>
  )
}

export function formatQuantity(value: number) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

const purchaseReceiptRegisterEntryPattern = /^(\d+)$/

export function getNextRegisterEntryNumber(
  items: BillingPurchaseReceipt[],
  currentReceiptId?: string
) {
  const maxSequence = items.reduce((currentMax, item) => {
    if (currentReceiptId && item.id === currentReceiptId) {
      return currentMax
    }

    const normalizedValue = item.entryNumber?.trim()
    if (!normalizedValue) {
      return currentMax
    }

    const match = purchaseReceiptRegisterEntryPattern.exec(normalizedValue)
    if (!match) {
      return currentMax
    }

    const sequence = Number(match[1])
    return Number.isFinite(sequence) ? Math.max(currentMax, sequence) : currentMax
  }, 0)

  return String(maxSequence + 1).padStart(2, "0")
}

export function toPurchaseReceiptView(item: BillingPurchaseReceipt): PurchaseReceiptView {
  return {
    id: item.id,
    entryNumber: item.entryNumber,
    supplierId: item.supplierId,
    supplierReferenceNumber: item.supplierReferenceNumber ?? null,
    supplierReferenceDate: item.supplierReferenceDate ?? null,
    postingDate: item.postingDate,
    warehouseId: item.warehouseId,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    createdByUserId: item.createdByUserId,
    lines: item.lines.map((line) => ({
      id: line.id,
      productId: line.productId,
      description: line.description ?? null,
      quantity: line.quantity ?? 0,
      rate: line.rate ?? 0,
      amount: line.amount ?? Number(((line.quantity ?? 0) * (line.rate ?? 0)).toFixed(2)),
      notes: line.notes ?? "",
    })),
  }
}

export function formatOptionalDate(value: string | null | undefined) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date)
}

export function createSupplierContactDraft(name = ""): SupplierContactDraft {
  return {
    contactPerson: "",
    gstin: "",
    name,
    phone: "",
  }
}

export function buildSupplierContactPayload(draft: SupplierContactDraft): ContactUpsertPayload {
  const normalizedPhone = draft.phone.trim()
  const normalizedGstin = draft.gstin.trim().toUpperCase()
  const normalizedContactPerson = draft.contactPerson.trim()

  return {
    code: "",
    contactTypeId: "contact-type:supplier",
    ledgerId: null,
    ledgerName: null,
    name: draft.name.trim(),
    legalName: "",
    pan: "",
    gstin: normalizedGstin || "",
    msmeType: "-",
    msmeNo: "",
    openingBalance: 0,
    balanceType: "-",
    creditLimit: 0,
    website: "",
    description: normalizedContactPerson ? `Contact person: ${normalizedContactPerson}` : "",
    isActive: true,
    addresses: [],
    emails: [],
    phones: normalizedPhone
      ? [{ phoneNumber: normalizedPhone, phoneType: "mobile", isPrimary: true }]
      : [],
    bankAccounts: [],
    gstDetails: normalizedGstin ? [{ gstin: normalizedGstin, state: "-", isDefault: true }] : [],
  }
}

export function buildSupplierContactOptions(
  contacts: ContactSummary[],
  currentSupplierName: string
): ProductLookupOption[] {
  const options = contacts
    .filter((contact) => contact.isActive)
    .map((contact) => ({
      value: contact.id,
      label: contact.name,
    }))

  if (
    currentSupplierName.trim() &&
    !options.some((option) => option.label.startsWith(currentSupplierName.trim()))
  ) {
    options.unshift({
      value: `manual:${currentSupplierName.trim()}`,
      label: currentSupplierName.trim(),
    })
  }

  return options
}

export function resolveSelectedSupplierContactValue(
  contacts: ContactSummary[],
  supplierName: string
) {
  const normalizedName = supplierName.trim()
  const selectedContact = contacts.find((contact) => contact.id === normalizedName)

  if (selectedContact) {
    return selectedContact.id
  }

  return supplierName.trim() ? `manual:${supplierName.trim()}` : ""
}

export function resolveSupplierContactId(
  contacts: ContactSummary[],
  supplierValue: string
) {
  const normalizedValue = supplierValue.trim()
  if (!normalizedValue) {
    return ""
  }

  const byId = contacts.find((contact) => contact.id === normalizedValue)
  if (byId) {
    return byId.id
  }

  const byName = contacts.find(
    (contact) => contact.name.trim().toLowerCase() === normalizedValue.toLowerCase()
  )
  return byName?.id ?? ""
}

export function buildWarehouseOptions(
  warehouses: CommonModuleItem[],
  currentWarehouseId: string,
  currentWarehouseName: string
): ProductLookupOption[] {
  const options = new Map<string, ProductLookupOption>()

  for (const warehouse of warehouses) {
    const warehouseId = typeof warehouse.id === "string" ? warehouse.id.trim() : ""
    const warehouseName =
      typeof warehouse.name === "string" ? warehouse.name.trim() : ""

    if (
      !warehouse.isActive ||
      warehouseId.length === 0 ||
      warehouseName.length === 0 ||
      warehouseId === "1" ||
      warehouseName === "-"
    ) {
      continue
    }

    options.set(warehouseId, {
      value: warehouseId,
      label: `${warehouseName} (${warehouseId})`,
    })
  }

  if (currentWarehouseId.trim() && currentWarehouseName.trim()) {
    options.set(currentWarehouseId, {
      value: currentWarehouseId,
      label: `${currentWarehouseName} (${currentWarehouseId})`,
    })
  }

  return [...options.values()]
}

export function getWarehouseNameFromOptionLabel(label: string) {
  return label.replace(/\s+\([^)]+\)$/, "")
}

export function getDefaultWarehouseOption(
  warehouses: CommonModuleItem[],
  warehouseOptions: ProductLookupOption[]
) {
  const defaultWarehouse = warehouses.find((warehouse) => warehouse.is_default_location === true)
  if (defaultWarehouse) {
    const matchedOption = warehouseOptions.find((option) => option.value === defaultWarehouse.id)
    if (matchedOption) {
      return matchedOption
    }
  }

  return warehouseOptions[0] ?? null
}

export function resolveWarehouseId(
  warehouseOptions: ProductLookupOption[],
  warehouseId: string,
  warehouseName: string
) {
  const normalizedWarehouseId = warehouseId.trim()
  if (normalizedWarehouseId) {
    return normalizedWarehouseId
  }

  const normalizedWarehouseName = warehouseName.trim().toLowerCase()
  if (!normalizedWarehouseName) {
    return ""
  }

  const selectedOption = warehouseOptions.find(
    (option) =>
      getWarehouseNameFromOptionLabel(option.label).trim().toLowerCase() ===
      normalizedWarehouseName
  )
  return selectedOption?.value ?? ""
}

export function getSupplierDisplayName(
  contacts: ContactSummary[],
  supplierId: string
) {
  const matchedContact = contacts.find((contact) => contact.id === supplierId)
  return matchedContact?.name ?? supplierId
}

export function getWarehouseDisplayName(
  warehouses: CommonModuleItem[],
  warehouseId: string
) {
  const matchedWarehouse = warehouses.find((warehouse) => warehouse.id === warehouseId)
  return typeof matchedWarehouse?.name === "string" && matchedWarehouse.name.trim().length > 0
    ? matchedWarehouse.name.trim()
    : warehouseId
}

export function DataTable({
  headers,
  rows,
}: {
  headers: string[]
  rows: ReactNode[][]
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border/70">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/40 text-left">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-medium text-foreground">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-t border-border/70 align-top">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 text-muted-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value)
}

function escapePrintHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

export async function printStockUnitBarcodes(units: BillingStockUnit[]) {
  if (units.length === 0) {
    return
  }

  let frame: HTMLIFrameElement | null = null

  try {
    const settings = loadBarcodePrintDesignerSettings()
    const horizontalAlign =
      settings.horizontalAlign === "center"
        ? "center"
        : settings.horizontalAlign === "right"
          ? "flex-end"
          : "flex-start"
    const textAlign = settings.horizontalAlign
    const verticalAlign =
      settings.verticalAlign === "center"
        ? "center"
        : settings.verticalAlign === "bottom"
          ? "flex-end"
          : "flex-start"
    frame = document.createElement("iframe")
    frame.setAttribute("aria-hidden", "true")
    frame.style.position = "fixed"
    frame.style.right = "0"
    frame.style.bottom = "0"
    frame.style.width = "0"
    frame.style.height = "0"
    frame.style.border = "0"
    frame.style.opacity = "0"
    document.body.appendChild(frame)

    const frameWindow = frame.contentWindow
    const frameDocument = frame.contentDocument
    if (!frameWindow || !frameDocument) {
      throw new Error("Print frame is unavailable.")
    }

    const stickerHtml = units
      .map(
        (unit, index) => `
          <article class="inventory-sticker">
            ${settings.showProductName ? `<div class="line product">${escapePrintHtml(unit.productName)}</div>` : ""}
            ${settings.showProductCode ? `<div class="line code">${escapePrintHtml(unit.productCode)}</div>` : ""}
            <svg id="barcode-${index}" class="barcode-svg" aria-label="${escapePrintHtml(unit.barcodeValue)}"></svg>
            ${settings.showBarcodeText ? `<div class="line barcode-text">${escapePrintHtml(unit.barcodeValue)}</div>` : ""}
            ${
              settings.showBatch || settings.showSerial
                ? `<div class="line meta-row">
                    ${settings.showBatch ? `<span>Batch: ${escapePrintHtml(unit.batchCode ?? "No batch")}</span>` : ""}
                    ${settings.showSerial ? `<span>Serial: ${escapePrintHtml(unit.serialNumber)}</span>` : ""}
                  </div>`
                : ""
            }
            ${settings.showExpiry && unit.expiresAt ? `<div class="line expiry">Expiry: ${escapePrintHtml(unit.expiresAt)}</div>` : ""}
          </article>
        `
      )
      .join("")

    frameDocument.open()
    frameDocument.write(`
      <html>
        <head>
          <title>Print Barcode</title>
          <style>
            @page { size: 50mm 25mm; margin: 0; }
            :root { color-scheme: light; }
            * { box-sizing: border-box; }
            html, body { margin: 0; padding: 0; background: #ffffff; }
            body { font-family: Arial, sans-serif; }
            .print-sheet { display: flex; flex-wrap: wrap; align-content: flex-start; }
            .inventory-sticker {
              width: ${settings.labelWidthMm}mm;
              height: ${settings.labelHeightMm}mm;
              padding: ${settings.paddingMm}mm;
              border: ${settings.showBorder ? "0.25mm solid #111827" : "0 solid transparent"};
              display: flex;
              flex-direction: column;
              justify-content: ${verticalAlign};
              align-items: ${horizontalAlign};
              gap: ${settings.gapMm}mm;
              overflow: hidden;
              page-break-inside: avoid;
            }
            .inventory-sticker .line {
              width: 100%;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              font-size: ${settings.metaFontSizePx}px;
              line-height: 1.1;
              color: #111827;
              text-align: ${textAlign};
            }
            .inventory-sticker .product { font-size: ${settings.productFontSizePx}px; font-weight: 700; }
            .inventory-sticker .code { color: #475569; font-size: ${settings.codeFontSizePx}px; }
            .inventory-sticker .barcode-svg {
              width: 100%;
              height: ${settings.barcodeHeightMm}mm;
              display: block;
            }
            .inventory-sticker .barcode-text {
              font-size: ${settings.barcodeTextFontSizePx}px;
              font-weight: 700;
              text-align: ${textAlign};
              letter-spacing: 0.25px;
            }
            .inventory-sticker .meta-row {
              display: flex;
              justify-content: space-between;
              gap: 1mm;
            }
            .inventory-sticker .expiry { color: #334155; }
            .screen-status {
              padding: 12px 14px;
              font-size: 12px;
              color: #475569;
            }
            @media print {
              .screen-status { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="screen-status">Preparing ${units.length} barcode label${units.length === 1 ? "" : "s"}...</div>
          <section class="print-sheet">${stickerHtml}</section>
        </body>
      </html>
    `)
    frameDocument.close()

    await new Promise<void>((resolve, reject) => {
      const script = frameDocument.createElement("script")
      script.src = "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error("Barcode print library failed to load."))
      frameDocument.head.appendChild(script)
    })

    const printableWindow = frameWindow as Window & {
      JsBarcode?: (
        element: Element,
        value: string,
        options?: Record<string, unknown>
      ) => void
    }

    if (!printableWindow.JsBarcode) {
      throw new Error("Barcode print library is unavailable.")
    }

    units.forEach((unit, index) => {
      const node = frameDocument.getElementById(`barcode-${index}`)
      if (!node) {
        return
      }

      try {
        printableWindow.JsBarcode?.(node, unit.barcodeValue, {
          format: settings.barcodeStandard,
          displayValue: false,
          margin: 0,
          width: settings.barcodeLineWidth,
          height: Math.max(settings.barcodeHeightMm * 2.8, 18),
        })
      } catch {
        printableWindow.JsBarcode?.(node, unit.barcodeValue, {
          format: "CODE128",
          displayValue: false,
          margin: 0,
          width: settings.barcodeLineWidth,
          height: Math.max(settings.barcodeHeightMm * 2.8, 18),
        })
      }
    })

    await new Promise<void>((resolve) => {
      frameWindow.onafterprint = () => resolve()
      frameWindow.setTimeout(() => {
        frameWindow.focus()
        frameWindow.print()
      }, 120)
      frameWindow.setTimeout(() => resolve(), 2000)
    })
  } catch (error) {
    showAppToast({
      variant: "error",
      title: "Barcode print failed.",
      description:
        error instanceof Error
          ? error.message
          : "Unable to prepare barcode labels for print.",
    })
  } finally {
    frame?.remove()
  }
}

export function getPurchaseReceiptLineAmount(line: PurchaseReceiptLineForm) {
  return Number(line.quantity || 0) * Number(line.unitCost || 0)
}

export function getGoodsInwardExceptionQuantity(line: GoodsInwardLineForm) {
  return Number(line.rejectedQuantity || 0) + Number(line.damagedQuantity || 0)
}

export function getProductLookupOptions(products: ProductLookupItem[]): ProductLookupOption[] {
  return products
    .filter((product) => product.isActive)
    .map((product) => ({
      value: product.id,
      label: `${product.name} (${product.code})`,
    }))
}

export function getPurchaseReceiptLineProductOptions(
  line: PurchaseReceiptLineForm,
  productOptions: ProductLookupOption[],
  index: number
) {
  if (line.productId && !productOptions.some((option) => option.value === line.productId)) {
    return [
      {
        value: line.productId,
        label: line.productName ? `${line.productId} (${line.productId})` : line.productId,
      },
      ...productOptions,
    ]
  }

  if (!line.productId && line.productName) {
    return [
      {
        value: `manual:${index}`,
        label: line.productName,
      },
      ...productOptions,
    ]
  }

  return productOptions
}

export function createPurchaseReceiptProductPatch(
  product: ProductLookupItem,
  line: PurchaseReceiptLineForm
): Partial<PurchaseReceiptLineForm> {
  return {
    productId: product.id,
    productName: product.name,
    unitCost: product.costPrice > 0 ? String(product.costPrice) : line.unitCost,
  }
}

export function normalizeInlineItemNote(note: string | null | undefined) {
  return note === "Expected inward quantity." ? "" : note ?? ""
}

export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>
}

export function Field({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={["space-y-2 text-sm", className].filter(Boolean).join(" ")}>
      <span className="font-medium text-foreground">{label}</span>
      {children}
    </label>
  )
}

export function MetricCards({
  items,
}: {
  items: Array<{ label: string; value: string; tone?: "default" | "secondary" | "outline" }>
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="border-border/70 shadow-sm">
          <CardContent className="space-y-2 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {item.label}
            </p>
            <div className="flex items-center justify-between gap-3">
              <p className="text-2xl font-semibold text-foreground">{item.value}</p>
              <Badge variant={item.tone ?? "secondary"}>{item.label}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export type {
  StockReconciliationResponse,
  StockVerificationSummary,
  StockTransfer,
  StockReservation,
}
