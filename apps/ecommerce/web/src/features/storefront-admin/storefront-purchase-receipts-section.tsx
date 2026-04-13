import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeftIcon, PencilLineIcon, ReceiptTextIcon } from "lucide-react"

import type {
  BillingPurchaseReceipt,
  BillingPurchaseReceiptListResponse,
  BillingPurchaseReceiptResponse,
  BillingPurchaseReceiptStatus,
  BillingPurchaseReceiptUpsertPayload,
} from "@billing/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { formatHttpErrorMessage } from "@cxapp/web/src/lib/http-error"
import { MasterList } from "@/components/blocks/master-list"
import { VoucherInlineEditableTable } from "@/components/blocks/voucher-inline-editable-table"
import { TechnicalNameBadge } from "@/components/system/technical-name-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"

type PurchaseReceiptLineForm = {
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

type PurchaseReceiptForm = {
  receiptNumber: string
  supplierName: string
  supplierLedgerId: string
  postingDate: string
  warehouseId: string
  warehouseName: string
  sourceVoucherId: string
  sourceFrappeReceiptId: string
  status: BillingPurchaseReceiptStatus
  note: string
  lines: PurchaseReceiptLineForm[]
}

type StatusFilterValue = "all" | BillingPurchaseReceiptStatus

const routeBase = "/dashboard/apps/ecommerce/stock-purchase-receipts"
const voucherInlineInputClassName =
  "h-9 rounded-none border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
const purchaseReceiptStatusOptions: BillingPurchaseReceiptStatus[] = [
  "draft",
  "open",
  "partially_received",
  "fully_received",
  "cancelled",
]

function createPurchaseReceiptLineForm(warehouseId = "warehouse:default"): PurchaseReceiptLineForm {
  return {
    productId: "",
    productName: "",
    variantId: "",
    variantName: "",
    warehouseId,
    quantity: "1",
    unit: "Nos",
    unitCost: "0",
    note: "",
  }
}

function createPurchaseReceiptForm(): PurchaseReceiptForm {
  return {
    receiptNumber: "",
    supplierName: "",
    supplierLedgerId: "",
    postingDate: new Date().toISOString().slice(0, 10),
    warehouseId: "warehouse:default",
    warehouseName: "Default Warehouse",
    sourceVoucherId: "",
    sourceFrappeReceiptId: "",
    status: "draft",
    note: "",
    lines: [createPurchaseReceiptLineForm()],
  }
}

function toPurchaseReceiptForm(item: BillingPurchaseReceipt): PurchaseReceiptForm {
  return {
    receiptNumber: item.receiptNumber,
    supplierName: item.supplierName,
    supplierLedgerId: item.supplierLedgerId ?? "",
    postingDate: item.postingDate,
    warehouseId: item.warehouseId,
    warehouseName: item.warehouseName,
    sourceVoucherId: item.sourceVoucherId ?? "",
    sourceFrappeReceiptId: item.sourceFrappeReceiptId ?? "",
    status: item.status,
    note: item.note,
    lines: item.lines.map((line) => ({
      productId: line.productId,
      productName: line.productName,
      variantId: line.variantId ?? "",
      variantName: line.variantName ?? "",
      warehouseId: line.warehouseId,
      quantity: String(line.quantity),
      unit: line.unit,
      unitCost: String(line.unitCost),
      note: line.note,
    })),
  }
}

function toPurchaseReceiptPayload(form: PurchaseReceiptForm): BillingPurchaseReceiptUpsertPayload {
  return {
    receiptNumber: form.receiptNumber,
    supplierName: form.supplierName,
    supplierLedgerId: form.supplierLedgerId.trim() || null,
    postingDate: form.postingDate,
    warehouseId: form.warehouseId,
    warehouseName: form.warehouseName,
    sourceVoucherId: form.sourceVoucherId.trim() || null,
    sourceFrappeReceiptId: form.sourceFrappeReceiptId.trim() || null,
    status: form.status,
    note: form.note,
    lines: form.lines.map((line) => ({
      productId: line.productId,
      productName: line.productName,
      variantId: line.variantId.trim() || null,
      variantName: line.variantName.trim() || null,
      warehouseId: line.warehouseId,
      quantity: Number(line.quantity || 0),
      unit: line.unit || "Nos",
      unitCost: Number(line.unitCost || 0),
      note: line.note,
    })),
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
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

  return (await response.json()) as T
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date)
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date)
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value)
}

function statusBadgeVariant(status: BillingPurchaseReceiptStatus) {
  return status === "fully_received" ? "secondary" : status === "cancelled" ? "outline" : "default"
}

function buildStatusFilters(
  statusFilter: StatusFilterValue,
  onChange: (value: StatusFilterValue) => void
) {
  const options = [
    { key: "all", label: "All receipts", value: "all" as const },
    { key: "draft", label: "Draft", value: "draft" as const },
    { key: "open", label: "Open", value: "open" as const },
    {
      key: "partially_received",
      label: "Partially received",
      value: "partially_received" as const,
    },
    {
      key: "fully_received",
      label: "Fully received",
      value: "fully_received" as const,
    },
    { key: "cancelled", label: "Cancelled", value: "cancelled" as const },
  ]

  return {
    options: options.map((option) => ({
      key: option.key,
      label: option.label,
      isActive: statusFilter === option.value,
      onSelect: () => onChange(option.value),
    })),
    activeFilters:
      statusFilter === "all"
        ? []
        : [
            {
              key: "status",
              label: "Status",
              value: options.find((option) => option.value === statusFilter)?.label ?? statusFilter,
            },
          ],
    onRemoveFilter: (key: string) => {
      if (key === "status") {
        onChange("all")
      }
    },
    onClearAllFilters: () => onChange("all"),
  }
}

function LoadingStateCard({ message }: { message: string }) {
  return (
    <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
      <CardContent className="space-y-4 p-5">
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="space-y-3 rounded-2xl border border-border/70 bg-card/70 p-4"
            >
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-3 w-full animate-pulse rounded bg-muted/80" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-muted/80" />
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  )
}

function StateCard({
  message,
  tone = "default",
}: {
  message: string
  tone?: "default" | "error" | "success"
}) {
  const className =
    tone === "error"
      ? "border-amber-500/40 bg-amber-500/5 text-amber-800"
      : tone === "success"
        ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-700"
        : "border-border/70 text-muted-foreground"

  return (
    <Card className={`rounded-[1.4rem] py-0 shadow-sm ${className}`}>
      <CardContent className="p-4 text-sm">{message}</CardContent>
    </Card>
  )
}

function SectionIntro({
  eyebrow,
  title,
  description,
  technicalName,
}: {
  eyebrow: string
  title: string
  description: string
  technicalName: string
}) {
  return (
    <Card
      className="relative overflow-visible border border-border/70 bg-background/90 shadow-sm"
      data-technical-name={technicalName}
    >
      <TechnicalNameBadge name={technicalName} className="absolute -top-3 right-4 z-20" />
      <CardHeader>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {eyebrow}
        </p>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="max-w-3xl text-sm leading-7">
          {description}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}

function MetricCard({
  label,
  value,
  summary,
  technicalName,
}: {
  label: string
  value: string
  summary: string
  technicalName: string
}) {
  return (
    <Card
      className="relative overflow-visible rounded-[1.3rem] border-border/70 py-0 shadow-sm"
      data-technical-name={technicalName}
    >
      <TechnicalNameBadge name={technicalName} className="absolute -top-3 right-4 z-20" />
      <CardContent className="space-y-2 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        <p className="text-sm leading-6 text-muted-foreground">{summary}</p>
      </CardContent>
    </Card>
  )
}

function usePurchaseReceiptList() {
  const [items, setItems] = useState<BillingPurchaseReceipt[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  useGlobalLoading(isLoading)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setError(null)
      setIsLoading(true)

      try {
        const response = await requestJson<BillingPurchaseReceiptListResponse>(
          "/internal/v1/billing/purchase-receipts"
        )

        if (!cancelled) {
          setItems(response.items)
          setIsLoading(false)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load purchase receipts."
          )
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  return { error, isLoading, items }
}

export function StorefrontPurchaseReceiptsSection() {
  const navigate = useNavigate()
  const { error, isLoading, items } = usePurchaseReceiptList()
  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase()

    return items.filter((item) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          item.receiptNumber,
          item.supplierName,
          item.warehouseName,
          item.sourceFrappeReceiptId ?? "",
          item.sourceVoucherId ?? "",
        ].some((value) => value.toLowerCase().includes(normalizedSearch))

      const matchesStatus = statusFilter === "all" || item.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [items, searchValue, statusFilter])

  const totalRecords = filteredItems.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedItems = filteredItems.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  )
  const openReceipts = items.filter((item) => item.status === "open").length
  const receivedReceipts = items.filter((item) => item.status === "fully_received").length
  const totalUnits = items.reduce(
    (sum, item) => sum + item.lines.reduce((lineSum, line) => lineSum + line.quantity, 0),
    0
  )

  if (isLoading) {
    return <LoadingStateCard message="Loading purchase receipt records..." />
  }

  if (error) {
    return <StateCard message={error} tone="error" />
  }

  return (
    <div className="space-y-4">
      <SectionIntro
        eyebrow="Stock"
        title="Purchase receipts"
        description="Use the same split record flow as product management: review receipt backlog in the list, inspect receiving posture in the detail page, and maintain document rows from a dedicated form while preserving the inline table."
        technicalName="page.ecommerce.stock-purchase-receipts"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Receipt count"
          value={String(items.length)}
          summary="Inbound buying documents currently tracked for ecommerce stock intake."
          technicalName="card.ecommerce.stock-purchase-receipts.count"
        />
        <MetricCard
          label="Open receipts"
          value={String(openReceipts)}
          summary="Receipts still waiting for full physical inward verification."
          technicalName="card.ecommerce.stock-purchase-receipts.open"
        />
        <MetricCard
          label="Planned quantity"
          value={totalUnits.toFixed(2)}
          summary="Total ordered quantity across all tracked purchase receipt lines."
          technicalName="card.ecommerce.stock-purchase-receipts.quantity"
        />
      </div>
      <MasterList
        header={{
          pageTitle: "Purchase Receipts",
          pageDescription:
            "Track local billing-owned purchase receipt documents that feed ecommerce stock entry and downstream inward posting.",
          technicalName: "page.ecommerce.stock-purchase-receipts.list",
          addLabel: "New Purchase Receipt",
          onAddClick: () => {
            void navigate(`${routeBase}/new`)
          },
        }}
        search={{
          value: searchValue,
          onChange: (value) => {
            setSearchValue(value)
            setCurrentPage(1)
          },
          placeholder: "Search receipt number, supplier, warehouse, or source ids",
        }}
        filters={{
          ...buildStatusFilters(statusFilter, (value) => {
            setStatusFilter(value)
            setCurrentPage(1)
          }),
          collapsible: true,
          collapseLabel: "Purchase receipt filters",
          technicalName: "section.ecommerce.stock-purchase-receipts.filters",
        }}
        table={{
          technicalName: "section.ecommerce.stock-purchase-receipts.table",
          columns: [
            {
              id: "receipt",
              header: "Receipt",
              sortable: true,
              accessor: (item) => `${item.receiptNumber} ${item.supplierName}`,
              cell: (item) => (
                <button
                  type="button"
                  className="text-left"
                  onClick={() => {
                    void navigate(`${routeBase}/${encodeURIComponent(item.id)}`)
                  }}
                >
                  <p className="font-medium text-foreground hover:underline hover:underline-offset-2">
                    {item.receiptNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.supplierName}</p>
                </button>
              ),
            },
            {
              id: "postingDate",
              header: "Posting Date",
              sortable: true,
              accessor: (item) => item.postingDate,
              cell: (item) => formatDate(item.postingDate),
            },
            {
              id: "warehouse",
              header: "Warehouse",
              sortable: true,
              accessor: (item) => `${item.warehouseName} ${item.warehouseId}`,
              cell: (item) => (
                <div className="space-y-1">
                  <p className="text-sm text-foreground">{item.warehouseName}</p>
                  <p className="text-xs text-muted-foreground">{item.warehouseId}</p>
                </div>
              ),
            },
            {
              id: "lines",
              header: "Lines",
              sortable: true,
              accessor: (item) => item.lines.length,
              cell: (item) => (
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>{item.lines.length} line(s)</p>
                  <p>
                    {item.lines.reduce((sum, line) => sum + line.quantity, 0).toFixed(2)} qty planned
                  </p>
                </div>
              ),
            },
            {
              id: "received",
              header: "Received",
              sortable: true,
              accessor: (item) =>
                item.lines.reduce((sum, line) => sum + line.receivedQuantity, 0),
              cell: (item) => (
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    {item.lines.reduce((sum, line) => sum + line.receivedQuantity, 0).toFixed(2)} qty
                  </p>
                  <p>
                    {formatMoney(
                      item.lines.reduce((sum, line) => sum + line.quantity * line.unitCost, 0)
                    )}
                  </p>
                </div>
              ),
            },
            {
              id: "status",
              header: "Status",
              sortable: true,
              accessor: (item) => item.status,
              cell: (item) => (
                <Badge variant={statusBadgeVariant(item.status)}>
                  {item.status.replace(/_/g, " ")}
                </Badge>
              ),
            },
            {
              id: "actions",
              header: "Actions",
              cell: (item) => (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 rounded-full px-3 text-xs"
                    onClick={() => {
                      void navigate(`${routeBase}/${encodeURIComponent(item.id)}`)
                    }}
                  >
                    View
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 rounded-full px-3 text-xs"
                    onClick={() => {
                      void navigate(`${routeBase}/${encodeURIComponent(item.id)}/edit`)
                    }}
                  >
                    Edit
                  </Button>
                </div>
              ),
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
              <span>
                Fully received:{" "}
                <span className="font-medium text-foreground">{receivedReceipts}</span>
              </span>
            </div>
          ),
        }}
        pagination={{
          currentPage: safeCurrentPage,
          pageSize,
          totalRecords,
          onPageChange: setCurrentPage,
          onPageSizeChange: (nextPageSize) => {
            setPageSize(nextPageSize)
            setCurrentPage(1)
          },
          pageSizeOptions: [10, 20, 50, 100, 200],
        }}
      />
    </div>
  )
}

export function StorefrontPurchaseReceiptShowSection({
  receiptId,
}: {
  receiptId: string
}) {
  const navigate = useNavigate()
  const [item, setItem] = useState<BillingPurchaseReceipt | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  useGlobalLoading(isLoading)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setError(null)
      setIsLoading(true)

      try {
        const response = await requestJson<BillingPurchaseReceiptResponse>(
          `/internal/v1/billing/purchase-receipt?id=${encodeURIComponent(receiptId)}`
        )

        if (!cancelled) {
          setItem(response.item)
          setIsLoading(false)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load purchase receipt."
          )
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [receiptId])

  if (isLoading) {
    return <LoadingStateCard message="Loading purchase receipt detail..." />
  }

  if (error || !item) {
    return <StateCard message={error ?? "Purchase receipt detail is unavailable."} tone="error" />
  }

  const plannedQuantity = item.lines.reduce((sum, line) => sum + line.quantity, 0)
  const receivedQuantity = item.lines.reduce((sum, line) => sum + line.receivedQuantity, 0)
  const totalValue = item.lines.reduce((sum, line) => sum + line.quantity * line.unitCost, 0)

  return (
    <div className="space-y-4">
      <SectionIntro
        eyebrow="Stock"
        title={item.receiptNumber}
        description="Review the billing-owned purchase receipt before or during inward verification. This detail page keeps the same record-reading tone as product detail screens while exposing the receiving-specific line metrics."
        technicalName="page.ecommerce.stock-purchase-receipts.show"
      />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild className="-ml-3 w-fit">
            <Link to={routeBase}>
              <ArrowLeftIcon className="size-4" />
              Back to purchase receipts
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={statusBadgeVariant(item.status)}>{item.status.replace(/_/g, " ")}</Badge>
            <Badge variant="outline">{item.warehouseName}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void navigate("/dashboard/apps/ecommerce/stock-goods-inward")
            }}
          >
            Open stock entry
          </Button>
          <Button
            type="button"
            onClick={() => {
              void navigate(`${routeBase}/${encodeURIComponent(item.id)}/edit`)
            }}
          >
            <PencilLineIcon className="mr-2 size-4" />
            Edit purchase receipt
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Supplier"
          value={item.supplierName}
          summary="Supplier name captured on the receipt document."
          technicalName="card.ecommerce.stock-purchase-receipts.show.supplier"
        />
        <MetricCard
          label="Planned quantity"
          value={plannedQuantity.toFixed(2)}
          summary="Total quantity expected across receipt lines."
          technicalName="card.ecommerce.stock-purchase-receipts.show.planned"
        />
        <MetricCard
          label="Received quantity"
          value={receivedQuantity.toFixed(2)}
          summary="Quantity already converted into stock entry acceptance."
          technicalName="card.ecommerce.stock-purchase-receipts.show.received"
        />
        <MetricCard
          label="Document value"
          value={formatMoney(totalValue)}
          summary="Planned value derived from quantity and unit cost."
          technicalName="card.ecommerce.stock-purchase-receipts.show.value"
        />
      </div>
      <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
        <CardHeader>
          <CardTitle>Receipt summary</CardTitle>
          <CardDescription>
            Document, source, and audit fields for this purchase receipt record.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Posting date
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">{formatDate(item.postingDate)}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Warehouse
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">{item.warehouseName}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.warehouseId}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Supplier ledger
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">
              {item.supplierLedgerId ?? "-"}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Source voucher
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">{item.sourceVoucherId ?? "-"}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Frappe receipt
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">
              {item.sourceFrappeReceiptId ?? "-"}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Audit
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">{formatDateTime(item.updatedAt)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.createdByUserId ?? "System"}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card/70 p-4 md:col-span-2 xl:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Note
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.note || "No note added."}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
        <CardHeader>
          <CardTitle>Receipt lines</CardTitle>
          <CardDescription>
            Line-level quantity, received posture, and unit-cost breakdown for inward operations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead className="text-right">Ordered</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Line Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {item.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{line.productName}</p>
                      <p className="text-xs text-muted-foreground">{line.productId}</p>
                    </div>
                  </TableCell>
                  <TableCell>{line.variantName ?? "-"}</TableCell>
                  <TableCell>{line.warehouseId}</TableCell>
                  <TableCell className="text-right">{line.quantity.toFixed(2)} {line.unit}</TableCell>
                  <TableCell className="text-right">{line.receivedQuantity.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{formatMoney(line.unitCost)}</TableCell>
                  <TableCell className="text-right">
                    {formatMoney(line.quantity * line.unitCost)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export function StorefrontPurchaseReceiptUpsertSection({
  receiptId,
}: {
  receiptId?: string
}) {
  const navigate = useNavigate()
  const isEditing = Boolean(receiptId)
  const [form, setForm] = useState<PurchaseReceiptForm>(createPurchaseReceiptForm())
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)
  useGlobalLoading(isLoading || isSaving)

  useEffect(() => {
    if (!receiptId) {
      setForm(createPurchaseReceiptForm())
      setIsLoading(false)
      return
    }

    const resolvedReceiptId = receiptId
    let cancelled = false

    async function load() {
      setFormError(null)
      setIsLoading(true)

      try {
        const response = await requestJson<BillingPurchaseReceiptResponse>(
          `/internal/v1/billing/purchase-receipt?id=${encodeURIComponent(resolvedReceiptId)}`
        )

        if (!cancelled) {
          setForm(toPurchaseReceiptForm(response.item))
          setIsLoading(false)
        }
      } catch (loadError) {
        if (!cancelled) {
          setFormError(
            loadError instanceof Error ? loadError.message : "Failed to load purchase receipt."
          )
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [receiptId])

  async function handleSave() {
    setIsSaving(true)
    setFormError(null)
    setFormSuccess(null)

    try {
      const payload = toPurchaseReceiptPayload(form)

      if (receiptId) {
        const resolvedReceiptId = receiptId
        await requestJson<BillingPurchaseReceiptResponse>(
          `/internal/v1/billing/purchase-receipt?id=${encodeURIComponent(resolvedReceiptId)}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          }
        )
      } else {
        await requestJson<BillingPurchaseReceiptResponse>("/internal/v1/billing/purchase-receipts", {
          method: "POST",
          body: JSON.stringify(payload),
        })
      }

      setFormSuccess(isEditing ? "Purchase receipt updated." : "Purchase receipt created.")
      void navigate(routeBase)
    } catch (saveError) {
      setFormError(
        saveError instanceof Error ? saveError.message : "Failed to save purchase receipt."
      )
    } finally {
      setIsSaving(false)
    }
  }

  const lineCount = form.lines.length
  const totalQuantity = form.lines.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  const totalValue = form.lines.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitCost || 0),
    0
  )

  if (isLoading) {
    return <LoadingStateCard message="Loading purchase receipt form..." />
  }

  return (
    <div className="space-y-4">
      <SectionIntro
        eyebrow="Stock"
        title={isEditing ? "Update purchase receipt" : "Create purchase receipt"}
        description="Keep the product-page tone for the record shell, but maintain the existing inline line-item table so receiving teams can edit document rows in place."
        technicalName="page.ecommerce.stock-purchase-receipts.upsert"
      />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild className="-ml-3 w-fit">
            <Link to={routeBase}>
              <ArrowLeftIcon className="size-4" />
              Back to purchase receipts
            </Link>
          </Button>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            {isEditing ? form.receiptNumber || "Update Purchase Receipt" : "Create Purchase Receipt"}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (receiptId) {
                void navigate(routeBase)
                return
              }

              setForm(createPurchaseReceiptForm())
              setFormSuccess(null)
              setFormError(null)
            }}
            disabled={isSaving}
          >
            {isEditing ? "Cancel" : "Reset"}
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving
              ? "Saving..."
              : isEditing
                ? "Update Purchase Receipt"
                : "Save Purchase Receipt"}
          </Button>
        </div>
      </div>
      {formError ? <StateCard message={formError} tone="error" /> : null}
      {formSuccess ? <StateCard message={formSuccess} tone="success" /> : null}
      <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ReceiptTextIcon className="size-5 text-accent" />
            Purchase receipt document
          </CardTitle>
          <CardDescription>
            Maintain supplier, warehouse, source references, and document status before goods inward.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <Label>Receipt Number</Label>
              <Input
                value={form.receiptNumber}
                onChange={(event) =>
                  setForm((current) => ({ ...current, receiptNumber: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Supplier Name</Label>
              <Input
                value={form.supplierName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, supplierName: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Posting Date</Label>
              <Input
                type="date"
                value={form.postingDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, postingDate: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Supplier Ledger Id</Label>
              <Input
                value={form.supplierLedgerId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, supplierLedgerId: event.target.value }))
                }
                placeholder="Optional ledger id"
              />
            </div>
            <div className="space-y-2">
              <Label>Warehouse Id</Label>
              <Input
                value={form.warehouseId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    warehouseId: event.target.value,
                    lines: current.lines.map((line) => ({
                      ...line,
                      warehouseId: event.target.value,
                    })),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Warehouse Name</Label>
              <Input
                value={form.warehouseName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, warehouseName: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Source Voucher Id</Label>
              <Input
                value={form.sourceVoucherId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, sourceVoucherId: event.target.value }))
                }
                placeholder="Optional source voucher id"
              />
            </div>
            <div className="space-y-2">
              <Label>Source Frappe Receipt Id</Label>
              <Input
                value={form.sourceFrappeReceiptId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sourceFrappeReceiptId: event.target.value,
                  }))
                }
                placeholder="Optional ERP receipt id"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    status: value as BillingPurchaseReceiptStatus,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {purchaseReceiptStatusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2 xl:col-span-3">
              <Label>Note</Label>
              <Textarea
                className="min-h-24"
                value={form.note}
                onChange={(event) =>
                  setForm((current) => ({ ...current, note: event.target.value }))
                }
              />
            </div>
          </div>
          <VoucherInlineEditableTable
            title="Receipt line items"
            description="Keep this inline table for purchase-receipt editing. Totals and downstream goods-inward verification continue to derive from these rows."
            rows={form.lines}
            onAddRow={() =>
              setForm((current) => ({
                ...current,
                lines: [...current.lines, createPurchaseReceiptLineForm(current.warehouseId)],
              }))
            }
            onRemoveRow={(index) =>
              setForm((current) => ({
                ...current,
                lines:
                  current.lines.length === 1
                    ? current.lines
                    : current.lines.filter((_, itemIndex) => itemIndex !== index),
              }))
            }
            columns={[
              {
                id: "productId",
                header: "Product Id",
                renderCell: (line: PurchaseReceiptLineForm, index: number) => (
                  <Input
                    value={line.productId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        lines: current.lines.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, productId: event.target.value } : item
                        ),
                      }))
                    }
                    className={voucherInlineInputClassName}
                  />
                ),
              },
              {
                id: "productName",
                header: "Product Name",
                renderCell: (line: PurchaseReceiptLineForm, index: number) => (
                  <Input
                    value={line.productName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        lines: current.lines.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, productName: event.target.value } : item
                        ),
                      }))
                    }
                    className={voucherInlineInputClassName}
                  />
                ),
              },
              {
                id: "variantName",
                header: "Variant",
                renderCell: (line: PurchaseReceiptLineForm, index: number) => (
                  <Input
                    value={line.variantName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        lines: current.lines.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, variantName: event.target.value }
                            : item
                        ),
                      }))
                    }
                    className={voucherInlineInputClassName}
                  />
                ),
              },
              {
                id: "quantity",
                header: "Quantity",
                headerClassName: "text-right",
                cellClassName: "text-right",
                renderCell: (line: PurchaseReceiptLineForm, index: number) => (
                  <Input
                    value={line.quantity}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        lines: current.lines.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, quantity: event.target.value } : item
                        ),
                      }))
                    }
                    className={voucherInlineInputClassName}
                  />
                ),
              },
              {
                id: "unit",
                header: "Unit",
                renderCell: (line: PurchaseReceiptLineForm, index: number) => (
                  <Input
                    value={line.unit}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        lines: current.lines.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, unit: event.target.value } : item
                        ),
                      }))
                    }
                    className={voucherInlineInputClassName}
                  />
                ),
              },
              {
                id: "unitCost",
                header: "Unit Cost",
                headerClassName: "text-right",
                cellClassName: "text-right",
                renderCell: (line: PurchaseReceiptLineForm, index: number) => (
                  <Input
                    value={line.unitCost}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        lines: current.lines.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, unitCost: event.target.value } : item
                        ),
                      }))
                    }
                    className={voucherInlineInputClassName}
                  />
                ),
              },
              {
                id: "note",
                header: "Note",
                renderCell: (line: PurchaseReceiptLineForm, index: number) => (
                  <Input
                    value={line.note}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        lines: current.lines.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, note: event.target.value } : item
                        ),
                      }))
                    }
                    className={voucherInlineInputClassName}
                  />
                ),
              },
            ]}
            footer={
              <>
                <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Line count
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{lineCount}</p>
                </div>
                <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Planned quantity
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    {totalQuantity.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Estimated value
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    {formatMoney(totalValue)}
                  </p>
                </div>
                <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Warehouse
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {form.warehouseName || "Not set"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {form.warehouseId || "Enter the warehouse id for inward posting."}
                  </p>
                </div>
              </>
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}
