import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  ArrowRightLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  FileTextIcon,
  PencilIcon,
  PrinterIcon,
  Trash2Icon,
  Undo2Icon,
} from "lucide-react"

import type {
  CommonModuleListResponse,
  CommonModuleRecordResponse,
  ContactListResponse,
  ProductListResponse,
} from "@core/shared"
import type { BillingStockRejectionReason, BillingStockUnit } from "../../../shared/index.ts"
import {
  createReservationForm,
  createTransferForm,
  requestJson,
  useJsonResource,
} from "./stock-workspace-api"
import { VoucherInlineEditableTable } from "@/components/blocks/voucher-inline-editable-table"
import { MasterList } from "@/components/blocks/master-list"
import { RecordActionMenu } from "@/components/blocks/record-action-menu"
import { showRecordToast } from "@/components/ui/app-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { TableCell, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { TechnicalNameBadge } from "@/components/system/technical-name-badge"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"
import { SearchableLookupField } from "@/features/forms/searchable-lookup-field"
import {
  DataTable,
  Field,
  FormGrid,
  buildWarehouseOptions,
  formatOptionalTimestamp,
  formatQuantity,
  getGoodsInwardExceptionQuantity,
  getProductLookupOptions,
  normalizeInlineItemNote,
  printStockUnitBarcodes,
  SectionIntro,
  StateCard,
  voucherInlineInputClassName,
} from "./stock-workspace-helpers"
import {
  createCustomBarcodePrintDesignerPreset,
  defaultBarcodePrintDesignerSettings,
  deleteCustomBarcodePrintDesignerPreset,
  getBarcodePrintDesignerPresets,
  getMatchingBarcodePrintDesignerPresetId,
  loadBarcodePrintDesignerSettings,
  resetBarcodePrintDesignerSettings,
  saveBarcodePrintDesignerSettings,
  type BarcodePrintDesignerPreset,
  type BarcodePrintDesignerSettings,
} from "./stock-print-designer"
import type {
  AvailabilityListResponse,
  BarcodeAliasListResponse,
  BarcodeResolutionResponse,
  DeliveryNoteListResponse,
  DeliveryNoteResponse,
  GoodsInwardListResponse,
  GoodsInwardPostingResponse,
  GoodsInwardResponse,
  GoodsInwardLineForm,
  LookupsResponse,
  MovementListResponse,
  PurchaseReceiptListResponse,
  ReservationListResponse,
  ResourceState,
  SaleAllocationListResponse,
  StockReconciliationResponse,
  StockReservation,
  StockAcceptanceResponse,
  StockAcceptanceVerificationListResponse,
  StockTransfer,
  StockUnitListResponse,
  TransferListResponse,
} from "./stock-workspace-types"

function escapeStockReportHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function formatStockStatusLabel(status: string) {
  return status.replace(/[-_]/g, " ")
}

function formatWarehouseDisplayName(value: string) {
  return value.replace(/^warehouse:/, "")
}

function getLightStockStatusBadgeClassName(status: string) {
  if (
    status === "available" ||
    status === "open" ||
    status === "requested" ||
    status === "ready" ||
    status === "confirmed" ||
    status === "posted" ||
    status === "active"
  ) {
    return "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-50"
  }

  if (
    status === "received" ||
    status === "partially-received" ||
    status === "partially_consumed" ||
    status === "partially-consumed" ||
    status === "partially_received" ||
    status === "pending_verification" ||
    status === "mismatch"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50"
  }

  if (
    status === "sold" ||
    status === "verified" ||
    status === "consumed" ||
    status === "fully_received" ||
    status === "completed"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
  }

  if (status === "allocated" || status === "approved" || status === "in-transit") {
    return "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-50"
  }

  if (status === "rejected" || status === "released" || status === "cancelled") {
    return "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-50"
  }

  if (status === "damaged" || status === "failed") {
    return "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-50"
  }

  return "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-50"
}

function renderLightStockStatusBadge(status: string, key: string, label?: string) {
  return (
    <Badge
      key={key}
      variant="outline"
      className={`capitalize ${getLightStockStatusBadgeClassName(status)}`}
    >
      {label ?? formatStockStatusLabel(status)}
    </Badge>
  )
}

function renderStockUnitStatusBadge(status: BillingStockUnit["status"], key: string) {
  const label =
    status === "rejected" ? "return" : status === "damaged" ? "damage" : status

  return renderLightStockStatusBadge(status, key, label)
}

function formatStockRejectionReasonLabel(
  reason: BillingStockRejectionReason | null | undefined
) {
  const normalizedReason = reason?.trim()

  if (!normalizedReason || normalizedReason === "rejected") {
    return "Rejected"
  }

  if (normalizedReason.toLowerCase() === "doa") {
    return "DOA"
  }

  return normalizedReason
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function renderStockRejectionReasonBadge(
  reason: BillingStockRejectionReason | null | undefined,
  key: string,
  label?: string
) {
  const normalizedReason = reason ?? "rejected"
  const className =
    normalizedReason === "doa"
      ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-50"
      : normalizedReason === "warranty"
        ? "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-50"
        : "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-50"

  return (
    <Badge key={key} variant="outline" className={className}>
      {label ?? formatStockRejectionReasonLabel(normalizedReason)}
    </Badge>
  )
}

function buildStockRejectionAuditNote(
  reason: BillingStockRejectionReason,
  note: string
) {
  const trimmedNote = note.trim()

  if (trimmedNote.length > 0) {
    return trimmedNote
  }

  return `${formatStockRejectionReasonLabel(reason)} recorded from the goods rejections page.`
}

function toLookupCode(value: string) {
  const normalizedValue = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")

  return normalizedValue || "rejected"
}

function printStockEntryDocument({
  receiptLabel,
  productLabel,
  barcodeCount,
  pendingRows,
  acceptedRows,
}: {
  receiptLabel: string
  productLabel: string
  barcodeCount: string
  pendingRows: string[][]
  acceptedRows: string[][]
}) {
  const pendingTableRows =
    pendingRows.length > 0
      ? pendingRows
          .map(
            (row) =>
              `<tr>${row.map((cell) => `<td>${escapeStockReportHtml(cell)}</td>`).join("")}</tr>`
          )
          .join("")
      : '<tr><td colspan="4">No temporary units pending verification.</td></tr>'
  const acceptedTableRows =
    acceptedRows.length > 0
      ? acceptedRows
          .map(
            (row) =>
              `<tr>${row.map((cell) => `<td>${escapeStockReportHtml(cell)}</td>`).join("")}</tr>`
          )
          .join("")
      : '<tr><td colspan="4">No accepted records found.</td></tr>'

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeStockReportHtml(productLabel)} Stock Entry</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
      .header { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
      .title { font-size: 24px; font-weight: 700; margin: 0 0 8px; }
      .meta { margin: 0; color: #4b5563; font-size: 13px; line-height: 1.6; }
      h2 { margin: 24px 0 12px; font-size: 16px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; vertical-align: top; }
      th { background: #f3f4f6; }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <h1 class="title">Stock Entry</h1>
        <p class="meta">Purchase Receipt: ${escapeStockReportHtml(receiptLabel)}</p>
        <p class="meta">Product: ${escapeStockReportHtml(productLabel)}</p>
      </div>
      <div>
        <p class="meta">Barcodes Present: ${escapeStockReportHtml(barcodeCount)}</p>
      </div>
    </div>
    <h2>Sticker Verification</h2>
    <table>
      <thead>
        <tr>
          <th>Sl No</th>
          <th>Product</th>
          <th>Barcode</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${pendingTableRows}</tbody>
    </table>
    <h2>Accepted Records</h2>
    <table>
      <thead>
        <tr>
          <th>Sl No</th>
          <th>Barcode</th>
          <th>Qty</th>
          <th>Verified At</th>
        </tr>
      </thead>
      <tbody>${acceptedTableRows}</tbody>
    </table>
  </body>
</html>`

  let frame: HTMLIFrameElement | null = null

  try {
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

    frameDocument.open()
    frameDocument.write(html)
    frameDocument.close()

    frameWindow.setTimeout(() => {
      frameWindow.focus()
      frameWindow.print()
    }, 120)
  } finally {
    if (frame?.contentWindow) {
      frame.contentWindow.setTimeout(() => {
        frame?.remove()
      }, 2000)
    } else {
      frame?.remove()
    }
  }
}

function printStockLedgerConsolidatedDocument({
  warehouseLabel,
  rows,
}: {
  warehouseLabel: string
  rows: string[][]
}) {
  const tableRows =
    rows.length > 0
      ? rows
          .map(
            (row) =>
              `<tr>${row.map((cell) => `<td>${escapeStockReportHtml(cell)}</td>`).join("")}</tr>`
          )
          .join("")
      : '<tr><td colspan="4">No stock ledger rows found.</td></tr>'

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Stock Ledger Consolidated Report</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
      .header { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
      .title { font-size: 24px; font-weight: 700; margin: 0 0 8px; }
      .meta { margin: 0; color: #4b5563; font-size: 13px; line-height: 1.6; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; vertical-align: top; }
      th { background: #f3f4f6; }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <h1 class="title">Stock Ledger Consolidated Report</h1>
        <p class="meta">Warehouse: ${escapeStockReportHtml(warehouseLabel)}</p>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Stock Received</th>
          <th>Stock Accepted</th>
          <th>Live Stock Balance</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
  </body>
</html>`

  let frame: HTMLIFrameElement | null = null

  try {
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

    frameDocument.open()
    frameDocument.write(html)
    frameDocument.close()

    frameWindow.setTimeout(() => {
      frameWindow.focus()
      frameWindow.print()
    }, 120)
  } finally {
    if (frame?.contentWindow) {
      frame.contentWindow.setTimeout(() => {
        frame?.remove()
      }, 2000)
    } else {
      frame?.remove()
    }
  }
}

export function StockEntrySection() {
  const [refreshNonce, setRefreshNonce] = useState(0)
  const receiptLookup = useJsonResource<PurchaseReceiptListResponse>(
    "/internal/v1/stock/purchase-receipts"
  )
  const productLookup = useJsonResource<ProductListResponse>("/internal/v1/core/products")
  const [purchaseReceiptId, setPurchaseReceiptId] = useState("")
  const [productId, setProductId] = useState("")
  const stockUnits = useJsonResource<StockUnitListResponse>("/internal/v1/stock/stock-units", [
    refreshNonce,
  ])
  const acceptanceRecordsPath =
    purchaseReceiptId && productId
      ? `/internal/v1/stock/stock-acceptance-verifications?purchaseReceiptId=${encodeURIComponent(purchaseReceiptId)}&productId=${encodeURIComponent(productId)}`
      : ""
  const acceptanceRecords = useJsonResource<StockAcceptanceVerificationListResponse>(
    acceptanceRecordsPath,
    [purchaseReceiptId, productId, refreshNonce]
  )
  const [barcodeInputs, setBarcodeInputs] = useState<Record<string, string>>({})
  const [rejectionSelections, setRejectionSelections] = useState<Record<string, boolean>>({})
  const [rejectionNotes, setRejectionNotes] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<string | null>(null)
  const barcodeInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  useGlobalLoading(
    receiptLookup.isLoading ||
      productLookup.isLoading ||
      stockUnits.isLoading ||
      acceptanceRecords.isLoading
  )

  if (
    receiptLookup.isLoading ||
    productLookup.isLoading ||
    stockUnits.isLoading ||
    acceptanceRecords.isLoading
  ) {
    return null
  }

  if (
    receiptLookup.error ||
    productLookup.error ||
    stockUnits.error ||
    acceptanceRecords.error
  ) {
    return (
      <StateCard
        message={
          receiptLookup.error ??
          productLookup.error ??
          stockUnits.error ??
          acceptanceRecords.error ??
          "Stock entry lookups are unavailable."
        }
      />
    )
  }

  if (!receiptLookup.data || !productLookup.data || !stockUnits.data) {
    return <StateCard message="Stock entry lookups are unavailable." />
  }

  const receiptOptions = receiptLookup.data.items.map((receipt) => ({
    value: receipt.id,
    label: `${receipt.entryNumber} · ${receipt.postingDate}`,
  }))
  const selectedReceipt =
    receiptLookup.data.items.find((receipt) => receipt.id === purchaseReceiptId) ?? null
  const receiptProductIds = new Set(selectedReceipt?.lines.map((line) => line.productId) ?? [])
  const productOptions = productLookup.data.items
    .filter((product) => product.isActive && receiptProductIds.has(product.id))
    .map((product) => ({
      value: product.id,
      label: `${product.name} (${product.code})`,
    }))
  const productById = new Map(
    productLookup.data.items.map((product) => [product.id, product] as const)
  )
  const selectedProduct =
    productLookup.data.items.find((product) => product.id === productId) ?? null
  const pendingVerificationUnits = stockUnits.data.items.filter(
    (stockUnit) =>
      stockUnit.purchaseReceiptId === purchaseReceiptId &&
      stockUnit.productId === productId &&
      stockUnit.status === "received"
  )
  const barcodeCount = pendingVerificationUnits.length
  const verifiedAcceptanceRecords =
    acceptanceRecords.data?.items.filter((item) => item.status === "verified") ?? []
  const rejectedAcceptanceRecords =
    acceptanceRecords.data?.items.filter((item) => item.status === "rejected") ?? []
  const normalizeScannedBarcode = (value: string) => value.trim().toUpperCase()
  const recordDateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  })
  const verifiedCount = pendingVerificationUnits.filter((stockUnit) => {
    if (rejectionSelections[stockUnit.id]) {
      return false
    }

    const inputValue = barcodeInputs[stockUnit.id]
    return (
      typeof inputValue === "string" &&
      normalizeScannedBarcode(inputValue) === normalizeScannedBarcode(stockUnit.barcodeValue)
    )
  }).length

  function handleBarcodeInputChange(stockUnitId: string, value: string) {
    setBarcodeInputs((current) => ({
      ...current,
      [stockUnitId]: value,
    }))
  }

  function handleRejectionSelectionChange(stockUnitId: string, rejected: boolean) {
    setRejectionSelections((current) => ({
      ...current,
      [stockUnitId]: rejected,
    }))

    if (!rejected) {
      setRejectionNotes((current) => ({
        ...current,
        [stockUnitId]: "",
      }))
    }
  }

  function handleRejectionNoteChange(stockUnitId: string, value: string) {
    setRejectionNotes((current) => ({
      ...current,
      [stockUnitId]: value,
    }))
  }

  function getVerificationStatus(stockUnitId: string, expectedBarcodeValue: string) {
    const inputValue = barcodeInputs[stockUnitId]

    if (!inputValue?.trim()) {
      return "pending"
    }

    return normalizeScannedBarcode(inputValue) === normalizeScannedBarcode(expectedBarcodeValue)
      ? "verified"
      : "mismatch"
  }

  function focusNextBarcodeInput(currentStockUnitId: string) {
    const currentIndex = pendingVerificationUnits.findIndex(
      (stockUnit) => stockUnit.id === currentStockUnitId
    )

    if (currentIndex === -1) {
      return
    }

    const nextUnit = pendingVerificationUnits.slice(currentIndex + 1).find((stockUnit) => {
      const inputValue = barcodeInputs[stockUnit.id]
      return normalizeScannedBarcode(inputValue ?? "") !== normalizeScannedBarcode(stockUnit.barcodeValue)
    })

    const nextFocusableUnit = nextUnit ?? pendingVerificationUnits[currentIndex + 1] ?? null

    if (!nextFocusableUnit) {
      return
    }

    barcodeInputRefs.current[nextFocusableUnit.id]?.focus()
    barcodeInputRefs.current[nextFocusableUnit.id]?.select()
  }

  function handleBarcodeInputKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
    stockUnitId: string
  ) {
    if (event.key !== "Enter" && event.key !== "Tab") {
      return
    }

    event.preventDefault()
    focusNextBarcodeInput(stockUnitId)
  }

  async function handleConfirmAcceptance() {
    if (!purchaseReceiptId.trim() || !productId.trim()) {
      setMessage("Select a purchase receipt and product before confirming stock acceptance.")
      return
    }

    const acceptanceItems = pendingVerificationUnits
      .map((stockUnit) => ({
        stockUnitId: stockUnit.id,
        scannedBarcodeValue: rejectionSelections[stockUnit.id]
          ? barcodeInputs[stockUnit.id]?.trim() || stockUnit.barcodeValue
          : barcodeInputs[stockUnit.id]?.trim() ?? "",
        rejected: Boolean(rejectionSelections[stockUnit.id]),
        rejectionReason: rejectionSelections[stockUnit.id] ? "rejected" : null,
        rejectionNote: rejectionSelections[stockUnit.id]
          ? rejectionNotes[stockUnit.id]?.trim() ?? ""
          : "",
      }))
      .filter((item) => item.scannedBarcodeValue.length > 0 || item.rejected)

    if (acceptanceItems.length === 0) {
      setMessage("Scan at least one barcode or mark rejected rows before confirming stock acceptance.")
      return
    }

    const missingRejectionNote = acceptanceItems.find(
      (item) => item.rejected && !(item.rejectionNote?.trim().length > 0)
    )

    if (missingRejectionNote) {
      setMessage("Enter rejection notes for every rejected barcode row before confirmation.")
      return
    }

    try {
      const response = await requestJson<StockAcceptanceResponse>("/internal/v1/stock/stock-acceptance", {
        method: "POST",
        body: JSON.stringify({
          purchaseReceiptId,
          productId,
          items: acceptanceItems,
        }),
      })

      setMessage(
        `Accepted ${response.acceptedCount} verified unit${response.acceptedCount === 1 ? "" : "s"} (${response.acceptedQuantity}). Rejected ${response.rejectedCount} unit${response.rejectedCount === 1 ? "" : "s"} (${response.rejectedQuantity}). ${response.mismatchCount} mismatch item${response.mismatchCount === 1 ? "" : "s"}, ${response.remainingCount} unit${response.remainingCount === 1 ? "" : "s"} still temporary.`
      )
      setBarcodeInputs({})
      setRejectionSelections({})
      setRejectionNotes({})
      setRefreshNonce((current) => current + 1)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to confirm stock acceptance.")
    }
  }

  function handlePrintStockEntry() {
    if (!selectedReceipt || !selectedProduct) {
      setMessage("Select a purchase receipt and product before printing stock entry.")
      return
    }

    printStockEntryDocument({
      receiptLabel: `${selectedReceipt.entryNumber} / ${selectedReceipt.postingDate}`,
      productLabel: `${selectedProduct.name} (${selectedProduct.code})`,
      barcodeCount: String(barcodeCount),
      pendingRows: pendingVerificationUnits.map((stockUnit, index) => {
        const verificationStatus = getVerificationStatus(stockUnit.id, stockUnit.barcodeValue)
        const resolvedProduct = productById.get(stockUnit.productId)
        return [
          String(index + 1),
          `${resolvedProduct?.name ?? stockUnit.productName} (${resolvedProduct?.code ?? stockUnit.productCode})`,
          barcodeInputs[stockUnit.id] ?? "",
          verificationStatus,
        ]
      }),
      acceptedRows: verifiedAcceptanceRecords.map((item, index) => [
        String(index + 1),
        item.scannedBarcodeValue,
        formatQuantity(item.quantityAccepted),
        item.verifiedAt
          ? recordDateTimeFormatter.format(new Date(item.verifiedAt))
          : "-",
      ]),
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Stock Entry</CardTitle>
            <CardDescription>
              Select the purchase receipt and choose the product from its receipt items.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Field label="Purchase receipt entry no / date">
                    <SearchableLookupField
                      emptyOptionLabel="Select purchase receipt"
                      noResultsMessage="No purchase receipts found."
                      onValueChange={(nextValue) => {
                        if (!nextValue) {
                          return
                        }

                        setPurchaseReceiptId(nextValue)
                        setProductId("")
                        setBarcodeInputs({})
                        setRejectionSelections({})
                        setRejectionNotes({})
                      }}
                      options={receiptOptions}
                      placeholder="Select purchase receipt"
                      searchPlaceholder="Search receipt"
                      triggerClassName="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-none focus-visible:border-ring focus-visible:ring-0"
                      value={purchaseReceiptId}
                    />
                  </Field>
                </div>
                <Field label="Product">
                  <SearchableLookupField
                    emptyOptionLabel="Select product"
                    noResultsMessage={
                      purchaseReceiptId ? "No receipt items found." : "Select purchase receipt first."
                    }
                    onValueChange={(nextValue) => {
                      if (!nextValue) {
                        return
                      }

                        setProductId(nextValue)
                        setBarcodeInputs({})
                        setRejectionSelections({})
                        setRejectionNotes({})
                      }}
                    options={productOptions}
                    placeholder={purchaseReceiptId ? "Select product" : "Select purchase receipt first"}
                    searchPlaceholder="Search product"
                    triggerClassName="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-none focus-visible:border-ring focus-visible:ring-0"
                    value={productId}
                  />
                </Field>
                <Field label="Barcodes present">
                  <div className="flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground">
                    {barcodeCount}
                  </div>
                </Field>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="bg-violet-600 text-white hover:bg-violet-700"
                  onClick={handlePrintStockEntry}
                >
                  <PrinterIcon className="mr-2 size-4" />
                  Print
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Sticker Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border/70">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/70 bg-muted/20 text-left">
                    <th className="px-4 py-3 font-medium text-foreground">Sl No</th>
                    <th className="px-4 py-3 font-medium text-foreground">Product</th>
                    <th className="px-4 py-3 font-medium text-foreground">Barcode</th>
                    <th className="px-4 py-3 font-medium text-foreground">Status</th>
                    <th className="px-4 py-3 font-medium text-foreground">Reject</th>
                    <th className="px-4 py-3 font-medium text-foreground">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {pendingVerificationUnits.length > 0 ? (
                    pendingVerificationUnits.map((stockUnit, index) => {
                      const verificationStatus = getVerificationStatus(
                        stockUnit.id,
                        stockUnit.barcodeValue
                      )
                      const displayStatus = rejectionSelections[stockUnit.id]
                        ? "rejected"
                        : verificationStatus
                      const resolvedProduct = productById.get(stockUnit.productId)
                      const productDisplayName = resolvedProduct?.name ?? stockUnit.productName
                      const productDisplayCode = resolvedProduct?.code ?? stockUnit.productCode

                      return (
                        <tr key={stockUnit.id}>
                          <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <p className="font-medium text-foreground">{productDisplayName}</p>
                              <p className="text-xs text-muted-foreground">{productDisplayCode}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              ref={(element) => {
                                barcodeInputRefs.current[stockUnit.id] = element
                              }}
                              placeholder="Scan or enter barcode"
                              value={barcodeInputs[stockUnit.id] ?? ""}
                              onChange={(event) =>
                                handleBarcodeInputChange(stockUnit.id, event.target.value)
                              }
                              onKeyDown={(event) =>
                                handleBarcodeInputKeyDown(event, stockUnit.id)
                              }
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={
                                displayStatus === "verified"
                                  ? "inline-flex h-8 items-center rounded-full bg-emerald-100 px-3 text-xs font-medium text-emerald-700"
                                  : displayStatus === "mismatch"
                                    ? "inline-flex h-8 items-center rounded-full bg-rose-100 px-3 text-xs font-medium text-rose-700"
                                    : displayStatus === "rejected"
                                      ? "inline-flex h-8 items-center rounded-full bg-orange-100 px-3 text-xs font-medium text-orange-700"
                                      : "inline-flex h-8 items-center rounded-full bg-muted px-3 text-xs font-medium text-muted-foreground"
                              }
                            >
                              {displayStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center">
                              <Checkbox
                                checked={Boolean(rejectionSelections[stockUnit.id])}
                                onCheckedChange={(checked) =>
                                  handleRejectionSelectionChange(stockUnit.id, checked === true)
                                }
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              placeholder="Rejected quantity notes"
                              value={rejectionNotes[stockUnit.id] ?? ""}
                              disabled={!rejectionSelections[stockUnit.id]}
                              onChange={(event) =>
                                handleRejectionNoteChange(stockUnit.id, event.target.value)
                              }
                            />
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                        No temporary units are pending barcode verification for this selection.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Verified {verifiedCount} of {pendingVerificationUnits.length} remaining temporary stock unit
                {pendingVerificationUnits.length === 1 ? "" : "s"}.
              </p>
              <Button
                type="button"
                onClick={() => void handleConfirmAcceptance()}
                disabled={pendingVerificationUnits.length === 0}
              >
                Confirm partial stock acceptance
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Accepted Records</CardTitle>
            <CardDescription>
              Verified barcode rows already accepted into stock.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border/70">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/70 bg-muted/20 text-left">
                    <th className="px-4 py-3 font-medium text-foreground">Sl No</th>
                    <th className="px-4 py-3 font-medium text-foreground">Barcode</th>
                    <th className="px-4 py-3 font-medium text-foreground">Qty</th>
                    <th className="px-4 py-3 font-medium text-foreground">Verified At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {verifiedAcceptanceRecords.length > 0 ? (
                    verifiedAcceptanceRecords.map((item, index) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                          <td className="px-4 py-3 font-medium text-foreground">
                            {item.scannedBarcodeValue}
                          </td>
                          <td className="px-4 py-3 text-foreground">{item.quantityAccepted}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {item.verifiedAt
                              ? recordDateTimeFormatter.format(new Date(item.verifiedAt))
                              : "-"}
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                        Accepted barcode records will appear here after partial stock acceptance.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Rejected Records</CardTitle>
            <CardDescription>
              Rejected barcode rows saved from the current sticker verification run.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border/70">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/70 bg-muted/20 text-left">
                    <th className="px-4 py-3 font-medium text-foreground">Sl No</th>
                    <th className="px-4 py-3 font-medium text-foreground">Barcode</th>
                    <th className="px-4 py-3 font-medium text-foreground">Qty</th>
                    <th className="px-4 py-3 font-medium text-foreground">Reason</th>
                    <th className="px-4 py-3 font-medium text-foreground">Notes</th>
                    <th className="px-4 py-3 font-medium text-foreground">Rejected At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {rejectedAcceptanceRecords.length > 0 ? (
                    rejectedAcceptanceRecords.map((item, index) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {item.expectedBarcodeValue}
                        </td>
                        <td className="px-4 py-3 text-foreground">{item.quantityRejected}</td>
                        <td className="px-4 py-3">
                          {renderStockRejectionReasonBadge(
                            item.rejectionReason ?? "rejected",
                            `${item.id}:reason`
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {item.rejectionNote ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {recordDateTimeFormatter.format(new Date(item.updatedAt))}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                        Rejected barcode records will appear here after stock rejection is confirmed.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
      {message ? <StateCard message={message} /> : null}
    </div>
  )
}

export function GoodsRejectionsSection() {
  const [refreshNonce, setRefreshNonce] = useState(0)
  const [rejectionTypeRefreshNonce, setRejectionTypeRefreshNonce] = useState(0)
  const receiptLookup = useJsonResource<PurchaseReceiptListResponse>(
    "/internal/v1/stock/purchase-receipts"
  )
  const goodsInwardLookup = useJsonResource<GoodsInwardListResponse>("/internal/v1/stock/goods-inward")
  const rejectionTypeLookup = useJsonResource<CommonModuleListResponse>(
    "/internal/v1/core/common-modules/items?module=stockRejectionTypes",
    [rejectionTypeRefreshNonce]
  )
  const acceptanceRecords = useJsonResource<StockAcceptanceVerificationListResponse>(
    "/internal/v1/stock/stock-acceptance-verifications?status=rejected",
    [refreshNonce]
  )
  const [purchaseReceiptId, setPurchaseReceiptId] = useState("")
  const [barcodeValue, setBarcodeValue] = useState("")
  const [rejectionReason, setRejectionReason] =
    useState<BillingStockRejectionReason>("rejected")
  const [rejectionNote, setRejectionNote] = useState("")
  const [matchedUnit, setMatchedUnit] = useState<BillingStockUnit | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCreatingRejectionType, setIsCreatingRejectionType] = useState(false)
  const [rejectedTablePage, setRejectedTablePage] = useState(1)
  const [rejectedTablePageSize, setRejectedTablePageSize] = useState(20)
  const barcodeInputRef = useRef<HTMLInputElement | null>(null)

  useGlobalLoading(
    receiptLookup.isLoading ||
      goodsInwardLookup.isLoading ||
      rejectionTypeLookup.isLoading ||
      acceptanceRecords.isLoading
  )

  if (
    receiptLookup.isLoading ||
    goodsInwardLookup.isLoading ||
    rejectionTypeLookup.isLoading ||
    acceptanceRecords.isLoading
  ) {
    return null
  }

  if (
    receiptLookup.error ||
    goodsInwardLookup.error ||
    rejectionTypeLookup.error ||
    acceptanceRecords.error ||
    !receiptLookup.data ||
    !goodsInwardLookup.data ||
    !rejectionTypeLookup.data ||
    !acceptanceRecords.data
  ) {
    return (
      <StateCard
        message={
          receiptLookup.error ??
          goodsInwardLookup.error ??
          rejectionTypeLookup.error ??
          acceptanceRecords.error ??
          "Goods rejection records are unavailable."
        }
      />
    )
  }

  const receiptOptions = receiptLookup.data.items.map((receipt) => ({
    value: receipt.id,
    label: `${receipt.entryNumber} · ${receipt.postingDate}`,
  }))
  const receiptById = new Map(
    receiptLookup.data.items.map((receipt) => [receipt.id, receipt] as const)
  )
  const goodsInwardById = new Map(
    goodsInwardLookup.data.items.map((item) => [item.id, item] as const)
  )
  const rejectionTypeItems = rejectionTypeLookup.data.items
    .filter((item) => item.isActive && String(item.code ?? "").trim() !== "-")
    .map((item) => ({
      id: item.id,
      code: String(item.code ?? "").trim(),
      name: String(item.name ?? "").trim(),
      description: String(item.description ?? "").trim(),
    }))
    .filter((item) => item.code && item.name)
  const rejectionTypeOptions = rejectionTypeItems.map((item) => ({
    value: item.code,
    label: item.name,
  }))
  const rejectionTypeLabelByCode = new Map(
    rejectionTypeOptions.map((option) => [option.value, option.label] as const)
  )
  const rejectedItems = acceptanceRecords.data.items.filter(
    (item) => !purchaseReceiptId || item.purchaseReceiptId === purchaseReceiptId
  )
  const rejectedQuantity = rejectedItems.reduce((sum, item) => sum + item.quantityRejected, 0)
  const rejectedTableTotalPages = Math.max(1, Math.ceil(rejectedItems.length / rejectedTablePageSize))
  const rejectedTableCurrentPage = Math.min(rejectedTablePage, rejectedTableTotalPages)
  const rejectedTableStartIndex =
    rejectedItems.length === 0 ? 0 : (rejectedTableCurrentPage - 1) * rejectedTablePageSize
  const rejectedTableEndIndex = Math.min(
    rejectedTableStartIndex + rejectedTablePageSize,
    rejectedItems.length
  )
  const pagedRejectedItems = rejectedItems.slice(rejectedTableStartIndex, rejectedTableEndIndex)

  async function resolveReceivedStockUnit(scannedBarcodeValue: string) {
    const normalizedBarcodeValue = scannedBarcodeValue.trim()

    if (!normalizedBarcodeValue) {
      throw new Error("Scan or enter a barcode before updating goods rejection.")
    }

    const response = await requestJson<BarcodeResolutionResponse>("/internal/v1/stock/barcode/resolve", {
      method: "POST",
      body: JSON.stringify({
        barcodeValue: normalizedBarcodeValue,
      }),
    })
    const stockUnit = response.item.stockUnit

    if (!response.item.resolved || !stockUnit) {
      throw new Error("Scanned barcode did not match any stock unit.")
    }

    if (stockUnit.status !== "received") {
      const statusMessage =
        stockUnit.status === "available"
          ? "already accepted into live stock"
          : stockUnit.status === "rejected"
            ? "already moved into the rejection register"
            : `currently ${stockUnit.status}`
      throw new Error(
        `Scanned barcode belongs to a stock unit that is ${statusMessage} and cannot be updated from this card.`
      )
    }

    return stockUnit
  }

  async function handleLookupBarcode() {
    try {
      const stockUnit = await resolveReceivedStockUnit(barcodeValue)
      setMatchedUnit(stockUnit)
      setMessage(
        `${stockUnit.productName} (${stockUnit.productCode}) is ready to move into the rejection register.`
      )
    } catch (error) {
      setMatchedUnit(null)
      setMessage(error instanceof Error ? error.message : "Barcode lookup failed.")
    }
  }

  async function handleCreateRejectionType(query: string) {
    const name = query.trim()
    const code = toLookupCode(name)

    if (!name) {
      return
    }

    const existingOption = rejectionTypeOptions.find(
      (option) =>
        option.value.toLowerCase() === code ||
        option.label.trim().toLowerCase() === name.toLowerCase()
    )

    if (existingOption) {
      setRejectionReason(existingOption.value)
      return
    }

    setIsCreatingRejectionType(true)
    setMessage(null)

    try {
      const response = await requestJson<CommonModuleRecordResponse>(
        "/internal/v1/core/common-modules/items?module=stockRejectionTypes",
        {
          method: "POST",
          body: JSON.stringify({
            code,
            name,
            description: "",
            isActive: true,
          }),
        }
      )
      const createdCode = String(response.item.code ?? code)

      setRejectionReason(createdCode)
      setRejectionTypeRefreshNonce((current) => current + 1)
      setMessage(`Created rejection type ${String(response.item.name ?? name)}.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to create rejection type.")
    } finally {
      setIsCreatingRejectionType(false)
    }
  }

  async function handleSubmitGoodsRejection() {
    setIsSubmitting(true)
    setMessage(null)

    try {
      const stockUnit =
        matchedUnit && matchedUnit.status === "received"
          ? matchedUnit
          : await resolveReceivedStockUnit(barcodeValue)

      await requestJson<StockAcceptanceResponse>("/internal/v1/stock/stock-acceptance", {
        method: "POST",
        body: JSON.stringify({
          purchaseReceiptId: stockUnit.purchaseReceiptId,
          productId: stockUnit.productId,
          items: [
            {
              stockUnitId: stockUnit.id,
              scannedBarcodeValue: barcodeValue.trim(),
              rejected: true,
              rejectionReason,
              rejectionNote: buildStockRejectionAuditNote(rejectionReason, rejectionNote),
            },
          ],
        }),
      })

      setPurchaseReceiptId(stockUnit.purchaseReceiptId)
      setMatchedUnit(null)
      setBarcodeValue("")
      setRejectionReason("rejected")
      setRejectionNote("")
      setRefreshNonce((current) => current + 1)
      setMessage(
        `Moved ${stockUnit.productName} (${stockUnit.productCode}) into goods rejection as ${rejectionTypeLabelByCode.get(rejectionReason) ?? formatStockRejectionReasonLabel(rejectionReason)}.`
      )
      window.setTimeout(() => {
        barcodeInputRef.current?.focus()
      }, 0)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update goods rejection.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card
        className="relative border-border/70 shadow-sm"
        data-technical-name="card.stock.goods-rejections.barcode-update"
      >
        <TechnicalNameBadge
          className="absolute right-4 top-4 z-10 max-w-[calc(100%-2rem)]"
          name="card.stock.goods-rejections.barcode-update"
        />
        <CardHeader>
          <CardTitle>Reject Barcode</CardTitle>
          <CardDescription>
            Scan a received barcode, choose a type, and mark it rejected.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid items-end gap-4 xl:grid-cols-[minmax(0,1.3fr)_260px_minmax(0,1fr)_auto]">
            <Field label="Barcode input">
              <Input
                ref={barcodeInputRef}
                className="h-11 text-base"
                placeholder="Scan received barcode"
                value={barcodeValue}
                onChange={(event) => {
                  setBarcodeValue(event.target.value)
                  setMatchedUnit(null)
                  setMessage(null)
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") {
                    return
                  }

                  event.preventDefault()
                  void handleLookupBarcode()
                }}
              />
            </Field>
            <Field label="Rejection type">
              <SearchableLookupField
                createActionLabel="Create rejection type"
                disabled={isCreatingRejectionType}
                noResultsMessage="No rejection types found."
                onCreateNew={(query) => {
                  void handleCreateRejectionType(query)
                }}
                onValueChange={(nextValue) =>
                  setRejectionReason(nextValue as BillingStockRejectionReason)
                }
                options={rejectionTypeOptions}
                placeholder={isCreatingRejectionType ? "Creating..." : "Select rejection type"}
                searchPlaceholder="Search rejection type"
                triggerClassName="h-11"
                value={rejectionReason}
              />
            </Field>
            <Field label="Note">
              <Input
                className="h-11"
                placeholder="Optional details"
                value={rejectionNote}
                onChange={(event) => {
                  setRejectionNote(event.target.value)
                }}
              />
            </Field>
            <div className="flex items-end xl:w-auto">
              <Button
                type="button"
                className="h-11 w-full xl:min-w-32"
                onClick={() => void handleSubmitGoodsRejection()}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
          {matchedUnit ? (
            <div className="grid gap-3 rounded-xl border border-border/70 bg-muted/10 p-4 md:grid-cols-4">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Product
                </p>
                <p className="font-medium text-foreground">{matchedUnit.productName}</p>
                <p className="text-xs text-muted-foreground">{matchedUnit.productCode}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Purchase receipt
                </p>
                <p className="font-medium text-foreground">{matchedUnit.purchaseReceiptNumber}</p>
                <p className="text-xs text-muted-foreground">{matchedUnit.goodsInwardNumber}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Warehouse
                </p>
                <p className="font-medium text-foreground">{matchedUnit.warehouseName}</p>
                <p className="text-xs text-muted-foreground">{matchedUnit.barcodeValue}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Current status
                </p>
                <div>{renderStockUnitStatusBadge(matchedUnit.status, `${matchedUnit.id}:status`)}</div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
      <Card className="border-border/70 shadow-sm">
        <CardContent className="p-5">
          <div className="grid items-end gap-5 xl:grid-cols-[minmax(0,1fr)_auto]">
            <Field label="Purchase receipt">
              <SearchableLookupField
                emptyOptionLabel="All receipts"
                noResultsMessage="No purchase receipts found."
                onValueChange={(nextValue) => {
                  setPurchaseReceiptId(nextValue)
                  setRejectedTablePage(1)
                }}
                options={receiptOptions}
                placeholder="All purchase receipts"
                searchPlaceholder="Search receipt"
                triggerClassName="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-none focus-visible:border-ring focus-visible:ring-0"
                value={purchaseReceiptId}
              />
            </Field>
            <div className="flex flex-wrap items-center gap-6 xl:justify-end">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">Rejected rows</span>
                <Badge
                  variant="outline"
                  className="min-w-10 justify-center rounded-full border-orange-200 bg-orange-50 px-3 py-1.5 text-base font-semibold text-orange-700 hover:bg-orange-50"
                >
                  {rejectedItems.length}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">Rejected quantity</span>
                <Badge
                  variant="outline"
                  className="min-w-10 justify-center rounded-full border-orange-200 bg-orange-50 px-3 py-1.5 text-base font-semibold text-orange-700 hover:bg-orange-50"
                >
                  {formatQuantity(rejectedQuantity)}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/70 shadow-sm">
        <CardContent className="p-4">
          <DataTable
            headers={[
              "Rejected at",
              "Purchase receipt",
              "Goods inward",
              "Product",
              "Barcode",
              "Qty rejected",
              "Warehouse",
              "Notes",
              "Reason",
            ]}
            rows={
              rejectedItems.length > 0
                ? pagedRejectedItems.map((item) => [
                    formatOptionalTimestamp(item.updatedAt),
                    receiptById.get(item.purchaseReceiptId)?.entryNumber ?? item.purchaseReceiptId,
                    goodsInwardById.get(item.goodsInwardId)?.inwardNumber ?? item.goodsInwardId,
                    <div key={`${item.id}:product`}>
                      <p className="font-medium text-foreground">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">{item.productCode}</p>
                    </div>,
                    <span key={`${item.id}:barcode`} className="font-mono text-xs text-foreground">
                      {item.expectedBarcodeValue}
                    </span>,
                    formatQuantity(item.quantityRejected),
                    formatWarehouseDisplayName(item.warehouseName),
                    item.rejectionNote ?? "-",
                    renderStockRejectionReasonBadge(
                      item.rejectionReason ?? "rejected",
                      `${item.id}:reason`,
                      rejectionTypeLabelByCode.get(item.rejectionReason ?? "rejected")
                    ),
                  ])
                : [[
                    "No rejected goods found.",
                    "-",
                    "-",
                    "-",
                    "-",
                    "-",
                    "-",
                    "-",
                    "-",
                  ]]
            }
          />
          <div className="mt-4 flex flex-col gap-3 rounded-md border border-border/70 bg-background px-4 py-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <span>
                Total rejected: <span className="font-semibold text-foreground">{rejectedItems.length}</span>
              </span>
              <label className="flex items-center gap-2">
                <span>Rows per page</span>
                <select
                  className="border-input bg-background h-9 rounded-md border px-3 text-sm text-foreground"
                  value={rejectedTablePageSize}
                  onChange={(event) => {
                    setRejectedTablePageSize(Number(event.target.value))
                    setRejectedTablePage(1)
                  }}
                >
                  {[10, 20, 50, 100].map((pageSize) => (
                    <option key={pageSize} value={pageSize}>
                      {pageSize}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-3 md:justify-end">
              <span>
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {rejectedItems.length === 0 ? 0 : rejectedTableStartIndex + 1}
                </span>{" "}
                to <span className="font-semibold text-foreground">{rejectedTableEndIndex}</span>{" "}
                of <span className="font-semibold text-foreground">{rejectedItems.length}</span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={rejectedTableCurrentPage <= 1}
                onClick={() => setRejectedTablePage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <Badge
                variant="outline"
                className="min-w-9 justify-center border-border bg-background px-3 py-1.5 text-sm font-semibold text-foreground"
              >
                {rejectedTableCurrentPage}
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={rejectedTableCurrentPage >= rejectedTableTotalPages}
                onClick={() =>
                  setRejectedTablePage((current) =>
                    Math.min(rejectedTableTotalPages, current + 1)
                  )
                }
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {message ? <StateCard message={message} /> : null}
    </div>
  )
}

type DeliveryNoteItem = {
  id: string
  productId: string
  barcodeValue: string
  productName: string
  productCode: string
  batchCode: string
  serialNumber: string
  warehouseId: string
  warehouseName: string
  quantity: number
  stockUnitStatus: string
}

type TransferItem = {
  id: string
  productId: string
  barcodeValue: string
  productName: string
  productCode: string
  batchCode: string
  serialNumber: string
  warehouseId: string
  warehouseName: string
  quantity: number
  stockUnitStatus: string
}

function getTodayDateInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function getNextDeliveryNoteNumber(items: DeliveryNoteListResponse["items"], currentNoteId?: string) {
  const maxSequence = items.reduce((currentMax, item) => {
    if (currentNoteId && item.id === currentNoteId) {
      return currentMax
    }

    const match = /^(\d+)$/.exec(item.deliveryNoteNumber.trim())
    if (!match) {
      return currentMax
    }

    const sequence = Number(match[1])
    return Number.isFinite(sequence) ? Math.max(currentMax, sequence) : currentMax
  }, 0)

  return String(maxSequence + 1).padStart(2, "0")
}

const deliveryEligibleStockStatuses = new Set(["available", "allocated"])

function createDeliveryNoteItemFromStockUnit(stockUnit: BillingStockUnit): DeliveryNoteItem {
  return {
    id: stockUnit.id,
    productId: stockUnit.productId,
    barcodeValue: stockUnit.barcodeValue,
    productName: stockUnit.productName,
    productCode: stockUnit.productCode,
    batchCode: stockUnit.batchCode ?? "No batch",
    serialNumber: stockUnit.serialNumber,
    warehouseId: stockUnit.warehouseId,
    warehouseName: formatWarehouseDisplayName(stockUnit.warehouseName),
    quantity: stockUnit.quantity,
    stockUnitStatus: stockUnit.status,
  }
}

function createTransferItemFromStockUnit(stockUnit: BillingStockUnit): TransferItem {
  return {
    id: stockUnit.id,
    productId: stockUnit.productId,
    barcodeValue: stockUnit.barcodeValue,
    productName: stockUnit.productName,
    productCode: stockUnit.productCode,
    batchCode: stockUnit.batchCode ?? "No batch",
    serialNumber: stockUnit.serialNumber,
    warehouseId: stockUnit.warehouseId,
    warehouseName: formatWarehouseDisplayName(stockUnit.warehouseName),
    quantity: stockUnit.quantity,
    stockUnitStatus: stockUnit.status,
  }
}

function getDeliveryStockUnitLabel(stockUnit: BillingStockUnit) {
  return `${stockUnit.barcodeValue} - ${stockUnit.productName} (${stockUnit.productCode})`
}

function formatDeliveryNoteDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) {
    return value
  }

  return `${match[3]}-${match[2]}-${match[1]}`
}

function formatDeliveryContactLabel(
  contactId: string,
  contacts: ContactListResponse["items"] = []
) {
  const contact = contacts.find((item) => item.id === contactId)
  if (contact) {
    return contact.name
  }

  return contactId.replace(/^contact:/, "").replace(/[-_]+/g, " ")
}

function printDeliveryNoteDocument({
  customerLabel,
  deliveryNoteNumber,
  isReturn,
  items,
  note,
  postingDate,
  totalQuantity,
  warehouseLabel,
}: {
  customerLabel: string
  deliveryNoteNumber: string
  isReturn: boolean
  items: DeliveryNoteItem[]
  note: string
  postingDate: string
  totalQuantity: number
  warehouseLabel: string
}) {
  const itemRows =
    items.length > 0
      ? items
          .map(
            (item, index) => `
        <tr>
          <td>${escapeStockReportHtml(String(index + 1).padStart(2, "0"))}</td>
          <td>
            <strong>${escapeStockReportHtml(item.productName)}</strong><br />
            <span>${escapeStockReportHtml(item.productCode)}</span>
          </td>
          <td>${escapeStockReportHtml(item.barcodeValue)}</td>
          <td>${escapeStockReportHtml(item.batchCode)}</td>
          <td>${escapeStockReportHtml(item.serialNumber)}</td>
          <td>${escapeStockReportHtml(item.warehouseName)}</td>
          <td>${escapeStockReportHtml(formatQuantity(item.quantity))}</td>
        </tr>`
          )
          .join("")
      : '<tr><td colspan="7">No delivery items added.</td></tr>'

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Delivery Note ${escapeStockReportHtml(deliveryNoteNumber)}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
      .header { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
      .title { font-size: 26px; font-weight: 700; margin: 0 0 8px; }
      .meta { margin: 0; color: #4b5563; font-size: 13px; line-height: 1.7; }
      .badge { display: inline-block; border: 1px solid #bfdbfe; background: #eff6ff; color: #1d4ed8; border-radius: 999px; padding: 4px 10px; font-size: 12px; font-weight: 700; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; vertical-align: top; }
      th { background: #f3f4f6; }
      tfoot td { font-weight: 700; background: #f9fafb; }
      .note { margin-top: 20px; border: 1px solid #d1d5db; padding: 12px; min-height: 48px; font-size: 13px; }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <h1 class="title">Delivery Note</h1>
        <p class="meta">Number: ${escapeStockReportHtml(deliveryNoteNumber)}</p>
        <p class="meta">Posting Date: ${escapeStockReportHtml(postingDate)}</p>
        <p class="meta">Customer: ${escapeStockReportHtml(customerLabel)}</p>
        <p class="meta">Warehouse: ${escapeStockReportHtml(warehouseLabel)}</p>
      </div>
      <div>
        <span class="badge">${escapeStockReportHtml(isReturn ? "Return" : "Delivery")}</span>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Sl No</th>
          <th>Product</th>
          <th>Barcode</th>
          <th>Batch</th>
          <th>Serial</th>
          <th>Warehouse</th>
          <th>Qty</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
      <tfoot>
        <tr>
          <td colspan="6">Total</td>
          <td>${escapeStockReportHtml(formatQuantity(totalQuantity))}</td>
        </tr>
      </tfoot>
    </table>
    <div class="note">
      <strong>Remarks</strong><br />
      ${escapeStockReportHtml(note.trim() || "-")}
    </div>
  </body>
</html>`

  let frame: HTMLIFrameElement | null = null

  try {
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

    frameDocument.open()
    frameDocument.write(html)
    frameDocument.close()

    frameWindow.setTimeout(() => {
      frameWindow.focus()
      frameWindow.print()
    }, 120)
  } finally {
    if (frame?.contentWindow) {
      frame.contentWindow.setTimeout(() => {
        frame?.remove()
      }, 2000)
    } else {
      frame?.remove()
    }
  }
}

export function DeliveryNoteSection() {
  const navigate = useNavigate()
  const { data, error, isLoading } = useJsonResource<DeliveryNoteListResponse>(
    "/internal/v1/stock/delivery-notes"
  )
  const contactLookup = useJsonResource<ContactListResponse>("/internal/v1/core/contacts")
  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "submitted" | "cancelled">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  useGlobalLoading(isLoading || contactLookup.isLoading)

  if (isLoading || contactLookup.isLoading) {
    return null
  }

  if (error || contactLookup.error || !data || !contactLookup.data) {
    return <StateCard message={error ?? contactLookup.error ?? "Delivery notes are unavailable."} />
  }

  const deliveryContacts = contactLookup.data.items
  const filteredItems = data.items.filter((item) => {
    const totalQuantity = item.lines.reduce((sum, line) => sum + line.quantity, 0)
    const customerLabel = formatDeliveryContactLabel(item.customerId, deliveryContacts)
    const matchesSearch =
      searchValue.trim().length === 0 ||
      [
        item.deliveryNoteNumber,
        item.postingDate,
        formatDeliveryNoteDate(item.postingDate),
        customerLabel,
        item.warehouseId,
        item.status,
        String(totalQuantity),
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchValue.trim().toLowerCase())

    const matchesStatus = statusFilter === "all" || item.status === statusFilter

    return matchesSearch && matchesStatus
  })
  const totalRecords = filteredItems.length
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )
  const activeFilters =
    statusFilter === "all"
      ? []
      : [{ key: "status", label: "Status", value: statusFilter }]

  return (
    <MasterList
      header={{
        pageTitle: "Delivery Notes",
        pageDescription:
          "Create and review customer-facing outward delivery notes from accepted stock barcodes.",
        technicalName: "page.stock.delivery-notes",
        addLabel: "New Delivery Note",
        onAddClick: () => {
          void navigate("/dashboard/apps/stock/delivery-note/new")
        },
      }}
      search={{
        value: searchValue,
        onChange: (value) => {
          setSearchValue(value)
          setCurrentPage(1)
        },
        placeholder: "Search note, customer, warehouse, status, or quantity",
      }}
      filters={{
        options: [
          {
            key: "all",
            label: "All notes",
            isActive: statusFilter === "all",
            onSelect: () => {
              setStatusFilter("all")
              setCurrentPage(1)
            },
          },
          ...(["draft", "submitted", "cancelled"] as const).map((value) => ({
            key: value,
            label: value,
            isActive: statusFilter === value,
            onSelect: () => {
              setStatusFilter(value)
              setCurrentPage(1)
            },
          })),
        ],
        activeFilters,
        onRemoveFilter: (key) => {
          if (key === "status") {
            setStatusFilter("all")
            setCurrentPage(1)
          }
        },
        onClearAllFilters: () => {
          setStatusFilter("all")
          setSearchValue("")
          setCurrentPage(1)
        },
        technicalName: "section.stock.delivery-notes.filters",
      }}
      table={{
        technicalName: "section.stock.delivery-notes.table",
        columns: [
          {
            id: "deliveryNoteNumber",
            header: "Delivery Note",
            sortable: true,
            accessor: (item) => item.deliveryNoteNumber,
            cell: (item) => (
              <button
                type="button"
                className="text-left"
                onClick={() => {
                  void navigate(`/dashboard/apps/stock/delivery-note/${encodeURIComponent(item.id)}`)
                }}
              >
                <p className="font-medium text-foreground hover:underline hover:underline-offset-2">
                  {item.deliveryNoteNumber}
                </p>
              </button>
            ),
          },
          {
            id: "postingDate",
            header: "Posting Date",
            sortable: true,
            accessor: (item) => item.postingDate,
            cell: (item) => formatDeliveryNoteDate(item.postingDate),
          },
          {
            id: "customer",
            header: "Customer",
            sortable: true,
            accessor: (item) => formatDeliveryContactLabel(item.customerId, deliveryContacts),
            cell: (item) => formatDeliveryContactLabel(item.customerId, deliveryContacts),
          },
          {
            id: "warehouse",
            header: "Warehouse",
            sortable: true,
            accessor: (item) => formatWarehouseDisplayName(item.warehouseId),
            cell: (item) => formatWarehouseDisplayName(item.warehouseId),
          },
          {
            id: "totalQuantity",
            header: "Total Qty",
            sortable: true,
            accessor: (item) => item.lines.reduce((sum, line) => sum + line.quantity, 0),
            cell: (item) =>
              formatQuantity(item.lines.reduce((sum, line) => sum + line.quantity, 0)),
          },
          {
            id: "status",
            header: "Status",
            sortable: true,
            accessor: (item) => item.status,
            cell: (item) => renderLightStockStatusBadge(item.status, `${item.id}:status`),
          },
          {
            id: "actions",
            header: "",
            cell: (item) => (
              <RecordActionMenu
                itemLabel={item.deliveryNoteNumber}
                editLabel="Edit delivery note"
                customItems={[
                  {
                    key: "view",
                    label: "View delivery note",
                    icon: <EyeIcon className="size-4" />,
                    onSelect: () => {
                      void navigate(`/dashboard/apps/stock/delivery-note/${encodeURIComponent(item.id)}`)
                    },
                  },
                  {
                    key: "print",
                    label: "Print",
                    icon: <PrinterIcon className="size-4" />,
                    onSelect: () => {
                      const totalQuantity = item.lines.reduce((sum, line) => sum + line.quantity, 0)
                      printDeliveryNoteDocument({
                        customerLabel: formatDeliveryContactLabel(
                          item.customerId,
                          deliveryContacts
                        ),
                        deliveryNoteNumber: item.deliveryNoteNumber,
                        isReturn: item.isReturn,
                        items: item.lines.map((line) => ({
                          id: line.stockUnitId,
                          productId: line.productId,
                          barcodeValue: line.barcodeValue,
                          productName: line.productName,
                          productCode: line.productCode,
                          batchCode: line.batchCode ?? "No batch",
                          serialNumber: line.serialNumber,
                          warehouseId: line.warehouseId,
                          warehouseName: formatWarehouseDisplayName(line.warehouseName),
                          quantity: line.quantity,
                          stockUnitStatus: line.stockUnitStatus,
                        })),
                        note: item.note,
                        postingDate: formatDeliveryNoteDate(item.postingDate),
                        totalQuantity,
                        warehouseLabel: formatWarehouseDisplayName(item.warehouseId),
                      })
                    },
                  },
                ]}
                onEdit={() => {
                  void navigate(`/dashboard/apps/stock/delivery-note/${encodeURIComponent(item.id)}/edit`)
                }}
              />
            ),
            className: "w-16 min-w-16 text-right",
            headerClassName: "w-16 min-w-16 text-right",
          },
        ],
        data: paginatedItems,
        emptyMessage: "No delivery notes found.",
        rowKey: (item) => item.id,
      }}
      footer={{
        content: (
          <div className="flex flex-wrap items-center gap-4">
            <span>
              Total notes: <span className="font-medium text-foreground">{totalRecords}</span>
            </span>
          </div>
        ),
      }}
      pagination={{
        currentPage,
        pageSize,
        totalRecords,
        onPageChange: setCurrentPage,
        onPageSizeChange: (value) => {
          setPageSize(value)
          setCurrentPage(1)
        },
      }}
      />
  )
}

export function DeliveryNoteUpsertSection({ deliveryNoteId }: { deliveryNoteId?: string }) {
  const navigate = useNavigate()
  const contactLookup = useJsonResource<ContactListResponse>("/internal/v1/core/contacts")
  const warehouseLookup = useJsonResource<CommonModuleListResponse>(
    "/internal/v1/core/common-modules/items?module=warehouses"
  )
  const productLookup = useJsonResource<ProductListResponse>("/internal/v1/core/products")
  const stockUnits = useJsonResource<StockUnitListResponse>("/internal/v1/stock/stock-units")
  const noteList = useJsonResource<DeliveryNoteListResponse>("/internal/v1/stock/delivery-notes")
  const detail = useJsonResource<DeliveryNoteResponse>(
    deliveryNoteId ? `/internal/v1/stock/delivery-note?id=${encodeURIComponent(deliveryNoteId)}` : "",
    [deliveryNoteId]
  )
  const [form, setForm] = useState({
    deliveryNoteNumber: "",
    postingDate: getTodayDateInputValue(),
    customerId: "",
    warehouseId: "",
    isReturn: false,
    note: "",
  })
  const [barcodeValue, setBarcodeValue] = useState("")
  const [manualProductId, setManualProductId] = useState("")
  const [manualStockUnitId, setManualStockUnitId] = useState("")
  const [items, setItems] = useState<DeliveryNoteItem[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  const selectedItemIds = useMemo(() => new Set(items.map((item) => item.id)), [items])
  const deliveryStockUnits = useMemo(
    () =>
      (stockUnits.data?.items ?? []).filter((stockUnit) => {
        if (!stockUnit.isActive || selectedItemIds.has(stockUnit.id)) {
          return false
        }

        if (!form.isReturn && !deliveryEligibleStockStatuses.has(stockUnit.status)) {
          return false
        }

        if (form.warehouseId && stockUnit.warehouseId !== form.warehouseId) {
          return false
        }

        return true
      }),
    [form.isReturn, form.warehouseId, selectedItemIds, stockUnits.data?.items]
  )
  const productOptions = useMemo(() => {
    const productIdsWithStock = new Set(deliveryStockUnits.map((stockUnit) => stockUnit.productId))
    return getProductLookupOptions(productLookup.data?.items ?? []).filter((option) =>
      productIdsWithStock.has(option.value)
    )
  }, [deliveryStockUnits, productLookup.data?.items])
  const manualStockUnitOptions = useMemo(
    () =>
      deliveryStockUnits
        .filter((stockUnit) => !manualProductId || stockUnit.productId === manualProductId)
        .map((stockUnit) => ({
          value: stockUnit.id,
          label: getDeliveryStockUnitLabel(stockUnit),
        })),
    [deliveryStockUnits, manualProductId]
  )

  useGlobalLoading(
    contactLookup.isLoading ||
      warehouseLookup.isLoading ||
      productLookup.isLoading ||
      stockUnits.isLoading ||
      noteList.isLoading ||
      detail.isLoading ||
      isScanning
  )

  const customerOptions = (contactLookup.data?.items ?? []).map((contact) => ({
    value: contact.id,
    label: contact.name,
  }))
  const warehouseOptions = (warehouseLookup.data?.items ?? [])
    .filter((item) => item.isActive && String(item.name ?? "").trim() !== "-")
    .map((item) => ({
      value: item.id,
      label: String(item.name ?? item.code ?? item.id),
    }))
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
  const nextDeliveryNoteNumber = getNextDeliveryNoteNumber(
    noteList.data?.items ?? [],
    deliveryNoteId
  )

  useEffect(() => {
    if (deliveryNoteId || form.deliveryNoteNumber) {
      return
    }

    setForm((current) => ({ ...current, deliveryNoteNumber: nextDeliveryNoteNumber }))
  }, [deliveryNoteId, form.deliveryNoteNumber, nextDeliveryNoteNumber])

  useEffect(() => {
    if (!deliveryNoteId || !detail.data) {
      return
    }

    const note = detail.data.item
    setForm({
      deliveryNoteNumber: note.deliveryNoteNumber,
      postingDate: note.postingDate,
      customerId: note.customerId,
      warehouseId: note.warehouseId,
      isReturn: note.isReturn,
      note: note.note,
    })
    setItems(
      note.lines.map((line) => ({
        id: line.stockUnitId,
        productId: line.productId,
        barcodeValue: line.barcodeValue,
        productName: line.productName,
        productCode: line.productCode,
        batchCode: line.batchCode ?? "No batch",
        serialNumber: line.serialNumber,
        warehouseId: line.warehouseId,
        warehouseName: formatWarehouseDisplayName(line.warehouseName),
        quantity: line.quantity,
        stockUnitStatus: line.stockUnitStatus,
      }))
    )
  }, [deliveryNoteId, detail.data])

  if (
    contactLookup.isLoading ||
    warehouseLookup.isLoading ||
    productLookup.isLoading ||
    stockUnits.isLoading ||
    noteList.isLoading ||
    detail.isLoading
  ) {
    return null
  }

  if (
    contactLookup.error ||
    warehouseLookup.error ||
    productLookup.error ||
    stockUnits.error ||
    noteList.error ||
    detail.error ||
    !contactLookup.data ||
    !warehouseLookup.data ||
    !productLookup.data ||
    !stockUnits.data ||
    !noteList.data ||
    (deliveryNoteId && !detail.data)
  ) {
    return (
      <StateCard
        message={
          contactLookup.error ??
          warehouseLookup.error ??
          productLookup.error ??
          stockUnits.error ??
          noteList.error ??
          detail.error ??
          "Delivery note lookups are unavailable."
        }
      />
    )
  }

  const selectedCustomerLabel =
    customerOptions.find((option) => option.value === form.customerId)?.label ?? form.customerId
  const selectedWarehouseLabel =
    warehouseOptions.find((option) => option.value === form.warehouseId)?.label ?? form.warehouseId

  function addStockUnitToDelivery(stockUnit: BillingStockUnit, matchedBarcodeValue?: string) {
    const normalizedMatchedBarcode = matchedBarcodeValue?.trim()

    if (
      items.some(
        (item) =>
          item.id === stockUnit.id ||
          item.barcodeValue === stockUnit.barcodeValue ||
          (normalizedMatchedBarcode ? item.barcodeValue === normalizedMatchedBarcode : false)
      )
    ) {
      setMessage("This barcode is already added to the delivery note.")
      return false
    }

    if (!form.isReturn && !deliveryEligibleStockStatuses.has(stockUnit.status)) {
      setMessage(
        `Warning: barcode is ${stockUnit.status}; only accepted stock can be added to delivery.`
      )
      return false
    }

    setItems((current) => [...current, createDeliveryNoteItemFromStockUnit(stockUnit)])
    setMessage(`Added ${stockUnit.productName} (${stockUnit.productCode}) to delivery note.`)
    return true
  }

  async function handleAddBarcode() {
    const normalizedBarcode = barcodeValue.trim()

    if (!normalizedBarcode) {
      setMessage("Scan or enter a barcode before adding a delivery item.")
      return
    }

    setIsScanning(true)
    setMessage(null)

    try {
      const response = await requestJson<BarcodeResolutionResponse>("/internal/v1/stock/barcode/resolve", {
        method: "POST",
        body: JSON.stringify({
          barcodeValue: normalizedBarcode,
        }),
      })
      const stockUnit = response.item.stockUnit

      if (!response.item.resolved || !stockUnit) {
        setMessage("Warning: scanned barcode did not match any stock unit.")
        return
      }

      if (addStockUnitToDelivery(stockUnit, response.item.barcodeValue)) {
        setBarcodeValue("")
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to add barcode to delivery note.")
    } finally {
      setIsScanning(false)
    }
  }

  function handleAddManualStockUnit() {
    if (!manualStockUnitId) {
      setMessage("Select a stock barcode before adding a manual delivery item.")
      return
    }

    const stockUnit = stockUnits.data?.items.find((item) => item.id === manualStockUnitId)
    if (!stockUnit) {
      setMessage("Selected stock barcode is no longer available.")
      return
    }

    if (addStockUnitToDelivery(stockUnit)) {
      setManualStockUnitId("")
    }
  }

  function validateDeliveryNoteForm() {
    if (!form.customerId) {
      setMessage("Select a customer before saving the delivery note.")
      return false
    }

    if (!form.warehouseId) {
      setMessage("Select a warehouse before saving the delivery note.")
      return false
    }

    if (items.length === 0) {
      setMessage("Add at least one scanned barcode before saving the delivery note.")
      return false
    }

    return true
  }

  async function saveDeliveryNote() {
    if (!validateDeliveryNoteForm()) {
      return null
    }

    return requestJson<DeliveryNoteResponse>(
      deliveryNoteId
        ? `/internal/v1/stock/delivery-note?id=${encodeURIComponent(deliveryNoteId)}`
        : "/internal/v1/stock/delivery-notes",
      {
        method: deliveryNoteId ? "PATCH" : "POST",
        body: JSON.stringify({
          deliveryNoteNumber: form.deliveryNoteNumber || nextDeliveryNoteNumber,
          postingDate: form.postingDate,
          customerId: form.customerId,
          warehouseId: form.warehouseId,
          isReturn: form.isReturn,
          status: "submitted",
          note: form.note,
          lines: items.map((item) => ({
            stockUnitId: item.id,
            barcodeValue: item.barcodeValue,
            productId: item.productId,
            productName: item.productName,
            productCode: item.productCode,
            batchCode: item.batchCode === "No batch" ? null : item.batchCode,
            serialNumber: item.serialNumber,
            warehouseId: item.warehouseId,
            warehouseName: item.warehouseName,
            quantity: item.quantity,
            stockUnitStatus: item.stockUnitStatus,
          })),
        }),
      }
    )
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      const response = await saveDeliveryNote()
      if (!response) {
        return
      }

      void navigate("/dashboard/apps/stock/delivery-note")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save delivery note.")
    }
  }

  async function handleSaveAndPrintDeliveryNote() {
    try {
      const response = await saveDeliveryNote()
      if (!response) {
        return
      }

      printDeliveryNoteDocument({
        customerLabel: selectedCustomerLabel,
        deliveryNoteNumber: response.item.deliveryNoteNumber,
        isReturn: response.item.isReturn,
        items,
        note: response.item.note,
        postingDate: formatDeliveryNoteDate(response.item.postingDate),
        totalQuantity,
        warehouseLabel: selectedWarehouseLabel,
      })
      setMessage(`Save and print prepared for delivery note ${response.item.deliveryNoteNumber}.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save and print delivery note.")
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/70 shadow-sm">
        <CardContent className="p-5">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Delivery note number">
                <Input
                  value={form.deliveryNoteNumber}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      deliveryNoteNumber: event.target.value,
                    }))
                  }
                  required
                />
              </Field>
              <Field label="Posting date">
                <Input
                  type="date"
                  value={form.postingDate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, postingDate: event.target.value }))
                  }
                  required
                />
              </Field>
              <Field label="Customer">
                <SearchableLookupField
                  noResultsMessage="No customers found."
                  onValueChange={(nextValue) =>
                    setForm((current) => ({ ...current, customerId: nextValue }))
                  }
                  options={customerOptions}
                  placeholder="Select customer"
                  searchPlaceholder="Search customer"
                  triggerClassName="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-none focus-visible:border-ring focus-visible:ring-0"
                  value={form.customerId}
                />
              </Field>
              <Field label="Warehouse">
                <SearchableLookupField
                  noResultsMessage="No warehouses found."
                  onValueChange={(nextValue) => {
                    setForm((current) => ({ ...current, warehouseId: nextValue }))
                    setManualStockUnitId("")
                  }}
                  options={warehouseOptions}
                  placeholder="Select warehouse"
                  searchPlaceholder="Search warehouse"
                  triggerClassName="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-none focus-visible:border-ring focus-visible:ring-0"
                  value={form.warehouseId}
                />
              </Field>
            </div>
            <div className="flex flex-wrap items-center gap-3 rounded-md border border-border/70 bg-muted/10 px-3 py-2">
              <Checkbox
                checked={form.isReturn}
                onCheckedChange={(checked) =>
                  setForm((current) => ({ ...current, isReturn: checked === true }))
                }
              />
              <span className="text-sm font-medium text-foreground">Is return</span>
              {renderLightStockStatusBadge(
                form.isReturn ? "received" : "available",
                "delivery-note-mode",
                form.isReturn ? "Return" : "Delivery"
              )}
            </div>
            <Card className="border-border/70 shadow-sm">
              <CardContent className="p-4">
                <div className="grid items-end gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                  <Field label="Scan barcode">
                    <Input
                      className="h-11 text-base"
                      placeholder="Scan stock barcode"
                      value={barcodeValue}
                      onChange={(event) => setBarcodeValue(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter") {
                          return
                        }

                        event.preventDefault()
                        void handleAddBarcode()
                      }}
                    />
                  </Field>
                  <Button
                    type="button"
                    className="h-11 min-w-32"
                    disabled={isScanning}
                    onClick={() => void handleAddBarcode()}
                  >
                    {isScanning ? "Adding..." : "Add item"}
                  </Button>
                </div>
                <div className="mt-4 grid items-end gap-3 border-t border-border/60 pt-4 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)_auto]">
                  <Field label="Product">
                    <SearchableLookupField
                      emptyOptionLabel="Select product"
                      noResultsMessage="No deliverable stock found."
                      onValueChange={(nextValue) => {
                        if (nextValue.startsWith("manual:")) {
                          return
                        }

                        setManualProductId(nextValue)
                        setManualStockUnitId("")
                      }}
                      options={productOptions}
                      placeholder="Select product"
                      searchPlaceholder="Search product"
                      triggerClassName="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-none focus-visible:border-ring focus-visible:ring-0"
                      value={manualProductId}
                    />
                  </Field>
                  <Field label="Stock barcode">
                    <SearchableLookupField
                      emptyOptionLabel="Select barcode"
                      noResultsMessage={
                        manualProductId ? "No stock barcodes found." : "Select product first."
                      }
                      onValueChange={(nextValue) => {
                        if (nextValue.startsWith("manual:")) {
                          return
                        }

                        setManualStockUnitId(nextValue)
                      }}
                      options={manualStockUnitOptions}
                      placeholder={manualProductId ? "Select stock barcode" : "Select product first"}
                      searchPlaceholder="Search barcode"
                      triggerClassName="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-none focus-visible:border-ring focus-visible:ring-0"
                      value={manualStockUnitId}
                    />
                  </Field>
                  <Button
                    type="button"
                    className="h-9 min-w-32"
                    onClick={handleAddManualStockUnit}
                  >
                    Add selected
                  </Button>
                </div>
              </CardContent>
            </Card>
            <VoucherInlineEditableTable
              title="Delivery items"
              addLabel="Add selected item"
              fitToContainer
              rows={items}
              onAddRow={handleAddManualStockUnit}
              onRemoveRow={(index) =>
                setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))
              }
              removeButtonLabel="Remove"
              getRowKey={(item) => item.id}
              columns={[
                {
                  id: "product",
                  header: "Product",
                  width: "28%",
                  renderCell: (item) => (
                    <div>
                      <p className="font-medium text-foreground">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">{item.productCode}</p>
                    </div>
                  ),
                },
                {
                  id: "barcode",
                  header: "Barcode",
                  width: "18%",
                  renderCell: (item) => (
                    <span className="font-mono text-xs text-foreground">{item.barcodeValue}</span>
                  ),
                },
                {
                  id: "batch",
                  header: "Batch",
                  width: "12%",
                  renderCell: (item) => item.batchCode,
                },
                {
                  id: "serial",
                  header: "Serial",
                  width: "14%",
                  renderCell: (item) => item.serialNumber,
                },
                {
                  id: "warehouse",
                  header: "Warehouse",
                  width: "12%",
                  renderCell: (item) => item.warehouseName,
                },
                {
                  id: "quantity",
                  header: "Qty",
                  width: "8%",
                  headerClassName: "text-center",
                  cellClassName: "text-center",
                  renderCell: (item) => formatQuantity(item.quantity),
                },
                {
                  id: "status",
                  header: "Status",
                  width: "8%",
                  renderCell: (item) =>
                    renderLightStockStatusBadge(item.stockUnitStatus, `${item.id}:status`),
                },
              ]}
              summaryRow={
                <TableRow className="border-border/60 bg-muted/20 hover:bg-muted/20">
                  <TableCell className="border-r border-border/50 px-1 py-0.5" />
                  <TableCell
                    colSpan={5}
                    className="border-r border-border/50 px-1.5 py-0.5 text-right font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                  >
                    Total
                  </TableCell>
                  <TableCell className="border-r border-border/50 px-0 py-0.5 text-center text-sm font-semibold text-foreground">
                    <div className="flex h-6 items-center justify-center">
                      {formatQuantity(totalQuantity)}
                    </div>
                  </TableCell>
                  <TableCell className="px-0 py-0.5">
                    <div className="h-6" />
                  </TableCell>
                </TableRow>
              }
            />
            <Field label="Delivery note remarks">
              <Textarea
                className="min-h-24"
                value={form.note}
                onChange={(event) =>
                  setForm((current) => ({ ...current, note: event.target.value }))
                }
              />
            </Field>
            {message ? (
              <p className="text-sm font-medium text-muted-foreground">{message}</p>
            ) : null}
            <div className="flex gap-3 pt-4">
              <Button type="submit">Save delivery note</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleSaveAndPrintDeliveryNote()}
              >
                <PrinterIcon className="mr-2 size-4" />
                Save and print
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void navigate("/dashboard/apps/stock/delivery-note")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export function DeliveryNoteShowSection({ deliveryNoteId }: { deliveryNoteId: string }) {
  const navigate = useNavigate()
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const noteList = useJsonResource<DeliveryNoteListResponse>("/internal/v1/stock/delivery-notes")
  const detail = useJsonResource<DeliveryNoteResponse>(
    `/internal/v1/stock/delivery-note?id=${encodeURIComponent(deliveryNoteId)}`,
    [deliveryNoteId]
  )
  const contactLookup = useJsonResource<ContactListResponse>("/internal/v1/core/contacts")
  useGlobalLoading(noteList.isLoading || detail.isLoading || contactLookup.isLoading)

  if (noteList.isLoading || detail.isLoading || contactLookup.isLoading) {
    return null
  }

  if (
    noteList.error ||
    detail.error ||
    contactLookup.error ||
    !noteList.data ||
    !detail.data ||
    !contactLookup.data
  ) {
    return (
      <StateCard
        message={
          noteList.error ??
          detail.error ??
          contactLookup.error ??
          "Delivery note detail is unavailable."
        }
      />
    )
  }

  const item = detail.data.item
  const currentNoteIndex = noteList.data.items.findIndex((entry) => entry.id === item.id)
  const previousNote = currentNoteIndex > 0 ? noteList.data.items[currentNoteIndex - 1] : null
  const nextNote =
    currentNoteIndex >= 0 && currentNoteIndex < noteList.data.items.length - 1
      ? noteList.data.items[currentNoteIndex + 1]
      : null
  const totalQuantity = item.lines.reduce((sum, line) => sum + line.quantity, 0)
  const customerLabel = formatDeliveryContactLabel(item.customerId, contactLookup.data.items)
  const printItems = item.lines.map((line) => ({
    id: line.stockUnitId,
    productId: line.productId,
    barcodeValue: line.barcodeValue,
    productName: line.productName,
    productCode: line.productCode,
    batchCode: line.batchCode ?? "No batch",
    serialNumber: line.serialNumber,
    warehouseId: line.warehouseId,
    warehouseName: formatWarehouseDisplayName(line.warehouseName),
    quantity: line.quantity,
    stockUnitStatus: line.stockUnitStatus,
  }))

  function handleConvertToSales() {
    const params = new URLSearchParams({
      sourceType: "delivery-note",
      sourceId: item.id,
      deliveryNoteId: item.id,
    })

    void navigate(`/dashboard/billing/sales-vouchers/new?${params.toString()}`)
  }

  async function handleDeleteDeliveryNote() {
    if (!window.confirm(`Delete delivery note ${item.deliveryNoteNumber}?`)) {
      return
    }

    setIsDeleting(true)
    setDeleteError(null)

    try {
      await requestJson(
        `/internal/v1/stock/delivery-note?id=${encodeURIComponent(item.id)}`,
        { method: "DELETE" }
      )
      showRecordToast({
        entity: "Delivery note",
        action: "deleted",
        recordName: item.deliveryNoteNumber,
      })
      void navigate("/dashboard/apps/stock/delivery-note")
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Failed to delete delivery note.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 lg:grid-cols-3 lg:items-center">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void navigate("/dashboard/apps/stock/delivery-note")}>
            <Undo2Icon className="mr-2 size-4" />
            Back
          </Button>
          <Button
            variant="outline"
            disabled={!previousNote}
            onClick={() =>
              previousNote &&
              void navigate(`/dashboard/apps/stock/delivery-note/${encodeURIComponent(previousNote.id)}`)
            }
          >
            <ChevronLeftIcon className="mr-2 size-4" />
            Prev
          </Button>
          <Button
            variant="outline"
            disabled={!nextNote}
            onClick={() =>
              nextNote &&
              void navigate(`/dashboard/apps/stock/delivery-note/${encodeURIComponent(nextNote.id)}`)
            }
          >
            Next
            <ChevronRightIcon className="ml-2 size-4" />
          </Button>
        </div>
        <div className="flex justify-start lg:justify-center">
          <Button onClick={handleConvertToSales}>
            <FileTextIcon className="mr-2 size-4" />
            Convert to sales
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Button
            className="bg-violet-600 text-white hover:bg-violet-700"
            onClick={() =>
              printDeliveryNoteDocument({
                customerLabel,
                deliveryNoteNumber: item.deliveryNoteNumber,
                isReturn: item.isReturn,
                items: printItems,
                note: item.note,
                postingDate: formatDeliveryNoteDate(item.postingDate),
                totalQuantity,
                warehouseLabel: formatWarehouseDisplayName(item.warehouseId),
              })
            }
          >
            <PrinterIcon className="mr-2 size-4" />
            Print
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              void navigate(`/dashboard/apps/stock/delivery-note/${encodeURIComponent(item.id)}/edit`)
            }
          >
            <PencilIcon className="mr-2 size-4" />
            Edit
          </Button>
          <Button variant="outline" disabled={isDeleting} onClick={() => void handleDeleteDeliveryNote()}>
            <Trash2Icon className="mr-2 size-4" />
            Delete
          </Button>
        </div>
      </div>
      {deleteError ? <p className="text-sm text-destructive">{deleteError}</p> : null}
      <Card className="border-border/70 shadow-sm">
        <CardContent className="grid gap-4 p-5 md:grid-cols-3">
          <Field label="Delivery note"><p className="text-sm font-medium">{item.deliveryNoteNumber}</p></Field>
          <Field label="Posting date"><p className="text-sm font-medium">{formatDeliveryNoteDate(item.postingDate)}</p></Field>
          <Field label="Customer"><p className="text-sm font-medium">{customerLabel}</p></Field>
          <Field label="Warehouse"><p className="text-sm font-medium">{formatWarehouseDisplayName(item.warehouseId)}</p></Field>
          <Field label="Mode"><p className="text-sm font-medium">{item.isReturn ? "Return" : "Delivery"}</p></Field>
          <Field label="Status">{renderLightStockStatusBadge(item.status, `${item.id}:status`)}</Field>
        </CardContent>
      </Card>
      <VoucherInlineEditableTable
        title="Delivery items"
        className="bg-white"
        containerClassName="bg-white"
        fitToContainer
        rows={item.lines}
        getRowKey={(line) => line.id}
        columns={[
          {
            id: "product",
            header: "Product",
            width: "28%",
            renderCell: (line) => (
              <div>
                <p className="font-medium text-foreground">{line.productName}</p>
                <p className="text-xs text-muted-foreground">{line.productCode}</p>
              </div>
            ),
          },
          {
            id: "barcode",
            header: "Barcode",
            width: "20%",
            renderCell: (line) => (
              <span className="font-mono text-xs text-foreground">{line.barcodeValue}</span>
            ),
          },
          {
            id: "batch",
            header: "Batch",
            width: "10%",
            renderCell: (line) => line.batchCode ?? "No batch",
          },
          {
            id: "serial",
            header: "Serial",
            width: "12%",
            renderCell: (line) => line.serialNumber,
          },
          {
            id: "warehouse",
            header: "Warehouse",
            width: "12%",
            renderCell: (line) => formatWarehouseDisplayName(line.warehouseName),
          },
          {
            id: "quantity",
            header: "Qty",
            width: "8%",
            headerClassName: "text-center",
            cellClassName: "text-center",
            renderCell: (line) => formatQuantity(line.quantity),
          },
          {
            id: "status",
            header: "Status",
            width: "10%",
            renderCell: (line) =>
              renderLightStockStatusBadge(line.stockUnitStatus, `${line.id}:status`),
          },
        ]}
        summaryRow={
          <TableRow className="border-border/60 bg-muted/20 hover:bg-muted/20">
            <TableCell className="border-r border-border/50 px-1 py-0.5" />
            <TableCell
              colSpan={5}
              className="border-r border-border/50 px-1.5 py-0.5 text-right font-semibold uppercase tracking-[0.14em] text-muted-foreground"
            >
              Total
            </TableCell>
            <TableCell className="border-r border-border/50 px-0 py-0.5 text-center text-sm font-semibold text-foreground">
              <div className="flex h-6 items-center justify-center">
                {formatQuantity(totalQuantity)}
              </div>
            </TableCell>
            <TableCell className="px-0 py-0.5">
              <div className="h-6" />
            </TableCell>
          </TableRow>
        }
      />
      <Card className="border-border/70 shadow-sm">
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">{item.note || "No remarks."}</p>
        </CardContent>
      </Card>
    </div>
  )
}

export function GoodsInwardSection() {
  const navigate = useNavigate()
  const { data, error, isLoading } = useJsonResource<GoodsInwardListResponse>("/internal/v1/stock/goods-inward")
  useGlobalLoading(isLoading)

  if (isLoading) {
    return null
  }

  if (error || !data) {
    return <StateCard message={error ?? "Goods inward records are unavailable."} />
  }

  return (
    <div className="space-y-4">
      <SectionIntro
        title="Goods inward"
        description="Verify accepted, rejected, and damaged quantity before real stock becomes available."
        actions={<Button onClick={() => void navigate("/dashboard/apps/stock/goods-inward/new")}>New inward</Button>}
      />
      <DataTable
        headers={["Inward", "Receipt", "Warehouse", "Status", "Posting", "Actions"]}
        rows={data.items.map((item) => [
          item.inwardNumber,
          item.purchaseReceiptNumber,
          item.warehouseName,
          renderLightStockStatusBadge(item.status, `${item.id}:status`),
          renderLightStockStatusBadge(item.stockPostingStatus, `${item.id}:posting`),
          <div key={`${item.id}:actions`} className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/dashboard/apps/stock/goods-inward/${encodeURIComponent(item.id)}`}>Show</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/dashboard/apps/stock/goods-inward/${encodeURIComponent(item.id)}/edit`}>Edit</Link>
            </Button>
          </div>,
        ])}
      />
    </div>
  )
}

export function GoodsInwardShowSection({ goodsInwardId }: { goodsInwardId: string }) {
  const navigate = useNavigate()
  const { data, error, isLoading } = useJsonResource<GoodsInwardResponse>(
    `/internal/v1/stock/goods-inward-note?id=${encodeURIComponent(goodsInwardId)}`,
    [goodsInwardId]
  )
  const [postingMessage, setPostingMessage] = useState<string | null>(null)
  useGlobalLoading(isLoading)

  if (isLoading) {
    return null
  }

  if (error || !data) {
    return <StateCard message={error ?? "Goods inward detail is unavailable."} />
  }

  const item = data.item

  async function postRecord() {
    const response = await requestJson<GoodsInwardPostingResponse>(
      `/internal/v1/stock/goods-inward-note/post?id=${encodeURIComponent(item.id)}`,
      { method: "POST" }
    )
    setPostingMessage(
      `Temporary stock units created: ${response.unitsCreated}. Barcode verification and acceptance are still required before inventory becomes live.`
    )
  }

  return (
    <div className="space-y-4">
      <SectionIntro
        title={item.inwardNumber}
        description={`${item.purchaseReceiptNumber} · ${item.warehouseName} · ${item.postingDate}`}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to={`/dashboard/apps/stock/goods-inward/${encodeURIComponent(item.id)}/edit`}>Edit inward</Link>
            </Button>
            <Button onClick={() => void postRecord()} disabled={item.stockPostingStatus === "posted"}>
              {item.stockPostingStatus === "posted" ? "Already prepared" : "Create temporary units"}
            </Button>
          </>
        }
      />
      {postingMessage ? <StateCard message={postingMessage} /> : null}
      <DataTable
        headers={["Product", "Description", "Expected", "Accepted", "Exception", "Identity"]}
        rows={item.lines.map((line) => [
          <div key={`${line.id}:product`}>
            <p className="font-medium text-foreground">{line.productId}</p>
            <p className="text-xs text-muted-foreground">{line.productId}</p>
          </div>,
          <div key={`${line.id}:description`}>
            <p>{line.variantName || "No variant"}</p>
            <p className="text-xs text-muted-foreground">
              {normalizeInlineItemNote(line.note) || `Receipt line ${line.purchaseReceiptLineId}`}
            </p>
          </div>,
          String(line.expectedQuantity),
          String(line.acceptedQuantity),
          <div key={`${line.id}:exception`}>
            <p>Rejected {line.rejectedQuantity}</p>
            <p className="text-xs text-muted-foreground">Damaged {line.damagedQuantity}</p>
          </div>,
          <div key={`${line.id}:identity`}>
            <p>{line.manufacturerBarcode || "No barcode"}</p>
            <p className="text-xs text-muted-foreground">{line.manufacturerSerial || "No serial"}</p>
          </div>,
        ])}
      />
      <Button variant="outline" onClick={() => void navigate("/dashboard/apps/stock/goods-inward")}>Back to inward list</Button>
    </div>
  )
}

export function GoodsInwardUpsertSection({ goodsInwardId }: { goodsInwardId?: string }) {
  const navigate = useNavigate()
  const lookups = useJsonResource<LookupsResponse>("/internal/v1/stock/lookups")
  const detail = useJsonResource<GoodsInwardResponse>(
    goodsInwardId ? `/internal/v1/stock/goods-inward-note?id=${encodeURIComponent(goodsInwardId)}` : "",
    [goodsInwardId]
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    inwardNumber: "",
    purchaseReceiptId: "",
    purchaseReceiptNumber: "",
    supplierName: "",
    postingDate: new Date().toISOString().slice(0, 10),
    warehouseId: "",
    warehouseName: "",
    status: "draft",
    note: "",
  })
  const [lines, setLines] = useState<GoodsInwardLineForm[]>([])
  useGlobalLoading((lookups.isLoading && !goodsInwardId) || detail.isLoading)

  useEffect(() => {
    if (goodsInwardId && detail.data) {
      setForm({
        inwardNumber: detail.data.item.inwardNumber,
        purchaseReceiptId: detail.data.item.purchaseReceiptId,
        purchaseReceiptNumber: detail.data.item.purchaseReceiptNumber,
        supplierName: detail.data.item.supplierName,
        postingDate: detail.data.item.postingDate,
        warehouseId: detail.data.item.warehouseId,
        warehouseName: detail.data.item.warehouseName,
        status: detail.data.item.status,
        note: detail.data.item.note ?? "",
      })
      setLines(
        detail.data.item.lines.map((line) => ({
          purchaseReceiptLineId: line.purchaseReceiptLineId,
          productId: line.productId,
          productName: line.productName,
          variantId: line.variantId ?? "",
          variantName: line.variantName ?? "",
          expectedQuantity: String(line.expectedQuantity),
          acceptedQuantity: String(line.acceptedQuantity),
          rejectedQuantity: String(line.rejectedQuantity),
          damagedQuantity: String(line.damagedQuantity),
          damageReceived: line.damageReceived || line.damagedQuantity > 0,
          returnToVendor: line.returnToVendor || line.rejectedQuantity > 0,
          damageRemark: line.damageRemark ?? "",
          manufacturerBarcode: line.manufacturerBarcode ?? "",
          manufacturerSerial: line.manufacturerSerial ?? "",
          note: normalizeInlineItemNote(line.note),
        }))
      )
      return
    }

    if (!goodsInwardId && lookups.data && !form.purchaseReceiptId && lookups.data.purchaseReceiptOptions[0]) {
      const firstReceipt = lookups.data.purchaseReceiptOptions[0]
      setForm((current) => ({
        ...current,
        purchaseReceiptId: firstReceipt.id,
        purchaseReceiptNumber: firstReceipt.label.split(" · ")[0] ?? "",
        warehouseId: firstReceipt.warehouseId,
        warehouseName: firstReceipt.warehouseName,
      }))
      setLines(
        firstReceipt.lines.map((line) => ({
          purchaseReceiptLineId: line.id,
          productId: line.productId,
          productName: line.productName,
          variantId: line.variantId ?? "",
          variantName: line.variantName ?? "",
          expectedQuantity: String(line.quantity - line.receivedQuantity),
          acceptedQuantity: "0",
          rejectedQuantity: "0",
          damagedQuantity: "0",
          damageReceived: false,
          returnToVendor: false,
          damageRemark: "",
          manufacturerBarcode: "",
          manufacturerSerial: "",
          note: "",
        }))
      )
    }
  }, [detail.data, form.purchaseReceiptId, goodsInwardId, lookups.data])

  function applyReceipt(receiptId: string) {
    const receipt = lookups.data?.purchaseReceiptOptions.find((item) => item.id === receiptId)
    if (!receipt) {
      return
    }

    setForm((current) => ({
      ...current,
      purchaseReceiptId: receipt.id,
      purchaseReceiptNumber: receipt.label.split(" · ")[0] ?? "",
      warehouseId: receipt.warehouseId,
      warehouseName: receipt.warehouseName,
    }))
    setLines(
      receipt.lines.map((line) => ({
        purchaseReceiptLineId: line.id,
        productId: line.productId,
        productName: line.productName,
        variantId: line.variantId ?? "",
        variantName: line.variantName ?? "",
          expectedQuantity: String(line.quantity - line.receivedQuantity),
          acceptedQuantity: "0",
          rejectedQuantity: "0",
          damagedQuantity: "0",
          damageReceived: false,
          returnToVendor: false,
          damageRemark: "",
          manufacturerBarcode: "",
          manufacturerSerial: "",
          note: "",
        }))
    )
  }

  function updateGoodsInwardLine(
    index: number,
    patch: Partial<GoodsInwardLineForm>
  ) {
    setLines((current) =>
      current.map((item, lineIndex) => (lineIndex === index ? { ...item, ...patch } : item))
    )
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const response = await requestJson<GoodsInwardResponse>(
        goodsInwardId
          ? `/internal/v1/stock/goods-inward-note?id=${encodeURIComponent(goodsInwardId)}`
          : "/internal/v1/stock/goods-inward",
        {
          method: goodsInwardId ? "PATCH" : "POST",
          body: JSON.stringify({
            ...form,
            note: form.note || null,
            lines: lines.map((line) => ({
              purchaseReceiptLineId: line.purchaseReceiptLineId,
              productId: line.productId,
              productName: line.productName,
              variantId: line.variantId || null,
              variantName: line.variantName || null,
              expectedQuantity: Number(line.expectedQuantity),
              acceptedQuantity: Number(line.acceptedQuantity),
              rejectedQuantity: Number(line.rejectedQuantity),
              damagedQuantity: Number(line.damagedQuantity),
              damageReceived: line.damageReceived,
              returnToVendor: line.returnToVendor,
              damageRemark: line.damageRemark || null,
              manufacturerBarcode: line.manufacturerBarcode || null,
              manufacturerSerial: line.manufacturerSerial || null,
              note: line.note,
            })),
          }),
        }
      )
      void navigate(`/dashboard/apps/stock/goods-inward/${encodeURIComponent(response.item.id)}`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save goods inward.")
    } finally {
      setSaving(false)
    }
  }

  if (lookups.isLoading && !goodsInwardId) {
    return null
  }

  return (
    <div className="space-y-4">
      <SectionIntro
        title={goodsInwardId ? "Edit goods inward" : "New goods inward"}
        description="Capture accepted, rejected, and damaged quantity per purchase receipt line before stock posting."
      />
      <Card className="border-border/70 shadow-sm">
        <CardContent className="p-5">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <FormGrid>
              <Field label="Inward number"><Input value={form.inwardNumber} onChange={(event) => setForm({ ...form, inwardNumber: event.target.value })} required /></Field>
              <Field label="Supplier name"><Input value={form.supplierName} onChange={(event) => setForm({ ...form, supplierName: event.target.value })} required /></Field>
              <Field label="Purchase receipt">
                <select className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm" value={form.purchaseReceiptId} onChange={(event) => applyReceipt(event.target.value)} required>
                  <option value="">Select receipt</option>
                  {(lookups.data?.purchaseReceiptOptions ?? []).map((item) => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Posting date"><Input type="date" value={form.postingDate} onChange={(event) => setForm({ ...form, postingDate: event.target.value })} required /></Field>
              <Field label="Status">
                <select className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                  <option value="draft">Draft</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
              </Field>
            </FormGrid>
            <VoucherInlineEditableTable
              title="Inward items"
              description="Verify each purchase receipt line with expected, accepted, exception, and manufacturer identity values."
              addLabel="Add item"
              rows={lines}
              onAddRow={() =>
                setLines((current) => [
                  ...current,
                  {
                    purchaseReceiptLineId: "",
                    productId: "",
                    productName: "",
                    variantId: "",
                    variantName: "",
                    expectedQuantity: "1",
                    acceptedQuantity: "0",
                    rejectedQuantity: "0",
                    damagedQuantity: "0",
                    damageReceived: false,
                    returnToVendor: false,
                    damageRemark: "",
                    manufacturerBarcode: "",
                    manufacturerSerial: "",
                    note: "",
                  },
                ])
              }
              onRemoveRow={(index) =>
                setLines((current) =>
                  current.length === 1
                    ? current
                    : current.filter((_, lineIndex) => lineIndex !== index)
                )
              }
              removeButtonLabel="Remove"
              getRowKey={(line, index) =>
                `stock-goods-inward-line:${index}:${line.purchaseReceiptLineId}:${line.productId}`
              }
              columns={[
                {
                  id: "product",
                  header: "Product",
                  headerClassName: "min-w-60",
                  renderCell: (line, index) => (
                    <div className="space-y-0.5">
                      <Input
                        placeholder="Product name"
                        value={line.productId}
                        onChange={(event) =>
                          updateGoodsInwardLine(index, { productName: event.target.value })
                        }
                        className={voucherInlineInputClassName}
                        required
                      />
                      <Input
                        placeholder="Product id"
                        value={line.productId}
                        onChange={(event) =>
                          updateGoodsInwardLine(index, { productId: event.target.value })
                        }
                        className="h-6 rounded-none border-0 bg-transparent px-0 text-xs text-muted-foreground shadow-none focus-visible:ring-0"
                        required
                      />
                    </div>
                  ),
                },
                {
                  id: "description",
                  header: "Description",
                  headerClassName: "min-w-72",
                  cellClassName: "max-w-0",
                  renderCell: (line, index) => (
                    <div className="min-w-0 space-y-0.5">
                      <Input
                        aria-label="Description"
                        value={line.variantName}
                        onChange={(event) =>
                          updateGoodsInwardLine(index, { variantName: event.target.value })
                        }
                        className={`${voucherInlineInputClassName} truncate`}
                      />
                      <Input
                        aria-label="Purchase receipt line id"
                        value={line.purchaseReceiptLineId}
                        onChange={(event) =>
                          updateGoodsInwardLine(index, { purchaseReceiptLineId: event.target.value })
                        }
                        className="h-6 truncate rounded-none border-0 bg-transparent px-0 text-xs text-muted-foreground shadow-none focus-visible:ring-0"
                        required
                      />
                      <Input
                        aria-label="Line note"
                        value={line.note}
                        onChange={(event) =>
                          updateGoodsInwardLine(index, { note: event.target.value })
                        }
                        className="h-6 truncate rounded-none border-0 bg-transparent px-0 text-xs text-muted-foreground shadow-none focus-visible:ring-0"
                      />
                    </div>
                  ),
                },
                {
                  id: "expectedQuantity",
                  header: "Expected",
                  headerClassName: "w-[10%] text-right",
                  cellClassName: "w-[10%] text-right",
                  renderCell: (line, index) => (
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.expectedQuantity}
                      onChange={(event) =>
                        updateGoodsInwardLine(index, { expectedQuantity: event.target.value })
                      }
                      className={voucherInlineInputClassName}
                      required
                    />
                  ),
                },
                {
                  id: "acceptedQuantity",
                  header: "Accepted",
                  headerClassName: "w-[10%] text-right",
                  cellClassName: "w-[10%] text-right",
                  renderCell: (line, index) => (
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.acceptedQuantity}
                      onChange={(event) =>
                        updateGoodsInwardLine(index, { acceptedQuantity: event.target.value })
                      }
                      className={voucherInlineInputClassName}
                      required
                    />
                  ),
                },
                {
                  id: "exception",
                  header: "Exception",
                  headerClassName: "min-w-32 text-right",
                  cellClassName: "text-right",
                  renderCell: (line, index) => (
                    <div className="space-y-0.5">
                      <Input
                        aria-label="Rejected quantity"
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.rejectedQuantity}
                        onChange={(event) =>
                          updateGoodsInwardLine(index, { rejectedQuantity: event.target.value })
                        }
                        className={voucherInlineInputClassName}
                        required
                      />
                      <Input
                        aria-label="Damaged quantity"
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.damagedQuantity}
                        onChange={(event) =>
                          updateGoodsInwardLine(index, { damagedQuantity: event.target.value })
                        }
                        className="h-6 rounded-none border-0 bg-transparent px-0 text-xs text-muted-foreground shadow-none focus-visible:ring-0"
                        required
                      />
                    </div>
                  ),
                },
                {
                  id: "identity",
                  header: "Identity",
                  headerClassName: "min-w-48",
                  renderCell: (line, index) => (
                    <div className="space-y-0.5">
                      <Input
                        placeholder="Manufacturer serial"
                        value={line.manufacturerSerial}
                        onChange={(event) =>
                          updateGoodsInwardLine(index, { manufacturerSerial: event.target.value })
                        }
                        className={voucherInlineInputClassName}
                      />
                      <Input
                        placeholder="Manufacturer barcode"
                        value={line.manufacturerBarcode}
                        onChange={(event) =>
                          updateGoodsInwardLine(index, { manufacturerBarcode: event.target.value })
                        }
                        className="h-6 rounded-none border-0 bg-transparent px-0 text-xs text-muted-foreground shadow-none focus-visible:ring-0"
                      />
                    </div>
                  ),
                },
              ]}
              footer={
                <>
                  <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Line count</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">{lines.length}</p>
                  </div>
                  <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Expected total</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {lines.reduce((sum, line) => sum + Number(line.expectedQuantity || 0), 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Accepted total</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {lines.reduce((sum, line) => sum + Number(line.acceptedQuantity || 0), 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Exception total</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {lines.reduce((sum, line) => sum + getGoodsInwardExceptionQuantity(line), 0).toFixed(2)}
                    </p>
                  </div>
                </>
              }
            />
            {error ? <StateCard message={error} /> : null}
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save inward"}</Button>
              <Button type="button" variant="outline" onClick={() => void navigate("/dashboard/apps/stock/goods-inward")}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export function StockUnitsSection() {
  const { data, error, isLoading } = useJsonResource<StockUnitListResponse>("/internal/v1/stock/stock-units")
  useGlobalLoading(isLoading)
  if (isLoading) return null
  if (error || !data) return <StateCard message={error ?? "Stock units are unavailable."} />

  return <DataTable headers={["Barcode", "Product", "Batch", "Serial", "Warehouse", "Status"]} rows={data.items.map((item) => [item.barcodeValue, item.productName, item.batchCode ?? "No batch", item.serialNumber, item.warehouseName, renderStockUnitStatusBadge(item.status, item.id)])} />
}

export function BarcodeSection() {
  const aliases = useJsonResource<BarcodeAliasListResponse>("/internal/v1/stock/barcode-aliases")
  const [barcodeValue, setBarcodeValue] = useState("")
  const [result, setResult] = useState<BarcodeResolutionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleResolve(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    try {
      setResult(
        await requestJson<BarcodeResolutionResponse>("/internal/v1/stock/barcode/resolve", {
          method: "POST",
          body: JSON.stringify({ barcodeValue }),
        })
      )
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Barcode resolution failed.")
    }
  }

  return (
    <div className="space-y-4">
      <SectionIntro title="Barcode and serial verification" description="Verify internal, vendor, manufacturer, batch, and serial identifiers against the current stock-unit ledger." />
      <Card className="border-border/70 shadow-sm">
        <CardContent className="p-5">
          <form className="flex gap-3" onSubmit={handleResolve}>
            <Input placeholder="Scan or type barcode" value={barcodeValue} onChange={(event) => setBarcodeValue(event.target.value)} />
            <Button type="submit">Verify</Button>
          </form>
        </CardContent>
      </Card>
      {error ? <StateCard message={error} /> : null}
      {result ? (
        <StateCard
          message={
            result.item.stockUnit
              ? `${result.item.barcodeValue} resolved to ${result.item.stockUnit.productName} in ${result.item.stockUnit.warehouseName}. ${result.item.warning ?? ""}`
              : result.item.warning ?? "Barcode did not resolve."
          }
        />
      ) : null}
      {aliases.data ? <DataTable headers={["Barcode", "Source", "Stock unit", "Updated"]} rows={aliases.data.items.slice(0, 50).map((item) => [item.barcodeValue, item.source, item.stockUnitId, item.updatedAt])} /> : null}
    </div>
  )
}

const barcodeDesignerPreviewUnit: BillingStockUnit = {
  id: "preview-stock-unit",
  goodsInwardLineId: "goods-inward-line:preview",
  barcodeValue: "AST-KRT-01-0001",
  batchCode: "BATCH-APR-2026",
  serialNumber: "AST-KRT-01-0001",
  expiresAt: "2027-04-30",
  productId: "product:preview",
  productCode: "AST-KRT-01",
  productName: "Aster Cotton Kurta",
  variantId: null,
  variantName: null,
  warehouseId: "warehouse:preview",
  warehouseName: "Main Warehouse",
  purchaseReceiptId: "purchase-receipt:preview",
  purchaseReceiptNumber: "PR-0001",
  goodsInwardId: "goods-inward:preview",
  goodsInwardNumber: "GIN-0001",
  unitSequence: 1,
  quantity: 1,
  manufacturerBarcode: null,
  manufacturerSerial: null,
  attributeSummary: null,
  variantSummary: null,
  mrp: null,
  sellingPrice: null,
  status: "available",
  receivedAt: new Date().toISOString(),
  availableAt: new Date().toISOString(),
  allocatedAt: null,
  soldAt: null,
  soldVoucherId: null,
  soldVoucherNumber: null,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export function PrintDesignerSection() {
  const [settings, setSettings] = useState<BarcodePrintDesignerSettings>(
    () => loadBarcodePrintDesignerSettings()
  )
  const [customPresetName, setCustomPresetName] = useState("")
  const [savedPresets, setSavedPresets] = useState<BarcodePrintDesignerPreset[]>(
    () => getBarcodePrintDesignerPresets()
  )
  const [selectedPresetId, setSelectedPresetId] = useState(() =>
    getMatchingBarcodePrintDesignerPresetId(loadBarcodePrintDesignerSettings())
  )
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setSavedPresets(getBarcodePrintDesignerPresets())
  }, [])

  useEffect(() => {
    setSelectedPresetId(getMatchingBarcodePrintDesignerPresetId(settings))
  }, [settings])

  useEffect(() => {
    const activePreset = savedPresets.find((preset) => preset.id === selectedPresetId)
    setCustomPresetName(activePreset?.isCustom ? activePreset.label : "")
  }, [savedPresets, selectedPresetId])

  function patchSettings(patch: Partial<BarcodePrintDesignerSettings>) {
    setSettings((current) => ({ ...current, ...patch }))
  }

  function handleSave() {
    saveBarcodePrintDesignerSettings(settings)
    setSettings(loadBarcodePrintDesignerSettings())
    setMessage("Barcode print designer saved. New print jobs will use this layout.")
  }

  function handleReset() {
    resetBarcodePrintDesignerSettings()
    setSettings(defaultBarcodePrintDesignerSettings)
    setMessage("Barcode print designer reset to the default layout.")
  }

  function handlePresetChange(presetId: string) {
    setSelectedPresetId(presetId)

    if (presetId === "custom") {
      return
    }

    const preset = savedPresets.find((item) => item.id === presetId)
    if (!preset) {
      return
    }

    setSettings((current) => ({ ...current, ...preset.settings }))
    setCustomPresetName(preset.isCustom ? preset.label : "")
    setMessage(`${preset.label} applied. You can still fine-tune the layout before saving.`)
  }

  function handleSaveAsPreset() {
    const normalizedName = customPresetName.trim()
    if (!normalizedName) {
      setMessage("Enter a preset name before saving the custom size.")
      return
    }

    const nextPreset = createCustomBarcodePrintDesignerPreset(normalizedName, settings)
    const nextPresets = getBarcodePrintDesignerPresets()
    setSavedPresets(nextPresets)
    setSelectedPresetId(nextPreset.id)
    setMessage(`Custom preset "${nextPreset.label}" saved.`)
  }

  function handleDeletePreset() {
    const activePreset = savedPresets.find((preset) => preset.id === selectedPresetId)
    if (!activePreset?.isCustom) {
      return
    }

    deleteCustomBarcodePrintDesignerPreset(activePreset.id)
    setSavedPresets(getBarcodePrintDesignerPresets())
    setSelectedPresetId("custom")
    setCustomPresetName("")
    setMessage(`Custom preset "${activePreset.label}" deleted.`)
  }

  async function handlePrintTest() {
    saveBarcodePrintDesignerSettings(settings)
    setMessage("Opening a sample print label with the current designer settings.")
    await printStockUnitBarcodes([barcodeDesignerPreviewUnit])
  }

  return (
    <div className="space-y-4">
      <SectionIntro
        title="Print designer"
        description="Define barcode label size, alignment, visibility, text scale, and barcode rendering rules before printing stock labels."
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_380px]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Barcode print designer</CardTitle>
              <CardDescription>
                Save one fixed print layout for generated barcode labels. This preset is used by both row print and bulk print.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => void handlePrintTest()}>
                Test print
              </Button>
              <Button type="button" variant="outline" onClick={handleReset}>
                Reset
              </Button>
              <Button type="button" onClick={handleSave}>
                Save designer
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Predefined size</p>
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[240px] flex-1 space-y-2">
                  <p className="text-sm font-medium text-foreground">Preset</p>
                  <select
                    className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                    value={selectedPresetId}
                    onChange={(event) => handlePresetChange(event.target.value)}
                  >
                    {savedPresets.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.isCustom ? `${preset.label} (Custom)` : preset.label}
                      </option>
                    ))}
                    <option value="custom">Custom size</option>
                  </select>
                </div>
                <div className="min-w-[240px] flex-1 space-y-2">
                  <p className="text-sm font-medium text-foreground">Save current size as</p>
                  <Input
                    value={customPresetName}
                    onChange={(event) => setCustomPresetName(event.target.value)}
                    placeholder="Ex: Zebra 60 x 40"
                  />
                </div>
                <div className="flex items-end">
                  <Button type="button" variant="outline" onClick={handleSaveAsPreset}>
                    Save as preset
                  </Button>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDeletePreset}
                    disabled={!savedPresets.find((preset) => preset.id === selectedPresetId)?.isCustom}
                  >
                    Delete preset
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Label layout</p>
              <FormGrid>
                <Field label="Label width (mm)">
                  <Input
                    type="number"
                    min="20"
                    max="150"
                    step="0.1"
                    value={settings.labelWidthMm}
                    onChange={(event) => patchSettings({ labelWidthMm: Number(event.target.value) })}
                  />
                </Field>
                <Field label="Label height (mm)">
                  <Input
                    type="number"
                    min="10"
                    max="100"
                    step="0.1"
                    value={settings.labelHeightMm}
                    onChange={(event) => patchSettings({ labelHeightMm: Number(event.target.value) })}
                  />
                </Field>
                <Field label="Inner padding (mm)">
                  <Input
                    type="number"
                    min="0"
                    max="8"
                    step="0.1"
                    value={settings.paddingMm}
                    onChange={(event) => patchSettings({ paddingMm: Number(event.target.value) })}
                  />
                </Field>
                <Field label="Line gap (mm)">
                  <Input
                    type="number"
                    min="0"
                    max="4"
                    step="0.1"
                    value={settings.gapMm}
                    onChange={(event) => patchSettings({ gapMm: Number(event.target.value) })}
                  />
                </Field>
                <Field label="Horizontal align">
                  <select
                    className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                    value={settings.horizontalAlign}
                    onChange={(event) =>
                      patchSettings({
                        horizontalAlign: event.target.value as BarcodePrintDesignerSettings["horizontalAlign"],
                      })
                    }
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </Field>
                <Field label="Vertical align">
                  <select
                    className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                    value={settings.verticalAlign}
                    onChange={(event) =>
                      patchSettings({
                        verticalAlign: event.target.value as BarcodePrintDesignerSettings["verticalAlign"],
                      })
                    }
                  >
                    <option value="top">Top</option>
                    <option value="center">Center</option>
                    <option value="bottom">Bottom</option>
                  </select>
                </Field>
              </FormGrid>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Text and barcode</p>
              <FormGrid>
                <Field label="Barcode standard">
                  <select
                    className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                    value={settings.barcodeStandard}
                    onChange={(event) =>
                      patchSettings({
                        barcodeStandard: event.target.value as BarcodePrintDesignerSettings["barcodeStandard"],
                      })
                    }
                  >
                    <option value="CODE128">CODE128</option>
                    <option value="CODE39">CODE39</option>
                    <option value="EAN13">EAN13</option>
                    <option value="EAN8">EAN8</option>
                  </select>
                </Field>
                <Field label="Barcode height (mm)">
                  <Input
                    type="number"
                    min="6"
                    max="40"
                    step="0.1"
                    value={settings.barcodeHeightMm}
                    onChange={(event) => patchSettings({ barcodeHeightMm: Number(event.target.value) })}
                  />
                </Field>
                <Field label="Barcode line width">
                  <Input
                    type="number"
                    min="0.6"
                    max="3"
                    step="0.01"
                    value={settings.barcodeLineWidth}
                    onChange={(event) => patchSettings({ barcodeLineWidth: Number(event.target.value) })}
                  />
                </Field>
                <Field label="Product text size">
                  <Input
                    type="number"
                    min="6"
                    max="20"
                    step="1"
                    value={settings.productFontSizePx}
                    onChange={(event) => patchSettings({ productFontSizePx: Number(event.target.value) })}
                  />
                </Field>
                <Field label="Code text size">
                  <Input
                    type="number"
                    min="5"
                    max="18"
                    step="1"
                    value={settings.codeFontSizePx}
                    onChange={(event) => patchSettings({ codeFontSizePx: Number(event.target.value) })}
                  />
                </Field>
                <Field label="Meta text size">
                  <Input
                    type="number"
                    min="5"
                    max="18"
                    step="1"
                    value={settings.metaFontSizePx}
                    onChange={(event) => patchSettings({ metaFontSizePx: Number(event.target.value) })}
                  />
                </Field>
                <Field label="Barcode text size">
                  <Input
                    type="number"
                    min="5"
                    max="18"
                    step="1"
                    value={settings.barcodeTextFontSizePx}
                    onChange={(event) =>
                      patchSettings({ barcodeTextFontSizePx: Number(event.target.value) })
                    }
                  />
                </Field>
              </FormGrid>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Visible content</p>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {[
                  ["showBorder", "Show border"],
                  ["showProductName", "Show product name"],
                  ["showProductCode", "Show product code"],
                  ["showBatch", "Show batch"],
                  ["showSerial", "Show serial"],
                  ["showExpiry", "Show expiry"],
                  ["showBarcodeText", "Show barcode text"],
                ].map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 rounded-lg border border-border/70 px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      className="size-4 rounded border-border"
                      checked={Boolean(settings[key as keyof BarcodePrintDesignerSettings])}
                      onChange={(event) =>
                        patchSettings({
                          [key]: event.target.checked,
                        } as Partial<BarcodePrintDesignerSettings>)
                      }
                    />
                    <span className="font-medium text-foreground">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            {message ? <StateCard message={message} /> : null}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Live preview</CardTitle>
            <CardDescription>
              Preview of the saved label direction using a sample stock unit.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-4">
              <div
                className="mx-auto flex overflow-hidden bg-white text-slate-900 shadow-sm"
                style={{
                  width: `${settings.labelWidthMm * 5.2}px`,
                  height: `${settings.labelHeightMm * 5.2}px`,
                  padding: `${settings.paddingMm * 5.2}px`,
                  border: settings.showBorder ? "1px solid #111827" : "1px solid transparent",
                  flexDirection: "column",
                  justifyContent:
                    settings.verticalAlign === "center"
                      ? "center"
                      : settings.verticalAlign === "bottom"
                        ? "flex-end"
                        : "flex-start",
                  alignItems:
                    settings.horizontalAlign === "center"
                      ? "center"
                      : settings.horizontalAlign === "right"
                        ? "flex-end"
                        : "flex-start",
                  gap: `${settings.gapMm * 5.2}px`,
                }}
              >
                {settings.showProductName ? (
                  <div
                    className="w-full truncate font-semibold"
                    style={{
                      fontSize: `${settings.productFontSizePx}px`,
                      textAlign: settings.horizontalAlign,
                    }}
                  >
                    {barcodeDesignerPreviewUnit.productName}
                  </div>
                ) : null}
                {settings.showProductCode ? (
                  <div
                    className="w-full truncate text-slate-500"
                    style={{
                      fontSize: `${settings.codeFontSizePx}px`,
                      textAlign: settings.horizontalAlign,
                    }}
                  >
                    {barcodeDesignerPreviewUnit.productCode}
                  </div>
                ) : null}
                <div
                  className="w-full rounded-sm bg-slate-900/90"
                  style={{ height: `${settings.barcodeHeightMm * 5.2}px` }}
                />
                {settings.showBarcodeText ? (
                  <div
                    className="w-full truncate font-semibold"
                    style={{
                      fontSize: `${settings.barcodeTextFontSizePx}px`,
                      textAlign: settings.horizontalAlign,
                    }}
                  >
                    {barcodeDesignerPreviewUnit.barcodeValue}
                  </div>
                ) : null}
                {settings.showBatch || settings.showSerial ? (
                  <div
                    className="flex w-full justify-between gap-2 truncate"
                    style={{
                      fontSize: `${settings.metaFontSizePx}px`,
                      textAlign: settings.horizontalAlign,
                    }}
                  >
                    {settings.showBatch ? <span>Batch: {barcodeDesignerPreviewUnit.batchCode}</span> : <span />}
                    {settings.showSerial ? <span>Serial: {barcodeDesignerPreviewUnit.serialNumber}</span> : null}
                  </div>
                ) : null}
                {settings.showExpiry ? (
                  <div
                    className="w-full truncate text-slate-600"
                    style={{
                      fontSize: `${settings.metaFontSizePx}px`,
                      textAlign: settings.horizontalAlign,
                    }}
                  >
                    Expiry: {barcodeDesignerPreviewUnit.expiresAt}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
              <p>Size: {settings.labelWidthMm}mm x {settings.labelHeightMm}mm</p>
              <p>Barcode: {settings.barcodeStandard} at {settings.barcodeHeightMm}mm height</p>
              <p>Alignment: {settings.horizontalAlign} / {settings.verticalAlign}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function SaleAllocationsSection() {
  const list = useJsonResource<SaleAllocationListResponse>("/internal/v1/stock/sale-allocations")
  const [form, setForm] = useState({ barcodeValue: "", warehouseId: "", salesVoucherNumber: "", salesItemIndex: "0", markAsSold: true })
  const [message, setMessage] = useState<string | null>(null)

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const response = await requestJson<{ item: { id: string; status: string } }>(
      "/internal/v1/stock/sale-allocations",
      {
        method: "POST",
        body: JSON.stringify({
          barcodeValue: form.barcodeValue,
          warehouseId: form.warehouseId || null,
          salesVoucherId: null,
          salesVoucherNumber: form.salesVoucherNumber || null,
          salesItemIndex: Number(form.salesItemIndex),
          markAsSold: form.markAsSold,
        }),
      }
    )
    setMessage(`Sale allocation ${response.item.id} saved with status ${response.item.status}.`)
  }

  return (
    <div className="space-y-4">
      <SectionIntro title="Pre-sales and issue allocations" description="Reserve or sell scanned stock units into outbound issue and pre-sales flows." />
      <Card className="border-border/70 shadow-sm">
        <CardContent className="p-5">
          <form className="grid gap-3 md:grid-cols-3" onSubmit={handleCreate}>
            <Input placeholder="Barcode" value={form.barcodeValue} onChange={(event) => setForm({ ...form, barcodeValue: event.target.value })} required />
            <Input placeholder="Warehouse id" value={form.warehouseId} onChange={(event) => setForm({ ...form, warehouseId: event.target.value })} />
            <Input placeholder="Sales voucher number" value={form.salesVoucherNumber} onChange={(event) => setForm({ ...form, salesVoucherNumber: event.target.value })} />
            <Button type="submit">Allocate</Button>
          </form>
        </CardContent>
      </Card>
      {message ? <StateCard message={message} /> : null}
      {list.data ? <DataTable headers={["Barcode", "Product", "Warehouse", "Voucher", "Status", "Allocated"]} rows={list.data.items.map((item) => [item.barcodeValue, item.productId, item.warehouseId, item.salesVoucherNumber ?? "-", renderLightStockStatusBadge(item.status, item.id), item.allocatedAt])} /> : null}
    </div>
  )
}

export function MovementsSection() {
  const { data, error, isLoading } = useJsonResource<MovementListResponse>("/internal/v1/stock/movements")
  useGlobalLoading(isLoading)
  if (isLoading) return null
  if (error || !data) return <StateCard message={error ?? "Stock movements are unavailable."} />
  return <DataTable headers={["Type", "Direction", "Product", "Warehouse", "Qty", "Reference", "Updated"]} rows={data.items.map((item) => [item.movementType, item.direction, item.productId, item.warehouseId, String(item.quantity), `${item.referenceType ?? "-"} ${item.referenceId ?? ""}`.trim(), item.updatedAt])} />
}

export function StockLedgerSection({ productId }: { productId?: string }) {
  const { data, error, isLoading } = useJsonResource<StockUnitListResponse>("/internal/v1/stock/stock-units")
  const location = useLocation()
  const navigate = useNavigate()
  const productLookup = useJsonResource<ProductListResponse>("/internal/v1/core/products")
  const warehouseLookup = useJsonResource<CommonModuleListResponse>(
    "/internal/v1/core/common-modules/items?module=warehouses"
  )
  const [warehouseId, setWarehouseId] = useState("")
  useGlobalLoading(isLoading || productLookup.isLoading || warehouseLookup.isLoading)

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    setWarehouseId(searchParams.get("warehouseId") ?? "")
  }, [location.search])

  if (isLoading || productLookup.isLoading || warehouseLookup.isLoading) {
    return null
  }

  if (
    error ||
    !data ||
    productLookup.error ||
    !productLookup.data ||
    warehouseLookup.error ||
    !warehouseLookup.data
  ) {
    return (
      <StateCard
        message={error ?? productLookup.error ?? warehouseLookup.error ?? "Stock ledger is unavailable."}
      />
    )
  }

  const warehouseOptions = buildWarehouseOptions(warehouseLookup.data.items, "", "")
  const productById = new Map(
    productLookup.data.items.map((product) => [product.id, product] as const)
  )
  const filteredItems = warehouseId
    ? data.items.filter((item) => item.warehouseId === warehouseId)
    : data.items
  const consolidatedProductMap = new Map<
    string,
    {
      productId: string
      productName: string
      productCode: string
      receivedQuantity: number
      acceptedQuantity: number
      liveBalanceQuantity: number
    }
  >()

  for (const item of filteredItems) {
    const resolvedProduct = productById.get(item.productId)
    const current = consolidatedProductMap.get(item.productId)
    const acceptedQuantity =
      item.status === "available" || item.status === "allocated" || item.status === "sold"
        ? item.quantity
        : 0
    const liveBalanceQuantity = item.status === "available" ? item.quantity : 0

    if (current) {
      current.receivedQuantity += item.quantity
      current.acceptedQuantity += acceptedQuantity
      current.liveBalanceQuantity += liveBalanceQuantity
      continue
    }

    consolidatedProductMap.set(item.productId, {
      productId: item.productId,
      productName: resolvedProduct?.name ?? item.productName,
      productCode: resolvedProduct?.code ?? item.productCode,
      receivedQuantity: item.quantity,
      acceptedQuantity,
      liveBalanceQuantity,
    })
  }

  const consolidatedProducts = Array.from(consolidatedProductMap.values())
  const selectedProduct =
    consolidatedProducts.find((item) => item.productId === productId) ?? null
  const selectedProductItems = productId
    ? filteredItems.filter((item) => item.productId === productId)
    : []
  const selectedProductName =
    selectedProduct?.productName ?? selectedProductItems[0]?.productName ?? "Product detail"
  const selectedProductCode =
    selectedProduct?.productCode ?? selectedProductItems[0]?.productCode ?? productId ?? "-"
  const selectedWarehouseLabel =
    warehouseOptions.find((item) => item.value === warehouseId)?.label ?? "All warehouses"
  const selectedProductStatusTotals = selectedProductItems.reduce(
    (totals, item) => {
      if (item.status === "received") totals.received += item.quantity
      if (item.status === "available") totals.available += item.quantity
      if (item.status === "allocated") totals.allocated += item.quantity
      if (item.status === "sold") totals.sold += item.quantity
      if (item.availableAt) totals.accepted += item.quantity
      if (item.allocatedAt || item.soldAt) totals.dispatched += item.quantity

      return totals
    },
    { received: 0, available: 0, allocated: 0, sold: 0, accepted: 0, dispatched: 0 }
  )

  if (productId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const query = warehouseId ? `?warehouseId=${encodeURIComponent(warehouseId)}` : ""
              void navigate(`/dashboard/apps/stock/stock-ledger${query}`)
            }}
          >
            Back
          </Button>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{selectedProductName}</h2>
            <p className="text-sm text-muted-foreground">
              {selectedProductCode} · {selectedWarehouseLabel}
            </p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {[
            { label: "Received", value: formatQuantity(selectedProductStatusTotals.received) },
            { label: "Available", value: formatQuantity(selectedProductStatusTotals.available) },
            { label: "Allocated", value: formatQuantity(selectedProductStatusTotals.allocated) },
            { label: "Sold", value: formatQuantity(selectedProductStatusTotals.sold) },
            { label: "Accepted", value: formatQuantity(selectedProductStatusTotals.accepted) },
            { label: "Dispatched", value: formatQuantity(selectedProductStatusTotals.dispatched) },
          ].map((item) => (
            <Card key={item.label} className="border-border/70 shadow-sm">
              <CardContent className="space-y-0 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {item.label}
                </p>
                <p className="text-base font-semibold text-foreground">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-0">
            <DataTable
              headers={["Warehouse", "Barcode", "Serial", "Qty", "Status", "Accepted at", "Last movement"]}
              rows={selectedProductItems.map((item) => [
                item.warehouseName,
                <span key={`${item.id}:barcode`} className="font-mono text-xs text-foreground">
                  {item.barcodeValue}
                </span>,
                item.serialNumber,
                String(item.quantity),
                renderStockUnitStatusBadge(item.status, `${item.id}:status`),
                formatOptionalTimestamp(item.availableAt),
                <div key={`${item.id}:movement`} className="space-y-0.5">
                  <p>{formatOptionalTimestamp(item.soldAt ?? item.allocatedAt)}</p>
                  {item.soldVoucherNumber ? (
                    <p className="text-xs text-muted-foreground">{item.soldVoucherNumber}</p>
                  ) : null}
                </div>,
              ])}
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <SectionIntro
        title="Stock ledger"
        description="Review product-wise stock received, accepted, and live stock balance."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <div className="w-full min-w-[280px] sm:w-[320px]">
              <SearchableLookupField
                emptyOptionLabel="All warehouses"
                noResultsMessage="No warehouses found."
                onValueChange={(nextValue) => {
                  const query = nextValue ? `?warehouseId=${encodeURIComponent(nextValue)}` : ""
                  setWarehouseId(nextValue)
                  void navigate(
                    productId
                      ? `/dashboard/apps/stock/stock-ledger/${encodeURIComponent(productId)}${query}`
                      : `/dashboard/apps/stock/stock-ledger${query}`
                  )
                }}
                options={warehouseOptions}
                placeholder="Select warehouse"
                searchPlaceholder="Search warehouse"
                triggerClassName="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-none focus-visible:border-ring focus-visible:ring-0"
                value={warehouseId}
              />
            </div>
            <Button
              type="button"
              className="bg-violet-600 text-white hover:bg-violet-700"
              onClick={() =>
                printStockLedgerConsolidatedDocument({
                  warehouseLabel: selectedWarehouseLabel,
                  rows: consolidatedProducts.map((item) => [
                    `${item.productName} (${item.productCode})`,
                    formatQuantity(item.receivedQuantity),
                    formatQuantity(item.acceptedQuantity),
                    formatQuantity(item.liveBalanceQuantity),
                  ]),
                })
              }
            >
              <PrinterIcon className="mr-2 size-4" />
              Print
            </Button>
          </div>
        }
      />
      <Card className="border-border/70 shadow-sm">
        <CardContent className="p-0">
          <DataTable
            headers={["Product", "Stock received", "Stock accepted", "Live stock balance"]} 
            rows={consolidatedProducts.map((item) => [
              <button
                key={`${item.productId}:select`}
                type="button"
                className="text-left"
                onClick={() => {
                  const query = warehouseId ? `?warehouseId=${encodeURIComponent(warehouseId)}` : ""
                  void navigate(`/dashboard/apps/stock/stock-ledger/${encodeURIComponent(item.productId)}${query}`)
                }}
              >
                <p className="font-medium text-foreground">{item.productName}</p>
                <p className="text-xs text-muted-foreground">{item.productCode}</p>
              </button>,
              formatQuantity(item.receivedQuantity),
              formatQuantity(item.acceptedQuantity),
              formatQuantity(item.liveBalanceQuantity),
            ])}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export function AvailabilitySection() {
  const [state, setState] = useState<ResourceState<AvailabilityListResponse>>({ data: null, error: null, isLoading: true })
  useGlobalLoading(state.isLoading)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await requestJson<AvailabilityListResponse>("/internal/v1/stock/availability", { method: "POST", body: JSON.stringify({}) })
        if (!cancelled) setState({ data, error: null, isLoading: false })
      } catch (error) {
        if (!cancelled) setState({ data: null, error: error instanceof Error ? error.message : "Failed to load availability.", isLoading: false })
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  if (state.isLoading) return null
  if (state.error || !state.data) return <StateCard message={state.error ?? "Availability is unavailable."} />
  return <DataTable headers={["Warehouse", "Product", "On hand", "Reserved", "Allocated", "In transit", "Available"]} rows={state.data.items.map((item) => [item.warehouseId, item.productId, String(item.onHandQuantity), String(item.reservedQuantity), String(item.allocatedQuantity), String(item.inTransitQuantity), String(item.availableQuantity)])} />
}

export function ReconciliationSection() {
  const { data, error, isLoading } = useJsonResource<StockReconciliationResponse>("/internal/v1/stock/reconciliation")
  useGlobalLoading(isLoading)
  if (isLoading) return null
  if (error || !data) return <StateCard message={error ?? "Reconciliation is unavailable."} />
  return <DataTable headers={["Warehouse", "Product", "Engine", "Core", "Mismatch"]} rows={data.items.map((item) => [item.warehouseId, item.productId, String(item.engineOnHandQuantity), String(item.coreOnHandQuantity), <Badge key={`${item.warehouseId}:${item.productId}`} variant={item.mismatchQuantity === 0 ? "secondary" : "outline"}>{item.mismatchQuantity}</Badge>])} />
}

function getTransferQuantity(item: StockTransfer) {
  return item.lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0)
}

function findTransfer(items: StockTransfer[], transferId: string) {
  return items.find((item) => item.id === transferId)
}

export function TransfersSection() {
  const navigate = useNavigate()
  const list = useJsonResource<TransferListResponse>("/internal/v1/stock/transfers")
  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  useGlobalLoading(list.isLoading)

  if (list.isLoading) {
    return null
  }

  if (list.error || !list.data) {
    return <StateCard message={list.error ?? "Warehouse transfers are unavailable."} />
  }

  const filteredItems = list.data.items.filter((item) => {
    const search = searchValue.trim().toLowerCase()
    const matchesSearch =
      search.length === 0 ||
      [
        item.id,
        item.sourceWarehouseId,
        item.destinationWarehouseId,
        item.status,
        item.requestedAt,
        String(getTransferQuantity(item)),
      ]
        .join(" ")
        .toLowerCase()
        .includes(search)
    const matchesStatus = statusFilter === "all" || item.status === statusFilter

    return matchesSearch && matchesStatus
  })
  const totalRecords = filteredItems.length
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )
  const activeFilters =
    statusFilter === "all"
      ? []
      : [{ key: "status", label: "Status", value: statusFilter }]

  return (
    <MasterList
      header={{
        pageTitle: "Warehouse Transfers",
        pageDescription:
          "Create and review warehouse-to-warehouse transfer records in the same operational tone as delivery notes.",
        technicalName: "page.stock.transfers",
        addLabel: "New Transfer",
        onAddClick: () => {
          void navigate("/dashboard/apps/stock/transfers/new")
        },
      }}
      search={{
        value: searchValue,
        onChange: (value) => {
          setSearchValue(value)
          setCurrentPage(1)
        },
        placeholder: "Search transfer, warehouse, status, or quantity",
      }}
      filters={{
        options: [
          {
            key: "all",
            label: "All transfers",
            isActive: statusFilter === "all",
            onSelect: () => {
              setStatusFilter("all")
              setCurrentPage(1)
            },
          },
          ...(["requested", "approved", "in-transit", "received", "cancelled"] as const).map((value) => ({
            key: value,
            label: value,
            isActive: statusFilter === value,
            onSelect: () => {
              setStatusFilter(value)
              setCurrentPage(1)
            },
          })),
        ],
        activeFilters,
        onRemoveFilter: (key) => {
          if (key === "status") {
            setStatusFilter("all")
            setCurrentPage(1)
          }
        },
        onClearAllFilters: () => {
          setStatusFilter("all")
          setSearchValue("")
          setCurrentPage(1)
        },
        technicalName: "section.stock.transfers.filters",
      }}
      table={{
        technicalName: "section.stock.transfers.table",
        columns: [
          {
            id: "transfer",
            header: "Transfer",
            sortable: true,
            accessor: (item) => item.id,
            cell: (item) => (
              <button
                type="button"
                className="text-left"
                onClick={() => {
                  void navigate(`/dashboard/apps/stock/transfers/${encodeURIComponent(item.id)}`)
                }}
              >
                <p className="font-medium text-foreground hover:underline hover:underline-offset-2">
                  {item.id}
                </p>
              </button>
            ),
          },
          {
            id: "from",
            header: "From",
            sortable: true,
            accessor: (item) => formatWarehouseDisplayName(item.sourceWarehouseId),
            cell: (item) => formatWarehouseDisplayName(item.sourceWarehouseId),
          },
          {
            id: "to",
            header: "To",
            sortable: true,
            accessor: (item) => formatWarehouseDisplayName(item.destinationWarehouseId),
            cell: (item) => formatWarehouseDisplayName(item.destinationWarehouseId),
          },
          {
            id: "requested",
            header: "Requested",
            sortable: true,
            accessor: (item) => item.requestedAt,
            cell: (item) => formatOptionalTimestamp(item.requestedAt),
          },
          {
            id: "quantity",
            header: "Qty",
            sortable: true,
            accessor: getTransferQuantity,
            cell: (item) => formatQuantity(getTransferQuantity(item)),
          },
          {
            id: "status",
            header: "Status",
            sortable: true,
            accessor: (item) => item.status,
            cell: (item) => renderLightStockStatusBadge(item.status, `${item.id}:status`),
          },
          {
            id: "actions",
            header: "",
            cell: (item) => (
              <RecordActionMenu
                itemLabel={item.id}
                editLabel="Edit transfer"
                customItems={[
                  {
                    key: "view",
                    label: "View transfer",
                    icon: <EyeIcon className="size-4" />,
                    onSelect: () => {
                      void navigate(`/dashboard/apps/stock/transfers/${encodeURIComponent(item.id)}`)
                    },
                  },
                ]}
                onEdit={() => {
                  void navigate(`/dashboard/apps/stock/transfers/${encodeURIComponent(item.id)}/edit`)
                }}
              />
            ),
            className: "w-16 min-w-16 text-right",
            headerClassName: "w-16 min-w-16 text-right",
          },
        ],
        data: paginatedItems,
        emptyMessage: "No warehouse transfers found.",
        rowKey: (item) => item.id,
      }}
      footer={{
        content: (
          <div className="flex flex-wrap items-center gap-4">
            <span>
              Total transfers: <span className="font-medium text-foreground">{totalRecords}</span>
            </span>
          </div>
        ),
      }}
      pagination={{
        currentPage,
        pageSize,
        totalRecords,
        onPageChange: setCurrentPage,
        onPageSizeChange: (value) => {
          setPageSize(value)
          setCurrentPage(1)
        },
      }}
    />
  )
}

export function TransferShowSection({ transferId }: { transferId: string }) {
  const navigate = useNavigate()
  const list = useJsonResource<TransferListResponse>("/internal/v1/stock/transfers")
  const productLookup = useJsonResource<ProductListResponse>("/internal/v1/core/products")
  useGlobalLoading(list.isLoading || productLookup.isLoading)

  if (list.isLoading || productLookup.isLoading) {
    return null
  }

  if (list.error || productLookup.error || !list.data || !productLookup.data) {
    return <StateCard message={list.error ?? productLookup.error ?? "Warehouse transfer detail is unavailable."} />
  }

  const item = findTransfer(list.data.items, transferId)

  if (!item) {
    return <StateCard message="Warehouse transfer could not be found." />
  }

  const productNameById = new Map(productLookup.data.items.map((product) => [product.id, product.name]))
  const totalQuantity = getTransferQuantity(item)
  const currentTransferIndex = list.data.items.findIndex((entry) => entry.id === item.id)
  const previousTransfer = currentTransferIndex > 0 ? list.data.items[currentTransferIndex - 1] : null
  const nextTransfer =
    currentTransferIndex >= 0 && currentTransferIndex < list.data.items.length - 1
      ? list.data.items[currentTransferIndex + 1]
      : null

  return (
    <div className="space-y-4">
      <div className="grid gap-2 lg:grid-cols-3 lg:items-center">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void navigate("/dashboard/apps/stock/transfers")}>
            <Undo2Icon className="mr-2 size-4" />
            Back
          </Button>
          <Button
            variant="outline"
            disabled={!previousTransfer}
            onClick={() =>
              previousTransfer &&
              void navigate(`/dashboard/apps/stock/transfers/${encodeURIComponent(previousTransfer.id)}`)
            }
          >
            <ChevronLeftIcon className="mr-2 size-4" />
            Prev
          </Button>
          <Button
            variant="outline"
            disabled={!nextTransfer}
            onClick={() =>
              nextTransfer &&
              void navigate(`/dashboard/apps/stock/transfers/${encodeURIComponent(nextTransfer.id)}`)
            }
          >
            Next
            <ChevronRightIcon className="ml-2 size-4" />
          </Button>
        </div>
        <div />
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Button
            variant="outline"
            onClick={() =>
              void navigate(`/dashboard/apps/stock/transfers/${encodeURIComponent(item.id)}/edit`)
            }
          >
            <PencilIcon className="mr-2 size-4" />
            Edit
          </Button>
        </div>
      </div>
      <Card className="border-border/70 shadow-sm">
        <CardContent className="grid gap-4 p-5 md:grid-cols-3">
          <Field label="Transfer"><p className="text-sm font-medium">{item.id}</p></Field>
          <Field label="Requested"><p className="text-sm font-medium">{formatOptionalTimestamp(item.requestedAt)}</p></Field>
          <Field label="Status">{renderLightStockStatusBadge(item.status, `${item.id}:status`)}</Field>
          <Field label="From"><p className="text-sm font-medium">{formatWarehouseDisplayName(item.sourceWarehouseId)}</p></Field>
          <Field label="To"><p className="text-sm font-medium">{formatWarehouseDisplayName(item.destinationWarehouseId)}</p></Field>
          <Field label="Qty"><p className="text-sm font-medium">{formatQuantity(totalQuantity)}</p></Field>
        </CardContent>
      </Card>
      <VoucherInlineEditableTable
        title="Transfer items"
        className="bg-white"
        containerClassName="bg-white"
        fitToContainer
        rows={item.lines}
        getRowKey={(line) => line.id}
        columns={[
          {
            id: "product",
            header: "Product",
            width: "34%",
            renderCell: (line) => (
              <div>
                <p className="font-medium text-foreground">{productNameById.get(line.productId) ?? line.productId}</p>
                <p className="text-xs text-muted-foreground">{line.productId}</p>
              </div>
            ),
          },
          {
            id: "from",
            header: "From location",
            width: "18%",
            renderCell: (line) => line.sourceLocationId ?? "-",
          },
          {
            id: "to",
            header: "To location",
            width: "18%",
            renderCell: (line) => line.destinationLocationId ?? "-",
          },
          {
            id: "quantity",
            header: "Qty",
            width: "12%",
            headerClassName: "text-center",
            cellClassName: "text-center",
            renderCell: (line) => formatQuantity(line.quantity),
          },
          {
            id: "status",
            header: "Status",
            width: "18%",
            renderCell: () => renderLightStockStatusBadge(item.status, `${item.id}:line-status`),
          },
        ]}
        summaryRow={
          <TableRow className="border-border/60 bg-muted/20 hover:bg-muted/20">
            <TableCell className="border-r border-border/50 px-1 py-0.5" />
            <TableCell
              colSpan={3}
              className="border-r border-border/50 px-1.5 py-0.5 text-right font-semibold uppercase tracking-[0.14em] text-muted-foreground"
            >
              Total
            </TableCell>
            <TableCell className="border-r border-border/50 px-0 py-0.5 text-center text-sm font-semibold text-foreground">
              <div className="flex h-6 items-center justify-center">
                {formatQuantity(totalQuantity)}
              </div>
            </TableCell>
            <TableCell className="px-0 py-0.5">
              <div className="h-6" />
            </TableCell>
          </TableRow>
        }
      />
      <Card className="border-border/70 shadow-sm">
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">{item.notes || "No remarks."}</p>
        </CardContent>
      </Card>
    </div>
  )
}

export function TransferUpsertSection({ transferId }: { transferId?: string }) {
  const navigate = useNavigate()
  const list = useJsonResource<TransferListResponse>("/internal/v1/stock/transfers")
  const productLookup = useJsonResource<ProductListResponse>("/internal/v1/core/products")
  const warehouseLookup = useJsonResource<CommonModuleListResponse>(
    "/internal/v1/core/common-modules/items?module=warehouses"
  )
  const stockUnits = useJsonResource<StockUnitListResponse>("/internal/v1/stock/stock-units")
  const [form, setForm] = useState(createTransferForm)
  const [barcodeValue, setBarcodeValue] = useState("")
  const [manualProductId, setManualProductId] = useState("")
  const [manualStockUnitId, setManualStockUnitId] = useState("")
  const [items, setItems] = useState<TransferItem[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [saving, setSaving] = useState(false)
  const selectedItemIds = useMemo(() => new Set(items.map((item) => item.id)), [items])
  const transferStockUnits = useMemo(
    () =>
      (stockUnits.data?.items ?? []).filter((stockUnit) => {
        if (!stockUnit.isActive || selectedItemIds.has(stockUnit.id)) {
          return false
        }

        if (!deliveryEligibleStockStatuses.has(stockUnit.status)) {
          return false
        }

        if (form.sourceWarehouseId && stockUnit.warehouseId !== form.sourceWarehouseId) {
          return false
        }

        return true
      }),
    [form.sourceWarehouseId, selectedItemIds, stockUnits.data?.items]
  )
  const transferProductOptions = useMemo(() => {
    const productIdsWithStock = new Set(transferStockUnits.map((stockUnit) => stockUnit.productId))
    return getProductLookupOptions(productLookup.data?.items ?? []).filter((option) =>
      productIdsWithStock.has(option.value)
    )
  }, [productLookup.data?.items, transferStockUnits])
  const manualTransferStockUnitOptions = useMemo(
    () =>
      transferStockUnits
        .filter((stockUnit) => !manualProductId || stockUnit.productId === manualProductId)
        .map((stockUnit) => ({
          value: stockUnit.id,
          label: getDeliveryStockUnitLabel(stockUnit),
        })),
    [manualProductId, transferStockUnits]
  )
  useGlobalLoading(
    list.isLoading ||
      productLookup.isLoading ||
      warehouseLookup.isLoading ||
      stockUnits.isLoading ||
      isScanning
  )

  const existingTransfer = transferId && list.data ? findTransfer(list.data.items, transferId) : null

  useEffect(() => {
    if (!existingTransfer) {
      return
    }

    const firstLine = existingTransfer.lines[0]
    setForm({
      id: existingTransfer.id,
      status: existingTransfer.status,
      sourceWarehouseId: existingTransfer.sourceWarehouseId,
      sourceLocationId: existingTransfer.sourceLocationId ?? "",
      destinationWarehouseId: existingTransfer.destinationWarehouseId,
      destinationLocationId: existingTransfer.destinationLocationId ?? "",
      requestedAt: existingTransfer.requestedAt,
      dispatchedAt: existingTransfer.dispatchedAt ?? "",
      receivedAt: existingTransfer.receivedAt ?? "",
      referenceType: existingTransfer.referenceType ?? "manual_transfer",
      referenceId: existingTransfer.referenceId ?? "",
      notes: existingTransfer.notes ?? "",
      productId: firstLine?.productId ?? "",
      quantity: firstLine ? String(firstLine.quantity) : "1",
    })
    setItems(
      existingTransfer.lines.map((line) => {
        const stockUnit =
          stockUnits.data?.items.find((unit) => unit.id === line.serialId || unit.id === line.id) ??
          null

        if (stockUnit) {
          return createTransferItemFromStockUnit(stockUnit)
        }

        return {
          id: line.id,
          productId: line.productId,
          barcodeValue: line.serialId ?? line.id,
          productName: productLookup.data?.items.find((product) => product.id === line.productId)?.name ?? line.productId,
          productCode: line.productId,
          batchCode: line.batchId ?? "No batch",
          serialNumber: line.serialId ?? line.id,
          warehouseId: existingTransfer.sourceWarehouseId,
          warehouseName: formatWarehouseDisplayName(existingTransfer.sourceWarehouseId),
          quantity: line.quantity,
          stockUnitStatus: existingTransfer.status,
        }
      })
    )
  }, [existingTransfer, productLookup.data?.items, stockUnits.data?.items])

  if (list.isLoading || productLookup.isLoading || warehouseLookup.isLoading || stockUnits.isLoading) {
    return null
  }

  if (
    list.error ||
    productLookup.error ||
    warehouseLookup.error ||
    stockUnits.error ||
    !list.data ||
    !productLookup.data ||
    !warehouseLookup.data ||
    !stockUnits.data
  ) {
    return (
      <StateCard
        message={
          list.error ??
          productLookup.error ??
          warehouseLookup.error ??
          stockUnits.error ??
          "Warehouse transfer form is unavailable."
        }
      />
    )
  }

  if (transferId && !existingTransfer) {
    return <StateCard message="Warehouse transfer could not be found." />
  }

  const warehouseOptions = buildWarehouseOptions(warehouseLookup.data.items, "", "")
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)

  function addStockUnitToTransfer(stockUnit: BillingStockUnit, matchedBarcodeValue?: string) {
    const normalizedMatchedBarcode = matchedBarcodeValue?.trim()

    if (
      items.some(
        (item) =>
          item.id === stockUnit.id ||
          item.barcodeValue === stockUnit.barcodeValue ||
          (normalizedMatchedBarcode ? item.barcodeValue === normalizedMatchedBarcode : false)
      )
    ) {
      setMessage("This barcode is already added to the warehouse transfer.")
      return false
    }

    if (!deliveryEligibleStockStatuses.has(stockUnit.status)) {
      setMessage(
        `Warning: barcode is ${stockUnit.status}; only accepted stock can be added to transfer.`
      )
      return false
    }

    if (form.sourceWarehouseId && stockUnit.warehouseId !== form.sourceWarehouseId) {
      setMessage("Warning: selected barcode is not in the source warehouse.")
      return false
    }

    setItems((current) => [...current, createTransferItemFromStockUnit(stockUnit)])
    setMessage(`Added ${stockUnit.productName} (${stockUnit.productCode}) to warehouse transfer.`)
    return true
  }

  async function handleAddTransferBarcode() {
    const normalizedBarcode = barcodeValue.trim()

    if (!normalizedBarcode) {
      setMessage("Scan or enter a barcode before adding a transfer item.")
      return
    }

    setIsScanning(true)
    setMessage(null)

    try {
      const response = await requestJson<BarcodeResolutionResponse>("/internal/v1/stock/barcode/resolve", {
        method: "POST",
        body: JSON.stringify({
          barcodeValue: normalizedBarcode,
        }),
      })
      const stockUnit = response.item.stockUnit

      if (!response.item.resolved || !stockUnit) {
        setMessage("Warning: scanned barcode did not match any stock unit.")
        return
      }

      if (addStockUnitToTransfer(stockUnit, response.item.barcodeValue)) {
        setBarcodeValue("")
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to add barcode to transfer.")
    } finally {
      setIsScanning(false)
    }
  }

  function handleAddManualTransferStockUnit() {
    if (!manualStockUnitId) {
      setMessage("Select a stock barcode before adding a transfer item.")
      return
    }

    const stockUnit = stockUnits.data?.items.find((item) => item.id === manualStockUnitId)
    if (!stockUnit) {
      setMessage("Selected stock barcode is no longer available.")
      return
    }

    if (addStockUnitToTransfer(stockUnit)) {
      setManualStockUnitId("")
    }
  }

  function removeTransferItem(itemId: string) {
    setItems((current) => current.filter((item) => item.id !== itemId))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.sourceWarehouseId) {
      setMessage("Select a source warehouse before saving the warehouse transfer.")
      return
    }

    if (!form.destinationWarehouseId) {
      setMessage("Select a destination warehouse before saving the warehouse transfer.")
      return
    }

    if (items.length === 0) {
      setMessage("Add at least one scanned barcode before saving the warehouse transfer.")
      return
    }

    if (items.some((item) => item.warehouseId !== form.sourceWarehouseId)) {
      setMessage("All selected barcodes must belong to the source warehouse.")
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const response = await requestJson<{ item: StockTransfer }>("/internal/v1/stock/transfers", {
        method: "POST",
        body: JSON.stringify({
          id: form.id,
          status: form.status,
          sourceWarehouseId: form.sourceWarehouseId,
          sourceLocationId: form.sourceLocationId || null,
          destinationWarehouseId: form.destinationWarehouseId,
          destinationLocationId: form.destinationLocationId || null,
          requestedAt: form.requestedAt,
          dispatchedAt: form.dispatchedAt || null,
          receivedAt: form.receivedAt || null,
          referenceType: form.referenceType || null,
          referenceId: form.referenceId || null,
          notes: form.notes || null,
          lines: items.map((item) => ({
            id: `${form.id}:${item.id}`,
            productId: item.productId,
            variantId: null,
            batchId: item.batchCode === "No batch" ? null : item.batchCode,
            serialId: item.id,
            quantity: item.quantity,
            sourceLocationId: form.sourceLocationId || null,
            destinationLocationId: form.destinationLocationId || null,
          })),
        }),
      })
      void navigate(`/dashboard/apps/stock/transfers/${encodeURIComponent(response.item.id)}`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save warehouse transfer.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/70 shadow-sm">
        <CardContent className="p-5">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Transfer number">
                <Input
                  value={form.id}
                  onChange={(event) => setForm({ ...form, id: event.target.value })}
                  required
                />
              </Field>
              <Field label="Status">
                <select
                  className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value })}
                >
                  <option value="requested">Requested</option>
                  <option value="approved">Approved</option>
                  <option value="in-transit">In transit</option>
                  <option value="partially-received">Partially received</option>
                  <option value="received">Received</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </Field>
              <Field label="Source warehouse">
                <SearchableLookupField
                  noResultsMessage="No warehouses found."
                  onValueChange={(nextValue) =>
                    setForm((current) => ({ ...current, sourceWarehouseId: nextValue }))
                  }
                  options={warehouseOptions}
                  placeholder="Select source warehouse"
                  searchPlaceholder="Search warehouse"
                  triggerClassName="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-none focus-visible:border-ring focus-visible:ring-0"
                  value={form.sourceWarehouseId}
                />
              </Field>
              <Field label="Destination warehouse">
                <SearchableLookupField
                  noResultsMessage="No warehouses found."
                  onValueChange={(nextValue) =>
                    setForm((current) => ({ ...current, destinationWarehouseId: nextValue }))
                  }
                  options={warehouseOptions}
                  placeholder="Select destination warehouse"
                  searchPlaceholder="Search warehouse"
                  triggerClassName="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-none focus-visible:border-ring focus-visible:ring-0"
                  value={form.destinationWarehouseId}
                />
              </Field>
            </div>
            <Card className="border-border/70 shadow-sm">
              <CardContent className="p-4">
                <div className="grid items-end gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                  <Field label="Scan barcode">
                    <Input
                      className="h-11 text-base"
                      placeholder="Scan stock barcode"
                      value={barcodeValue}
                      onChange={(event) => setBarcodeValue(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter") {
                          return
                        }

                        event.preventDefault()
                        void handleAddTransferBarcode()
                      }}
                    />
                  </Field>
                  <Button
                    type="button"
                    className="h-11 min-w-32"
                    disabled={isScanning}
                    onClick={() => void handleAddTransferBarcode()}
                  >
                    {isScanning ? "Adding..." : "Add item"}
                  </Button>
                </div>
                <div className="mt-4 grid items-end gap-3 border-t border-border/60 pt-4 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)_auto]">
                  <Field label="Product">
                    <SearchableLookupField
                      emptyOptionLabel="Select product"
                      noResultsMessage="No transferable stock found."
                      onValueChange={(nextValue) => {
                        if (nextValue.startsWith("manual:")) {
                          return
                        }

                        setManualProductId(nextValue)
                        setManualStockUnitId("")
                      }}
                      options={transferProductOptions}
                      placeholder="Select product"
                      searchPlaceholder="Search product"
                      triggerClassName="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-none focus-visible:border-ring focus-visible:ring-0"
                      value={manualProductId}
                    />
                  </Field>
                  <Field label="Stock barcode">
                    <SearchableLookupField
                      emptyOptionLabel="Select barcode"
                      noResultsMessage={
                        manualProductId ? "No stock barcodes found." : "Select product first."
                      }
                      onValueChange={(nextValue) => {
                        if (nextValue.startsWith("manual:")) {
                          return
                        }

                        setManualStockUnitId(nextValue)
                      }}
                      options={manualTransferStockUnitOptions}
                      placeholder={manualProductId ? "Select stock barcode" : "Select product first"}
                      searchPlaceholder="Search barcode"
                      triggerClassName="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-none focus-visible:border-ring focus-visible:ring-0"
                      value={manualStockUnitId}
                    />
                  </Field>
                  <Button
                    type="button"
                    className="h-9 min-w-32"
                    onClick={handleAddManualTransferStockUnit}
                  >
                    Add selected
                  </Button>
                </div>
              </CardContent>
            </Card>
            <VoucherInlineEditableTable
              title="Transfer items"
              className="bg-white"
              containerClassName="bg-white"
              fitToContainer
              rows={items}
              getRowKey={(line) => line.id}
              columns={[
                {
                  id: "product",
                  header: "Product",
                  width: "28%",
                  renderCell: (line) => (
                    <div>
                      <p className="font-medium text-foreground">{line.productName}</p>
                      <p className="text-xs text-muted-foreground">{line.productCode}</p>
                    </div>
                  ),
                },
                {
                  id: "barcode",
                  header: "Barcode",
                  width: "16%",
                  renderCell: (line) => (
                    <span className="font-mono text-xs text-foreground">{line.barcodeValue}</span>
                  ),
                },
                {
                  id: "batch",
                  header: "Batch",
                  width: "10%",
                  renderCell: (line) => line.batchCode,
                },
                {
                  id: "serial",
                  header: "Serial",
                  width: "12%",
                  renderCell: (line) => line.serialNumber,
                },
                {
                  id: "warehouse",
                  header: "Warehouse",
                  width: "12%",
                  renderCell: (line) => formatWarehouseDisplayName(line.warehouseName),
                },
                {
                  id: "quantity",
                  header: "Qty",
                  width: "8%",
                  headerClassName: "text-center",
                  cellClassName: "text-center",
                  renderCell: (line) => formatQuantity(line.quantity),
                },
                {
                  id: "status",
                  header: "Status",
                  width: "8%",
                  renderCell: (line) =>
                    renderLightStockStatusBadge(line.stockUnitStatus, `${line.id}:status`),
                },
                {
                  id: "actions",
                  header: "Act",
                  width: "6%",
                  headerClassName: "text-center",
                  cellClassName: "px-2 text-center",
                  renderCell: (line) => (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTransferItem(line.id)}
                      aria-label={`Remove ${line.barcodeValue}`}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  ),
                },
              ]}
              summaryRow={
                <TableRow className="border-border/60 bg-muted/20 hover:bg-muted/20">
                  <TableCell className="border-r border-border/50 px-1 py-0.5" />
                  <TableCell
                    colSpan={5}
                    className="border-r border-border/50 px-1.5 py-0.5 text-right font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                  >
                    Total
                  </TableCell>
                  <TableCell className="border-r border-border/50 px-0 py-0.5 text-center text-sm font-semibold text-foreground">
                    <div className="flex h-6 items-center justify-center">
                      {formatQuantity(totalQuantity)}
                    </div>
                  </TableCell>
                  <TableCell className="px-0 py-0.5">
                    <div className="h-6" />
                  </TableCell>
                </TableRow>
              }
            />
            <Field label="Transfer remarks">
              <Textarea
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                rows={4}
              />
            </Field>
            {message ? <p className="text-sm text-destructive">{message}</p> : null}
            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                <ArrowRightLeftIcon className="mr-2 size-4" />
                {saving ? "Saving..." : "Save transfer"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void navigate("/dashboard/apps/stock/transfers")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export function ReservationsSection() {
  const list = useJsonResource<ReservationListResponse>("/internal/v1/stock/reservations")
  const [message, setMessage] = useState<string | null>(null)
  const [form, setForm] = useState(createReservationForm)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const response = await requestJson<{ item: StockReservation }>("/internal/v1/stock/reservations", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        variantId: null,
        warehouseId: form.warehouseId || null,
        locationId: form.locationId || null,
        quantity: Number(form.quantity),
        consumedQuantity: Number(form.consumedQuantity),
        expiresAt: form.expiresAt || null,
        releasedAt: form.releasedAt || null,
        notes: form.notes || null,
      }),
    })
    setMessage(`Reservation ${response.item.id} saved as ${response.item.status}.`)
  }

  return (
    <div className="space-y-4">
      <SectionIntro title="Reservations" description="Reserve inventory for pre-sales, allocation, release, and partial or final consumption." />
      <Card className="border-border/70 shadow-sm">
        <CardContent className="p-5">
          <form className="grid gap-3 md:grid-cols-3" onSubmit={handleSubmit}>
            <Input placeholder="Reservation id" value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} />
            <Input placeholder="Product id" value={form.productId} onChange={(event) => setForm({ ...form, productId: event.target.value })} required />
            <Input placeholder="Warehouse id" value={form.warehouseId} onChange={(event) => setForm({ ...form, warehouseId: event.target.value })} />
            <Input placeholder="Reference id" value={form.referenceId} onChange={(event) => setForm({ ...form, referenceId: event.target.value })} required />
            <Input placeholder="Quantity" type="number" min="0" step="0.01" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} required />
            <select className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              <option value="active">Active</option>
              <option value="allocated">Allocated</option>
              <option value="partially-consumed">Partially consumed</option>
              <option value="consumed">Consumed</option>
              <option value="released">Released</option>
            </select>
            <Button type="submit">Save reservation</Button>
          </form>
        </CardContent>
      </Card>
      {message ? <StateCard message={message} /> : null}
      {list.data ? <DataTable headers={["Reservation", "Product", "Warehouse", "Status", "Qty", "Consumed"]} rows={list.data.items.map((item) => [item.id, item.productId, item.warehouseId ?? "-", renderLightStockStatusBadge(item.status, item.id), String(item.quantity), String(item.consumedQuantity)])} /> : null}
    </div>
  )
}

function escapeReportHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function getLocalDateKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function printStockReport(
  title: string,
  subtitle: string,
  headers: string[],
  rows: string[][]
) {
  const printableWindow = window.open("", "_blank", "noopener,noreferrer,width=1200,height=900")
  if (!printableWindow) {
    return
  }

  const tableHead = headers
    .map((header) => `<th>${escapeReportHtml(header)}</th>`)
    .join("")
  const tableRows = rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${escapeReportHtml(cell)}</td>`).join("")}</tr>`
    )
    .join("")

  printableWindow.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeReportHtml(title)}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
      h1 { margin: 0 0 8px; font-size: 24px; }
      p { margin: 0 0 20px; color: #4b5563; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; vertical-align: top; }
      th { background: #f3f4f6; }
    </style>
  </head>
  <body>
    <h1>${escapeReportHtml(title)}</h1>
    <p>${escapeReportHtml(subtitle)}</p>
    <table>
      <thead><tr>${tableHead}</tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  </body>
</html>`)
  printableWindow.document.close()
  printableWindow.focus()
  printableWindow.print()
}

export function StockReportsSection() {
  const receiptLookup = useJsonResource<PurchaseReceiptListResponse>(
    "/internal/v1/stock/purchase-receipts"
  )
  const productLookup = useJsonResource<ProductListResponse>("/internal/v1/core/products")
  const stockUnits = useJsonResource<StockUnitListResponse>("/internal/v1/stock/stock-units")
  const acceptanceRecords = useJsonResource<StockAcceptanceVerificationListResponse>(
    "/internal/v1/stock/stock-acceptance-verifications"
  )
  const [purchaseReceiptId, setPurchaseReceiptId] = useState("")
  useGlobalLoading(
    receiptLookup.isLoading ||
      productLookup.isLoading ||
      stockUnits.isLoading ||
      acceptanceRecords.isLoading
  )

  useEffect(() => {
    if (purchaseReceiptId || !receiptLookup.data?.items.length) {
      return
    }

    setPurchaseReceiptId(receiptLookup.data.items[0]?.id ?? "")
  }, [purchaseReceiptId, receiptLookup.data])

  if (
    receiptLookup.isLoading ||
    productLookup.isLoading ||
    stockUnits.isLoading ||
    acceptanceRecords.isLoading
  ) {
    return null
  }

  if (
    receiptLookup.error ||
    productLookup.error ||
    stockUnits.error ||
    acceptanceRecords.error ||
    !receiptLookup.data ||
    !productLookup.data ||
    !stockUnits.data ||
    !acceptanceRecords.data
  ) {
    return (
      <StateCard
        message={
          receiptLookup.error ??
          productLookup.error ??
          stockUnits.error ??
          acceptanceRecords.error ??
          "Stock reports are unavailable."
        }
      />
    )
  }

  const productById = new Map(
    productLookup.data.items.map((product) => [product.id, product] as const)
  )
  const receiptOptions = receiptLookup.data.items.map((receipt) => ({
    value: receipt.id,
    label: `${receipt.entryNumber} (${receipt.postingDate})`,
  }))
  const selectedReceipt =
    receiptLookup.data.items.find((receipt) => receipt.id === purchaseReceiptId) ?? null
  const selectedReceiptUnits = stockUnits.data.items.filter(
    (item) => item.purchaseReceiptId === purchaseReceiptId
  )
  const selectedReceiptAcceptances = acceptanceRecords.data.items.filter(
    (item) => item.purchaseReceiptId === purchaseReceiptId && item.status === "verified"
  )
  const selectedReceiptRejections = acceptanceRecords.data.items.filter(
    (item) => item.purchaseReceiptId === purchaseReceiptId && item.status === "rejected"
  )
  const challanRows =
    selectedReceipt?.lines.map((line, index) => {
      const product = productById.get(line.productId)
      const receivedQuantity = selectedReceiptUnits
        .filter((item) => item.productId === line.productId)
        .reduce((sum, item) => sum + item.quantity, 0)
      const verifiedQuantity = selectedReceiptAcceptances
        .filter((item) => item.productId === line.productId)
        .reduce((sum, item) => sum + item.quantityAccepted, 0)
      const rejectedQuantity = selectedReceiptRejections
        .filter((item) => item.productId === line.productId)
        .reduce((sum, item) => sum + item.quantityRejected, 0)
      const pendingQuantity = Math.max(receivedQuantity - verifiedQuantity - rejectedQuantity, 0)

      return {
        slNo: String(index + 1),
        productName: product?.name ?? line.productId,
        productCode: product?.code ?? "-",
        orderedQuantity: formatQuantity(Number(line.quantity || 0)),
        receivedQuantity: formatQuantity(receivedQuantity),
        pendingQuantity: formatQuantity(pendingQuantity),
        status: pendingQuantity > 0 ? "Received / not verified" : "Verified",
      }
    }) ?? []
  const stockEntryVerificationRows =
    selectedReceipt?.lines.map((line, index) => {
      const product = productById.get(line.productId)
      const verifiedQuantity = selectedReceiptAcceptances
        .filter((item) => item.productId === line.productId)
        .reduce((sum, item) => sum + item.quantityAccepted, 0)
      const receivedQuantity = selectedReceiptUnits
        .filter((item) => item.productId === line.productId)
        .reduce((sum, item) => sum + item.quantity, 0)

      return {
        slNo: String(index + 1),
        productName: product?.name ?? line.productId,
        productCode: product?.code ?? "-",
        receivedQuantity: formatQuantity(receivedQuantity),
        verifiedQuantity: formatQuantity(verifiedQuantity),
        status:
          verifiedQuantity > 0 && verifiedQuantity >= receivedQuantity
            ? "Qty verified"
            : verifiedQuantity > 0
              ? "Partially verified"
              : "Pending verification",
      }
    }) ?? []
  const ledgerReportMap = new Map<
    string,
    {
      productName: string
      productCode: string
      receivedQuantity: number
      acceptedQuantity: number
      liveBalanceQuantity: number
    }
  >()

  for (const item of stockUnits.data.items) {
    const current = ledgerReportMap.get(item.productId)
    const acceptedQuantity =
      item.status === "available" || item.status === "allocated" || item.status === "sold"
        ? item.quantity
        : 0
    const liveBalanceQuantity = item.status === "available" ? item.quantity : 0

    if (current) {
      current.receivedQuantity += item.quantity
      current.acceptedQuantity += acceptedQuantity
      current.liveBalanceQuantity += liveBalanceQuantity
      continue
    }

    ledgerReportMap.set(item.productId, {
      productName: item.productName,
      productCode: item.productCode,
      receivedQuantity: item.quantity,
      acceptedQuantity,
      liveBalanceQuantity,
    })
  }

  const ledgerReportRows = Array.from(ledgerReportMap.values()).sort((left, right) =>
    left.productName.localeCompare(right.productName)
  )
  const todayKey = getLocalDateKey(new Date())
  const todayFormatter = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  })
  const todayVerificationRows = acceptanceRecords.data.items
    .filter(
      (item) =>
        item.status === "verified" &&
        getLocalDateKey(item.verifiedAt ?? item.createdAt) === todayKey
    )
    .sort((left, right) =>
      (right.verifiedAt ?? right.createdAt).localeCompare(left.verifiedAt ?? left.createdAt)
    )

  return (
    <div className="space-y-4">
      <SectionIntro
        title="Stock Reports"
        description="Print receipt challan, verification confirmation, consolidated ledger, and today verification activity reports."
      />
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Report Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Purchase receipt">
              <SearchableLookupField
                emptyOptionLabel="Select purchase receipt"
                noResultsMessage="No purchase receipts found."
                onValueChange={(nextValue) => {
                  if (!nextValue) {
                    return
                  }

                  setPurchaseReceiptId(nextValue)
                }}
                options={receiptOptions}
                placeholder="Select purchase receipt"
                searchPlaceholder="Search purchase receipt"
                triggerClassName="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-none focus-visible:border-ring focus-visible:ring-0"
                value={purchaseReceiptId}
              />
            </Field>
            <Field label="Selected receipt status">
              <div className="flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground">
                {selectedReceipt ? `${selectedReceipt.entryNumber} / ${selectedReceipt.postingDate}` : "-"}
              </div>
            </Field>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Purchase Receipt Challan</CardTitle>
            <CardDescription>
              Confirm goods received against the selected purchase receipt before verification completes.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={!selectedReceipt || challanRows.length === 0}
            onClick={() =>
              printStockReport(
                "Purchase Receipt Challan",
                `${selectedReceipt?.entryNumber ?? "-"} · Received goods pending verification`,
                ["Sl No", "Product", "Code", "Ordered", "Received", "Pending Verify", "Status"],
                challanRows.map((item) => [
                  item.slNo,
                  item.productName,
                  item.productCode,
                  item.orderedQuantity,
                  item.receivedQuantity,
                  item.pendingQuantity,
                  item.status,
                ])
              )
            }
          >
            Print challan
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            headers={["Sl No", "Product", "Code", "Ordered", "Received", "Pending Verify", "Status"]}
            rows={
              challanRows.length > 0
                ? challanRows.map((item) => [
                    item.slNo,
                    item.productName,
                    item.productCode,
                    item.orderedQuantity,
                    item.receivedQuantity,
                    item.pendingQuantity,
                    renderLightStockStatusBadge(item.status, `${item.slNo}:challan-status`),
                  ])
                : [["-", "Select purchase receipt", "-", "-", "-", "-", "-"]]
            }
          />
        </CardContent>
      </Card>
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Stock Entry Verification Report</CardTitle>
            <CardDescription>
              Confirm verified quantity after stock entry acceptance for the selected receipt.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={!selectedReceipt || stockEntryVerificationRows.length === 0}
            onClick={() =>
              printStockReport(
                "Stock Entry Verification Report",
                `${selectedReceipt?.entryNumber ?? "-"} · Verified quantity confirmation`,
                ["Sl No", "Product", "Code", "Received", "Verified", "Status"],
                stockEntryVerificationRows.map((item) => [
                  item.slNo,
                  item.productName,
                  item.productCode,
                  item.receivedQuantity,
                  item.verifiedQuantity,
                  item.status,
                ])
              )
            }
          >
            Print verification
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            headers={["Sl No", "Product", "Code", "Received", "Verified", "Status"]}
            rows={
              stockEntryVerificationRows.length > 0
                ? stockEntryVerificationRows.map((item) => [
                    item.slNo,
                    item.productName,
                    item.productCode,
                    item.receivedQuantity,
                    item.verifiedQuantity,
                    renderLightStockStatusBadge(item.status, `${item.slNo}:verify-status`),
                  ])
                : [["-", "Select purchase receipt", "-", "-", "-", "-"]]
            }
          />
        </CardContent>
      </Card>
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Stock Ledger Consolidated Report</CardTitle>
            <CardDescription>
              Consolidated product-wise stock received, accepted, and live stock balance.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={ledgerReportRows.length === 0}
            onClick={() =>
              printStockReport(
                "Stock Ledger Consolidated Report",
                "Product name, received, stock accepted, and live stock balance.",
                ["Product", "Code", "Received", "Stock Accepted", "Live Stock Balance"],
                ledgerReportRows.map((item) => [
                  item.productName,
                  item.productCode,
                  formatQuantity(item.receivedQuantity),
                  formatQuantity(item.acceptedQuantity),
                  formatQuantity(item.liveBalanceQuantity),
                ])
              )
            }
          >
            Print ledger
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            headers={["Product", "Code", "Received", "Stock Accepted", "Live Stock Balance"]}
            rows={ledgerReportRows.map((item) => [
              item.productName,
              item.productCode,
              formatQuantity(item.receivedQuantity),
              formatQuantity(item.acceptedQuantity),
              formatQuantity(item.liveBalanceQuantity),
            ])}
          />
        </CardContent>
      </Card>
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Today Verified Duty Report</CardTitle>
            <CardDescription>
              Today&apos;s saved verification activity from the current stock verification records.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={todayVerificationRows.length === 0}
            onClick={() =>
              printStockReport(
                "Today Verified Duty Report",
                `Verification activity for ${todayFormatter.format(new Date())}`,
                ["Verified At", "Receipt", "Product", "Warehouse", "Barcode", "Qty"],
                todayVerificationRows.map((item) => [
                  todayFormatter.format(new Date(item.verifiedAt ?? item.createdAt)),
                  item.purchaseReceiptId,
                  item.productName,
                  item.warehouseName,
                  item.scannedBarcodeValue,
                  formatQuantity(item.quantityAccepted),
                ])
              )
            }
          >
            Print today report
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            headers={["Verified At", "Receipt", "Product", "Warehouse", "Barcode", "Qty"]}
            rows={
              todayVerificationRows.length > 0
                ? todayVerificationRows.map((item) => [
                    todayFormatter.format(new Date(item.verifiedAt ?? item.createdAt)),
                    item.purchaseReceiptId,
                    item.productName,
                    item.warehouseName,
                    item.scannedBarcodeValue,
                    formatQuantity(item.quantityAccepted),
                  ])
                : [["-", "-", "No verified records for today", "-", "-", "-"]]
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}

export function VerificationSection() {
  const productLookup = useJsonResource<ProductListResponse>("/internal/v1/core/products")
  const stockUnits = useJsonResource<StockUnitListResponse>("/internal/v1/stock/stock-units")
  const [productId, setProductId] = useState("")
  const [barcodeInputs, setBarcodeInputs] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [randomScanInput, setRandomScanInput] = useState("")
  const [randomScanResult, setRandomScanResult] = useState<{
    status: "pending" | "confirmed" | "mismatch"
    message: string
  }>({
    status: "pending",
    message: "Scan any live barcode to identify the product and confirm availability.",
  })
  const [savedBatches, setSavedBatches] = useState<
    Array<{
      id: string
      productId: string
      productName: string
      productCode: string
      verifiedCount: number
      savedAt: string
    }>
  >([])
  const [savedUnitIds, setSavedUnitIds] = useState<string[]>([])
  const barcodeInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const randomScanInputRef = useRef<HTMLInputElement | null>(null)

  useGlobalLoading(productLookup.isLoading || stockUnits.isLoading)
  if (productLookup.isLoading || stockUnits.isLoading) return null

  if (productLookup.error || stockUnits.error || !productLookup.data || !stockUnits.data) {
    return (
      <StateCard
        message={
          productLookup.error ??
          stockUnits.error ??
          "Live stock verification is unavailable."
        }
      />
    )
  }

  const normalizeScannedBarcode = (value: string) => value.trim().toUpperCase()
  const savedUnitIdSet = new Set(savedUnitIds)
  const liveUnits = stockUnits.data.items.filter(
    (item) => item.status === "available" && !savedUnitIdSet.has(item.id)
  )
  const liveProductIds = new Set(liveUnits.map((item) => item.productId))
  const productById = new Map(
    productLookup.data.items.map((product) => [product.id, product] as const)
  )
  const liveProductMap = new Map<
    string,
    {
      productId: string
      productName: string
      productCode: string
      liveStockCount: number
      verifiedCount: number
    }
  >()

  for (const stockUnit of liveUnits) {
    const resolvedProduct = productById.get(stockUnit.productId) ?? null
    const current = liveProductMap.get(stockUnit.productId)
    const verificationInput = barcodeInputs[stockUnit.id] ?? ""
    const isVerified =
      normalizeScannedBarcode(verificationInput) === normalizeScannedBarcode(stockUnit.barcodeValue)

    if (current) {
      current.liveStockCount += 1
      if (isVerified) {
        current.verifiedCount += 1
      }
      continue
    }

    liveProductMap.set(stockUnit.productId, {
      productId: stockUnit.productId,
      productName: resolvedProduct?.name ?? stockUnit.productName,
      productCode: resolvedProduct?.code ?? stockUnit.productCode,
      liveStockCount: 1,
      verifiedCount: isVerified ? 1 : 0,
    })
  }

  const liveProducts = Array.from(liveProductMap.values()).sort((left, right) =>
    left.productName.localeCompare(right.productName)
  )
  const productOptions = productLookup.data.items
    .filter((product) => product.isActive && liveProductIds.has(product.id))
    .map((product) => ({
      value: product.id,
      label: `${product.name} (${product.code})`,
    }))
  const selectedProduct = productById.get(productId) ?? null
  const liveProductUnits = productId
    ? liveUnits.filter((item) => item.productId === productId)
    : []
  const liveStockCount = liveProductUnits.length
  const verifiedCount = liveProductUnits.filter((stockUnit) => {
    const inputValue = barcodeInputs[stockUnit.id]
    return normalizeScannedBarcode(inputValue ?? "") === normalizeScannedBarcode(stockUnit.barcodeValue)
  }).length

  function handleBarcodeInputChange(stockUnitId: string, value: string) {
    setBarcodeInputs((current) => ({
      ...current,
      [stockUnitId]: value,
    }))
    setMessage(null)
  }

  function getVerificationStatus(stockUnitId: string, expectedBarcodeValue: string) {
    const inputValue = barcodeInputs[stockUnitId]

    if (!inputValue?.trim()) {
      return "pending"
    }

    return normalizeScannedBarcode(inputValue) === normalizeScannedBarcode(expectedBarcodeValue)
      ? "verified"
      : "mismatch"
  }

  function focusNextBarcodeInput(currentStockUnitId: string) {
    const currentIndex = liveProductUnits.findIndex((stockUnit) => stockUnit.id === currentStockUnitId)

    if (currentIndex === -1) {
      return
    }

    const nextUnit = liveProductUnits.slice(currentIndex + 1).find((stockUnit) => {
      const inputValue = barcodeInputs[stockUnit.id]
      return normalizeScannedBarcode(inputValue ?? "") !== normalizeScannedBarcode(stockUnit.barcodeValue)
    })

    const nextFocusableUnit = nextUnit ?? liveProductUnits[currentIndex + 1] ?? null

    if (!nextFocusableUnit) {
      return
    }

    barcodeInputRefs.current[nextFocusableUnit.id]?.focus()
    barcodeInputRefs.current[nextFocusableUnit.id]?.select()
  }

  function handleBarcodeInputKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
    stockUnitId: string
  ) {
    if (event.key !== "Enter" && event.key !== "Tab") {
      return
    }

    event.preventDefault()
    focusNextBarcodeInput(stockUnitId)
  }

  function focusInputElement(input: HTMLInputElement | null) {
    if (!input) {
      return
    }

    input.focus()
    input.select()
  }

  function focusRandomScanInput() {
    focusInputElement(randomScanInputRef.current)
  }

  function handleRandomScanSubmit() {
    const normalizedInput = normalizeScannedBarcode(randomScanInput)

    if (!normalizedInput) {
      setRandomScanResult({
        status: "pending",
        message: "Scan any live barcode to identify the product and confirm availability.",
      })
      window.setTimeout(() => {
        focusRandomScanInput()
      }, 0)
      return
    }

    const matchedUnit = liveUnits.find(
      (stockUnit) => normalizeScannedBarcode(stockUnit.barcodeValue) === normalizedInput
    )

    if (!matchedUnit) {
      setRandomScanResult({
        status: "mismatch",
        message: "Scanned barcode is not available in current live stock.",
      })
      window.setTimeout(() => {
        focusRandomScanInput()
      }, 0)
      return
    }

    const resolvedProduct = productById.get(matchedUnit.productId)

    setProductId(matchedUnit.productId)
    setBarcodeInputs((current) => ({
      ...current,
      [matchedUnit.id]: randomScanInput,
    }))
    setRandomScanInput("")
    setRandomScanResult({
      status: "confirmed",
      message: `${resolvedProduct?.name ?? matchedUnit.productName} is confirmed in live stock.`,
    })
    setMessage(null)

    window.setTimeout(() => {
      focusRandomScanInput()
    }, 0)
  }

  function handleRandomScanKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" && event.key !== "Tab") {
      return
    }

    event.preventDefault()
    handleRandomScanSubmit()
  }

  function handleSaveVerificationBatch() {
    if (!productId.trim()) {
      setMessage("Select a live stock product before saving the verification batch.")
      return
    }

    const verifiedUnits = liveProductUnits.filter((stockUnit) => {
      const scannedValue = barcodeInputs[stockUnit.id] ?? ""
      return normalizeScannedBarcode(scannedValue) === normalizeScannedBarcode(stockUnit.barcodeValue)
    })

    if (verifiedUnits.length === 0) {
      setMessage("Scan at least one verified live barcode before saving the batch.")
      return
    }

    const savedAt = new Date().toISOString()

    setSavedBatches((current) => [
      {
        id: `live-verification-batch:${savedAt}:${productId}`,
        productId,
        productName: selectedProduct?.name ?? productId,
        productCode: selectedProduct?.code ?? "",
        verifiedCount: verifiedUnits.length,
        savedAt,
      },
      ...current,
    ])
    setSavedUnitIds((current) => [...current, ...verifiedUnits.map((stockUnit) => stockUnit.id)])
    setBarcodeInputs((current) => {
      const nextInputs = { ...current }
      for (const stockUnit of verifiedUnits) {
        delete nextInputs[stockUnit.id]
      }
      return nextInputs
    })
    setRandomScanInput("")
    setRandomScanResult({
      status: "pending",
      message: "Scan any live barcode to identify the product and confirm availability.",
    })
    setMessage(
      `Saved verification batch for ${verifiedUnits.length} live unit${verifiedUnits.length === 1 ? "" : "s"} of ${selectedProduct?.name ?? productId}.`
    )
  }

  function handleConfirmVerification() {
    if (!productId.trim()) {
      setMessage("Select a live stock product before confirming periodic verification.")
      return
    }

    if (liveProductUnits.length === 0) {
      setMessage("No live stock units are available for this product.")
      return
    }

    if (verifiedCount !== liveProductUnits.length) {
      setMessage("Scan and verify every live stock barcode before confirming physical stock presence.")
      return
    }

    setMessage(
      `Physical stock presence confirmed for ${liveProductUnits.length} live unit${liveProductUnits.length === 1 ? "" : "s"} of ${selectedProduct?.name ?? productId}.`
    )
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Live Stock Products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-border/70">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/70 bg-muted/20 text-left">
                  <th className="px-4 py-3 font-medium text-foreground">Sl No</th>
                  <th className="px-4 py-3 font-medium text-foreground">Product</th>
                  <th className="px-4 py-3 font-medium text-foreground">Live stock count</th>
                  <th className="px-4 py-3 font-medium text-foreground">Verified</th>
                  <th className="px-4 py-3 font-medium text-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {liveProducts.length > 0 ? (
                  liveProducts.map((liveProduct, index) => {
                    const isSelected = liveProduct.productId === productId

                    return (
                      <tr key={liveProduct.productId}>
                        <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">{liveProduct.productName}</p>
                            <p className="text-xs text-muted-foreground">{liveProduct.productCode}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-foreground">
                            {liveProduct.liveStockCount}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-muted-foreground">
                            {liveProduct.verifiedCount} / {liveProduct.liveStockCount}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setProductId(liveProduct.productId)
                              setMessage(null)
                            }}
                          >
                            {isSelected ? "Selected" : "Verify"}
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                      No live stock is available for periodic verification.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Periodic Verification</CardTitle>
          <CardDescription>
            Verify physically available live stock by barcode before stock audit confirmation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Live stock product">
              <SearchableLookupField
                emptyOptionLabel="Select product"
                noResultsMessage="No live stock products found."
                onValueChange={(nextValue) => {
                  if (!nextValue) {
                    return
                  }

                  setProductId(nextValue)
                  setMessage(null)
                }}
                options={productOptions}
                placeholder="Select product"
                searchPlaceholder="Search product"
                triggerClassName="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-none focus-visible:border-ring focus-visible:ring-0"
                value={productId}
              />
            </Field>
            <Field label="Live stock count">
              <div className="flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground">
                {liveStockCount}
              </div>
            </Field>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Live Stock Audit</CardTitle>
          <CardDescription>
            Scan each live barcode and confirm that the live stock is physically present.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-end">
            <Field label="Status" className="md:w-auto">
              <div className="flex h-9 items-center">
                <Badge
                  className={`rounded-full px-3 py-1 text-xs font-medium ${getLightStockStatusBadgeClassName(randomScanResult.status)}`}
                  variant="outline"
                >
                  {randomScanResult.status === "confirmed"
                    ? "Confirmed"
                    : randomScanResult.status === "mismatch"
                      ? "Mismatch"
                      : "Ready"}
                </Badge>
              </div>
            </Field>
            <Field label="Random live barcode scan" className="md:w-[48rem]">
              <Input
                className="h-11 text-2xl"
                placeholder="Scan any live barcode"
                ref={randomScanInputRef}
                value={randomScanInput}
                onChange={(event) => {
                  setRandomScanInput(event.target.value)
                  setRandomScanResult({
                    status: "pending",
                    message: "Ready",
                  })
                }}
                onKeyDown={handleRandomScanKeyDown}
              />
            </Field>
          </div>
          <div className="rounded-xl border border-border/70">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/70 bg-muted/20 text-left">
                  <th className="px-4 py-3 font-medium text-foreground">Sl No</th>
                  <th className="px-4 py-3 font-medium text-foreground">Product</th>
                  <th className="px-4 py-3 font-medium text-foreground">Barcode</th>
                  <th className="px-4 py-3 font-medium text-foreground">Scan barcode</th>
                  <th className="px-4 py-3 font-medium text-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {liveProductUnits.length > 0 ? (
                  liveProductUnits.map((stockUnit, index) => {
                    const verificationStatus = getVerificationStatus(stockUnit.id, stockUnit.barcodeValue)
                    const resolvedProduct = productById.get(stockUnit.productId)

                    return (
                      <tr key={stockUnit.id}>
                        <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">
                              {resolvedProduct?.name ?? stockUnit.productName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {resolvedProduct?.code ?? stockUnit.productCode}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-foreground">{stockUnit.barcodeValue}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            ref={(element) => {
                              barcodeInputRefs.current[stockUnit.id] = element
                            }}
                            placeholder="Scan barcode"
                            value={barcodeInputs[stockUnit.id] ?? ""}
                            onChange={(event) =>
                              handleBarcodeInputChange(stockUnit.id, event.target.value)
                            }
                            onKeyDown={(event) =>
                              handleBarcodeInputKeyDown(event, stockUnit.id)
                            }
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              verificationStatus === "verified"
                                ? "inline-flex h-8 items-center rounded-full bg-emerald-100 px-3 text-xs font-medium text-emerald-700"
                                : verificationStatus === "mismatch"
                                  ? "inline-flex h-8 items-center rounded-full bg-rose-100 px-3 text-xs font-medium text-rose-700"
                                  : "inline-flex h-8 items-center rounded-full bg-muted px-3 text-xs font-medium text-muted-foreground"
                            }
                          >
                            {verificationStatus}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                      Select a live stock product to start barcode-based periodic verification.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Verified {verifiedCount} of {liveProductUnits.length} live stock unit
              {liveProductUnits.length === 1 ? "" : "s"}.
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={handleSaveVerificationBatch}>
                Save verification batch
              </Button>
              <Button type="button" onClick={handleConfirmVerification}>
                Confirm physical stock
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Saved Verification Batches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border/70">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/70 bg-muted/20 text-left">
                  <th className="px-4 py-3 font-medium text-foreground">Sl No</th>
                  <th className="px-4 py-3 font-medium text-foreground">Product</th>
                  <th className="px-4 py-3 font-medium text-foreground">Verified qty</th>
                  <th className="px-4 py-3 font-medium text-foreground">Saved at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {savedBatches.length > 0 ? (
                  savedBatches.map((batch, index) => (
                    <tr key={batch.id}>
                      <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{batch.productName}</p>
                          <p className="text-xs text-muted-foreground">{batch.productCode}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-foreground">{batch.verifiedCount}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Intl.DateTimeFormat("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(batch.savedAt))}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                      No verification batches saved in this session.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      {message ? <StateCard message={message} /> : null}
    </div>
  )
}
