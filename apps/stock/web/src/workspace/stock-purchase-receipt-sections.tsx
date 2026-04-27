import { useEffect, useMemo, useState } from "react"
import { EyeIcon, PrinterIcon, SparklesIcon, Trash2Icon } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import type {
  BillingPurchaseReceiptSerializationMode,
  BillingPurchaseReceipt,
  BillingPurchaseReceiptBarcodeGenerationResponse,
  BillingPurchaseReceiptBarcodeRollbackResponse,
} from "../../../shared/index.ts"
import type {
  ContactListResponse,
  ContactResponse,
  ContactSummary,
  CommonModuleListResponse,
  ProductListResponse,
} from "@core/shared"
import { requestJson, useJsonResource } from "./stock-workspace-api"
import { MasterList } from "@/components/blocks/master-list"
import { RecordActionMenu } from "@/components/blocks/record-action-menu"
import { VoucherInlineEditableTable } from "@/components/blocks/voucher-inline-editable-table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { showAppToast, showRecordToast } from "@/components/ui/app-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { TableCell, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"
import { SearchableLookupField } from "@/features/forms/searchable-lookup-field"
import {
  buildSupplierContactOptions,
  buildSupplierContactPayload,
  buildWarehouseOptions,
  createPurchaseReceiptProductPatch,
  createSupplierContactDraft,
  DataTable,
  Field,
  formatMoney,
  formatOptionalDate,
  formatQuantity,
  getDefaultWarehouseOption,
  getNextRegisterEntryNumber,
  getProductLookupOptions,
  getPurchaseReceiptLineAmount,
  getPurchaseReceiptLineProductOptions,
  getSupplierDisplayName,
  getWarehouseDisplayName,
  getWarehouseNameFromOptionLabel,
  LoadingCard,
  MetricCards,
  printStockUnitBarcodes,
  resolveSelectedSupplierContactValue,
  resolveSupplierContactId,
  resolveWarehouseId,
  SectionIntro,
  StateCard,
  toPurchaseReceiptView,
  voucherInlineInputClassName,
} from "./stock-workspace-helpers"
import type {
  GoodsInwardListResponse,
  LookupsResponse,
  MovementListResponse,
  PurchaseReceiptLineForm,
  PurchaseReceiptListResponse,
  PurchaseReceiptResponse,
  PurchaseReceiptSerializationLineForm,
  SupplierContactDraft,
  StockUnitListResponse,
  StockVerificationSummary,
} from "./stock-workspace-types"

function escapeReceiptPrintHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ")
}

function getPurchaseReceiptStatusBadgeClassName(status: BillingPurchaseReceipt["status"]) {
  if (status === "fully_received") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
  }

  if (status === "partially_received") {
    return "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50"
  }

  if (status === "open") {
    return "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-50"
  }

  if (status === "cancelled") {
    return "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-50"
  }

  return "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-50"
}

function renderPurchaseReceiptStatusBadge(status: BillingPurchaseReceipt["status"], key?: string) {
  return (
    <Badge
      key={key}
      variant="outline"
      className={`capitalize ${getPurchaseReceiptStatusBadgeClassName(status)}`}
    >
      {formatStatusLabel(status)}
    </Badge>
  )
}

function getStockUnitStatusBadgeClassName(status: string) {
  if (status === "available") {
    return "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50"
  }

  if (status === "received") {
    return "border-yellow-200 bg-yellow-50 text-yellow-800 hover:bg-yellow-50"
  }

  if (status === "sold") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
  }

  if (status === "allocated") {
    return "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-50"
  }

  if (status === "rejected") {
    return "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-50"
  }

  if (status === "damaged") {
    return "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-50"
  }

  return "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-50"
}

function renderStockUnitStatusBadge(status: string, key?: string) {
  return (
    <Badge
      key={key}
      variant="outline"
      className={`capitalize ${getStockUnitStatusBadgeClassName(status)}`}
    >
      {formatStatusLabel(status)}
    </Badge>
  )
}

function printPurchaseReceiptDocument({
  receipt,
  supplierName,
  warehouseName,
  productNameById,
}: {
  receipt: BillingPurchaseReceipt
  supplierName: string
  warehouseName: string
  productNameById?: Map<string, string>
}) {
  const lineRows = receipt.lines
    .map(
      (line, index) => `
        <tr>
          <td>${escapeReceiptPrintHtml(String(index + 1).padStart(2, "0"))}</td>
          <td>${escapeReceiptPrintHtml(productNameById?.get(line.productId) ?? line.productId)}</td>
          <td>${escapeReceiptPrintHtml(line.description ?? "-")}</td>
          <td>${escapeReceiptPrintHtml(formatQuantity(Number(line.quantity || 0)))}</td>
          <td>${escapeReceiptPrintHtml(formatMoney(Number(line.rate || 0)))}</td>
          <td>${escapeReceiptPrintHtml(formatMoney(Number(line.amount || 0)))}</td>
        </tr>
      `
    )
    .join("")
  const receiptHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeReceiptPrintHtml(receipt.entryNumber)}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
      .header { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
      .title { font-size: 26px; font-weight: 700; margin: 0 0 8px; }
      .meta { margin: 0; color: #4b5563; font-size: 13px; line-height: 1.6; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; vertical-align: top; }
      th { background: #f3f4f6; }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <h1 class="title">Purchase Receipt</h1>
        <p class="meta">Entry No: ${escapeReceiptPrintHtml(receipt.entryNumber)}</p>
        <p class="meta">Posting Date: ${escapeReceiptPrintHtml(receipt.postingDate)}</p>
      </div>
      <div>
        <p class="meta">Supplier: ${escapeReceiptPrintHtml(supplierName)}</p>
        <p class="meta">Warehouse: ${escapeReceiptPrintHtml(warehouseName)}</p>
        <p class="meta">Supplier Ref: ${escapeReceiptPrintHtml(receipt.supplierReferenceNumber ?? "-")}</p>
        <p class="meta">Supplier Ref Date: ${escapeReceiptPrintHtml(formatOptionalDate(receipt.supplierReferenceDate))}</p>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Sl No</th>
          <th>Product</th>
          <th>Description</th>
          <th>Qty</th>
          <th>Rate</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>${lineRows}</tbody>
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
    frameDocument.write(receiptHtml)
    frameDocument.close()

    frameWindow.setTimeout(() => {
      frameWindow.focus()
      frameWindow.print()
    }, 120)
  } catch (error) {
    showAppToast({
      variant: "error",
      title: "Receipt print failed.",
      description:
        error instanceof Error ? error.message : "Unable to prepare the purchase receipt for print.",
    })
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

export function OverviewSection() {
  const verifications = useJsonResource<StockVerificationSummary>("/internal/v1/stock/verifications")
  const movements = useJsonResource<MovementListResponse>("/internal/v1/stock/movements")

  if (verifications.isLoading || movements.isLoading) {
    return <LoadingCard message="Loading stock dashboard..." />
  }

  if (verifications.error) {
    return <StateCard message={verifications.error} />
  }

  if (!verifications.data) {
    return <StateCard message="Stock verification summary is unavailable." />
  }

  return (
    <div className="space-y-4">
      <SectionIntro
        title="Stock control tower"
        description="Use the stock app as the operational workspace for inward, serial and barcode identity, warehouse movement, reservations, transfer send and accept, reconciliation, and verification."
      />
      <MetricCards
        items={[
          { label: "Pending verification", value: String(verifications.data.pendingVerificationCount) },
          { label: "Posted inward", value: String(verifications.data.postedInwardCount) },
          { label: "Available units", value: String(verifications.data.availableUnitCount) },
          { label: "Allocated units", value: String(verifications.data.allocatedUnitCount), tone: "outline" },
          { label: "Sold units", value: String(verifications.data.soldUnitCount), tone: "outline" },
          { label: "Tracked movements", value: String(movements.data?.items.length ?? 0) },
        ]}
      />
    </div>
  )
}

export function PurchaseReceiptsSection() {
  const navigate = useNavigate()
  const [reloadKey, setReloadKey] = useState(0)
  const { data, error, isLoading } = useJsonResource<PurchaseReceiptListResponse>(
    "/internal/v1/stock/purchase-receipts",
    [reloadKey]
  )
  const contactLookup = useJsonResource<ContactListResponse>("/internal/v1/core/contacts")
  const warehouseLookup = useJsonResource<CommonModuleListResponse>(
    "/internal/v1/core/common-modules/items?module=warehouses"
  )
  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState<
    "all" | BillingPurchaseReceipt["status"]
  >("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [pendingDeleteItem, setPendingDeleteItem] = useState<BillingPurchaseReceipt | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  useGlobalLoading(isLoading || contactLookup.isLoading || warehouseLookup.isLoading)

  if (isLoading || contactLookup.isLoading || warehouseLookup.isLoading) {
    return null
  }

  if (error || !data) {
    return <StateCard message={error ?? "Purchase receipts are unavailable."} />
  }

  if (contactLookup.error || warehouseLookup.error) {
    return <StateCard message={contactLookup.error ?? warehouseLookup.error ?? "Purchase receipt lookups are unavailable."} />
  }

  const items = data.items.map(toPurchaseReceiptView)
  const supplierContacts = contactLookup.data?.items ?? []
  const warehouses = warehouseLookup.data?.items ?? []

  const filteredItems = items.filter((item) => {
    const supplierName = getSupplierDisplayName(supplierContacts, item.supplierId)
    const warehouseName = getWarehouseDisplayName(warehouses, item.warehouseId)
    const matchesSearch =
      searchValue.trim().length === 0 ||
      [
        item.entryNumber,
        supplierName,
        item.supplierReferenceNumber ?? "",
        item.supplierReferenceDate ?? "",
        warehouseName,
        item.postingDate,
        item.id,
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
      : [{ key: "status", label: "Status", value: statusFilter.replace(/_/g, " ") }]

  async function handleDeleteReceipt() {
    if (!pendingDeleteItem) {
      return
    }

    setIsDeleting(true)

    try {
      await requestJson<{ deleted: true; id: string }>(
        `/internal/v1/stock/purchase-receipt?id=${encodeURIComponent(pendingDeleteItem.id)}`,
        { method: "DELETE" }
      )

      showRecordToast({
        entity: "Purchase receipt",
        action: "deleted",
        recordName: pendingDeleteItem.entryNumber,
      })
      setPendingDeleteItem(null)
      setReloadKey((current) => current + 1)
    } catch (deleteError) {
      showAppToast({
        variant: "error",
        title: "Purchase receipt delete failed.",
        description:
          deleteError instanceof Error ? deleteError.message : "Failed to delete purchase receipt.",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <MasterList
      header={{
        pageTitle: "Purchase Receipts",
        pageDescription:
          "Capture incoming supplier receipts, verify received quantities, and prepare inventory posting from one receipt workflow.",
        technicalName: "page.stock.purchase-receipts",
        addLabel: "New Receipt",
          onAddClick: () => {
            void navigate("/dashboard/apps/stock/purchase-receipts/new")
          },
        }}
        search={{
          value: searchValue,
          onChange: (value) => {
            setSearchValue(value)
            setCurrentPage(1)
          },
          placeholder: "Search entry no, contact, supplier ref, or warehouse",
        }}
        filters={{
          options: [
            {
              key: "all",
              label: "All receipts",
              isActive: statusFilter === "all",
              onSelect: () => {
                setStatusFilter("all")
                setCurrentPage(1)
              },
            },
            ...(["draft", "open", "partially_received", "fully_received", "cancelled"] as const).map(
              (value) => ({
                key: value,
                label: value.replace(/_/g, " "),
                isActive: statusFilter === value,
                onSelect: () => {
                  setStatusFilter(value)
                  setCurrentPage(1)
                },
              })
            ),
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
          technicalName: "section.stock.purchase-receipts.filters",
        }}
        table={{
          technicalName: "section.stock.purchase-receipts.table",
          columns: [
            {
              id: "entryNumber",
              header: "Entry No",
              sortable: true,
              accessor: (item) => item.entryNumber,
              cell: (item) => (
                <button
                  type="button"
                  className="text-left"
                  onClick={() => {
                    void navigate(`/dashboard/apps/stock/purchase-receipts/${encodeURIComponent(item.id)}`)
                  }}
                >
                  <p className="font-medium text-foreground hover:underline hover:underline-offset-2">
                    {item.entryNumber}
                  </p>
                </button>
              ),
            },
            {
              id: "supplier",
              header: "Contact Name",
              sortable: true,
              accessor: (item) => getSupplierDisplayName(supplierContacts, item.supplierId),
              cell: (item) => getSupplierDisplayName(supplierContacts, item.supplierId),
            },
            {
              id: "supplierReference",
              header: "Supplier Ref / Date",
              sortable: true,
              accessor: (item) =>
                `${item.supplierReferenceNumber ?? ""} ${item.supplierReferenceDate ?? ""}`,
              cell: (item) => (
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>{item.supplierReferenceNumber ?? "-"}</p>
                  <p>{formatOptionalDate(item.supplierReferenceDate)}</p>
                </div>
              ),
            },
            {
              id: "totalQuantity",
              header: "Total Qty",
              sortable: true,
              accessor: (item) =>
                item.lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0),
              cell: (item) =>
                formatQuantity(item.lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0)),
            },
            {
              id: "warehouse",
              header: "Warehouse Name",
              sortable: true,
              accessor: (item) => getWarehouseDisplayName(warehouses, item.warehouseId),
              cell: (item) => getWarehouseDisplayName(warehouses, item.warehouseId),
            },
            {
              id: "status",
              header: "Status",
              sortable: true,
              accessor: (item) => item.status,
              cell: (item) => renderPurchaseReceiptStatusBadge(item.status),
            },
            {
              id: "actions",
              header: "",
              cell: (item) => (
                <RecordActionMenu
                  itemLabel={item.entryNumber}
                  editLabel="Edit receipt"
                  customItems={[
                    {
                      key: "view",
                      label: "View receipt",
                      icon: <EyeIcon className="size-4" />,
                      onSelect: () => {
                        void navigate(`/dashboard/apps/stock/purchase-receipts/${encodeURIComponent(item.id)}`)
                      },
                    },
                    {
                      key: "print",
                      label: "Print",
                      icon: <PrinterIcon className="size-4" />,
                      onSelect: () => {
                        printPurchaseReceiptDocument({
                          receipt: item,
                          supplierName: getSupplierDisplayName(supplierContacts, item.supplierId),
                          warehouseName: getWarehouseDisplayName(warehouses, item.warehouseId),
                        })
                      },
                    },
                  ]}
                  onEdit={() => {
                    void navigate(`/dashboard/apps/stock/purchase-receipts/${encodeURIComponent(item.id)}/edit`)
                  }}
                  onDelete={() => {
                    setPendingDeleteItem(item)
                  }}
                />
              ),
              className: "w-16 min-w-16 text-right",
              headerClassName: "w-16 min-w-16 text-right",
            },
          ],
          data: paginatedItems,
          emptyMessage: "No purchase receipts found.",
          rowKey: (item) => item.id,
        }}
        footer={{
          content: (
            <div className="flex flex-wrap items-center gap-4">
              <span>
                Total receipts: <span className="font-medium text-foreground">{totalRecords}</span>
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
      <AlertDialog
        open={pendingDeleteItem !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !isDeleting) {
            setPendingDeleteItem(null)
          }
        }}
      >
        <AlertDialogContent size="default">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Delete receipt?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteItem
                ? `This will permanently remove purchase receipt ${pendingDeleteItem.entryNumber}.`
                : "This will permanently remove the selected purchase receipt."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="border-destructive/15 bg-destructive/5">
            <AlertDialogCancel disabled={isDeleting}>Keep receipt</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={() => void handleDeleteReceipt()}
            >
              {isDeleting ? "Deleting..." : "Delete receipt"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function PurchaseReceiptShowSection({ receiptId }: { receiptId: string }) {
  const navigate = useNavigate()
  const [refreshNonce, setRefreshNonce] = useState(0)
  const detail = useJsonResource<PurchaseReceiptResponse>(
    `/internal/v1/stock/purchase-receipt?id=${encodeURIComponent(receiptId)}`,
    [receiptId, refreshNonce]
  )
  const lookups = useJsonResource<LookupsResponse>("/internal/v1/stock/lookups", [refreshNonce])
  const receiptList = useJsonResource<PurchaseReceiptListResponse>(
    "/internal/v1/stock/purchase-receipts",
    [refreshNonce]
  )
  const goodsInward = useJsonResource<GoodsInwardListResponse>(
    "/internal/v1/stock/goods-inward",
    [refreshNonce]
  )
  const contactLookup = useJsonResource<ContactListResponse>("/internal/v1/core/contacts", [refreshNonce])
  const productLookup = useJsonResource<ProductListResponse>("/internal/v1/core/products", [refreshNonce])
  const stockUnits = useJsonResource<StockUnitListResponse>("/internal/v1/stock/stock-units", [refreshNonce])
  const [postingDate, setPostingDate] = useState(new Date().toISOString().slice(0, 10))
  const [postingNote] = useState("")
  const [lineForms, setLineForms] = useState<PurchaseReceiptSerializationLineForm[]>([])
  const [pendingGenerateLine, setPendingGenerateLine] =
    useState<PurchaseReceiptSerializationLineForm | null>(null)
  const [pendingRollbackUnitIds, setPendingRollbackUnitIds] = useState<string[] | null>(null)
  const [generatingLineId, setGeneratingLineId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRollingBack, setIsRollingBack] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedPrintedUnitIds, setSelectedPrintedUnitIds] = useState<string[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  const [lastGeneratedBatch, setLastGeneratedBatch] =
    useState<BillingPurchaseReceiptBarcodeGenerationResponse | null>(null)
  useGlobalLoading(
    detail.isLoading ||
      lookups.isLoading ||
      receiptList.isLoading ||
      goodsInward.isLoading ||
      contactLookup.isLoading ||
      productLookup.isLoading ||
      stockUnits.isLoading ||
      isGenerating ||
      isRollingBack ||
      isDeleting
  )

  useEffect(() => {
    if (!detail.data) {
      return
    }

    const item = detail.data.item
    const lookupReceipt = lookups.data?.purchaseReceiptOptions.find((entry) => entry.id === item.id)
    const receivedByLineId = new Map(
      (lookupReceipt?.lines ?? []).map((line) => [line.id, Number(line.receivedQuantity || 0)])
    )
    const receiptGoodsInward = [...(goodsInward.data?.items ?? [])]
      .filter((entry) => entry.purchaseReceiptId === item.id)
      .sort(
        (left, right) =>
          right.updatedAt.localeCompare(left.updatedAt) ||
          right.createdAt.localeCompare(left.createdAt)
      )
    const latestSerializationLineByReceiptLineId = new Map<
      string,
      (typeof receiptGoodsInward)[number]["lines"][number]
    >()
    for (const inward of receiptGoodsInward) {
      for (const inwardLine of inward.lines) {
        if (!latestSerializationLineByReceiptLineId.has(inwardLine.purchaseReceiptLineId)) {
          latestSerializationLineByReceiptLineId.set(
            inwardLine.purchaseReceiptLineId,
            inwardLine
          )
        }
      }
    }
    const receiptStockUnits = (stockUnits.data?.items ?? []).filter(
      (stockUnit) => stockUnit.purchaseReceiptId === item.id
    )
    const stockUnitsByGoodsInwardLineId = new Map<string, StockUnitListResponse["items"]>()
    for (const stockUnit of receiptStockUnits) {
      const current = stockUnitsByGoodsInwardLineId.get(stockUnit.goodsInwardLineId) ?? []
      current.push(stockUnit)
      stockUnitsByGoodsInwardLineId.set(stockUnit.goodsInwardLineId, current)
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPostingDate(item.postingDate)
    setLineForms(
      item.lines.map((line) => {
        const orderedQuantity = Number(line.quantity || 0)
        const receivedQuantity = Number(receivedByLineId.get(line.id) ?? 0)
        const remainingQuantity = Math.max(orderedQuantity - receivedQuantity, 0)
        const defaultBarcodeQuantity =
          Number.isInteger(remainingQuantity) && remainingQuantity > 0 ? remainingQuantity : 1
        const latestSerializationLine = latestSerializationLineByReceiptLineId.get(line.id) ?? null
        const latestSerializationUnits =
          latestSerializationLine
            ? [...(stockUnitsByGoodsInwardLineId.get(latestSerializationLine.id) ?? [])].sort(
                (left, right) => left.unitSequence - right.unitSequence
              )
            : []
        const firstSerializationUnit = latestSerializationUnits[0] ?? null
        const hasSavedSerialization = latestSerializationLine !== null

        return {
          purchaseReceiptLineId: line.id,
          productId: line.productId,
          description: line.description ?? "",
          orderedQuantity,
          receivedQuantity,
          remainingQuantity,
          inwardQuantity: remainingQuantity > 0 ? String(remainingQuantity) : "0",
          barcodeQuantity:
            latestSerializationLine?.serializationBarcodeQuantity != null
              ? String(latestSerializationLine.serializationBarcodeQuantity)
              : latestSerializationUnits.length > 0
                ? String(latestSerializationUnits.length)
                : remainingQuantity > 0
                  ? String(defaultBarcodeQuantity)
                  : "1",
          identityMode: hasSavedSerialization
            ? (latestSerializationLine?.serializationMode ??
              (firstSerializationUnit?.batchCode ? "batch-and-serial" : "serial-only"))
            : "batch-and-serial",
          batchCode:
            latestSerializationLine?.serializationBatchCode ??
            firstSerializationUnit?.batchCode ??
            "",
          serialPrefix: hasSavedSerialization
            ? (latestSerializationLine?.serializationSerialPrefix ??
              latestSerializationLine?.manufacturerSerial ??
              "")
            : "",
          barcodePrefix: hasSavedSerialization
            ? (latestSerializationLine?.serializationBarcodePrefix ?? "")
            : "",
          manufacturerBarcodePrefix: hasSavedSerialization
            ? (latestSerializationLine?.serializationManufacturerBarcodePrefix ??
              latestSerializationLine?.manufacturerBarcode ??
              "")
            : "",
          expiresAt:
            latestSerializationLine?.serializationExpiresAt ??
            firstSerializationUnit?.expiresAt ??
            "",
          selected: remainingQuantity > 0,
        }
      })
    )
  }, [detail.data, goodsInward.data, lookups.data, stockUnits.data])

  if (
    detail.isLoading ||
    lookups.isLoading ||
    receiptList.isLoading ||
    goodsInward.isLoading ||
    contactLookup.isLoading ||
    productLookup.isLoading ||
    stockUnits.isLoading
  ) {
    return null
  }

  if (detail.error || !detail.data) {
    return <StateCard message={detail.error ?? "Purchase receipt detail is unavailable."} />
  }

  if (
    lookups.error ||
    receiptList.error ||
    goodsInward.error ||
    contactLookup.error ||
    productLookup.error ||
    stockUnits.error
  ) {
    return (
      <StateCard
        message={
          lookups.error ??
          receiptList.error ??
          goodsInward.error ??
          contactLookup.error ??
          productLookup.error ??
          stockUnits.error ??
          "Purchase receipt lookups are unavailable."
        }
      />
    )
  }

  const item = detail.data.item
  const receiptItems = receiptList.data?.items ?? []
  const supplierContacts = contactLookup.data?.items ?? []
  const products = productLookup.data?.items ?? []
  const receiptStockUnits = (stockUnits.data?.items ?? []).filter(
    (stockUnit) => stockUnit.purchaseReceiptId === item.id
  )
  const isInwardStarted = receiptStockUnits.length > 0
  const productNameById = new Map(products.map((product) => [product.id, product.name]))
  const productCodeById = new Map(products.map((product) => [product.id, product.code]))
  const supplierName = getSupplierDisplayName(supplierContacts, item.supplierId)
  const warehouseName = item.warehouseId
  const currentReceiptIndex = receiptItems.findIndex((entry) => entry.id === item.id)
  const nextReceipt = currentReceiptIndex >= 0 ? receiptItems[currentReceiptIndex + 1] : null
  const selectedPrintedUnits = receiptStockUnits.filter((unit) =>
    selectedPrintedUnitIds.includes(unit.id)
  )
  const canRollbackSelectedPrintedUnits =
    selectedPrintedUnits.length > 0 &&
    selectedPrintedUnits.every((unit) => unit.status === "received")

  function updateSerializationLine(
    purchaseReceiptLineId: string,
    patch: Partial<PurchaseReceiptSerializationLineForm>
  ) {
    setLineForms((current) =>
      current.map((line) =>
        line.purchaseReceiptLineId === purchaseReceiptLineId ? { ...line, ...patch } : line
      )
    )
  }

  async function handleDeleteReceipt() {
    if (!window.confirm(`Delete purchase receipt ${item.entryNumber}?`)) {
      return
    }

    setIsDeleting(true)

    try {
      await requestJson(
        `/internal/v1/stock/purchase-receipt?id=${encodeURIComponent(item.id)}`,
        { method: "DELETE" }
      )
      showRecordToast({
        entity: "Purchase receipt",
        action: "deleted",
        recordName: item.entryNumber,
      })
      void navigate("/dashboard/apps/stock/purchase-receipts")
    } catch (deleteError) {
      setFormError(
        deleteError instanceof Error ? deleteError.message : "Failed to delete purchase receipt."
      )
    } finally {
      setIsDeleting(false)
    }
  }

  async function executeGenerateBarcodeLine(line: PurchaseReceiptSerializationLineForm) {
    setIsGenerating(true)
    setGeneratingLineId(line.purchaseReceiptLineId)

    try {
      const response = await requestJson<BillingPurchaseReceiptBarcodeGenerationResponse>(
        `/internal/v1/stock/purchase-receipt/barcodes?id=${encodeURIComponent(receiptId)}`,
        {
          method: "POST",
          body: JSON.stringify({
            postingDate,
            note: postingNote,
            template: "inventory-sticker-25x50mm",
            lines: [
              {
                purchaseReceiptLineId: line.purchaseReceiptLineId,
                inwardQuantity: line.remainingQuantity,
                barcodeQuantity: Number(line.barcodeQuantity),
                identityMode: line.identityMode,
                batchCode: line.identityMode === "batch-and-serial" ? line.batchCode : null,
                serialPrefix: line.serialPrefix || null,
                barcodePrefix: line.barcodePrefix || null,
                manufacturerBarcodePrefix: line.manufacturerBarcodePrefix || null,
                expiresAt: line.expiresAt || null,
                note: line.description || "",
              },
            ],
          }),
        }
      )

      setLastGeneratedBatch(response)
      setRefreshNonce((current) => current + 1)
      showRecordToast({
        entity: "Barcode batch",
        action: "generated",
        recordName: response.stickerBatch.goodsInwardNumber,
      })
    } catch (submitError) {
      setFormError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to generate barcode batch from purchase receipt."
      )
    } finally {
      setIsGenerating(false)
      setGeneratingLineId(null)
      setPendingGenerateLine(null)
    }
  }

  async function executeRollbackSelectedUnits(stockUnitIds: string[]) {
    setIsRollingBack(true)

    try {
      const response = await requestJson<BillingPurchaseReceiptBarcodeRollbackResponse>(
        `/internal/v1/stock/purchase-receipt/barcodes?id=${encodeURIComponent(receiptId)}`,
        {
          method: "DELETE",
          body: JSON.stringify({
            stockUnitIds,
          }),
        }
      )

      setLastGeneratedBatch(null)
      setSelectedPrintedUnitIds((current) =>
        current.filter((item) => !response.deletedStockUnitIds.includes(item))
      )
      setRefreshNonce((current) => current + 1)
      showRecordToast({
        entity: "Generated barcode",
        action: "rolled back",
        recordName: `${item.entryNumber} (${response.rolledBackCount})`,
      })
    } catch (rollbackError) {
      setFormError(
        rollbackError instanceof Error
          ? rollbackError.message
          : "Failed to delete selected generated barcodes."
      )
    } finally {
      setIsRollingBack(false)
      setPendingRollbackUnitIds(null)
    }
  }

  function handleGenerateBarcodeLine(line: PurchaseReceiptSerializationLineForm) {
    setFormError(null)
    setLastGeneratedBatch(null)

    const inwardQuantity = line.remainingQuantity
    const barcodeQuantity = Number(line.barcodeQuantity || 0)

    if (
      !Number.isFinite(inwardQuantity) ||
      inwardQuantity <= 0 ||
      inwardQuantity > line.remainingQuantity ||
      !Number.isInteger(barcodeQuantity) ||
      barcodeQuantity <= 0 ||
      barcodeQuantity > Math.ceil(inwardQuantity)
      ) {
      setFormError(`Check barcode quantity for product ${line.productId}.`)
      return
    }

    if (line.identityMode === "batch-and-serial" && line.batchCode.trim().length === 0) {
      setFormError(`Batch number is required for product ${line.productId}.`)
      return
    }

    setPendingGenerateLine(line)
  }

  function handleRollbackSelectedUnits() {
    setFormError(null)

    if (selectedPrintedUnits.length === 0) {
      setFormError("Select one or more generated barcodes to delete.")
      return
    }

    if (!selectedPrintedUnits.every((unit) => unit.status === "received")) {
      setFormError("Generated barcodes can be deleted only before stock acceptance.")
      return
    }

    setPendingRollbackUnitIds(selectedPrintedUnits.map((unit) => unit.id))
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Back
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(1)}>
            Forward
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!nextReceipt}
            onClick={() => {
              if (!nextReceipt) {
                return
              }

              void navigate(
                `/dashboard/apps/stock/purchase-receipts/${encodeURIComponent(nextReceipt.id)}`
              )
            }}
          >
            Next
          </Button>
          <Button
            type="button"
            className="bg-violet-600 text-white hover:bg-violet-700"
            onClick={() =>
              printPurchaseReceiptDocument({
                receipt: item,
                supplierName,
                warehouseName,
                productNameById,
              })
            }
          >
            <PrinterIcon className="mr-2 size-4" />
            Print
          </Button>
        </div>
        <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
          {isInwardStarted ? (
            <div className="rounded-md border border-border/70 px-3 py-2 text-sm text-muted-foreground">
              Edit/Delete blocked after barcode generation starts
            </div>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link to={`/dashboard/apps/stock/purchase-receipts/${encodeURIComponent(item.id)}/edit`}>
                  Edit
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isDeleting}
                onClick={() => void handleDeleteReceipt()}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </>
          )}
        </div>
      </div>
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Receipt overview</CardTitle>
          <CardDescription>
            Document summary and ordered lines before inward serialization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <DataTable
            headers={[
              "Register entry",
              "Supplier reference",
              "Supplier ref date",
              "Posting date",
              "Warehouse",
            ]}
            rows={[
              [
                item.entryNumber,
                item.supplierReferenceNumber ?? "-",
                formatOptionalDate(item.supplierReferenceDate),
                item.postingDate,
                item.warehouseId,
              ],
            ]}
          />
          <DataTable
            headers={["Serial no", "Product", "Description", "Qty", "Rate", "Amount"]}
            rows={item.lines.map((line, index) => [
              String(index + 1).padStart(2, "0"),
              <div key={`${line.id}:product`}>
                <p className="font-medium text-foreground">
                  {productNameById.get(line.productId) ?? line.productId}
                </p>
                <p className="text-xs text-muted-foreground">{line.productId}</p>
              </div>,
              <div key={`${line.id}:description`}>
                <p>{line.description ?? "-"}</p>
                <p className="text-xs text-muted-foreground">{line.notes || "-"}</p>
              </div>,
              formatQuantity(Number(line.quantity || 0)),
              formatMoney(Number(line.rate || 0)),
              formatMoney(Number(line.amount || 0)),
            ])}
          />
        </CardContent>
      </Card>
      <div className="space-y-4">
        <Card
          className="border-border/70 shadow-sm"
          data-technical-name="section.stock.purchase-receipt.serialization-form"
        >
          <CardHeader>
            <CardTitle>Generate barcode</CardTitle>
          </CardHeader>
          <CardContent>
            {formError ? <StateCard message={formError} /> : null}
            <div className="space-y-3">
              {lineForms.map((line) => {
                return (
                  <div
                    key={line.purchaseReceiptLineId}
                    className={`rounded-2xl border p-4 transition ${
                      line.selected
                        ? "border-border bg-background shadow-sm"
                        : "border-border/50 bg-muted/20"
                    }`}
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="size-4 rounded border-border"
                          checked={line.selected}
                          disabled={line.remainingQuantity <= 0}
                          onChange={(event) =>
                            updateSerializationLine(line.purchaseReceiptLineId, {
                              selected: event.target.checked,
                            })
                          }
                        />
                        <p className="text-sm font-medium text-foreground">
                          {line.remainingQuantity > 0 ? "Ready to generate" : "Fully generated"}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        disabled={
                          !line.selected ||
                          line.remainingQuantity <= 0 ||
                          isGenerating
                        }
                        onClick={() => void handleGenerateBarcodeLine(line)}
                      >
                        {generatingLineId === line.purchaseReceiptLineId && isGenerating
                          ? "Generating..."
                          : "Generate barcode"}
                      </Button>
                    </div>
                    <div className="mb-4 flex flex-wrap gap-2">
                      <Badge variant="outline">Received {formatQuantity(line.receivedQuantity)}</Badge>
                      <Badge variant="outline">Barcode qty {formatQuantity(Number(line.barcodeQuantity || 0))}</Badge>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">Product</p>
                        <Input
                          value={productNameById.get(line.productId) ?? line.productId}
                          disabled
                        />
                      </div>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-foreground">Barcode qty</p>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            value={line.barcodeQuantity}
                            disabled={!line.selected}
                            onChange={(event) =>
                              updateSerializationLine(line.purchaseReceiptLineId, {
                                barcodeQuantity: event.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-foreground">Serialization mode</p>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={line.identityMode}
                            disabled={!line.selected}
                            onChange={(event) =>
                              updateSerializationLine(line.purchaseReceiptLineId, {
                                identityMode: event.target.value as BillingPurchaseReceiptSerializationMode,
                                batchCode:
                                  event.target.value === "serial-only" ? "" : line.batchCode,
                              })
                            }
                          >
                            <option value="batch-and-serial">Batch no + serial number</option>
                            <option value="serial-only">Without batch no</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-foreground">
                            {line.identityMode === "batch-and-serial" ? "Batch expiry date" : "Expiry date"}
                          </p>
                          <Input
                            type="date"
                            value={line.expiresAt}
                            disabled={!line.selected}
                            onChange={(event) =>
                              updateSerializationLine(line.purchaseReceiptLineId, {
                                expiresAt: event.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        {line.identityMode === "batch-and-serial" ? (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-foreground">Batch no</p>
                            <Input
                              value={line.batchCode}
                              disabled={!line.selected}
                              onChange={(event) =>
                                updateSerializationLine(line.purchaseReceiptLineId, {
                                  batchCode: event.target.value,
                                })
                              }
                              placeholder="Enter supplier or internal batch no"
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-foreground">Batch no</p>
                            <Input value="No batch" disabled />
                          </div>
                        )}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-foreground">Serial prefix</p>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground underline underline-offset-4 transition hover:text-foreground"
                              disabled={!line.selected || !productCodeById.get(line.productId)}
                              onClick={() =>
                                updateSerializationLine(line.purchaseReceiptLineId, {
                                  serialPrefix: (productCodeById.get(line.productId) ?? "").toUpperCase(),
                                })
                              }
                            >
                              <SparklesIcon className="size-3" />
                              Use product code
                            </button>
                          </div>
                          <Input
                            value={line.serialPrefix}
                            disabled={!line.selected}
                            onChange={(event) =>
                              updateSerializationLine(line.purchaseReceiptLineId, {
                                serialPrefix: event.target.value.toUpperCase(),
                              })
                            }
                            placeholder={productCodeById.get(line.productId) ?? ""}
                          />
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-foreground">Barcode prefix</p>
                          <Input
                            value={line.barcodePrefix}
                            disabled={!line.selected}
                            onChange={(event) =>
                              updateSerializationLine(line.purchaseReceiptLineId, {
                                barcodePrefix: event.target.value.toUpperCase(),
                              })
                            }
                            placeholder="Leave blank for serial or batch + serial"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <p className="text-sm font-medium text-foreground">Manufacturer barcode prefix</p>
                        <Input
                          value={line.manufacturerBarcodePrefix}
                          disabled={!line.selected}
                          onChange={(event) =>
                            updateSerializationLine(line.purchaseReceiptLineId, {
                              manufacturerBarcodePrefix: event.target.value,
                            })
                          }
                          placeholder="Manufacturer barcode prefix"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
      {lastGeneratedBatch ? (
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Generated barcodes</CardTitle>
            <CardDescription>
              {lastGeneratedBatch.unitsCreated} barcode{lastGeneratedBatch.unitsCreated === 1 ? "" : "s"} created from {lastGeneratedBatch.goodsInward.inwardNumber}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DataTable
              headers={["Product", "Batch", "Serial", "Barcode", "Expiry"]}
              rows={lastGeneratedBatch.stickerBatch.items.map((generatedItem) => [
                <div key={`${generatedItem.stockUnitId}:product`} className="space-y-0.5">
                  <p className="font-medium text-foreground">
                    {productNameById.get(generatedItem.productId) ?? generatedItem.productName}
                  </p>
                  <p className="text-xs text-muted-foreground">{generatedItem.productCode}</p>
                </div>,
                generatedItem.batchCode ?? "No batch",
                generatedItem.serialNumber,
                <span
                  key={`${generatedItem.stockUnitId}:barcode`}
                  className="font-mono text-xs text-foreground"
                >
                  {generatedItem.barcodeValue}
                </span>,
                formatOptionalDate(generatedItem.expiresAt),
              ])}
            />
          </CardContent>
        </Card>
      ) : null}
      {receiptStockUnits.length > 0 ? (
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Generated barcodes below</CardTitle>
              <CardDescription>
                Existing barcodes already created for this purchase receipt.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setSelectedPrintedUnitIds(
                    selectedPrintedUnitIds.length === receiptStockUnits.length
                      ? []
                      : receiptStockUnits.map((unit) => unit.id)
                  )
                }
              >
                {selectedPrintedUnitIds.length === receiptStockUnits.length ? "Clear all" : "Select all"}
              </Button>
              <div className="rounded-md border border-border/70 px-3 py-2 text-sm text-muted-foreground">
                Selected {selectedPrintedUnits.length}
              </div>
              <Button
                type="button"
                variant={canRollbackSelectedPrintedUnits ? "destructive" : "outline"}
                disabled={!canRollbackSelectedPrintedUnits || isRollingBack}
                onClick={handleRollbackSelectedUnits}
              >
                <Trash2Icon className="mr-2 size-4" />
                {isRollingBack ? "Deleting..." : "Delete selected"}
              </Button>
              <Button
                type="button"
                variant={selectedPrintedUnits.length > 0 ? "default" : "outline"}
                disabled={selectedPrintedUnits.length === 0}
                onClick={() => {
                  void printStockUnitBarcodes(selectedPrintedUnits)
                }}
              >
                <PrinterIcon className="mr-2 size-4" />
                Print Barcode
              </Button>
            </div>
            {selectedPrintedUnits.length > 0 && !canRollbackSelectedPrintedUnits ? (
              <div className="rounded-md border border-border/70 px-3 py-2 text-sm text-muted-foreground">
                Delete selected is available only while the chosen units are still in received status.
              </div>
            ) : null}
          </CardHeader>
          <CardContent>
            <DataTable
              headers={["Select", "Serial no", "Product", "Batch", "Serial", "Barcode", "Expiry", "Status", "Action"]}
              rows={receiptStockUnits.map((stockUnit, index) => [
                <input
                  key={`${stockUnit.id}:select`}
                  type="checkbox"
                  className="size-4 rounded border-border"
                  checked={selectedPrintedUnitIds.includes(stockUnit.id)}
                  onChange={(event) =>
                    setSelectedPrintedUnitIds((current) =>
                      event.target.checked
                        ? [...current, stockUnit.id]
                        : current.filter((item) => item !== stockUnit.id)
                    )
                  }
                />,
                String(index + 1).padStart(2, "0"),
                <div key={`${stockUnit.id}:product`}>
                  <p className="font-medium text-foreground">
                    {productNameById.get(stockUnit.productId) ?? stockUnit.productName}
                  </p>
                  <p className="text-xs text-muted-foreground">{stockUnit.productCode}</p>
                </div>,
                stockUnit.batchCode ?? "No batch",
                stockUnit.serialNumber,
                <span
                  key={`${stockUnit.id}:barcode`}
                  className="font-mono text-xs text-foreground"
                >
                  {stockUnit.barcodeValue}
                </span>,
                formatOptionalDate(stockUnit.expiresAt),
                renderStockUnitStatusBadge(stockUnit.status, `${stockUnit.id}:status`),
                <Button
                  key={`${stockUnit.id}:print`}
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    void printStockUnitBarcodes([stockUnit])
                  }}
                  aria-label={`Print ${stockUnit.barcodeValue}`}
                >
                  <PrinterIcon className="size-4" />
                </Button>,
              ])}
            />
          </CardContent>
        </Card>
      ) : null}
      <AlertDialog
        open={pendingGenerateLine !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !isGenerating) {
            setPendingGenerateLine(null)
          }
        }}
      >
        <AlertDialogContent size="default">
          <AlertDialogHeader>
            <AlertDialogTitle>Generate barcode batch?</AlertDialogTitle>
            <AlertDialogDescription>
              Generate barcode will post inward for the selected quantity immediately. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isGenerating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isGenerating || !pendingGenerateLine}
              onClick={() => {
                if (!pendingGenerateLine) {
                  return
                }

                void executeGenerateBarcodeLine(pendingGenerateLine)
              }}
            >
              {isGenerating ? "Generating..." : "Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={pendingRollbackUnitIds !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !isRollingBack) {
            setPendingRollbackUnitIds(null)
          }
        }}
      >
        <AlertDialogContent size="default">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete selected generated barcodes?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the selected generated barcodes, inward quantity, and sticker rows so
              you can regenerate them again from this purchase receipt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRollingBack}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isRollingBack || !pendingRollbackUnitIds}
              onClick={() => {
                if (!pendingRollbackUnitIds) {
                  return
                }

                void executeRollbackSelectedUnits(pendingRollbackUnitIds)
              }}
            >
              {isRollingBack ? "Deleting..." : "Delete selected"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export function PurchaseReceiptUpsertSection({ receiptId }: { receiptId?: string }) {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [lines, setLines] = useState<PurchaseReceiptLineForm[]>([
    {
      productId: "",
      productName: "",
      variantId: "",
      variantName: "",
      warehouseId: "",
      quantity: "1",
      unit: "Nos",
      unitCost: "0",
      note: "",
    },
  ])
  const [form, setForm] = useState({
    registerEntryNumber: "",
    receiptNumber: "",
    supplierName: "",
    supplierReferenceNumber: "",
    supplierReferenceDate: "",
    postingDate: new Date().toISOString().slice(0, 10),
    warehouseId: "",
    warehouseName: "",
    sourceVoucherId: "",
    sourceFrappeReceiptId: "",
    status: "open",
    note: "",
  })

  const detail = useJsonResource<PurchaseReceiptResponse>(
    receiptId ? `/internal/v1/stock/purchase-receipt?id=${encodeURIComponent(receiptId)}` : "",
    [receiptId]
  )
  const warehouseLookup = useJsonResource<CommonModuleListResponse>(
    "/internal/v1/core/common-modules/items?module=warehouses"
  )
  const productLookup = useJsonResource<ProductListResponse>("/internal/v1/core/products")
  const contactLookup = useJsonResource<ContactListResponse>("/internal/v1/core/contacts")
  const receiptLookup = useJsonResource<PurchaseReceiptListResponse>(
    "/internal/v1/stock/purchase-receipts"
  )
  const [createdContacts, setCreatedContacts] = useState<ContactSummary[]>([])
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false)
  const [supplierDraft, setSupplierDraft] = useState<SupplierContactDraft>(createSupplierContactDraft())
  const [supplierCreateError, setSupplierCreateError] = useState<string | null>(null)
  const [supplierCreateSaving, setSupplierCreateSaving] = useState(false)
  const productOptions = useMemo(
    () => getProductLookupOptions(productLookup.data?.items ?? []),
    [productLookup.data]
  )
  const warehouseOptions = useMemo(
    () =>
      buildWarehouseOptions(
        warehouseLookup.data?.items ?? [],
        form.warehouseId,
        form.warehouseName
      ),
    [form.warehouseId, form.warehouseName, warehouseLookup.data]
  )
  const supplierContacts = useMemo(() => {
    const seen = new Set<string>()
    return [...createdContacts, ...(contactLookup.data?.items ?? [])].filter((contact) => {
      if (seen.has(contact.id)) {
        return false
      }

      seen.add(contact.id)
      return true
    })
  }, [contactLookup.data, createdContacts])
  const supplierOptions = useMemo(
    () => buildSupplierContactOptions(supplierContacts, form.supplierName),
    [form.supplierName, supplierContacts]
  )
  const selectedSupplierValue = useMemo(
    () => resolveSelectedSupplierContactValue(supplierContacts, form.supplierName),
    [form.supplierName, supplierContacts]
  )
  const nextRegisterEntryNumber = useMemo(
    () => getNextRegisterEntryNumber(receiptLookup.data?.items ?? [], receiptId),
    [receiptId, receiptLookup.data]
  )
  useGlobalLoading(
    detail.isLoading ||
      warehouseLookup.isLoading ||
      productLookup.isLoading ||
      contactLookup.isLoading ||
      receiptLookup.isLoading ||
      saving ||
      supplierCreateSaving
  )

  useEffect(() => {
    if (receiptId || form.warehouseId || warehouseOptions.length === 0) {
      return
    }

    const defaultWarehouse = getDefaultWarehouseOption(
      warehouseLookup.data?.items ?? [],
      warehouseOptions
    )
    if (!defaultWarehouse) {
      return
    }

    const warehouseName = getWarehouseNameFromOptionLabel(defaultWarehouse.label)

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm((current) => ({
      ...current,
      warehouseId: defaultWarehouse.value,
      warehouseName,
    }))
    setLines((current) =>
      current.map((line) => ({
        ...line,
        warehouseId: defaultWarehouse.value,
      }))
    )
  }, [form.warehouseId, receiptId, warehouseLookup.data?.items, warehouseOptions])

  useEffect(() => {
    if (!receiptId || !detail.data) {
      return
    }

    const detailItem = detail.data.item

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      registerEntryNumber: detailItem.entryNumber ?? "",
      receiptNumber: detailItem.entryNumber,
      supplierName: detailItem.supplierId,
      supplierReferenceNumber: detailItem.supplierReferenceNumber ?? "",
      supplierReferenceDate: detailItem.supplierReferenceDate ?? "",
      postingDate: detailItem.postingDate,
      warehouseId: detailItem.warehouseId,
      warehouseName: detailItem.warehouseId,
      sourceVoucherId: "",
      sourceFrappeReceiptId: "",
      status: detailItem.status,
      note: "",
    })
    setLines(
      detailItem.lines.map((line) => ({
        productId: line.productId,
        productName: line.productId,
        variantId: "",
        variantName: line.description ?? "",
        warehouseId: detailItem.warehouseId,
        quantity: String(line.quantity ?? 0),
        unit: "Nos",
        unitCost: String(line.rate ?? 0),
        note: line.notes ?? "",
      }))
    )
  }, [detail.data, receiptId])

  function updatePurchaseReceiptLine(
    index: number,
    patch: Partial<PurchaseReceiptLineForm>
  ) {
    setLines((current) =>
      current.map((item, lineIndex) => (lineIndex === index ? { ...item, ...patch } : item))
    )
  }

  function selectPurchaseReceiptProduct(index: number, productId: string) {
    const selectedProduct = productLookup.data?.items.find((product) => product.id === productId)
    if (!selectedProduct) {
      return
    }

    setLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index
          ? { ...line, ...createPurchaseReceiptProductPatch(selectedProduct, line) }
          : line
      )
    )
  }

  function applySupplierContact(contact: ContactSummary) {
    setForm((current) => ({
      ...current,
      supplierName: contact.id,
    }))
  }

  function handleSupplierValueChange(nextValue: string) {
    if (!nextValue || nextValue.startsWith("manual:")) {
      return
    }

    const selectedContact = supplierContacts.find((contact) => contact.id === nextValue)
    if (!selectedContact) {
      return
    }

    applySupplierContact(selectedContact)
  }

  function handleOpenCreateSupplier(query: string) {
    setSupplierCreateError(null)
    setSupplierDraft(createSupplierContactDraft(query))
    setSupplierDialogOpen(true)
  }

  async function handleCreateSupplierContact() {
    if (supplierDraft.name.trim().length < 2) {
      setSupplierCreateError("Supplier name must be at least 2 characters.")
      return
    }

    setSupplierCreateSaving(true)
    setSupplierCreateError(null)

    try {
      const response = await requestJson<ContactResponse>("/internal/v1/core/contacts", {
        method: "POST",
        body: JSON.stringify(buildSupplierContactPayload(supplierDraft)),
      })

      setCreatedContacts((current) => [response.item, ...current.filter((item) => item.id !== response.item.id)])
      applySupplierContact(response.item)
      setSupplierDialogOpen(false)
      setSupplierDraft(createSupplierContactDraft())
    } catch (createError) {
      setSupplierCreateError(
        createError instanceof Error ? createError.message : "Failed to create supplier contact."
      )
    } finally {
      setSupplierCreateSaving(false)
    }
  }

  function handleWarehouseValueChange(nextValue: string) {
    if (!nextValue) {
      return
    }

    const selectedWarehouse = warehouseOptions.find((option) => option.value === nextValue)
    if (!selectedWarehouse) {
      return
    }

    const warehouseName = getWarehouseNameFromOptionLabel(selectedWarehouse.label)
    setForm((current) => ({
      ...current,
      warehouseId: nextValue,
      warehouseName,
    }))
    setLines((current) =>
      current.map((line) => ({
        ...line,
        warehouseId: nextValue,
      }))
    )
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const normalizedSupplierId = resolveSupplierContactId(supplierContacts, form.supplierName)
    const normalizedWarehouseId = resolveWarehouseId(
      warehouseOptions,
      form.warehouseId,
      form.warehouseName
    )

    if (!normalizedSupplierId || normalizedSupplierId.startsWith("manual:")) {
      setError("Select a supplier contact before saving the receipt.")
      return
    }

    if (!normalizedWarehouseId) {
      setError("Select a warehouse before saving the receipt.")
      return
    }

    const invalidLineIndex = lines.findIndex(
      (line) => !line.productId.trim() || Number.isNaN(Number(line.quantity)) || Number.isNaN(Number(line.unitCost))
    )

    if (invalidLineIndex >= 0) {
      setError(`Complete product, quantity, and rate for line ${invalidLineIndex + 1}.`)
      return
    }

    setSaving(true)

    try {
      const resolvedRegisterEntryNumber =
        form.registerEntryNumber.trim() || nextRegisterEntryNumber

      await requestJson<PurchaseReceiptResponse>(
        receiptId
          ? `/internal/v1/stock/purchase-receipt?id=${encodeURIComponent(receiptId)}`
          : "/internal/v1/stock/purchase-receipts",
        {
          method: receiptId ? "PATCH" : "POST",
          body: JSON.stringify({
            entryNumber: resolvedRegisterEntryNumber,
            supplierId: normalizedSupplierId,
            supplierReferenceNumber: form.supplierReferenceNumber || null,
            supplierReferenceDate: form.supplierReferenceDate || null,
            postingDate: form.postingDate,
            warehouseId: normalizedWarehouseId,
            status: form.status,
            lines: lines.map((line) => ({
              productId: line.productId,
              quantity: Number(line.quantity),
              description: line.variantName || null,
              rate: Number(line.unitCost),
              amount: Number((Number(line.quantity || 0) * Number(line.unitCost || 0)).toFixed(2)),
              notes: line.note,
            })),
          }),
        }
      )

      setSaving(false)
      void navigate("/dashboard/apps/stock/purchase-receipts")
      return
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save purchase receipt.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/70 shadow-sm">
        <CardContent className="p-5">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Register entry number">
                <div className="space-y-2">
                  <Input
                    value={form.registerEntryNumber}
                    onChange={(event) =>
                      setForm({ ...form, registerEntryNumber: event.target.value })
                    }
                    placeholder={nextRegisterEntryNumber}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave blank to auto assign the next number: {nextRegisterEntryNumber}
                  </p>
                </div>
              </Field>
              <Field label="Posting date"><Input type="date" value={form.postingDate} onChange={(event) => setForm({ ...form, postingDate: event.target.value })} required /></Field>
              <Field label="Supplier">
                <SearchableLookupField
                  createActionLabel="Create contact"
                  error={contactLookup.error}
                  noResultsMessage="No contacts found."
                  onCreateNew={handleOpenCreateSupplier}
                  onValueChange={handleSupplierValueChange}
                  options={supplierOptions}
                  placeholder={contactLookup.isLoading ? "Loading..." : "Select supplier"}
                  searchPlaceholder="Search contact"
                  triggerClassName="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-none focus-visible:border-ring focus-visible:ring-0"
                  value={selectedSupplierValue}
                />
              </Field>
              <Field label="Supplier ref no">
                <Input
                  value={form.supplierReferenceNumber}
                  onChange={(event) =>
                    setForm({ ...form, supplierReferenceNumber: event.target.value })
                  }
                  placeholder="Supplier document number"
                />
              </Field>
              <Field label="Supplier ref date">
                <Input
                  type="date"
                  value={form.supplierReferenceDate}
                  onChange={(event) =>
                    setForm({ ...form, supplierReferenceDate: event.target.value })
                  }
                />
              </Field>
              <div />
              <Field label="Warehouse">
                <SearchableLookupField
                  noResultsMessage="No warehouses found."
                  onValueChange={handleWarehouseValueChange}
                  options={warehouseOptions}
                  placeholder={warehouseLookup.isLoading ? "Loading..." : "Select warehouse"}
                  searchPlaceholder="Search warehouse"
                  triggerClassName="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-none focus-visible:border-ring focus-visible:ring-0"
                  value={form.warehouseId}
                />
              </Field>
              <Field label="Status">
                <select className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                  <option value="open">Open</option>
                  <option value="partially_received">Partially received</option>
                  <option value="fully_received">Fully received</option>
                </select>
              </Field>
            </div>
            <VoucherInlineEditableTable
              title="Purchase items"
              addLabel="Add item"
              fitToContainer
              rows={lines}
              onAddRow={() =>
                setLines((current) => [
                  ...current,
                  {
                    productId: "",
                    productName: "",
                    variantId: "",
                    variantName: "",
                    warehouseId: form.warehouseId,
                    quantity: "1",
                    unit: "Nos",
                    unitCost: "0",
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
                `stock-purchase-receipt-line:${index}:${line.productId}:${line.productId}`
              }
              columns={[
                {
                  id: "product",
                  header: "Product",
                  width: "30%",
                  headerClassName: "min-w-0",
                  renderCell: (line, index) => {
                    const rowOptions = getPurchaseReceiptLineProductOptions(
                      line,
                      productOptions,
                      index
                    )

                    return (
                      <SearchableLookupField
                        emptyOptionLabel="Select product"
                        noResultsMessage="No products found."
                        onValueChange={(nextValue) => {
                          if (!nextValue || nextValue.startsWith("manual:")) {
                            return
                          }

                          selectPurchaseReceiptProduct(index, nextValue)
                        }}
                        options={rowOptions}
                        placeholder={productLookup.isLoading ? "Loading..." : "Select"}
                        searchPlaceholder="Search"
                        triggerClassName="h-6 rounded-none border-0 bg-transparent px-0 text-sm shadow-none focus-visible:border-transparent focus-visible:ring-0"
                        value={line.productId || (line.productName ? `manual:${index}` : "")}
                      />
                    )
                  },
                },
                {
                  id: "description",
                  header: "Description",
                  width: "24%",
                  cellClassName: "max-w-0",
                  renderCell: (line, index) => (
                    <Input
                      aria-label="Variant description"
                      value={line.variantName}
                      onChange={(event) =>
                        updatePurchaseReceiptLine(index, { variantName: event.target.value })
                      }
                      className={`${voucherInlineInputClassName} h-6 min-w-0 truncate`}
                    />
                  ),
                },
                {
                  id: "quantity",
                  header: "Qty",
                  width: "10%",
                  headerClassName: "text-center",
                  cellClassName: "text-center",
                  renderCell: (line, index) => (
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.quantity}
                      onChange={(event) =>
                        updatePurchaseReceiptLine(index, { quantity: event.target.value })
                      }
                      className={`${voucherInlineInputClassName} h-6 text-center`}
                      required
                    />
                  ),
                },
                {
                  id: "rate",
                  header: "Rate",
                  width: "12%",
                  headerClassName: "text-center",
                  cellClassName: "text-center",
                  renderCell: (line, index) => (
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.unitCost}
                      onChange={(event) =>
                        updatePurchaseReceiptLine(index, { unitCost: event.target.value })
                      }
                      className={`${voucherInlineInputClassName} h-6 text-center`}
                      required
                    />
                  ),
                },
                {
                  id: "amount",
                  header: "Amount",
                  width: "12%",
                  headerClassName: "text-right",
                  cellClassName: "text-right text-sm font-medium text-foreground",
                  renderCell: (line) => formatMoney(getPurchaseReceiptLineAmount(line)),
                },
              ]}
              summaryRow={
                <TableRow className="border-border/60 bg-muted/20 hover:bg-muted/20">
                  <TableCell className="border-r border-border/50 px-1 py-0.5" />
                  <TableCell
                    colSpan={2}
                    className="border-r border-border/50 px-1.5 py-0.5 text-right font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                  >
                    Total
                  </TableCell>
                  <TableCell className="border-r border-border/50 px-0 py-0.5 text-center text-sm font-semibold text-foreground">
                    <div className="flex h-6 items-center justify-center">
                      {formatQuantity(
                        lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0)
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="border-r border-border/50 px-0 py-0.5">
                    <div className="h-6" />
                  </TableCell>
                  <TableCell className="border-r border-border/50 px-0 py-0.5 text-right text-sm font-semibold text-foreground">
                    <div className="flex h-6 items-center justify-end px-1.5">
                      {formatMoney(
                        lines.reduce((sum, line) => sum + getPurchaseReceiptLineAmount(line), 0)
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-0 py-0.5">
                    <div className="h-6" />
                  </TableCell>
                </TableRow>
              }
            />
            <Field label="Receipt note">
              <Textarea
                className="min-h-24"
                value={form.note}
                onChange={(event) => setForm({ ...form, note: event.target.value })}
              />
            </Field>
            <Dialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
              <DialogContent className="max-w-md p-4">
                <DialogHeader>
                  <DialogTitle>Create supplier contact</DialogTitle>
                  <DialogDescription>
                    Capture the supplier identity now. Remaining contact details can be completed later.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3">
                  <Field label="Name">
                    <Input
                      value={supplierDraft.name}
                      onChange={(event) =>
                        setSupplierDraft((current) => ({ ...current, name: event.target.value }))
                      }
                      required
                    />
                  </Field>
                  <Field label="Phone">
                    <Input
                      value={supplierDraft.phone}
                      onChange={(event) =>
                        setSupplierDraft((current) => ({ ...current, phone: event.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Contact person">
                    <Input
                      value={supplierDraft.contactPerson}
                      onChange={(event) =>
                        setSupplierDraft((current) => ({
                          ...current,
                          contactPerson: event.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="GST number">
                    <Input
                      value={supplierDraft.gstin}
                      onChange={(event) =>
                        setSupplierDraft((current) => ({ ...current, gstin: event.target.value }))
                      }
                    />
                  </Field>
                  {supplierCreateError ? (
                    <p className="text-sm text-destructive">{supplierCreateError}</p>
                  ) : null}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSupplierDialogOpen(false)}
                    disabled={supplierCreateSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void handleCreateSupplierContact()}
                    disabled={supplierCreateSaving}
                  >
                    {supplierCreateSaving ? "Saving..." : "Save contact"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {error ? <StateCard message={error} /> : null}
            <div className="mt-4 flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save receipt"}</Button>
              <Button type="button" variant="outline" onClick={() => void navigate("/dashboard/apps/stock/purchase-receipts")}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

