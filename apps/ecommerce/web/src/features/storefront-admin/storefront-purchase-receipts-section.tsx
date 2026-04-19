import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeftIcon, EyeIcon, PencilLineIcon, ReceiptTextIcon } from "lucide-react"

import type {
  BillingPurchaseReceipt,
  BillingPurchaseReceiptListResponse,
  BillingPurchaseReceiptResponse,
  BillingPurchaseReceiptStatus,
  BillingPurchaseReceiptUpsertPayload,
} from "@billing/shared"
import type {
  ContactListResponse,
  ContactResponse,
  ContactSummary,
  ContactUpsertPayload,
  ProductListResponse,
} from "@core/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { formatHttpErrorMessage } from "@cxapp/web/src/lib/http-error"
import { MasterList } from "@/components/blocks/master-list"
import { RecordActionMenu } from "@/components/blocks/record-action-menu"
import { VoucherInlineEditableTable } from "@/components/blocks/voucher-inline-editable-table"
import { TechnicalNameBadge } from "@/components/system/technical-name-badge"
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
import { SearchableLookupField } from "@/features/forms/searchable-lookup-field"
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
  registerEntryNumber: string
  receiptNumber: string
  supplierName: string
  supplierReferenceNumber: string
  supplierReferenceDate: string
  postingDate: string
  warehouseId: string
  warehouseName: string
  sourceVoucherId: string
  sourceFrappeReceiptId: string
  status: BillingPurchaseReceiptStatus
  note: string
  lines: PurchaseReceiptLineForm[]
}

type PurchaseReceiptView = {
  id: string
  registerEntryNumber: string
  receiptNumber: string
  supplierName: string
  supplierReferenceNumber: string | null
  supplierReferenceDate: string | null
  postingDate: string
  warehouseId: string
  warehouseName: string
  sourceVoucherId: string | null
  sourceFrappeReceiptId: string | null
  status: BillingPurchaseReceiptStatus
  note: string
  createdAt: string
  updatedAt: string
  createdByUserId: string | null
  lines: PurchaseReceiptLineForm[]
}

type StatusFilterValue = "all" | BillingPurchaseReceiptStatus
type ProductLookupItem = ProductListResponse["items"][number]
type ProductLookupOption = {
  label: string
  value: string
}
type SupplierContactDraft = {
  contactPerson: string
  gstin: string
  name: string
  phone: string
}

const routeBase = "/dashboard/apps/ecommerce/stock-purchase-receipts"
const voucherInlineInputClassName =
  "h-8 rounded-none border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
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
    registerEntryNumber: "",
    receiptNumber: "",
    supplierName: "",
    supplierReferenceNumber: "",
    supplierReferenceDate: "",
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
  const adapted = toPurchaseReceiptView(item)
  return {
    registerEntryNumber: adapted.registerEntryNumber,
    receiptNumber: adapted.receiptNumber,
    supplierName: adapted.supplierName,
    supplierReferenceNumber: adapted.supplierReferenceNumber ?? "",
    supplierReferenceDate: adapted.supplierReferenceDate ?? "",
    postingDate: adapted.postingDate,
    warehouseId: adapted.warehouseId,
    warehouseName: adapted.warehouseName,
    sourceVoucherId: "",
    sourceFrappeReceiptId: "",
    status: adapted.status,
    note: adapted.note,
    lines: adapted.lines,
  }
}

function toPurchaseReceiptPayload(
  form: PurchaseReceiptForm,
  fallbackRegisterEntryNumber: string
): BillingPurchaseReceiptUpsertPayload {
  const resolvedRegisterEntryNumber =
    form.registerEntryNumber.trim() || fallbackRegisterEntryNumber

  return {
    entryNumber: resolvedRegisterEntryNumber,
    supplierId: form.supplierName,
    supplierReferenceNumber: form.supplierReferenceNumber.trim() || null,
    supplierReferenceDate: form.supplierReferenceDate.trim() || null,
    postingDate: form.postingDate,
    warehouseId: form.warehouseId,
    status: form.status,
    lines: form.lines.map((line) => ({
      productId: line.productId,
      description: line.variantName.trim() || null,
      quantity: Number(line.quantity || 0),
      rate: Number(line.unitCost || 0),
      amount: Number((Number(line.quantity || 0) * Number(line.unitCost || 0)).toFixed(2)),
      notes: line.note,
    })),
  }
}

function toPurchaseReceiptView(item: BillingPurchaseReceipt): PurchaseReceiptView {
  return {
    id: item.id,
    registerEntryNumber: item.entryNumber,
    receiptNumber: item.entryNumber,
    supplierName: item.supplierId,
    supplierReferenceNumber: item.supplierReferenceNumber ?? null,
    supplierReferenceDate: item.supplierReferenceDate ?? null,
    postingDate: item.postingDate,
    warehouseId: item.warehouseId,
    warehouseName: item.warehouseId,
    sourceVoucherId: null,
    sourceFrappeReceiptId: null,
    status: item.status,
    note: "",
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    createdByUserId: item.createdByUserId,
    lines: item.lines.map((line) => ({
      productId: line.productId,
      productName: line.productId,
      variantId: "",
      variantName: line.description ?? "",
      warehouseId: item.warehouseId,
      quantity: String(line.quantity ?? 0),
      unit: "Nos",
      unitCost: String(line.rate ?? 0),
      note: line.notes ?? "",
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

function formatQuantity(value: number) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

const purchaseReceiptRegisterEntryPattern = /^(\d+)$/

function getNextRegisterEntryNumber(
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

function createSupplierContactDraft(name = ""): SupplierContactDraft {
  return {
    contactPerson: "",
    gstin: "",
    name,
    phone: "",
  }
}

function buildSupplierContactPayload(draft: SupplierContactDraft): ContactUpsertPayload {
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

function buildSupplierContactOptions(
  contacts: ContactSummary[],
  currentSupplierName: string
): ProductLookupOption[] {
  const options = contacts
    .filter((contact) => contact.isActive)
    .map((contact) => ({
      value: contact.id,
      label: contact.name,
    }))

  if (currentSupplierName.trim() && !options.some((option) => option.value === currentSupplierName.trim())) {
    options.unshift({
      value: `manual:${currentSupplierName.trim()}`,
      label: currentSupplierName.trim(),
    })
  }

  return options
}

function resolveSelectedSupplierContactValue(
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

function getPurchaseReceiptLineAmount(line: PurchaseReceiptLineForm) {
  return Number(line.quantity || 0) * Number(line.unitCost || 0)
}

function getProductLookupOptions(products: ProductLookupItem[]): ProductLookupOption[] {
  return products
    .filter((product) => product.isActive)
    .map((product) => ({
      value: product.id,
      label: `${product.name} (${product.code})`,
    }))
}

function getPurchaseReceiptLineProductOptions(
  line: PurchaseReceiptLineForm,
  productOptions: ProductLookupOption[],
  index: number
) {
  if (line.productId && !productOptions.some((option) => option.value === line.productId)) {
    return [
      {
        value: line.productId,
        label: line.productName ? `${line.productName} (${line.productId})` : line.productId,
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

function createPurchaseReceiptProductPatch(
  product: ProductLookupItem,
  line: PurchaseReceiptLineForm
): Partial<PurchaseReceiptLineForm> {
  return {
    productId: product.id,
    productName: product.name,
    unitCost: product.costPrice > 0 ? String(product.costPrice) : line.unitCost,
  }
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
  const [items, setItems] = useState<PurchaseReceiptView[]>([])
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
          setItems(response.items.map(toPurchaseReceiptView))
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

  return { error, isLoading, items, setItems }
}

export function StorefrontPurchaseReceiptsSection() {
  const navigate = useNavigate()
  const { error, isLoading, items, setItems } = usePurchaseReceiptList()
  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [pendingDeleteItem, setPendingDeleteItem] = useState<PurchaseReceiptView | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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
    (sum, item) =>
      sum + item.lines.reduce((lineSum, line) => lineSum + Number(line.quantity || 0), 0),
    0
  )

  async function handleDeleteReceipt() {
    if (!pendingDeleteItem) {
      return
    }

    setIsDeleting(true)

    try {
      await requestJson<{ deleted: true; id: string }>(
        `/internal/v1/billing/purchase-receipt?id=${encodeURIComponent(pendingDeleteItem.id)}`,
        { method: "DELETE" }
      )

      setItems((current) => current.filter((item) => item.id !== pendingDeleteItem.id))
      showRecordToast({
        entity: "Purchase receipt",
        action: "deleted",
        recordName: pendingDeleteItem.receiptNumber,
      })
      setPendingDeleteItem(null)
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
            "Track local billing-owned purchase receipt documents that cover receipt verification and downstream inventory posting.",
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
          placeholder: "Search entry number, supplier, warehouse, or supplier ref",
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
              accessor: (item) =>
                `${item.receiptNumber} ${item.registerEntryNumber ?? ""} ${item.supplierName} ${item.supplierReferenceNumber ?? ""}`,
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
                  <p className="text-xs text-muted-foreground">
                    Register {item.registerEntryNumber ?? "Not assigned"}
                  </p>
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
                    {formatQuantity(
                      item.lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0)
                    )} qty planned
                  </p>
                </div>
              ),
            },
            {
              id: "value",
              header: "Value",
              sortable: true,
              accessor: (item) =>
                item.lines.reduce(
                  (sum, line) => sum + Number(line.quantity || 0) * Number(line.unitCost || 0),
                  0
                ),
              cell: (item) => (
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    {formatMoney(
                      item.lines.reduce(
                        (sum, line) =>
                          sum + Number(line.quantity || 0) * Number(line.unitCost || 0),
                        0
                      )
                    )}
                  </p>
                  <p>{item.supplierReferenceNumber ?? "-"}</p>
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
                <RecordActionMenu
                  itemLabel={item.receiptNumber}
                  editLabel="Edit purchase receipt"
                  customItems={[
                    {
                      key: "view",
                      label: "View purchase receipt",
                      icon: <EyeIcon className="size-4" />,
                      onSelect: () => {
                        void navigate(`${routeBase}/${encodeURIComponent(item.id)}`)
                      },
                    },
                  ]}
                  onEdit={() => {
                    void navigate(`${routeBase}/${encodeURIComponent(item.id)}/edit`)
                  }}
                  onDelete={() => {
                    setPendingDeleteItem(item)
                  }}
                />
              ),
              className: "w-20 min-w-20 text-right",
              headerClassName: "w-20 min-w-20 text-right",
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
            <AlertDialogTitle className="text-destructive">
              Delete purchase receipt?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteItem
                ? `This will permanently remove purchase receipt ${pendingDeleteItem.receiptNumber}.`
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
    </div>
  )
}

export function StorefrontPurchaseReceiptShowSection({
  receiptId,
}: {
  receiptId: string
}) {
  const navigate = useNavigate()
  const [item, setItem] = useState<PurchaseReceiptView | null>(null)
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
          setItem(toPurchaseReceiptView(response.item))
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

  const plannedQuantity = item.lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0)
  const totalValue = item.lines.reduce(
    (sum, line) => sum + Number(line.quantity || 0) * Number(line.unitCost || 0),
    0
  )

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
          summary="Supplier id captured on the receipt document."
          technicalName="card.ecommerce.stock-purchase-receipts.show.supplier"
        />
        <MetricCard
          label="Planned quantity"
          value={plannedQuantity.toFixed(2)}
          summary="Total quantity expected across receipt lines."
          technicalName="card.ecommerce.stock-purchase-receipts.show.planned"
        />
        <MetricCard
          label="Status"
          value={item.status.replace(/_/g, " ")}
          summary="Current receipt lifecycle state."
          technicalName="card.ecommerce.stock-purchase-receipts.show.status"
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
            Document and audit fields for this purchase receipt record.
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
              Register entry
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">
              {item.registerEntryNumber ?? "-"}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Supplier ref no
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">
              {item.supplierReferenceNumber ?? "-"}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Supplier ref date
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">
              {item.supplierReferenceDate ? formatDate(item.supplierReferenceDate) : "-"}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Entry number
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">{item.receiptNumber}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Audit
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">{formatDateTime(item.updatedAt)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.createdByUserId ?? "System"}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
        <CardHeader>
          <CardTitle>Purchase items</CardTitle>
          <CardDescription>
            Product, description, quantity, rate, and amount for this purchase receipt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {item.lines.map((line, index) => (
                <TableRow key={`${line.productId}:${index}`}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{line.productName}</p>
                      <p className="text-xs text-muted-foreground">{line.productId}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm text-foreground">{line.variantName ?? "-"}</p>
                      <p className="text-xs text-muted-foreground">
                        {line.note || "-"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatQuantity(Number(line.quantity || 0))}
                  </TableCell>
                  <TableCell className="text-right">{formatMoney(Number(line.unitCost || 0))}</TableCell>
                  <TableCell className="text-right">
                    {formatMoney(Number(line.quantity || 0) * Number(line.unitCost || 0))}
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
  const [purchaseReceipts, setPurchaseReceipts] = useState<BillingPurchaseReceipt[]>([])
  const [products, setProducts] = useState<ProductListResponse["items"]>([])
  const [contacts, setContacts] = useState<ContactSummary[]>([])
  const [createdContacts, setCreatedContacts] = useState<ContactSummary[]>([])
  const [isProductLookupLoading, setIsProductLookupLoading] = useState(false)
  const [isContactLookupLoading, setIsContactLookupLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false)
  const [supplierDraft, setSupplierDraft] = useState<SupplierContactDraft>(createSupplierContactDraft())
  const [supplierCreateError, setSupplierCreateError] = useState<string | null>(null)
  const [supplierCreateSaving, setSupplierCreateSaving] = useState(false)
  useGlobalLoading(
    isLoading ||
      isSaving ||
      isProductLookupLoading ||
      isContactLookupLoading ||
      supplierCreateSaving
  )

  const productOptions = useMemo(() => getProductLookupOptions(products), [products])
  const supplierContacts = useMemo(() => {
    const seen = new Set<string>()
    return [...createdContacts, ...contacts].filter((contact) => {
      if (seen.has(contact.id)) {
        return false
      }

      seen.add(contact.id)
      return true
    })
  }, [contacts, createdContacts])
  const supplierOptions = useMemo(
    () => buildSupplierContactOptions(supplierContacts, form.supplierName),
    [form.supplierName, supplierContacts]
  )
  const selectedSupplierValue = useMemo(
    () => resolveSelectedSupplierContactValue(supplierContacts, form.supplierName),
    [form.supplierName, supplierContacts]
  )
  const nextRegisterEntryNumber = useMemo(
    () => getNextRegisterEntryNumber(purchaseReceipts, receiptId),
    [purchaseReceipts, receiptId]
  )

  useEffect(() => {
    let cancelled = false

    async function loadLookups() {
      setIsProductLookupLoading(true)
      setIsContactLookupLoading(true)
      try {
        const [productResponse, contactResponse, receiptResponse] = await Promise.all([
          requestJson<ProductListResponse>("/internal/v1/core/products"),
          requestJson<ContactListResponse>("/internal/v1/core/contacts"),
          requestJson<BillingPurchaseReceiptListResponse>("/internal/v1/billing/purchase-receipts"),
        ])
        if (!cancelled) {
          setProducts(productResponse.items)
          setContacts(contactResponse.items)
          setPurchaseReceipts(receiptResponse.items)
        }
      } catch (loadError) {
        if (!cancelled) {
          setFormError(
            loadError instanceof Error ? loadError.message : "Failed to load product lookup."
          )
        }
      } finally {
        if (!cancelled) {
          setIsProductLookupLoading(false)
          setIsContactLookupLoading(false)
        }
      }
    }

    void loadLookups()

    return () => {
      cancelled = true
    }
  }, [])

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
      const payload = toPurchaseReceiptPayload(form, nextRegisterEntryNumber)

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

  const totalQuantity = form.lines.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  const totalValue = form.lines.reduce(
    (sum, item) => sum + getPurchaseReceiptLineAmount(item),
    0
  )

  function updatePurchaseReceiptLine(
    index: number,
    patch: Partial<PurchaseReceiptLineForm>
  ) {
    setForm((current) => ({
      ...current,
      lines: current.lines.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      ),
    }))
  }

  function selectPurchaseReceiptProduct(index: number, productId: string) {
    const selectedProduct = products.find((product) => product.id === productId)
    if (!selectedProduct) {
      return
    }

    setForm((current) => ({
      ...current,
      lines: current.lines.map((line, lineIndex) =>
        lineIndex === index
          ? { ...line, ...createPurchaseReceiptProductPatch(selectedProduct, line) }
          : line
      ),
    }))
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
            {isEditing ? form.registerEntryNumber || "Update Purchase Receipt" : "Create Purchase Receipt"}
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
            Maintain the receipt number, supplier id, warehouse id, and status before inventory posting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Register Entry Number</Label>
              <div className="space-y-2">
                <Input
                  value={form.registerEntryNumber}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, registerEntryNumber: event.target.value }))
                  }
                  placeholder={nextRegisterEntryNumber}
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to auto assign the next number: {nextRegisterEntryNumber}
                </p>
              </div>
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
              <Label>Supplier</Label>
              <SearchableLookupField
                createActionLabel="Create contact"
                error={formError ?? null}
                noResultsMessage="No contacts found."
                onCreateNew={handleOpenCreateSupplier}
                onValueChange={handleSupplierValueChange}
                options={supplierOptions}
                placeholder={isContactLookupLoading ? "Loading..." : "Select supplier"}
                searchPlaceholder="Search contact"
                triggerClassName="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-none focus-visible:border-ring focus-visible:ring-0"
                value={selectedSupplierValue}
              />
            </div>
            <div className="space-y-2">
              <Label>Supplier Ref No</Label>
              <Input
                value={form.supplierReferenceNumber}
                onChange={(event) =>
                  setForm((current) => ({ ...current, supplierReferenceNumber: event.target.value }))
                }
                placeholder="Supplier document number"
              />
            </div>
            <div className="space-y-2">
              <Label>Supplier Ref Date</Label>
              <Input
                type="date"
                value={form.supplierReferenceDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, supplierReferenceDate: event.target.value }))
                }
              />
            </div>
            <div />
            <div className="space-y-2">
              <Label>Warehouse Name</Label>
              <Input
                value={form.warehouseName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    warehouseId: event.target.value,
                  }))
                }
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
            title="Purchase items"
            addLabel="Add item"
            fitToContainer
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
            removeButtonLabel="Remove"
            getRowKey={(line, index) =>
              `purchase-receipt-line:${index}:${line.productId}:${line.productName}`
            }
            columns={[
              {
                id: "product",
                header: "Product",
                width: "34%",
                headerClassName: "min-w-80",
                renderCell: (line: PurchaseReceiptLineForm, index: number) => {
                  const rowOptions = getPurchaseReceiptLineProductOptions(
                    line,
                    productOptions,
                    index
                  )

                  return (
                    <div className="space-y-0.5">
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
                        placeholder={isProductLookupLoading ? "Loading..." : "Select"}
                        searchPlaceholder="Search"
                        triggerClassName="h-8 rounded-none border-0 bg-transparent px-0 shadow-none focus-visible:border-transparent focus-visible:ring-0"
                        value={line.productId || (line.productName ? `manual:${index}` : "")}
                      />
                    </div>
                  )
                },
              },
              {
                id: "description",
                header: "Description",
                width: "28%",
                cellClassName: "max-w-0",
                renderCell: (line: PurchaseReceiptLineForm, index: number) => (
                  <Input
                    aria-label="Description"
                    value={line.variantName}
                    onChange={(event) =>
                      updatePurchaseReceiptLine(index, { variantName: event.target.value })
                    }
                    className={voucherInlineInputClassName}
                  />
                ),
              },
              {
                id: "quantity",
                header: "Qty",
                width: "12%",
                headerClassName: "text-center",
                cellClassName: "text-center",
                renderCell: (line: PurchaseReceiptLineForm, index: number) => (
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.quantity}
                    onChange={(event) =>
                      updatePurchaseReceiptLine(index, { quantity: event.target.value })
                    }
                    className={`${voucherInlineInputClassName} text-center`}
                  />
                ),
              },
              {
                id: "rate",
                header: "Rate",
                width: "14%",
                headerClassName: "text-center",
                cellClassName: "text-center",
                renderCell: (line: PurchaseReceiptLineForm, index: number) => (
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.unitCost}
                    onChange={(event) =>
                      updatePurchaseReceiptLine(index, { unitCost: event.target.value })
                    }
                    className={`${voucherInlineInputClassName} text-center`}
                  />
                ),
              },
              {
                id: "amount",
                header: "Amount",
                width: "14%",
                headerClassName: "text-right",
                cellClassName: "text-right font-medium text-foreground",
                renderCell: (line: PurchaseReceiptLineForm) =>
                  formatMoney(getPurchaseReceiptLineAmount(line)),
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
                <TableCell className="border-r border-border/50 px-0 py-0.5 text-center font-semibold text-foreground">
                  <div className="flex h-6 items-center justify-center">
                    {formatQuantity(totalQuantity)}
                  </div>
                </TableCell>
                <TableCell className="border-r border-border/50 px-0 py-0.5">
                  <div className="h-6" />
                </TableCell>
                <TableCell className="border-r border-border/50 px-0 py-0.5 text-right font-semibold text-foreground">
                  <div className="flex h-6 items-center justify-end px-1.5">
                    {formatMoney(totalValue)}
                  </div>
                </TableCell>
                <TableCell className="px-0 py-0.5">
                  <div className="h-6" />
                </TableCell>
              </TableRow>
            }
          />
          <Dialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
            <DialogContent className="max-w-md p-4">
              <DialogHeader>
                <DialogTitle>Create supplier contact</DialogTitle>
                <DialogDescription>
                  Capture only the supplier essentials now. Remaining contact details can be filled later.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={supplierDraft.name}
                    onChange={(event) =>
                      setSupplierDraft((current) => ({ ...current, name: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={supplierDraft.phone}
                    onChange={(event) =>
                      setSupplierDraft((current) => ({ ...current, phone: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Person</Label>
                  <Input
                    value={supplierDraft.contactPerson}
                    onChange={(event) =>
                      setSupplierDraft((current) => ({
                        ...current,
                        contactPerson: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>GST Number</Label>
                  <Input
                    value={supplierDraft.gstin}
                    onChange={(event) =>
                      setSupplierDraft((current) => ({ ...current, gstin: event.target.value }))
                    }
                  />
                </div>
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
        </CardContent>
      </Card>
    </div>
  )
}


