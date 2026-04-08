import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Link, useNavigate } from "react-router-dom"
import {
  CheckIcon,
  ChevronsUpDownIcon,
  MoreHorizontalIcon,
  PencilLineIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react"

import type {
  BillingAccountingReports,
  BillingAccountingReportsResponse,
  BillingCategory,
  BillingCategoryListResponse,
  BillingCategoryResponse,
  BillingLedger,
  BillingLedgerListResponse,
  BillingLedgerResponse,
  BillingVoucherGroup,
  BillingVoucherGroupListResponse,
  BillingVoucherGroupResponse,
  BillingVoucherMasterType,
  BillingVoucherMasterTypeListResponse,
  BillingVoucherMasterTypeResponse,
  BillingVoucher,
  BillingVoucherLifecycleStatus,
  BillingVoucherListResponse,
  BillingVoucherReverseResponse,
  BillingVoucherResponse,
  BillingVoucherType,
  BillingVoucherUpsertPayload,
} from "@billing/shared"
import { billingVoucherModules, billingWorkspaceItems } from "@billing/shared"
import type { CommonModuleItem, CommonModuleListResponse, ProductListResponse } from "@core/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"
import { ActivityStatusBadge } from "@/features/status/activity-status"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { CommonList, MasterList } from "@/components/blocks/master-list"
import { VoucherInlineEditableTable } from "@/components/blocks/voucher-inline-editable-table"

type ResourceState = {
  error: string | null
  isLoading: boolean
  categories: BillingCategory[]
  hsnCodes: CommonModuleItem[]
  ledgers: BillingLedger[]
  products: ProductListResponse["items"]
  voucherGroups: BillingVoucherGroup[]
  voucherTypes: BillingVoucherMasterType[]
  reports: BillingAccountingReports
  units: CommonModuleItem[]
  vouchers: BillingVoucher[]
}

type StatusFilterValue = "all" | "active" | "inactive"

function matchesStatusFilter(statusFilter: StatusFilterValue, isActive: boolean) {
  if (statusFilter === "all") {
    return true
  }

  return statusFilter === "active" ? isActive : !isActive
}

function buildStatusFilters(
  statusFilter: StatusFilterValue,
  onChange: (value: StatusFilterValue) => void
) {
  return {
    options: [
      {
        key: "all",
        label: "All records",
        isActive: statusFilter === "all",
        onSelect: () => onChange("all"),
      },
      {
        key: "active",
        label: "Active only",
        isActive: statusFilter === "active",
        onSelect: () => onChange("active"),
      },
      {
        key: "inactive",
        label: "Inactive only",
        isActive: statusFilter === "inactive",
        onSelect: () => onChange("inactive"),
      },
    ],
    activeFilters:
      statusFilter === "all"
        ? []
        : [
            {
              key: "status",
              label: "Status",
              value: statusFilter === "active" ? "Active only" : "Inactive only",
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

function createEmptyReports(): BillingAccountingReports {
  return {
    trialBalance: {
      items: [],
      debitTotal: 0,
      creditTotal: 0,
    },
    profitAndLoss: {
      incomeItems: [],
      expenseItems: [],
      totalIncome: 0,
      totalExpense: 0,
      netProfit: 0,
      netLoss: 0,
    },
    balanceSheet: {
      assetItems: [],
      liabilityItems: [],
      totalAssets: 0,
      totalLiabilities: 0,
      balanceGap: 0,
    },
    outstanding: {
      asOfDate: "1970-01-01",
      receivableTotal: 0,
      payableTotal: 0,
      items: [],
    },
    receivableAging: {
      asOfDate: "1970-01-01",
      totalAmount: 0,
      buckets: [],
      items: [],
    },
    payableAging: {
      asOfDate: "1970-01-01",
      totalAmount: 0,
      buckets: [],
      items: [],
    },
    settlementFollowUp: {
      items: [],
    },
    settlementExceptions: {
      advanceTotal: 0,
      onAccountTotal: 0,
      overpaymentTotal: 0,
      items: [],
    },
    partySettlementSummary: {
      items: [],
    },
    generalLedger: {
      items: [],
    },
    customerStatement: {
      items: [],
    },
    supplierStatement: {
      items: [],
    },
  }
}

type VoucherFormLine = {
  amount: string
  ledgerId: string
  note: string
  side: "debit" | "credit"
}

type VoucherBillAllocationForm = {
  amount: string
  dueDate: string
  note: string
  referenceDate: string
  referenceNumber: string
  referenceType: "new_ref" | "against_ref" | "on_account"
}

type SalesItemForm = {
  description: string
  hsnOrSac: string
  itemName: string
  productId: string
  quantity: string
  rate: string
  unit: string
}

type SalesFormState = {
  billToAddress: string
  billToName: string
  customerLedgerId: string
  dueDate: string
  partyGstin: string
  placeOfSupply: string
  referenceNumber: string
  shipToAddress: string
  shipToName: string
  supplyType: "intra" | "inter"
  taxRate: string
  items: SalesItemForm[]
  voucherTypeId: string
}

type LedgerFormState = {
  categoryId: string
  closingAmount: string
  closingSide: "debit" | "credit"
  group: string
  name: string
  nature: "asset" | "liability" | "income" | "expense"
}

type CategoryFormState = {
  description: string
  name: string
}

type VoucherGroupFormState = {
  description: string
  name: string
}

type VoucherTypeFormState = {
  categoryId: string
  description: string
  ledgerId: string
  name: string
  voucherGroupId: string
}

type LookupOption = {
  value: string
  label: string
}

const defaultLedgerForm: LedgerFormState = {
  categoryId: "",
  closingAmount: "0",
  closingSide: "debit",
  group: "",
  name: "",
  nature: "asset",
}

const defaultCategoryForm: CategoryFormState = {
  description: "",
  name: "",
}

const defaultVoucherGroupForm: VoucherGroupFormState = {
  description: "",
  name: "",
}

const defaultVoucherTypeForm: VoucherTypeFormState = {
  categoryId: "",
  description: "",
  ledgerId: "",
  name: "",
  voucherGroupId: "",
}

type VoucherFormState = {
  counterparty: string
  date: string
  billAllocations: VoucherBillAllocationForm[]
  generateEInvoice: boolean
  generateEWayBill: boolean
  sourceVoucherId: string
  status: BillingVoucherLifecycleStatus
  gst: {
    enabled: boolean
    hsnOrSac: string
    partyGstin: string
    partyLedgerId: string
    placeOfSupply: string
    supplyType: "intra" | "inter"
    taxRate: string
    taxableAmount: string
    taxableLedgerId: string
  }
  transport: {
    distanceKm: string
    enabled: boolean
    transporterId: string
    vehicleNumber: string
  }
  lines: VoucherFormLine[]
  narration: string
  sales: SalesFormState
  type: BillingVoucherType
  voucherNumber: string
}

type VoucherReverseRequest = {
  reason: string
  date?: string
}

const defaultSalesItem: SalesItemForm = {
  description: "",
  hsnOrSac: "",
  itemName: "",
  productId: "",
  quantity: "1",
  rate: "",
  unit: "Nos",
}

const defaultSalesForm: SalesFormState = {
  billToAddress: "",
  billToName: "",
  customerLedgerId: "",
  dueDate: "",
  partyGstin: "",
  placeOfSupply: "KA",
  referenceNumber: "",
  shipToAddress: "",
  shipToName: "",
  supplyType: "intra",
  taxRate: "18",
  items: [{ ...defaultSalesItem }],
  voucherTypeId: "",
}

const voucherInlineInputClassName =
  "h-9 rounded-none border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"

const voucherInlineSelectClassName =
  "flex h-9 w-full rounded-none border-0 bg-transparent px-0 py-2 text-sm shadow-none outline-none focus-visible:ring-0"

function createDefaultSalesForm(): SalesFormState {
  return {
    ...defaultSalesForm,
    items: [{ ...defaultSalesItem }],
  }
}

function getCommonModuleText(
  item: CommonModuleItem | null | undefined,
  preferredKeys: string[]
) {
  for (const key of preferredKeys) {
    const value = item?.[key]
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim()
    }
  }

  return ""
}

function createDefaultVoucherForm(): VoucherFormState {
  return {
    billAllocations: [],
    counterparty: "",
    date: "2026-04-01",
    generateEInvoice: false,
    generateEWayBill: false,
    sourceVoucherId: "",
    status: "posted",
    gst: {
      enabled: false,
      hsnOrSac: "",
      partyGstin: "",
      partyLedgerId: "",
      placeOfSupply: "KA",
      supplyType: "intra",
      taxRate: "18",
      taxableAmount: "",
      taxableLedgerId: "",
    },
    transport: {
      distanceKm: "",
      enabled: false,
      transporterId: "",
      vehicleNumber: "",
    },
    lines: [
      { amount: "", ledgerId: "", note: "", side: "debit" },
      { amount: "", ledgerId: "", note: "", side: "credit" },
    ],
    narration: "",
    sales: createDefaultSalesForm(),
    type: "journal",
    voucherNumber: "",
  }
}

class HttpError extends Error {
  readonly statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.name = "HttpError"
    this.statusCode = statusCode
  }
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount)
}

function parsePositiveDecimal(value: string) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 0
}

function getSalesItemAmount(item: SalesItemForm) {
  return parsePositiveDecimal(item.quantity) * parsePositiveDecimal(item.rate)
}

function getSalesSummary(sales: SalesFormState) {
  const subtotal = sales.items.reduce((sum, item) => sum + getSalesItemAmount(item), 0)
  const totalQuantity = sales.items.reduce(
    (sum, item) => sum + parsePositiveDecimal(item.quantity),
    0
  )
  const taxRate = parsePositiveDecimal(sales.taxRate)
  const taxAmount = subtotal * (taxRate / 100)

  return {
    grandTotal: subtotal + taxAmount,
    subtotal,
    taxAmount,
    totalQuantity,
  }
}

function toStatusLabel(status: BillingVoucher["eInvoice"]["status"]) {
  switch (status) {
    case "not_applicable":
      return "N/A"
    case "pending":
      return "Pending"
    case "generated":
      return "Generated"
    case "failed":
      return "Failed"
  }
}

function toVoucherLifecycleLabel(status: BillingVoucherLifecycleStatus) {
  switch (status) {
    case "draft":
      return "Draft"
    case "posted":
      return "Posted"
    case "cancelled":
      return "Cancelled"
    case "reversed":
      return "Reversed"
  }
}

function getVoucherLifecycleBadgeVariant(status: BillingVoucherLifecycleStatus) {
  switch (status) {
    case "posted":
      return "outline" as const
    case "draft":
      return "secondary" as const
    case "cancelled":
    case "reversed":
      return "destructive" as const
  }
}

function titleFromVoucherType(type: BillingVoucherType) {
  switch (type) {
    case "payment":
      return "Payment"
    case "receipt":
      return "Receipt"
    case "sales":
      return "Sales"
    case "credit_note":
      return "Credit Note"
    case "purchase":
      return "Purchase"
    case "debit_note":
      return "Debit Note"
    case "contra":
      return "Contra"
    case "journal":
      return "Journal"
  }
}

function getVoucherPostingRoute(voucherType: BillingVoucherType, voucherId: string) {
  const encodedVoucherId = encodeURIComponent(voucherId)

  switch (voucherType) {
    case "payment":
      return `/dashboard/billing/payment-vouchers/${encodedVoucherId}/edit`
    case "receipt":
      return `/dashboard/billing/receipt-vouchers/${encodedVoucherId}/edit`
    case "sales":
      return `/dashboard/billing/sales-vouchers/${encodedVoucherId}/edit`
    case "credit_note":
      return `/dashboard/billing/credit-note/${encodedVoucherId}/edit`
    case "purchase":
      return `/dashboard/billing/purchase-vouchers/${encodedVoucherId}/edit`
    case "debit_note":
      return `/dashboard/billing/debit-note/${encodedVoucherId}/edit`
    default:
      return null
  }
}

function getVoucherTotals(voucher: Pick<BillingVoucher, "lines">) {
  return voucher.lines.reduce(
    (totals, line) => {
      if (line.side === "debit") {
        totals.debit += line.amount
      } else {
        totals.credit += line.amount
      }

      return totals
    },
    { credit: 0, debit: 0 }
  )
}

function isVoucherBalanced(voucher: Pick<BillingVoucher, "lines">) {
  const totals = getVoucherTotals(voucher)
  return totals.debit === totals.credit && totals.debit > 0
}

async function request<T>(path: string, init?: RequestInit) {
  const accessToken = getStoredAccessToken()
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      ...(init?.headers ?? {}),
    },
  })

  const payload = (await response.json().catch(() => null)) as
    | T
    | { error?: string; message?: string }
    | null

  if (!response.ok) {
    const message =
      payload && typeof payload === "object"
        ? ("error" in payload && payload.error) ||
          ("message" in payload && payload.message) ||
          "Request failed."
        : "Request failed."

    throw new HttpError(String(message), response.status)
  }

  return payload as T
}

function toVoucherForm(voucher: BillingVoucher): VoucherFormState {
  return {
    billAllocations: voucher.billAllocations.map((item) => ({
      amount: String(item.amount),
      dueDate: item.dueDate ?? "",
      note: item.note,
      referenceDate: item.referenceDate ?? "",
      referenceNumber: item.referenceNumber,
      referenceType: item.referenceType,
    })),
    counterparty: voucher.counterparty,
    date: voucher.date,
    generateEInvoice: voucher.eInvoice.status === "generated",
    generateEWayBill: voucher.eWayBill.status === "generated",
    sourceVoucherId: voucher.sourceDocument?.voucherId ?? "",
    status: voucher.status,
    gst: {
      enabled: voucher.gst !== null,
      hsnOrSac: voucher.gst?.hsnOrSac ?? "",
      partyGstin: voucher.gst?.partyGstin ?? "",
      partyLedgerId: voucher.gst?.partyLedgerId ?? "",
      placeOfSupply: voucher.gst?.placeOfSupply ?? "KA",
      supplyType: voucher.gst?.supplyType ?? "intra",
      taxRate: voucher.gst ? String(voucher.gst.taxRate) : "18",
      taxableAmount: voucher.gst ? String(voucher.gst.taxableAmount) : "",
      taxableLedgerId: voucher.gst?.taxableLedgerId ?? "",
    },
    transport: {
      distanceKm: voucher.eWayBill.distanceKm ? String(voucher.eWayBill.distanceKm) : "",
      enabled: voucher.eWayBill.status === "generated" || voucher.eWayBill.status === "pending",
      transporterId: voucher.eWayBill.transporterId ?? "",
      vehicleNumber: voucher.eWayBill.vehicleNumber ?? "",
    },
      lines: voucher.lines.map((line) => ({
        amount: String(line.amount),
        ledgerId: line.ledgerId,
        note: line.note,
        side: line.side,
    })),
    narration: voucher.narration,
    sales: voucher.sales
      ? {
          billToAddress: voucher.sales.billToAddress,
          billToName: voucher.sales.billToName,
          customerLedgerId: voucher.sales.customerLedgerId,
          dueDate: voucher.sales.dueDate ?? "",
          partyGstin: voucher.sales.partyGstin ?? "",
          placeOfSupply: voucher.sales.placeOfSupply,
          referenceNumber: voucher.sales.referenceNumber ?? "",
          shipToAddress: voucher.sales.shipToAddress ?? "",
          shipToName: voucher.sales.shipToName ?? "",
          supplyType: voucher.sales.supplyType,
          taxRate: String(voucher.sales.taxRate),
          items: voucher.sales.items.map((item) => ({
            description: item.description,
            hsnOrSac: item.hsnOrSac,
            itemName: item.itemName,
            productId: "",
            quantity: String(item.quantity),
            rate: String(item.rate),
            unit: item.unit,
          })),
          voucherTypeId: voucher.sales.voucherTypeId,
        }
      : createDefaultSalesForm(),
    type: voucher.type,
    voucherNumber: voucher.voucherNumber,
  }
}

function toLedgerForm(ledger?: BillingLedger | null): LedgerFormState {
  if (!ledger) {
    return defaultLedgerForm
  }

  return {
    categoryId: ledger.categoryId,
    closingAmount: String(ledger.closingAmount),
    closingSide: ledger.closingSide,
    group: ledger.group,
    name: ledger.name,
    nature: ledger.nature,
  }
}

function buildLedgerPayload(
  form: LedgerFormState,
  categories: BillingCategory[],
  activeLedger?: BillingLedger | null
) {
  const normalizedName = form.name.trim()
  const resolvedCategoryId = form.categoryId || activeLedger?.categoryId || ""
  const selectedCategory =
    categories.find((category) => category.id === resolvedCategoryId) ?? null
  const closingAmount = Number(form.closingAmount)
  const inferredGroup =
    activeLedger?.group?.trim() ||
    selectedCategory?.name?.trim() ||
    "General"
  const inferredNature =
    activeLedger?.nature ||
    selectedCategory?.nature ||
    (form.closingSide === "credit" ? "liability" : "asset")

  if (!normalizedName) {
    throw new Error("Ledger name is required.")
  }

  if (!resolvedCategoryId) {
    throw new Error("Category is required.")
  }

  if (!Number.isFinite(closingAmount) || closingAmount < 0) {
    throw new Error("Closing amount must be a valid non-negative number.")
  }

  return {
    name: normalizedName,
    categoryId: resolvedCategoryId,
    group: inferredGroup,
    nature: inferredNature,
    closingSide: form.closingSide,
    closingAmount,
  }
}

function SectionShell({
  children,
  description,
  title,
}: {
  children: React.ReactNode
  description: string
  title: string
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
      {children}
    </div>
  )
}

function MetricCard({
  hint,
  label,
  value,
}: {
  hint: string
  label: string
  value: string | number
}) {
  return (
    <Card>
      <CardContent className="space-y-2 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        <p className="text-sm leading-6 text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  )
}

function StateCard({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="p-5 text-sm text-muted-foreground">{message}</CardContent>
    </Card>
  )
}

function ComplianceBadges({ voucher }: { voucher: BillingVoucher }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant={getVoucherLifecycleBadgeVariant(voucher.status)}>
        {toVoucherLifecycleLabel(voucher.status)}
      </Badge>
      <Badge variant="outline">{voucher.financialYear.label}</Badge>
      {voucher.billAllocations.length > 0 ? (
        <Badge variant="outline">{voucher.billAllocations.length} bill refs</Badge>
      ) : null}
      {voucher.gst ? <Badge variant="outline">GST {voucher.gst.taxRate}%</Badge> : null}
      <Badge variant={voucher.eInvoice.status === "generated" ? "outline" : "secondary"}>
        E-invoice {toStatusLabel(voucher.eInvoice.status)}
      </Badge>
      <Badge variant={voucher.eWayBill.status === "generated" ? "outline" : "secondary"}>
        E-way {toStatusLabel(voucher.eWayBill.status)}
      </Badge>
    </div>
  )
}

function VoucherComplianceCard({ voucher }: { voucher: BillingVoucher | null }) {
  if (!voucher) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance</CardTitle>
          <CardDescription>
            Financial year, bill references, e-invoice, and e-way bill output appear here after posting.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance</CardTitle>
        <CardDescription>
          Posted voucher metadata prepared for Indian GST operations and downstream integrations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Lifecycle
            </p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {toVoucherLifecycleLabel(voucher.status)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Lifecycle state defined for controlled billing posting flows.
            </p>
          </div>
          <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Financial year
            </p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {voucher.financialYear.label}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {voucher.financialYear.startDate} to {voucher.financialYear.endDate}
            </p>
          </div>
          <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Sequence
            </p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {voucher.financialYear.prefix}-{String(voucher.financialYear.sequenceNumber).padStart(3, "0")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Voucher number {voucher.voucherNumber}
            </p>
          </div>
        </div>

        {voucher.reversalOfVoucherNumber || voucher.reversedByVoucherNumber ? (
          <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
            <p className="font-semibold text-foreground">Reversal tracking</p>
            {voucher.reversalOfVoucherNumber ? (
              <p className="mt-2 text-sm text-muted-foreground">
                This voucher reverses {voucher.reversalOfVoucherNumber}.
              </p>
            ) : null}
            {voucher.reversedByVoucherNumber ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Reversed by {voucher.reversedByVoucherNumber}
                {voucher.reversedAt ? ` on ${voucher.reversedAt.slice(0, 10)}` : ""}.
              </p>
            ) : null}
            {voucher.reversalReason ? (
              <p className="mt-1 text-sm text-muted-foreground">{voucher.reversalReason}</p>
            ) : null}
          </div>
        ) : null}

        {voucher.billAllocations.length > 0 ? (
          <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
            <p className="font-semibold text-foreground">Bill-wise adjustments</p>
            <div className="mt-3 space-y-2">
              {voucher.billAllocations.map((allocation) => (
                <div
                  key={allocation.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-foreground">
                    {allocation.referenceNumber}
                  </span>
                  <span className="text-muted-foreground">{allocation.referenceType}</span>
                  <span className="text-muted-foreground">{formatAmount(allocation.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
            <p className="font-semibold text-foreground">E-invoice</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Status: {toStatusLabel(voucher.eInvoice.status)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              IRN: {voucher.eInvoice.irn ?? "Not generated"}
            </p>
            {voucher.eInvoice.errorMessage ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {voucher.eInvoice.errorMessage}
              </p>
            ) : null}
          </div>
          <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
            <p className="font-semibold text-foreground">E-way bill</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Status: {toStatusLabel(voucher.eWayBill.status)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              No: {voucher.eWayBill.ewayBillNo ?? "Not generated"}
            </p>
            {voucher.eWayBill.errorMessage ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {voucher.eWayBill.errorMessage}
              </p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function VoucherRegisterTable({ vouchers }: { vouchers: BillingVoucher[] }) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Voucher</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Counterparty</TableHead>
              <TableHead>Narration</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>FY / Compliance</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vouchers.map((voucher) => {
              const totals = getVoucherTotals(voucher)

              return (
                <TableRow key={voucher.id}>
                  <TableCell>{voucher.date}</TableCell>
                  <TableCell className="font-medium">{voucher.voucherNumber}</TableCell>
                  <TableCell>{titleFromVoucherType(voucher.type)}</TableCell>
                  <TableCell>{voucher.counterparty}</TableCell>
                  <TableCell className="max-w-[26rem] text-muted-foreground">
                    {voucher.narration}
                  </TableCell>
                  <TableCell>{formatAmount(totals.debit)}</TableCell>
                  <TableCell>
                    <ComplianceBadges voucher={voucher} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={isVoucherBalanced(voucher) ? "outline" : "destructive"}>
                      {isVoucherBalanced(voucher) ? "Balanced" : "Mismatch"}
                    </Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function VoucherEditor({
  form,
  formError,
  isSaving,
  ledgers,
  onChange,
  onDelete,
  onBillAllocationChange,
  onBillAllocationCreate,
  onBillAllocationRemove,
  onLineChange,
  onLineCreate,
  onLineRemove,
  onReset,
  onSave,
  selectedVoucher,
}: {
  form: VoucherFormState
  formError: string | null
  isSaving: boolean
  ledgers: BillingLedger[]
  onChange: (field: string, value: string) => void
  onDelete: () => void
  onBillAllocationChange: (
    index: number,
    field: keyof VoucherBillAllocationForm,
    value: string
  ) => void
  onBillAllocationCreate: () => void
  onBillAllocationRemove: (index: number) => void
  onLineChange: (
    index: number,
    field: keyof VoucherFormLine,
    value: string
  ) => void
  onLineCreate: () => void
  onLineRemove: (index: number) => void
  onReset: () => void
  onSave: () => void
  selectedVoucher: BillingVoucher | null
}) {
  const isMutableVoucher = selectedVoucher === null || selectedVoucher.status === "draft"
  const provisionalVoucher = {
    lines:
      form.gst.enabled && ["sales", "purchase"].includes(form.type)
        ? []
        : form.lines.map((line) => ({
            amount: Number(line.amount || 0),
            side: line.side,
          })),
  } as Pick<BillingVoucher, "lines">
  const totals = getVoucherTotals(provisionalVoucher)
  const gstTaxableAmount = Number(form.gst.taxableAmount || 0)
  const gstRate = Number(form.gst.taxRate || 0)
  const gstTotalTax = Number(((gstTaxableAmount * gstRate) / 100).toFixed(2))
  const gstCgst =
    form.gst.supplyType === "intra" ? Number((gstTotalTax / 2).toFixed(2)) : 0
  const gstSgst =
    form.gst.supplyType === "intra" ? Number((gstTotalTax / 2).toFixed(2)) : 0
  const gstIgst = form.gst.supplyType === "inter" ? gstTotalTax : 0
  const gstInvoiceAmount = Number((gstTaxableAmount + gstTotalTax).toFixed(2))
  const gstModeEnabled = form.gst.enabled && ["sales", "purchase"].includes(form.type)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {selectedVoucher
            ? isMutableVoucher
              ? "Edit Voucher"
              : "View Voucher"
            : "Create Voucher"}
        </CardTitle>
        <CardDescription>
          Create or update payment, receipt, sales, purchase, contra, and journal vouchers with visible debit and credit lines.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="voucher-number">
              Voucher number
            </label>
            <Input
              id="voucher-number"
              value={form.voucherNumber}
              onChange={(event) => onChange("voucherNumber", event.target.value)}
              placeholder="Leave blank for FY auto numbering"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="voucher-date">
              Date
            </label>
            <Input
              id="voucher-date"
              type="date"
              value={form.date}
              onChange={(event) => onChange("date", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="voucher-type">
              Voucher type
            </label>
            <select
              id="voucher-type"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.type}
              onChange={(event) => onChange("type", event.target.value)}
            >
              {(["payment", "receipt", "sales", "purchase", "contra", "journal"] as BillingVoucherType[]).map((type) => (
                <option key={type} value={type}>
                  {titleFromVoucherType(type)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="voucher-status">
              Lifecycle
            </label>
            <select
              id="voucher-status"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.status}
              onChange={(event) => onChange("status", event.target.value)}
            >
              {(["draft", "posted", "cancelled", "reversed"] as BillingVoucherLifecycleStatus[]).map((status) => (
                <option key={status} value={status}>
                  {toVoucherLifecycleLabel(status)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="voucher-counterparty">
              Counterparty
            </label>
            <Input
              id="voucher-counterparty"
              value={form.counterparty}
              onChange={(event) => onChange("counterparty", event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="voucher-narration">
            Narration
          </label>
          <Textarea
            id="voucher-narration"
            value={form.narration}
            onChange={(event) => onChange("narration", event.target.value)}
          />
        </div>

        <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4 text-sm text-muted-foreground">
          {selectedVoucher ? (
            <>
              Lifecycle <span className="font-medium text-foreground">{toVoucherLifecycleLabel(selectedVoucher.status)}</span> in financial year <span className="font-medium text-foreground">{selectedVoucher.financialYear.label}</span> with sequence{" "}
              <span className="font-medium text-foreground">
                {selectedVoucher.financialYear.prefix}-{String(selectedVoucher.financialYear.sequenceNumber).padStart(3, "0")}
              </span>.
            </>
          ) : (
            <>Voucher lifecycle is defined now. Voucher number and financial year sequence will be generated automatically from the posting date if left blank.</>
          )}
        </div>

        {selectedVoucher && !isMutableVoucher ? (
          <div className="rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            {toVoucherLifecycleLabel(selectedVoucher.status)} vouchers are read-only. Keep a voucher in draft for direct editing.
          </div>
        ) : null}

        {["sales", "purchase"].includes(form.type) ? (
          <div className="space-y-4 rounded-[1rem] border border-border/70 bg-card/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">GST posting</p>
                <p className="text-sm text-muted-foreground">
                  Enable GST mode to auto-post tax ledgers for sales and purchase vouchers.
                </p>
              </div>
              <select
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.gst.enabled ? "enabled" : "disabled"}
                onChange={(event) =>
                  onChange("gst", event.target.value === "enabled" ? "enabled" : "disabled")
                }
              >
                <option value="disabled">Manual</option>
                <option value="enabled">GST auto-post</option>
              </select>
            </div>

            {gstModeEnabled ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Input
                    value={form.gst.hsnOrSac}
                    onChange={(event) => onChange("gstHsnOrSac", event.target.value)}
                    placeholder="HSN / SAC"
                  />
                  <AutocompleteLookupField
                    emptyLabel="Select party ledger"
                    onChange={(nextValue) => onChange("gstPartyLedgerId", nextValue)}
                    options={ledgers.map((ledger) => ({
                      value: ledger.id,
                      label: ledger.name,
                    }))}
                    searchPlaceholder="Search party ledger"
                    value={form.gst.partyLedgerId}
                  />
                  <AutocompleteLookupField
                    emptyLabel="Select taxable ledger"
                    onChange={(nextValue) => onChange("gstTaxableLedgerId", nextValue)}
                    options={ledgers.map((ledger) => ({
                      value: ledger.id,
                      label: ledger.name,
                    }))}
                    searchPlaceholder="Search taxable ledger"
                    value={form.gst.taxableLedgerId}
                  />
                  <Input
                    value={form.gst.partyGstin}
                    onChange={(event) => onChange("gstPartyGstin", event.target.value)}
                    placeholder="Party GSTIN"
                  />
                  <Input
                    value={form.gst.placeOfSupply}
                    onChange={(event) => onChange("gstPlaceOfSupply", event.target.value)}
                    placeholder="Place of supply"
                  />
                  <select
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.gst.supplyType}
                    onChange={(event) => onChange("gstSupplyType", event.target.value)}
                  >
                    <option value="intra">Intra-state</option>
                    <option value="inter">Inter-state</option>
                  </select>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.gst.taxableAmount}
                    onChange={(event) => onChange("gstTaxableAmount", event.target.value)}
                    placeholder="Taxable amount"
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.gst.taxRate}
                    onChange={(event) => onChange("gstTaxRate", event.target.value)}
                    placeholder="GST rate"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[1rem] border border-border/70 bg-background/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Taxable
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {formatAmount(gstTaxableAmount)}
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-border/70 bg-background/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      CGST
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {formatAmount(gstCgst)}
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-border/70 bg-background/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      SGST / IGST
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {formatAmount(form.gst.supplyType === "intra" ? gstSgst : gstIgst)}
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-border/70 bg-background/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Invoice total
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {formatAmount(gstInvoiceAmount)}
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex items-center gap-2 rounded-[1rem] border border-border/70 bg-background/80 p-4 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={form.generateEInvoice}
                      onChange={(event) =>
                        onChange("generateEInvoice", event.target.checked ? "true" : "false")
                      }
                    />
                    Generate e-invoice record
                  </label>
                  <label className="flex items-center gap-2 rounded-[1rem] border border-border/70 bg-background/80 p-4 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={form.generateEWayBill}
                      onChange={(event) =>
                        onChange("generateEWayBill", event.target.checked ? "true" : "false")
                      }
                    />
                    Generate e-way bill record
                  </label>
                </div>
                {form.generateEWayBill ? (
                  <div className="grid gap-4 md:grid-cols-3">
                    <Input
                      type="number"
                      min="1"
                      value={form.transport.distanceKm}
                      onChange={(event) => onChange("transportDistanceKm", event.target.value)}
                      placeholder="Distance in KM"
                    />
                    <Input
                      value={form.transport.vehicleNumber}
                      onChange={(event) => onChange("transportVehicleNumber", event.target.value)}
                      placeholder="Vehicle number"
                    />
                    <Input
                      value={form.transport.transporterId}
                      onChange={(event) => onChange("transportTransporterId", event.target.value)}
                      placeholder="Transporter id"
                    />
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        ) : null}

        {["payment", "receipt"].includes(form.type) ? (
          <VoucherInlineEditableTable
            title="Bill-wise adjustments"
            description="Match receipt and payment vouchers against bill references the way Tally operators expect."
            addLabel="Add bill ref"
            rows={form.billAllocations}
            onAddRow={onBillAllocationCreate}
            onRemoveRow={onBillAllocationRemove}
            removeButtonLabel="Remove"
            getRowKey={(allocation, index) => `${allocation.referenceNumber || "bill-ref"}:${index}`}
            emptyMessage="No bill-wise adjustments added yet."
            columns={[
              {
                id: "referenceType",
                header: "Reference type",
                headerClassName: "w-36 min-w-36",
                cellClassName: "w-36 min-w-36",
                renderCell: (allocation, index) => (
                  <select
                    className={voucherInlineSelectClassName}
                    value={allocation.referenceType}
                    onChange={(event) =>
                      onBillAllocationChange(index, "referenceType", event.target.value)
                    }
                  >
                    <option value="against_ref">Against ref</option>
                    <option value="new_ref">New ref</option>
                    <option value="on_account">On account</option>
                  </select>
                ),
              },
              {
                id: "referenceNumber",
                header: "Reference number",
                headerClassName: "min-w-40",
                renderCell: (allocation, index) => (
                  <Input
                    className={voucherInlineInputClassName}
                    value={allocation.referenceNumber}
                    onChange={(event) =>
                      onBillAllocationChange(index, "referenceNumber", event.target.value)
                    }
                    placeholder="Reference number"
                  />
                ),
              },
              {
                id: "referenceDate",
                header: "Reference date",
                headerClassName: "w-36 min-w-36",
                cellClassName: "w-36 min-w-36",
                renderCell: (allocation, index) => (
                  <Input
                    className={voucherInlineInputClassName}
                    type="date"
                    value={allocation.referenceDate}
                    onChange={(event) =>
                      onBillAllocationChange(index, "referenceDate", event.target.value)
                    }
                  />
                ),
              },
              {
                id: "dueDate",
                header: "Due date",
                headerClassName: "w-36 min-w-36",
                cellClassName: "w-36 min-w-36",
                renderCell: (allocation, index) => (
                  <Input
                    className={voucherInlineInputClassName}
                    type="date"
                    value={allocation.dueDate}
                    onChange={(event) =>
                      onBillAllocationChange(index, "dueDate", event.target.value)
                    }
                  />
                ),
              },
              {
                id: "amount",
                header: "Amount",
                headerClassName: "w-32 min-w-32",
                cellClassName: "w-32 min-w-32",
                renderCell: (allocation, index) => (
                  <Input
                    className={voucherInlineInputClassName}
                    type="number"
                    min="0"
                    step="0.01"
                    value={allocation.amount}
                    onChange={(event) =>
                      onBillAllocationChange(index, "amount", event.target.value)
                    }
                    placeholder="Amount"
                  />
                ),
              },
              {
                id: "note",
                header: "Note",
                headerClassName: "min-w-48",
                renderCell: (allocation, index) => (
                  <Input
                    className={voucherInlineInputClassName}
                    value={allocation.note}
                    onChange={(event) =>
                      onBillAllocationChange(index, "note", event.target.value)
                    }
                    placeholder="Adjustment note"
                  />
                ),
              },
            ]}
          />
        ) : null}

        {!gstModeEnabled ? (
        <VoucherInlineEditableTable
          title="Ledger lines"
          description="Every voucher must contain balanced debit and credit lines."
          addLabel="Add line"
          rows={form.lines}
          onAddRow={onLineCreate}
          onRemoveRow={(index) => {
            if (form.lines.length > 2) {
              onLineRemove(index)
            }
          }}
          removeButtonLabel={form.lines.length <= 2 ? "Locked" : "Remove"}
          getRowKey={(line, index) => `${index}:${line.ledgerId}:${line.side}`}
          columns={[
            {
              id: "ledger",
              header: "Ledger",
              headerClassName: "min-w-60",
              renderCell: (line, index) => (
                <AutocompleteLookupField
                  emptyLabel="Select ledger"
                  onChange={(nextValue) => onLineChange(index, "ledgerId", nextValue)}
                  options={ledgers.map((ledger) => ({
                    value: ledger.id,
                    label: ledger.name,
                  }))}
                  searchPlaceholder="Search ledger"
                  value={line.ledgerId}
                />
              ),
            },
            {
              id: "side",
              header: "Side",
              headerClassName: "w-32 min-w-32",
              cellClassName: "w-32 min-w-32",
              renderCell: (line, index) => (
                <select
                  className={voucherInlineSelectClassName}
                  value={line.side}
                  onChange={(event) => onLineChange(index, "side", event.target.value)}
                >
                  <option value="debit">Debit</option>
                  <option value="credit">Credit</option>
                </select>
              ),
            },
            {
              id: "amount",
              header: "Amount",
              headerClassName: "w-32 min-w-32",
              cellClassName: "w-32 min-w-32",
              renderCell: (line, index) => (
                <Input
                  className={voucherInlineInputClassName}
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.amount}
                  onChange={(event) => onLineChange(index, "amount", event.target.value)}
                />
              ),
            },
            {
              id: "note",
              header: "Note",
              headerClassName: "min-w-56",
              renderCell: (line, index) => (
                <Input
                  className={voucherInlineInputClassName}
                  value={line.note}
                  onChange={(event) => onLineChange(index, "note", event.target.value)}
                  placeholder="Posting note"
                />
              ),
            },
          ]}
        />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {gstModeEnabled ? "GST invoice total" : "Debit total"}
            </p>
            <p className="mt-2 text-xl font-semibold text-foreground">
              {formatAmount(gstModeEnabled ? gstInvoiceAmount : totals.debit)}
            </p>
          </div>
          <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {gstModeEnabled ? "GST tax total" : "Credit total"}
            </p>
            <p className="mt-2 text-xl font-semibold text-foreground">
              {formatAmount(gstModeEnabled ? gstTotalTax : totals.credit)}
            </p>
          </div>
        </div>

        {formError ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {formError}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={onSave} disabled={isSaving || !isMutableVoucher}>
            {isSaving ? "Saving..." : selectedVoucher ? "Save voucher" : "Create voucher"}
          </Button>
          <Button type="button" variant="outline" onClick={onReset} disabled={isSaving}>
            New voucher
          </Button>
          {selectedVoucher ? (
            <Button
              type="button"
              variant="destructive"
              onClick={onDelete}
              disabled={isSaving || !isMutableVoucher}
            >
              Delete voucher
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

function SalesInvoiceEditor({
  form,
  formError,
  isSaving,
  ledgers,
  onChange,
  onDelete,
  onReset,
  onSave,
  onSalesItemProductChange,
  onSalesItemChange,
  onSalesItemCreate,
  onSalesItemRemove,
  products,
  selectedVoucher,
  voucherTypes,
}: {
  form: VoucherFormState
  formError: string | null
  isSaving: boolean
  ledgers: BillingLedger[]
  onChange: (field: string, value: string) => void
  onDelete: () => void
  onReset: () => void
  onSave: () => void
  onSalesItemProductChange: (index: number, productId: string) => void
  onSalesItemChange: (index: number, field: keyof SalesItemForm, value: string) => void
  onSalesItemCreate: () => void
  onSalesItemRemove: (index: number) => void
  products: ProductListResponse["items"]
  selectedVoucher: BillingVoucher | null
  voucherTypes: BillingVoucherMasterType[]
}) {
  const isMutableVoucher = selectedVoucher === null || selectedVoucher.status === "draft"
  const salesVoucherTypes = voucherTypes.filter(
    (voucherType) => voucherType.postingType === "sales" && voucherType.deletedAt === null
  )
  const salesSummary = getSalesSummary(form.sales)
  const activeProducts = products.filter((product) => product.isActive)
  const productOptions = activeProducts.map((product) => ({
    value: product.id,
    label: `${product.name} (${product.code})`,
  }))
  const selectedCustomerLedger =
    ledgers.find((ledger) => ledger.id === form.sales.customerLedgerId) ?? null

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {selectedVoucher
            ? isMutableVoucher
              ? "Edit sales invoice"
              : "View sales invoice"
            : "Create sales invoice"}
        </CardTitle>
        <CardDescription>
          Capture customer invoice details, select the sales voucher type, and post item-table totals into double-entry and GST automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="sales-voucher-number">
              Invoice number
            </label>
            <Input
              id="sales-voucher-number"
              value={form.voucherNumber}
              onChange={(event) => onChange("voucherNumber", event.target.value)}
              placeholder="Leave blank for FY auto numbering"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="sales-date">
              Invoice date
            </label>
            <Input
              id="sales-date"
              type="date"
              value={form.date}
              onChange={(event) => onChange("date", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Voucher type</label>
            <AutocompleteLookupField
              emptyLabel="Select sales type"
              onChange={(nextValue) => onChange("salesVoucherTypeId", nextValue)}
              options={salesVoucherTypes.map((voucherType) => ({
                value: voucherType.id,
                label: voucherType.name,
              }))}
              searchPlaceholder="Search sales voucher type"
              value={form.sales.voucherTypeId}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Customer ledger</label>
            <AutocompleteLookupField
              emptyLabel="Select customer ledger"
              onChange={(nextValue) => {
                const nextLedger = ledgers.find((ledger) => ledger.id === nextValue) ?? null
                onChange("salesCustomerLedgerId", nextValue)
                if (!form.sales.billToName && nextLedger) {
                  onChange("salesBillToName", nextLedger.name)
                }
              }}
              options={ledgers.map((ledger) => ({
                value: ledger.id,
                label: `${ledger.name} (${ledger.categoryName})`,
              }))}
              searchPlaceholder="Search customer ledger"
              value={form.sales.customerLedgerId}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="sales-bill-to-name">
              Bill to name
            </label>
            <Input
              id="sales-bill-to-name"
              value={form.sales.billToName}
              onChange={(event) => onChange("salesBillToName", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="sales-reference-number">
              Reference number
            </label>
            <Input
              id="sales-reference-number"
              value={form.sales.referenceNumber}
              onChange={(event) => onChange("salesReferenceNumber", event.target.value)}
              placeholder="PO / customer ref"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="sales-due-date">
              Due date
            </label>
            <Input
              id="sales-due-date"
              type="date"
              value={form.sales.dueDate}
              onChange={(event) => onChange("salesDueDate", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="sales-party-gstin">
              Customer GSTIN
            </label>
            <Input
              id="sales-party-gstin"
              value={form.sales.partyGstin}
              onChange={(event) => onChange("salesPartyGstin", event.target.value)}
              placeholder="29ABCDE1234F1Z5"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="sales-place-of-supply">
              Place of supply
            </label>
            <Input
              id="sales-place-of-supply"
              value={form.sales.placeOfSupply}
              onChange={(event) => onChange("salesPlaceOfSupply", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Supply type</label>
            <RadioGroup
              value={form.sales.supplyType}
              onValueChange={(nextValue) => onChange("salesSupplyType", nextValue)}
              className="flex h-10 items-center gap-6 rounded-md border border-input bg-background px-3"
            >
              <label className="flex items-center gap-2 text-sm text-foreground">
                <RadioGroupItem value="intra" />
                Intra-state
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <RadioGroupItem value="inter" />
                Inter-state
              </label>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="sales-tax-rate">
              GST rate %
            </label>
            <Input
              id="sales-tax-rate"
              type="number"
              min="0"
              step="0.01"
              value={form.sales.taxRate}
              onChange={(event) => onChange("salesTaxRate", event.target.value)}
            />
          </div>
          <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Customer account
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">
              {selectedCustomerLedger?.name ?? "Not selected"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {selectedCustomerLedger?.categoryName ?? "Choose the receivable ledger to debit."}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="sales-bill-to-address">
              Bill to address
            </label>
            <Textarea
              id="sales-bill-to-address"
              value={form.sales.billToAddress}
              onChange={(event) => onChange("salesBillToAddress", event.target.value)}
              placeholder="Customer billing address"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="sales-ship-to-address">
              Ship to address
            </label>
            <Textarea
              id="sales-ship-to-address"
              value={form.sales.shipToAddress}
              onChange={(event) => onChange("salesShipToAddress", event.target.value)}
              placeholder="Dispatch or delivery address"
            />
          </div>
        </div>

        <VoucherInlineEditableTable
          title="Sales items"
          description="Add invoice lines as sale sub-items. Tax and posting totals are derived from this table."
          addLabel="Add item"
          fitToContainer
          rows={form.sales.items}
          onAddRow={onSalesItemCreate}
          onRemoveRow={onSalesItemRemove}
          removeButtonLabel="Remove"
          getRowKey={(item, index) => `sales-item:${index}:${item.itemName}`}
          columns={[
            {
              id: "itemName",
              header: "Product",
              headerClassName: "min-w-60",
              renderCell: (item, index) => {
                const rowOptions =
                  item.productId || !item.itemName
                    ? productOptions
                    : [
                        {
                          value: `manual:${index}`,
                          label: item.itemName,
                        },
                        ...productOptions,
                      ]

                return (
                  <AutocompleteLookupField
                    emptyLabel="Select product"
                    onChange={(nextValue) =>
                      nextValue.startsWith("manual:")
                        ? undefined
                        : onSalesItemProductChange(index, nextValue)
                    }
                    options={rowOptions}
                    searchPlaceholder="Search product"
                    triggerClassName="h-9 rounded-none border-0 bg-transparent px-0 shadow-none focus-visible:border-transparent focus-visible:ring-0"
                    value={item.productId || (item.itemName ? `manual:${index}` : "")}
                  />
                )
              },
            },
            {
              id: "description",
              header: "Description",
              headerClassName: "w-[34%]",
              renderCell: (item, index) => (
                <Input
                  className={voucherInlineInputClassName}
                  value={item.description}
                  onChange={(event) =>
                    onSalesItemChange(index, "description", event.target.value)
                  }
                  placeholder="Item description"
                />
              ),
            },
            {
              id: "quantity",
              header: "Qty",
              headerClassName: "w-[12%]",
              cellClassName: "w-[12%]",
              renderCell: (item, index) => (
                <Input
                  className={voucherInlineInputClassName}
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.quantity}
                  onChange={(event) =>
                    onSalesItemChange(index, "quantity", event.target.value)
                  }
                />
              ),
            },
            {
              id: "rate",
              header: "Rate",
              headerClassName: "w-[14%]",
              cellClassName: "w-[14%]",
              renderCell: (item, index) => (
                <Input
                  className={voucherInlineInputClassName}
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.rate}
                  onChange={(event) =>
                    onSalesItemChange(index, "rate", event.target.value)
                  }
                />
              ),
            },
            {
              id: "amount",
              header: "Amount",
              headerClassName: "w-[14%] text-right",
              cellClassName: "w-[14%] text-right font-medium text-foreground",
              renderCell: (item) => formatAmount(getSalesItemAmount(item)),
            },
          ]}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Quantity
            </p>
            <p className="mt-2 text-xl font-semibold text-foreground">
              {salesSummary.totalQuantity.toFixed(2)}
            </p>
          </div>
          <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Subtotal
            </p>
            <p className="mt-2 text-xl font-semibold text-foreground">
              {formatAmount(salesSummary.subtotal)}
            </p>
          </div>
          <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              GST total
            </p>
            <p className="mt-2 text-xl font-semibold text-foreground">
              {formatAmount(salesSummary.taxAmount)}
            </p>
          </div>
          <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Invoice total
            </p>
            <p className="mt-2 text-xl font-semibold text-foreground">
              {formatAmount(salesSummary.grandTotal)}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-2 rounded-[1rem] border border-border/70 bg-card/70 p-4 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.generateEInvoice}
              onChange={(event) =>
                onChange("generateEInvoice", event.target.checked ? "true" : "false")
              }
            />
            Generate e-invoice record
          </label>
          <label className="flex items-center gap-2 rounded-[1rem] border border-border/70 bg-card/70 p-4 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.generateEWayBill}
              onChange={(event) =>
                onChange("generateEWayBill", event.target.checked ? "true" : "false")
              }
            />
            Generate e-way bill record
          </label>
        </div>

        {form.generateEWayBill ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              type="number"
              min="1"
              value={form.transport.distanceKm}
              onChange={(event) => onChange("transportDistanceKm", event.target.value)}
              placeholder="Distance in KM"
            />
            <Input
              value={form.transport.vehicleNumber}
              onChange={(event) => onChange("transportVehicleNumber", event.target.value)}
              placeholder="Vehicle number"
            />
            <Input
              value={form.transport.transporterId}
              onChange={(event) => onChange("transportTransporterId", event.target.value)}
              placeholder="Transporter id"
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="sales-narration">
            Narration
          </label>
          <Textarea
            id="sales-narration"
            value={form.narration}
            onChange={(event) => onChange("narration", event.target.value)}
            placeholder="Optional invoice note"
          />
        </div>

        {formError ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {formError}
          </div>
        ) : null}

        {selectedVoucher && !isMutableVoucher ? (
          <div className="rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            {toVoucherLifecycleLabel(selectedVoucher.status)} invoices are read-only. Keep an invoice in draft for direct editing.
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={onSave} disabled={isSaving || !isMutableVoucher}>
            {isSaving ? "Saving..." : selectedVoucher ? "Save sales invoice" : "Create sales invoice"}
          </Button>
          <Button type="button" variant="outline" onClick={onReset} disabled={isSaving}>
            New invoice
          </Button>
          {selectedVoucher ? (
            <Button
              type="button"
              variant="destructive"
              onClick={onDelete}
              disabled={isSaving || !isMutableVoucher}
            >
              Delete invoice
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

function getVoucherInvoiceAmount(voucher: BillingVoucher) {
  if (voucher.sales) {
    return voucher.sales.grandTotal
  }
  if (voucher.gst) {
    return voucher.gst.invoiceAmount
  }

  return getVoucherTotals(voucher).debit
}

function getVoucherModuleLabel(moduleId: BillingVoucherType) {
  switch (moduleId) {
    case "payment":
      return {
        addLabel: "New Payment Voucher",
        amountLabel: "Amount",
        emptyMessage: "No payment vouchers found.",
        pageDescription: "Create and maintain outgoing payment vouchers with bill settlement and double-entry posting.",
        pageTitle: "Payment",
      }
    case "receipt":
      return {
        addLabel: "New Receipt Voucher",
        amountLabel: "Amount",
        emptyMessage: "No receipt vouchers found.",
        pageDescription: "Create and maintain incoming receipt vouchers with customer settlement and collection posting.",
        pageTitle: "Receipt",
      }
    case "purchase":
      return {
        addLabel: "New Purchase Voucher",
        amountLabel: "Invoice Total",
        emptyMessage: "No purchase vouchers found.",
        pageDescription: "Create and maintain purchase vouchers with GST-aware posting and supplier-side liability impact.",
        pageTitle: "Purchase",
      }
    case "debit_note":
      return {
        addLabel: "New Debit Note",
        amountLabel: "Adjustment Total",
        emptyMessage: "No debit notes found.",
        pageDescription: "Create and maintain supplier debit notes for purchase-side corrections, shortages, and payable adjustments.",
        pageTitle: "Debit Note",
      }
    case "credit_note":
      return {
        addLabel: "New Credit Note",
        amountLabel: "Adjustment Total",
        emptyMessage: "No credit notes found.",
        pageDescription: "Create and maintain customer credit notes for sales returns, receivable reductions, and commercial corrections.",
        pageTitle: "Credit Note",
      }
    default:
      return {
        addLabel: "New Voucher",
        amountLabel: "Amount",
        emptyMessage: "No vouchers found.",
        pageDescription: "Create and maintain vouchers.",
        pageTitle: titleFromVoucherType(moduleId),
      }
  }
}

function SalesVoucherSection({
  onCreate,
  onEdit,
  onSelectVoucher,
  vouchers,
}: {
  onCreate: () => void
  onEdit: (voucherId: string) => void
  onSelectVoucher: (voucher: BillingVoucher) => void
  vouchers: BillingVoucher[]
}) {
  const [searchValue, setSearchValue] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const salesVouchers = vouchers.filter((voucher) => voucher.type === "sales")
  const normalizedSearch = searchValue.trim().toLowerCase()
  const filteredVouchers = salesVouchers.filter((voucher) =>
    [
      voucher.voucherNumber,
      voucher.counterparty,
      voucher.sales?.voucherTypeName ?? "",
      voucher.sales?.referenceNumber ?? "",
      voucher.date,
    ].some((value) => value.toLowerCase().includes(normalizedSearch))
  )
  const totalRecords = filteredVouchers.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedVouchers = filteredVouchers.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  )

  return (
    <>
      <MasterList
        header={{
          pageTitle: "Sales",
          pageDescription:
            "Create and maintain customer invoices with voucher type alignment, GST-ready totals, and item-table posting.",
          addLabel: "New Sales Invoice",
          onAddClick: onCreate,
        }}
        search={{
          value: searchValue,
          onChange: (value) => {
            setSearchValue(value)
            setCurrentPage(1)
          },
          placeholder: "Search sales invoices",
        }}
        table={{
          columns: [
            {
              id: "serial",
              header: "Sl.No",
              cell: (voucher) =>
                (safeCurrentPage - 1) * pageSize +
                paginatedVouchers.findIndex((entry) => entry.id === voucher.id) +
                1,
              className: "w-12 min-w-12 px-2 text-center",
              headerClassName: "w-12 min-w-12 px-2 text-center",
              sticky: "left",
            },
            {
              id: "voucherNumber",
              header: "Invoice",
              sortable: true,
              accessor: (voucher) => voucher.voucherNumber,
              cell: (voucher) => (
                <div>
                  <p className="font-medium text-foreground">{voucher.voucherNumber}</p>
                  <p className="text-xs text-muted-foreground">{voucher.date}</p>
                </div>
              ),
            },
            {
              id: "voucherType",
              header: "Sales Type",
              sortable: true,
              accessor: (voucher) => voucher.sales?.voucherTypeName ?? "Sales",
              cell: (voucher) => voucher.sales?.voucherTypeName ?? "Sales",
            },
            {
              id: "customer",
              header: "Customer",
              sortable: true,
              accessor: (voucher) => voucher.counterparty,
              cell: (voucher) => voucher.counterparty,
            },
            {
              id: "items",
              header: "Items",
              sortable: true,
              accessor: (voucher) => voucher.sales?.items.length ?? 0,
              cell: (voucher) => voucher.sales?.items.length ?? 0,
            },
            {
              id: "amount",
              header: "Invoice Total",
              sortable: true,
              accessor: (voucher) => getVoucherInvoiceAmount(voucher),
              cell: (voucher) => formatAmount(getVoucherInvoiceAmount(voucher)),
            },
            {
              id: "actions",
              header: "Actions",
              cell: (voucher) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="size-8 rounded-full">
                      <MoreHorizontalIcon className="size-4" />
                      <span className="sr-only">Open sales invoice actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem className="gap-2" onSelect={() => {
                    onSelectVoucher(voucher)
                    onEdit(voucher.id)
                  }}>
                      <PencilLineIcon className="size-4" />
                      Edit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ),
              className: "w-20 min-w-20 text-right",
              headerClassName: "w-20 min-w-20 text-right",
            },
          ],
          data: paginatedVouchers,
          emptyMessage: "No sales invoices found.",
          rowKey: (voucher) => voucher.id,
        }}
        footer={{
          content: (
            <div className="flex flex-wrap items-center gap-4">
              <span>
                Total invoices: <span className="font-medium text-foreground">{totalRecords}</span>
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
          pageSizeOptions: [10, 20, 50, 100, 200, 500],
        }}
      />
    </>
  )
}

function SalesVoucherUpsertSection({
  form,
  formError,
  isSaving,
  ledgers,
  onChange,
  onDelete,
  onReset,
  onSalesItemProductChange,
  onSalesItemChange,
  onSalesItemCreate,
  onSalesItemRemove,
  onSave,
  products,
  selectedVoucher,
  voucherTypes,
}: {
  form: VoucherFormState
  formError: string | null
  isSaving: boolean
  ledgers: BillingLedger[]
  onChange: (field: string, value: string) => void
  onDelete: () => void
  onReset: () => void
  onSalesItemProductChange: (index: number, productId: string) => void
  onSalesItemChange: (index: number, field: keyof SalesItemForm, value: string) => void
  onSalesItemCreate: () => void
  onSalesItemRemove: (index: number) => void
  onSave: () => void
  products: ProductListResponse["items"]
  selectedVoucher: BillingVoucher | null
  voucherTypes: BillingVoucherMasterType[]
}) {
  return (
    <div className="space-y-4">
      <SalesInvoiceEditor
        form={form}
        formError={formError}
        isSaving={isSaving}
        ledgers={ledgers}
        onChange={onChange}
        onDelete={onDelete}
        onReset={onReset}
        onSave={onSave}
        onSalesItemProductChange={onSalesItemProductChange}
        onSalesItemChange={onSalesItemChange}
        onSalesItemCreate={onSalesItemCreate}
        onSalesItemRemove={onSalesItemRemove}
        products={products}
        selectedVoucher={selectedVoucher}
        voucherTypes={voucherTypes}
      />
      {selectedVoucher ? <VoucherComplianceCard voucher={selectedVoucher} /> : null}
    </div>
  )
}

function VoucherModuleListSection({
  moduleId,
  onCreate,
  onEdit,
  onSelectVoucher,
  vouchers,
}: {
  moduleId: "payment" | "receipt" | "purchase" | "credit_note" | "debit_note"
  onCreate: () => void
  onEdit: (voucherId: string) => void
  onSelectVoucher: (voucher: BillingVoucher) => void
  vouchers: BillingVoucher[]
}) {
  const [searchValue, setSearchValue] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const labels = getVoucherModuleLabel(moduleId)
  const filteredByType = vouchers.filter((voucher) => voucher.type === moduleId)
  const normalizedSearch = searchValue.trim().toLowerCase()
  const filteredVouchers = filteredByType.filter((voucher) =>
    [
      voucher.voucherNumber,
      voucher.counterparty,
      voucher.narration,
      voucher.date,
    ].some((value) => value.toLowerCase().includes(normalizedSearch))
  )
  const totalRecords = filteredVouchers.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedVouchers = filteredVouchers.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  )

  return (
    <MasterList
      header={{
        pageTitle: labels.pageTitle,
        pageDescription: labels.pageDescription,
        addLabel: labels.addLabel,
        onAddClick: onCreate,
      }}
      search={{
        value: searchValue,
        onChange: (value) => {
          setSearchValue(value)
          setCurrentPage(1)
        },
        placeholder: `Search ${labels.pageTitle.toLowerCase()} vouchers`,
      }}
      table={{
        columns: [
          {
            id: "serial",
            header: "Sl.No",
            cell: (voucher) =>
              (safeCurrentPage - 1) * pageSize +
              paginatedVouchers.findIndex((entry) => entry.id === voucher.id) +
              1,
            className: "w-12 min-w-12 px-2 text-center",
            headerClassName: "w-12 min-w-12 px-2 text-center",
            sticky: "left",
          },
          {
            id: "voucherNumber",
            header: "Voucher",
            sortable: true,
            accessor: (voucher) => voucher.voucherNumber,
            cell: (voucher) => (
              <div>
                <p className="font-medium text-foreground">{voucher.voucherNumber}</p>
                <p className="text-xs text-muted-foreground">{voucher.date}</p>
              </div>
            ),
          },
          {
            id: "counterparty",
            header: "Counterparty",
            sortable: true,
            accessor: (voucher) => voucher.counterparty,
            cell: (voucher) => voucher.counterparty,
          },
          {
            id: "narration",
            header: "Narration",
            sortable: true,
            accessor: (voucher) => voucher.narration,
            cell: (voucher) => voucher.narration || "—",
          },
          {
            id: "amount",
            header: labels.amountLabel,
            sortable: true,
            accessor: (voucher) => getVoucherInvoiceAmount(voucher),
            cell: (voucher) => formatAmount(getVoucherInvoiceAmount(voucher)),
          },
          {
            id: "actions",
            header: "Actions",
            cell: (voucher) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="size-8 rounded-full">
                    <MoreHorizontalIcon className="size-4" />
                    <span className="sr-only">Open voucher actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem className="gap-2" onSelect={() => {
                    onSelectVoucher(voucher)
                    onEdit(voucher.id)
                  }}>
                    <PencilLineIcon className="size-4" />
                    Edit
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ),
            className: "w-20 min-w-20 text-right",
            headerClassName: "w-20 min-w-20 text-right",
          },
        ],
        data: paginatedVouchers,
        emptyMessage: labels.emptyMessage,
        rowKey: (voucher) => voucher.id,
      }}
      footer={{
        content: (
          <div className="flex flex-wrap items-center gap-4">
            <span>
              Total vouchers: <span className="font-medium text-foreground">{totalRecords}</span>
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
        pageSizeOptions: [10, 20, 50, 100, 200, 500],
      }}
    />
  )
}

function VoucherModuleUpsertSection({
  form,
  formError,
  isSaving,
  ledgers,
  onBillAllocationChange,
  onBillAllocationCreate,
  onBillAllocationRemove,
  onChange,
  onDelete,
  onLineChange,
  onLineCreate,
  onLineRemove,
  onReset,
  onSave,
  selectedVoucher,
}: {
  form: VoucherFormState
  formError: string | null
  isSaving: boolean
  ledgers: BillingLedger[]
  onBillAllocationChange: (
    index: number,
    field: keyof VoucherBillAllocationForm,
    value: string
  ) => void
  onBillAllocationCreate: () => void
  onBillAllocationRemove: (index: number) => void
  onChange: (field: string, value: string) => void
  onDelete: () => void
  onLineChange: (
    index: number,
    field: keyof VoucherFormLine,
    value: string
  ) => void
  onLineCreate: () => void
  onLineRemove: (index: number) => void
  onReset: () => void
  onSave: () => void
  selectedVoucher: BillingVoucher | null
}) {
  return (
    <div className="space-y-4">
      <VoucherEditor
        form={form}
        formError={formError}
        isSaving={isSaving}
        ledgers={ledgers}
        onChange={onChange}
        onDelete={onDelete}
        onBillAllocationChange={onBillAllocationChange}
        onBillAllocationCreate={onBillAllocationCreate}
        onBillAllocationRemove={onBillAllocationRemove}
        onLineChange={onLineChange}
        onLineCreate={onLineCreate}
        onLineRemove={onLineRemove}
        onReset={onReset}
        onSave={onSave}
        selectedVoucher={selectedVoucher}
      />
      {selectedVoucher ? <VoucherComplianceCard voucher={selectedVoucher} /> : null}
    </div>
  )
}

function OverviewSection({
  ledgers,
  vouchers,
}: {
  ledgers: BillingLedger[]
  vouchers: BillingVoucher[]
}) {
  const totalDebits = vouchers.reduce(
    (sum, voucher) => sum + getVoucherTotals(voucher).debit,
    0
  )
  const balancedCount = vouchers.filter((voucher) => isVoucherBalanced(voucher)).length
  const summary = vouchers.reduce<Record<BillingVoucherType, number>>(
    (counts, voucher) => {
      counts[voucher.type] += 1
      return counts
    },
    {
      payment: 0,
      receipt: 0,
      sales: 0,
      credit_note: 0,
      purchase: 0,
      debit_note: 0,
      contra: 0,
      journal: 0,
    }
  )

  return (
    <SectionShell
      title="Accounts Overview"
      description="A Tally-style accounting desk focused on voucher-led posting, ledger discipline, and visible double-entry balance checks."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Ledgers"
          value={ledgers.length}
          hint="Primary books used across cash, bank, debtors, creditors, sales, purchase, and adjustments."
        />
        <MetricCard
          label="Voucher Types"
          value="6"
          hint="Payment, receipt, sales, purchase, contra, and journal are modeled as separate posting lanes."
        />
        <MetricCard
          label="Posted Debits"
          value={formatAmount(totalDebits)}
          hint="Credits match the same amount whenever vouchers stay balanced."
        />
        <MetricCard
          label="Balanced Entries"
          value={`${balancedCount}/${vouchers.length}`}
          hint="Every voucher must balance before it is treated as posted."
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(Object.entries(summary) as [BillingVoucherType, number][]).map(([type, count]) => (
          <Card key={type}>
            <CardContent className="space-y-2 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-foreground">{titleFromVoucherType(type)}</p>
                <Badge variant="outline">{count}</Badge>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                {titleFromVoucherType(type)} vouchers remain explicit instead of hiding accounting impact.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Billing Menu</CardTitle>
          <CardDescription>
            Frontend billing pages are connected as dedicated routes so the app can expand into desktop modules later.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {billingWorkspaceItems
            .filter((item) => item.id !== "overview")
            .map((item) => (
              <Link
                key={item.id}
                to={item.route}
                className="rounded-[1rem] border border-border/70 bg-card/70 p-4 transition hover:-translate-y-0.5 hover:border-accent/40 hover:bg-card"
              >
                <p className="font-semibold text-foreground">{item.name}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.summary}
                </p>
              </Link>
            ))}
        </CardContent>
      </Card>
    </SectionShell>
  )
}

function ChartOfAccountsSection({
  categories,
  form,
  formError,
  hideHeader,
  isDialogOpen,
  isEditing,
  isSaving,
  onChange,
  onCreate,
  onDelete,
  onEdit,
  onOpenChange,
  onRestore,
  onSave,
}: {
  categories: BillingCategory[]
  form: CategoryFormState
  formError: string | null
  hideHeader?: boolean
  isDialogOpen: boolean
  isEditing: boolean
  isSaving: boolean
  onChange: (field: keyof CategoryFormState, value: string) => void
  onCreate: () => void
  onDelete: (categoryId: string) => Promise<void>
  onEdit: (categoryId: string) => void
  onOpenChange: (open: boolean) => void
  onRestore: (categoryId: string) => Promise<void>
  onSave: () => void
}) {
  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  const normalizedSearch = searchValue.trim().toLowerCase()
  const filteredCategories = categories.filter((category) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      [category.name, category.description]
        .some((value) => value.toLowerCase().includes(normalizedSearch))

    return matchesSearch && matchesStatusFilter(statusFilter, !category.deletedAt)
  })
  const totalRecords = filteredCategories.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedCategories = filteredCategories.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  )

  const content = (
    <>
      <CommonList
        header={{
          pageTitle: "Ledger Categories",
          pageDescription:
            "Create and manage account categories that structure ledger masters, subgroup organization, and posting setup across the books.",
          addLabel: "New Category",
          onAddClick: onCreate,
        }}
        search={{
          value: searchValue,
          onChange: (value) => {
            setSearchValue(value)
            setCurrentPage(1)
          },
          placeholder: "Search billing categories",
        }}
        filters={buildStatusFilters(statusFilter, (value) => {
          setStatusFilter(value)
          setCurrentPage(1)
        })}
        table={{
          columns: [
            {
              id: "serial",
              header: "Sl.No",
              cell: (category) =>
                (safeCurrentPage - 1) * pageSize +
                paginatedCategories.findIndex((entry) => entry.id === category.id) +
                1,
              className: "w-12 min-w-12 px-2 text-center",
              headerClassName: "w-12 min-w-12 px-2 text-center",
              sticky: "left",
            },
            {
              id: "name",
              header: "Category",
              sortable: true,
              accessor: (category) => category.name,
              cell: (category) => (
                <div>
                  <p className="font-medium text-foreground">{category.name}</p>
                </div>
              ),
            },
            {
              id: "description",
              header: "Description",
              sortable: true,
              accessor: (category) => category.description,
              cell: (category) =>
                category.description.trim().length > 0 ? (
                  category.description
                ) : (
                  <span className="text-muted-foreground">No description</span>
                ),
            },
            {
              id: "linked-ledgers",
              header: "Linked Ledgers",
              sortable: true,
              accessor: (category) => category.linkedLedgerCount,
              cell: (category) => (
                <Badge variant="outline">
                  {category.linkedLedgerCount} ledger{category.linkedLedgerCount === 1 ? "" : "s"}
                </Badge>
              ),
            },
            {
              id: "status",
              header: "Status",
              sortable: true,
              accessor: (category) => (category.deletedAt ? "deleted" : "active"),
              cell: (category) => (
                <ActivityStatusBadge
                  active={!category.deletedAt}
                  inactiveLabel="Deleted"
                />
              ),
            },
            {
              id: "actions",
              header: "Actions",
              cell: (category) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="size-8 rounded-full">
                      <MoreHorizontalIcon className="size-4" />
                      <span className="sr-only">Open category actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      className="gap-2"
                      onSelect={() => {
                        onEdit(category.id)
                      }}
                    >
                        <PencilLineIcon className="size-4" />
                        Edit
                    </DropdownMenuItem>
                    {category.deletedAt ? (
                      <DropdownMenuItem
                        className="gap-2"
                        onSelect={() => {
                          void onRestore(category.id)
                        }}
                      >
                        <RotateCcwIcon className="size-4" />
                        Restore
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        className="gap-2 text-destructive focus:text-destructive"
                        onSelect={() => {
                          void onDelete(category.id)
                        }}
                      >
                        <Trash2Icon className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              ),
              className: "w-20 min-w-20 text-right",
              headerClassName: "w-20 min-w-20 text-right",
            },
          ],
          data: paginatedCategories,
          emptyMessage: "No billing categories found.",
          rowKey: (category) => category.id,
        }}
        footer={{
          content: (
            <div className="flex flex-wrap items-center gap-4">
              <span>
                Total categories: <span className="font-medium text-foreground">{totalRecords}</span>
              </span>
              <span>
                Linked ledgers:{" "}
                <span className="font-medium text-foreground">
                  {filteredCategories.reduce((total, category) => total + category.linkedLedgerCount, 0)}
                </span>
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
          pageSizeOptions: [10, 20, 50, 100, 200, 500],
        }}
      />
      <Dialog open={isDialogOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Update billing category" : "Create billing category"}</DialogTitle>
            <DialogDescription>
              Define the category name and setup note used across ledgers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="billing-category-name">
                Category name
              </label>
              <Input
                id="billing-category-name"
                value={form.name}
                onChange={(event) => onChange("name", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="billing-category-description"
              >
                Description
              </label>
              <Textarea
                id="billing-category-description"
                value={form.description}
                onChange={(event) => onChange("description", event.target.value)}
                placeholder="Notes"
                rows={5}
              />
            </div>
            {formError ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {formError}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="button" onClick={onSave} disabled={isSaving}>
              {isSaving ? "Saving..." : isEditing ? "Update category" : "Create category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )

  if (hideHeader) {
    return content
  }

  return (
    <SectionShell
      title="Billing Categories"
      description="Top-level accounting categories for billing, aligned to the Tally-style Assets, Liabilities, Income, and Expenses structure."
    >
      {content}
    </SectionShell>
  )
}

function AutocompleteLookupField({
  emptyLabel = "Select option",
  onChange,
  onCreateOption,
  options,
  searchPlaceholder,
  triggerClassName,
  value,
}: {
  emptyLabel?: string
  onChange: (value: string) => void
  onCreateOption?: (name: string) => Promise<LookupOption>
  options: LookupOption[]
  searchPlaceholder: string
  triggerClassName?: string
  value: string
}) {
  const LOOKUP_MENU_HEIGHT = 320
  const LOOKUP_VIEWPORT_GAP = 12
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [creating, setCreating] = useState(false)
  const [menuStyle, setMenuStyle] = useState<{
    top?: number
    left?: number
    width?: number
    maxHeight: number
    openUpward: boolean
    withinDialog: boolean
  } | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const selectedOption =
    options.find((option) => option.value === value) ?? null
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) {
      return options
    }

    return options.filter((option) =>
      option.label.toLowerCase().includes(normalizedQuery)
    )
  }, [options, query])
  const canCreateOption =
    Boolean(onCreateOption) &&
    query.trim().length > 0 &&
    !options.some(
      (option) => option.label.trim().toLowerCase() === query.trim().toLowerCase()
    )
  const createItemIndex = canCreateOption ? filteredOptions.length : -1

  useEffect(() => {
    function syncMenuPosition() {
      const trigger = triggerRef.current
      if (!trigger) {
        return
      }

      const withinDialog = Boolean(trigger.closest('[role="dialog"]'))
      const rect = trigger.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom - LOOKUP_VIEWPORT_GAP
      const spaceAbove = rect.top - LOOKUP_VIEWPORT_GAP
      const shouldOpenUpward = spaceBelow < LOOKUP_MENU_HEIGHT && spaceAbove > spaceBelow
      const availableHeight = shouldOpenUpward ? Math.max(spaceAbove, 180) : Math.max(spaceBelow, 180)
      const maxHeight = Math.min(LOOKUP_MENU_HEIGHT, availableHeight)
      const top = shouldOpenUpward
        ? Math.max(LOOKUP_VIEWPORT_GAP, rect.top - maxHeight - 8)
        : rect.bottom + 8

      setMenuStyle({
        maxHeight,
        openUpward: shouldOpenUpward,
        withinDialog,
        ...(withinDialog ? {} : { top, left: rect.left, width: rect.width }),
      })
    }

    if (!open) {
      setQuery("")
      setHighlightedIndex(0)
      setMenuStyle(null)
      return
    }

    syncMenuPosition()
    setHighlightedIndex(0)
    window.addEventListener("resize", syncMenuPosition)
    window.addEventListener("scroll", syncMenuPosition, true)

    return () => {
      window.removeEventListener("resize", syncMenuPosition)
      window.removeEventListener("scroll", syncMenuPosition, true)
    }
  }, [open])

  useEffect(() => {
    if (!open || !menuStyle) {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })

    return () => window.cancelAnimationFrame(frame)
  }, [menuStyle, open])

  useEffect(() => {
    const maxIndex = canCreateOption
      ? filteredOptions.length
      : Math.max(filteredOptions.length - 1, 0)
    setHighlightedIndex((current) => Math.min(current, maxIndex))
  }, [canCreateOption, filteredOptions.length])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function closeMenu() {
    setOpen(false)
    setQuery("")
    triggerRef.current?.focus()
  }

  function selectOption(nextValue: string) {
    onChange(nextValue)
    closeMenu()
  }

  function moveHighlight(direction: 1 | -1) {
    const itemCount = canCreateOption ? filteredOptions.length + 1 : filteredOptions.length
    if (itemCount <= 0) {
      return
    }

    setHighlightedIndex((current) => {
      const next = current + direction
      if (next < 0) {
        return itemCount - 1
      }
      if (next >= itemCount) {
        return 0
      }
      return next
    })
  }

  async function handleCreateOption() {
    if (!query.trim() || !onCreateOption) {
      return
    }

    setCreating(true)

    try {
      const createdOption = await onCreateOption(query.trim())
      onChange(createdOption.value)
      closeMenu()
    } finally {
      setCreating(false)
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement | HTMLInputElement>) {
    if (!open && ["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault()
      setOpen(true)
      return
    }

    if (!open) {
      return
    }

    if (event.key === "ArrowDown") {
      event.preventDefault()
      moveHighlight(1)
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      moveHighlight(-1)
      return
    }

    if (event.key === "Escape") {
      event.preventDefault()
      closeMenu()
      return
    }

    if (event.key === "Enter") {
      event.preventDefault()

      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        selectOption(filteredOptions[highlightedIndex].value)
        return
      }

      if (highlightedIndex === createItemIndex) {
        void handleCreateOption()
      }
    }
  }

  const menuContent = menuStyle ? (
    <div
      ref={menuRef}
      className={
        menuStyle.withinDialog
          ? `absolute z-[220] w-full rounded-md border border-border bg-popover p-2 shadow-md ${menuStyle.openUpward ? "bottom-full mb-2" : "top-full mt-2"}`
          : "fixed z-[200] rounded-md border border-border bg-popover p-2 shadow-md"
      }
      style={
        menuStyle.withinDialog
          ? undefined
          : {
              top: menuStyle.top,
              left: menuStyle.left,
              width: menuStyle.width,
            }
      }
    >
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={searchPlaceholder}
        className="mb-2 flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
      />
      <div
        className="overflow-y-auto pr-1 [scrollbar-color:hsl(var(--border))_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/80 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5"
        style={{ maxHeight: Math.max(menuStyle.maxHeight - 52, 128) }}
      >
        {filteredOptions.map((option, index) => (
          <button
            key={option.value}
            type="button"
            className={`flex w-full items-center justify-between rounded-sm px-2 py-2 text-left text-sm transition-colors hover:bg-muted/70 ${highlightedIndex === index ? "bg-muted/70" : ""}`}
            onClick={() => {
              selectOption(option.value)
            }}
          >
            <span>{option.label}</span>
            {option.value === value ? <CheckIcon className="size-4" /> : null}
          </button>
        ))}
        {filteredOptions.length === 0 ? (
          <div className="space-y-2 px-2 py-2">
            <p className="text-sm text-muted-foreground">No results found.</p>
            {canCreateOption ? (
              <button
                type="button"
                className={`flex w-full items-center justify-between rounded-sm border border-dashed border-border px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-muted/70 ${highlightedIndex === createItemIndex ? "bg-muted/70" : ""}`}
                onClick={() => void handleCreateOption()}
                disabled={creating}
              >
                <span>{creating ? "Creating..." : `Create "${query.trim()}"`}</span>
                <span className="text-xs text-muted-foreground">Enter</span>
              </button>
            ) : null}
          </div>
        ) : null}
        {filteredOptions.length > 0 && canCreateOption ? (
          <button
            type="button"
            className={`mt-2 flex w-full items-center justify-between rounded-sm border border-dashed border-border px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-muted/70 ${highlightedIndex === createItemIndex ? "bg-muted/70" : ""}`}
            onClick={() => void handleCreateOption()}
            disabled={creating}
          >
            <span>{creating ? "Creating..." : `Create "${query.trim()}"`}</span>
            <span className="text-xs text-muted-foreground">Enter</span>
          </button>
        ) : null}
      </div>
    </div>
  ) : null

  return (
    <div ref={rootRef} className={open ? "relative z-[230]" : "relative"}>
      <button
        type="button"
        ref={triggerRef}
        role="combobox"
        aria-expanded={open}
        className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 ${triggerClassName ?? ""}`}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleKeyDown}
      >
        <span className={selectedOption ? "text-foreground" : "text-muted-foreground"}>
          {selectedOption?.label ?? emptyLabel}
        </span>
        <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
      </button>
      {open && menuStyle
        ? menuStyle.withinDialog
          ? menuContent
          : typeof document !== "undefined" && menuContent
            ? createPortal(menuContent, document.body)
            : null
        : null}
    </div>
  )
}

function LedgerCategoryPicker({
  categories,
  onChange,
  onCreateCategory,
  value,
}: {
  categories: BillingCategory[]
  onChange: (value: string) => void
  onCreateCategory: (name: string) => Promise<BillingCategory>
  value: string
}) {
  return (
    <AutocompleteLookupField
      emptyLabel="Select category"
      onChange={onChange}
      onCreateOption={async (name) => {
        const createdCategory = await onCreateCategory(name)
        return {
          value: createdCategory.id,
          label: createdCategory.name,
        }
      }}
      options={categories
        .filter((category) => !category.deletedAt || category.id === value)
        .map((category) => ({
          value: category.id,
          label: category.name,
        }))}
      searchPlaceholder="Search category"
      value={value}
    />
  )
}

function LedgerMasterSection({
  categories,
  form,
  formError,
  isDialogOpen,
  isEditing,
  isSaving,
  ledgers,
  onCreate,
  onCategoryCreate,
  onChange,
  onDelete,
  onEdit,
  onOpenChange,
  onSave,
}: {
  categories: BillingCategory[]
  form: LedgerFormState
  formError: string | null
  isDialogOpen: boolean
  isEditing: boolean
  isSaving: boolean
  ledgers: BillingLedger[]
  onCreate: () => void
  onCategoryCreate: (name: string) => Promise<BillingCategory>
  onChange: (field: keyof LedgerFormState, value: string) => void
  onDelete: () => void
  onEdit: (ledgerId: string) => void
  onOpenChange: (open: boolean) => void
  onSave: () => void
}) {
  const [searchValue, setSearchValue] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const normalizedSearch = searchValue.trim().toLowerCase()
  const filteredLedgers = ledgers.filter((ledger) =>
    [ledger.name, ledger.categoryName, ledger.group]
      .some((value) => value.toLowerCase().includes(normalizedSearch))
  )
  const totalRecords = filteredLedgers.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedLedgers = filteredLedgers.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  )

  return (
    <>
      <CommonList
        header={{
          pageTitle: "Ledger Masters",
          pageDescription:
            "Create and manage account ledgers with category mapping, subgroup structure, and closing balances used across voucher posting.",
          addLabel: "New Ledger",
          onAddClick: onCreate,
        }}
        search={{
          value: searchValue,
          onChange: (value) => {
            setSearchValue(value)
            setCurrentPage(1)
          },
          placeholder: "Search ledger masters",
        }}
        table={{
        columns: [
          {
            id: "serial",
            header: "Sl.No",
            cell: (ledger) =>
              (safeCurrentPage - 1) * pageSize +
              paginatedLedgers.findIndex((entry) => entry.id === ledger.id) +
              1,
            className: "w-12 min-w-12 px-2 text-center",
            headerClassName: "w-12 min-w-12 px-2 text-center",
            sticky: "left",
          },
          {
            id: "name",
            header: "Ledger",
            sortable: true,
            accessor: (ledger) => ledger.name,
            cell: (ledger) => <p className="font-medium text-foreground">{ledger.name}</p>,
          },
          {
            id: "category",
            header: "Category",
            sortable: true,
            accessor: (ledger) => ledger.categoryName,
            cell: (ledger) => ledger.categoryName,
          },
          {
            id: "closing",
            header: "Closing",
            sortable: true,
            accessor: (ledger) => ledger.closingAmount,
            cell: (ledger) => `${formatAmount(ledger.closingAmount)} ${ledger.closingSide === "debit" ? "Dr" : "Cr"}`,
          },
          {
            id: "actions",
            header: "Actions",
            cell: (ledger) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="size-8 rounded-full">
                    <MoreHorizontalIcon className="size-4" />
                    <span className="sr-only">Open ledger actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    className="gap-2"
                    onSelect={() => {
                      onEdit(ledger.id)
                    }}
                  >
                    <PencilLineIcon className="size-4" />
                    Edit
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ),
            className: "w-20 min-w-20 text-right",
            headerClassName: "w-20 min-w-20 text-right",
          },
        ],
        data: paginatedLedgers,
        emptyMessage: "No ledger masters found.",
        rowKey: (ledger) => ledger.id,
      }}
        footer={{
          content: (
            <div className="flex flex-wrap items-center gap-4">
              <span>
                Total ledgers: <span className="font-medium text-foreground">{totalRecords}</span>
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
          pageSizeOptions: [10, 20, 50, 100, 200, 500],
        }}
      />
      <Dialog open={isDialogOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Update ledger master" : "Create ledger master"}</DialogTitle>
            <DialogDescription>
              Define ledger identity, category mapping, and closing balance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="ledger-name">
                  Ledger name
                </label>
                <Input
                  id="ledger-name"
                  value={form.name}
                  onChange={(event) => onChange("name", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="ledger-category">
                  Category
                </label>
                <LedgerCategoryPicker
                  categories={categories}
                  onChange={(nextValue) => onChange("categoryId", nextValue)}
                  onCreateCategory={onCategoryCreate}
                  value={form.categoryId}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Closing side
                </label>
                <RadioGroup
                  value={form.closingSide}
                  onValueChange={(value) => onChange("closingSide", value)}
                  className="grid grid-cols-2 gap-3"
                >
                  <label className="flex items-center gap-3 rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <RadioGroupItem value="debit" />
                    <span>Debit</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <RadioGroupItem value="credit" />
                    <span>Credit</span>
                  </label>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="ledger-closing-amount">
                  Closing amount
                </label>
                <Input
                  id="ledger-closing-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.closingAmount}
                  onChange={(event) => onChange("closingAmount", event.target.value)}
                />
              </div>
            </div>
            {formError ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {formError}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            {isEditing ? (
              <Button type="button" variant="destructive" onClick={onDelete} disabled={isSaving}>
                Delete ledger
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="button" onClick={onSave} disabled={isSaving}>
              {isSaving ? "Saving..." : isEditing ? "Update ledger" : "Create ledger"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function VoucherGroupMasterSection({
  form,
  formError,
  groups,
  isDialogOpen,
  isEditing,
  isSaving,
  onChange,
  onCreate,
  onDelete,
  onEdit,
  onOpenChange,
  onRestore,
  onSave,
}: {
  form: VoucherGroupFormState
  formError: string | null
  groups: BillingVoucherGroup[]
  isDialogOpen: boolean
  isEditing: boolean
  isSaving: boolean
  onChange: (field: keyof VoucherGroupFormState, value: string) => void
  onCreate: () => void
  onDelete: (voucherGroupId: string) => Promise<void>
  onEdit: (voucherGroupId: string) => void
  onOpenChange: (open: boolean) => void
  onRestore: (voucherGroupId: string) => Promise<void>
  onSave: () => void
}) {
  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const normalizedSearch = searchValue.trim().toLowerCase()
  const filteredGroups = groups.filter((group) => {
    const matchesSearch = [group.name, group.description].some((value) =>
      value.toLowerCase().includes(normalizedSearch)
    )

    return matchesSearch && matchesStatusFilter(statusFilter, !group.deletedAt)
  })
  const totalRecords = filteredGroups.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedGroups = filteredGroups.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  )

  return (
    <>
      <CommonList
        header={{
          pageTitle: "Voucher Groups",
          pageDescription:
            "Create and manage voucher groups that define the main posting lanes such as sales, purchase, receipt, and payment.",
          addLabel: "New Voucher Group",
          onAddClick: onCreate,
        }}
        search={{
          value: searchValue,
          onChange: (value) => {
            setSearchValue(value)
            setCurrentPage(1)
          },
          placeholder: "Search voucher groups",
        }}
        filters={buildStatusFilters(statusFilter, (value) => {
          setStatusFilter(value)
          setCurrentPage(1)
        })}
        table={{
          columns: [
            {
              id: "serial",
              header: "Sl.No",
              cell: (group) =>
                (safeCurrentPage - 1) * pageSize +
                paginatedGroups.findIndex((entry) => entry.id === group.id) +
                1,
              className: "w-12 min-w-12 px-2 text-center",
              headerClassName: "w-12 min-w-12 px-2 text-center",
              sticky: "left",
            },
            {
              id: "name",
              header: "Voucher Group",
              sortable: true,
              accessor: (group) => group.name,
              cell: (group) => <p className="font-medium text-foreground">{group.name}</p>,
            },
            {
              id: "linkedCount",
              header: "Types",
              sortable: true,
              accessor: (group) => group.linkedVoucherTypeCount,
              cell: (group) => group.linkedVoucherTypeCount,
            },
            {
              id: "actions",
              header: "Actions",
              cell: (group) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="size-8 rounded-full">
                      <MoreHorizontalIcon className="size-4" />
                      <span className="sr-only">Open voucher group actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem className="gap-2" onSelect={() => onEdit(group.id)}>
                      <PencilLineIcon className="size-4" />
                      Edit
                    </DropdownMenuItem>
                    {group.deletedAt ? (
                      <DropdownMenuItem className="gap-2" onSelect={() => void onRestore(group.id)}>
                        <RotateCcwIcon className="size-4" />
                        Restore
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem className="gap-2 text-destructive" onSelect={() => void onDelete(group.id)}>
                        <Trash2Icon className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              ),
              className: "w-20 min-w-20 text-right",
              headerClassName: "w-20 min-w-20 text-right",
            },
          ],
          data: paginatedGroups,
          emptyMessage: "No voucher groups found.",
          rowKey: (group) => group.id,
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
          pageSizeOptions: [10, 20, 50, 100, 200, 500],
        }}
      />
      <Dialog open={isDialogOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Update voucher group" : "Create voucher group"}</DialogTitle>
            <DialogDescription>
              Define the voucher group name, posting lane, and operational note used across billing setup.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Voucher group name</label>
              <Input value={form.name} onChange={(event) => onChange("name", event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea
                value={form.description}
                onChange={(event) => onChange("description", event.target.value)}
                placeholder="Notes"
                rows={4}
              />
            </div>
            {formError ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {formError}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="button" onClick={onSave} disabled={isSaving}>
              {isSaving ? "Saving..." : isEditing ? "Update voucher group" : "Create voucher group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function VoucherTypeMasterSection({
  categories,
  form,
  formError,
  groups,
  isDialogOpen,
  isEditing,
  isSaving,
  ledgers,
  onChange,
  onCreate,
  onDelete,
  onEdit,
  onOpenChange,
  onRestore,
  onSave,
  types,
}: {
  categories: BillingCategory[]
  form: VoucherTypeFormState
  formError: string | null
  groups: BillingVoucherGroup[]
  isDialogOpen: boolean
  isEditing: boolean
  isSaving: boolean
  ledgers: BillingLedger[]
  onChange: (field: keyof VoucherTypeFormState, value: string) => void
  onCreate: () => void
  onDelete: (voucherTypeId: string) => Promise<void>
  onEdit: (voucherTypeId: string) => void
  onOpenChange: (open: boolean) => void
  onRestore: (voucherTypeId: string) => Promise<void>
  onSave: () => void
  types: BillingVoucherMasterType[]
}) {
  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const normalizedSearch = searchValue.trim().toLowerCase()
  const filteredTypes = types.filter((type) => {
    const matchesSearch = [type.name, type.voucherGroupName, type.description].some((value) =>
      value.toLowerCase().includes(normalizedSearch)
    )

    return matchesSearch && matchesStatusFilter(statusFilter, !type.deletedAt)
  })
  const totalRecords = filteredTypes.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedTypes = filteredTypes.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  )
  const activeGroups = groups.filter((group) => !group.deletedAt)
  const activeCategories = categories.filter((category) => !category.deletedAt)
  const categoryLedgers = ledgers.filter((ledger) => ledger.categoryId === form.categoryId)

  return (
    <>
      <CommonList
        header={{
          pageTitle: "Voucher Types",
          pageDescription:
            "Create and manage operational voucher types such as fabric sales, garment sales, and accessories purchase under the right voucher group.",
          addLabel: "New Voucher Type",
          onAddClick: onCreate,
        }}
        search={{
          value: searchValue,
          onChange: (value) => {
            setSearchValue(value)
            setCurrentPage(1)
          },
          placeholder: "Search voucher types",
        }}
        filters={buildStatusFilters(statusFilter, (value) => {
          setStatusFilter(value)
          setCurrentPage(1)
        })}
        table={{
          columns: [
            {
              id: "serial",
              header: "Sl.No",
              cell: (type) =>
                (safeCurrentPage - 1) * pageSize +
                paginatedTypes.findIndex((entry) => entry.id === type.id) +
                1,
              className: "w-12 min-w-12 px-2 text-center",
              headerClassName: "w-12 min-w-12 px-2 text-center",
              sticky: "left",
            },
            {
              id: "name",
              header: "Voucher Type",
              sortable: true,
              accessor: (type) => type.name,
              cell: (type) => <p className="font-medium text-foreground">{type.name}</p>,
            },
            {
              id: "group",
              header: "Voucher Group",
              sortable: true,
              accessor: (type) => type.voucherGroupName,
              cell: (type) => type.voucherGroupName,
            },
            {
              id: "category",
              header: "Category",
              sortable: true,
              accessor: (type) => type.categoryName,
              cell: (type) => type.categoryName,
            },
            {
              id: "ledger",
              header: "Ledger",
              sortable: true,
              accessor: (type) => type.ledgerName,
              cell: (type) => type.ledgerName,
            },
            {
              id: "actions",
              header: "Actions",
              cell: (type) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="size-8 rounded-full">
                      <MoreHorizontalIcon className="size-4" />
                      <span className="sr-only">Open voucher type actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem className="gap-2" onSelect={() => onEdit(type.id)}>
                      <PencilLineIcon className="size-4" />
                      Edit
                    </DropdownMenuItem>
                    {type.deletedAt ? (
                      <DropdownMenuItem className="gap-2" onSelect={() => void onRestore(type.id)}>
                        <RotateCcwIcon className="size-4" />
                        Restore
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem className="gap-2 text-destructive" onSelect={() => void onDelete(type.id)}>
                        <Trash2Icon className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              ),
              className: "w-20 min-w-20 text-right",
              headerClassName: "w-20 min-w-20 text-right",
            },
          ],
          data: paginatedTypes,
          emptyMessage: "No voucher types found.",
          rowKey: (type) => type.id,
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
          pageSizeOptions: [10, 20, 50, 100, 200, 500],
        }}
      />
      <Dialog open={isDialogOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Update voucher type" : "Create voucher type"}</DialogTitle>
            <DialogDescription>
              Define the operational voucher type and map it under the right voucher group.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Voucher type name</label>
              <Input value={form.name} onChange={(event) => onChange("name", event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Voucher group</label>
              <AutocompleteLookupField
                emptyLabel="Select voucher group"
                onChange={(nextValue) => onChange("voucherGroupId", nextValue)}
                options={activeGroups.map((group) => ({
                  value: group.id,
                  label: group.name,
                }))}
                searchPlaceholder="Search voucher group"
                value={form.voucherGroupId}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Category</label>
              <AutocompleteLookupField
                emptyLabel="Select category"
                onChange={(nextValue) => {
                  onChange("categoryId", nextValue)
                  onChange("ledgerId", "")
                }}
                options={activeCategories.map((category) => ({
                  value: category.id,
                  label: category.name,
                }))}
                searchPlaceholder="Search category"
                value={form.categoryId}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Ledger</label>
              <AutocompleteLookupField
                emptyLabel="Select ledger"
                onChange={(nextValue) => onChange("ledgerId", nextValue)}
                options={categoryLedgers.map((ledger) => ({
                  value: ledger.id,
                  label: ledger.name,
                }))}
                searchPlaceholder="Search ledger"
                value={form.ledgerId}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea
                value={form.description}
                onChange={(event) => onChange("description", event.target.value)}
                placeholder="Notes"
                rows={4}
              />
            </div>
            {formError ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {formError}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="button" onClick={onSave} disabled={isSaving}>
              {isSaving ? "Saving..." : isEditing ? "Update voucher type" : "Create voucher type"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function VoucherRegisterSection({
  form,
  formError,
  isDialogOpen,
  isSaving,
  ledgers,
  products,
  voucherTypes,
  onChange,
  onCreate,
  onDelete,
  onReverse,
  onBillAllocationChange,
  onBillAllocationCreate,
  onBillAllocationRemove,
  onLineChange,
  onLineCreate,
  onLineRemove,
  onOpenChange,
  onReset,
  onSalesItemProductChange,
  onSalesItemChange,
  onSalesItemCreate,
  onSalesItemRemove,
  onSave,
  onSelectVoucher,
  selectedVoucher,
  vouchers,
}: {
  form: VoucherFormState
  formError: string | null
  isDialogOpen: boolean
  isSaving: boolean
  ledgers: BillingLedger[]
  products: ProductListResponse["items"]
  voucherTypes: BillingVoucherMasterType[]
  onChange: (field: string, value: string) => void
  onCreate: () => void
  onDelete: () => void
  onReverse: (voucher: BillingVoucher) => void
  onBillAllocationChange: (
    index: number,
    field: keyof VoucherBillAllocationForm,
    value: string
  ) => void
  onBillAllocationCreate: () => void
  onBillAllocationRemove: (index: number) => void
  onLineChange: (
    index: number,
    field: keyof VoucherFormLine,
    value: string
  ) => void
  onLineCreate: () => void
  onLineRemove: (index: number) => void
  onOpenChange: (open: boolean) => void
  onReset: () => void
  onSalesItemProductChange: (index: number, productId: string) => void
  onSalesItemChange: (index: number, field: keyof SalesItemForm, value: string) => void
  onSalesItemCreate: () => void
  onSalesItemRemove: (index: number) => void
  onSave: () => void
  onSelectVoucher: (voucher: BillingVoucher) => void
  selectedVoucher: BillingVoucher | null
  vouchers: BillingVoucher[]
}) {
  const [searchValue, setSearchValue] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const normalizedSearch = searchValue.trim().toLowerCase()
  const filteredVouchers = vouchers.filter((voucher) =>
    [
      voucher.voucherNumber,
      voucher.date,
      voucher.counterparty,
      voucher.narration,
      titleFromVoucherType(voucher.type),
    ].some((value) => value.toLowerCase().includes(normalizedSearch))
  )
  const totalRecords = filteredVouchers.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedVouchers = filteredVouchers.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  )

  return (
    <>
      <CommonList
        header={{
          pageTitle: "Voucher Register",
          pageDescription:
            "Create, update, and manage posted vouchers with Tally-style double-entry controls, GST posting, and bill-wise adjustments.",
          addLabel: "New Voucher",
          onAddClick: onCreate,
        }}
        search={{
          value: searchValue,
          onChange: (value) => {
            setSearchValue(value)
            setCurrentPage(1)
          },
          placeholder: "Search vouchers",
        }}
        table={{
          columns: [
            {
              id: "serial",
              header: "Sl.No",
              cell: (voucher) =>
                (safeCurrentPage - 1) * pageSize +
                paginatedVouchers.findIndex((entry) => entry.id === voucher.id) +
                1,
              className: "w-12 min-w-12 px-2 text-center",
              headerClassName: "w-12 min-w-12 px-2 text-center",
              sticky: "left",
            },
            {
              id: "voucherNumber",
              header: "Voucher",
              sortable: true,
              accessor: (voucher) => voucher.voucherNumber,
              cell: (voucher) => (
                <div>
                  <p className="font-medium text-foreground">{voucher.voucherNumber}</p>
                  <p className="text-xs text-muted-foreground">{voucher.date}</p>
                </div>
              ),
            },
            {
              id: "type",
              header: "Type",
              sortable: true,
              accessor: (voucher) => titleFromVoucherType(voucher.type),
              cell: (voucher) => titleFromVoucherType(voucher.type),
            },
            {
              id: "counterparty",
              header: "Counterparty",
              sortable: true,
              accessor: (voucher) => voucher.counterparty,
              cell: (voucher) => voucher.counterparty,
            },
            {
              id: "amount",
              header: "Amount",
              sortable: true,
              accessor: (voucher) => getVoucherTotals(voucher).debit,
              cell: (voucher) => formatAmount(getVoucherTotals(voucher).debit),
            },
            {
              id: "status",
              header: "Status",
              accessor: (voucher) => (isVoucherBalanced(voucher) ? "Balanced" : "Mismatch"),
              cell: (voucher) => (
                <Badge variant={isVoucherBalanced(voucher) ? "outline" : "destructive"}>
                  {isVoucherBalanced(voucher) ? "Balanced" : "Mismatch"}
                </Badge>
              ),
            },
            {
              id: "actions",
              header: "Actions",
              cell: (voucher) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="size-8 rounded-full">
                      <MoreHorizontalIcon className="size-4" />
                      <span className="sr-only">Open voucher actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      className="gap-2"
                      onSelect={() => {
                        onSelectVoucher(voucher)
                      }}
                    >
                      <PencilLineIcon className="size-4" />
                      {voucher.status === "draft" ? "Edit" : "View"}
                    </DropdownMenuItem>
                    {voucher.status === "posted" &&
                    voucher.reversalOfVoucherId === null &&
                    voucher.reversedByVoucherId === null ? (
                      <DropdownMenuItem
                        className="gap-2"
                        onSelect={() => {
                          onReverse(voucher)
                        }}
                      >
                        <RotateCcwIcon className="size-4" />
                        Reverse
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              ),
              className: "w-20 min-w-20 text-right",
              headerClassName: "w-20 min-w-20 text-right",
            },
          ],
          data: paginatedVouchers,
          emptyMessage: "No vouchers found.",
          rowKey: (voucher) => voucher.id,
        }}
        footer={{
          content: (
            <div className="flex flex-wrap items-center gap-4">
              <span>
                Total vouchers: <span className="font-medium text-foreground">{totalRecords}</span>
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
          pageSizeOptions: [10, 20, 50, 100, 200, 500],
        }}
      />
      <Dialog open={isDialogOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedVoucher ? "Update voucher" : "Create voucher"}</DialogTitle>
            <DialogDescription>
              Post and maintain payment, receipt, sales, purchase, contra, and journal vouchers with double-entry controls.
            </DialogDescription>
          </DialogHeader>
          {form.type === "sales" ? (
            <SalesInvoiceEditor
              form={form}
              formError={formError}
              isSaving={isSaving}
              ledgers={ledgers}
              onChange={onChange}
              onDelete={onDelete}
              onReset={onReset}
              onSave={onSave}
              onSalesItemProductChange={onSalesItemProductChange}
              onSalesItemChange={onSalesItemChange}
              onSalesItemCreate={onSalesItemCreate}
              onSalesItemRemove={onSalesItemRemove}
              products={products}
              selectedVoucher={selectedVoucher}
              voucherTypes={voucherTypes}
            />
          ) : (
            <VoucherEditor
              form={form}
              formError={formError}
              isSaving={isSaving}
              ledgers={ledgers}
              onChange={onChange}
              onDelete={onDelete}
              onBillAllocationChange={onBillAllocationChange}
              onBillAllocationCreate={onBillAllocationCreate}
              onBillAllocationRemove={onBillAllocationRemove}
              onLineChange={onLineChange}
              onLineCreate={onLineCreate}
              onLineRemove={onLineRemove}
              onReset={onReset}
              onSave={onSave}
              selectedVoucher={selectedVoucher}
            />
          )}
          {selectedVoucher ? <VoucherComplianceCard voucher={selectedVoucher} /> : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

function VoucherModuleSection({
  ledgers,
  moduleId,
  onSelectVoucher,
  vouchers,
}: {
  ledgers: BillingLedger[]
  moduleId: BillingVoucherType
  onSelectVoucher: (voucher: BillingVoucher) => void
  vouchers: BillingVoucher[]
}) {
  const module = billingVoucherModules.find((item) => item.id === moduleId) ?? null

  if (!module) {
    return null
  }

  const filteredVouchers = vouchers.filter((voucher) => voucher.type === moduleId)

  return (
    <SectionShell
      title={module.name}
      description={`${module.summary} ${module.desktopIntent}`}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Voucher count"
          value={filteredVouchers.length}
          hint="Posted records currently present in this module lane."
        />
        <MetricCard
          label="Workflow"
          value={titleFromVoucherType(moduleId)}
          hint={module.workflowHint}
        />
        <MetricCard
          label="Available ledgers"
          value={ledgers.length}
          hint="Shared chart-of-accounts entries available during voucher posting."
        />
        <MetricCard
          label="Desktop intent"
          value="Ready"
          hint="This module is structured so it can map into Electron windows and keyboard-led panels."
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{module.name} Register</CardTitle>
          <CardDescription>
            Individual voucher lane kept modular for Tally-style accounting navigation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredVouchers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No vouchers have been posted in this module yet.
            </p>
          ) : (
            filteredVouchers.map((voucher) => {
              const totals = getVoucherTotals(voucher)

              return (
                <button
                  key={voucher.id}
                  type="button"
                  onClick={() => onSelectVoucher(voucher)}
                  className="w-full rounded-[1rem] border border-border/70 bg-card/70 p-4 text-left transition hover:border-accent/40"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{voucher.voucherNumber}</p>
                    <Badge variant="outline">{voucher.date}</Badge>
                    <Badge variant={isVoucherBalanced(voucher) ? "outline" : "destructive"}>
                      {isVoucherBalanced(voucher) ? "Balanced" : "Mismatch"}
                    </Badge>
                  </div>
                  <div className="mt-2">
                    <ComplianceBadges voucher={voucher} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{voucher.counterparty}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {voucher.narration}
                  </p>
                  <p className="mt-3 text-sm font-medium text-foreground">
                    {formatAmount(totals.debit)}
                  </p>
                </button>
              )
            })
          )}
        </CardContent>
      </Card>
    </SectionShell>
  )
}

function StockSection({ ledgers }: { ledgers: BillingLedger[] }) {
  const stockLedgers = ledgers.filter((ledger) =>
    ["stock", "purchase", "direct"].some((value) =>
      ledger.group.toLowerCase().includes(value)
    )
  )

  return (
    <SectionShell
      title="Stock"
      description="Inventory-facing page for stock-linked ledgers, valuation hooks, and future item-level stock books."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Stock-linked groups"
          value={new Set(stockLedgers.map((ledger) => ledger.group)).size}
          hint="Groups currently aligned to stock, purchase, and direct cost treatment."
        />
        <MetricCard
          label="Visible ledgers"
          value={stockLedgers.length}
          hint="Ledgers currently acting as inventory-side references in the books."
        />
        <MetricCard
          label="Valuation mode"
          value="Prepared"
          hint="This page is ready for stock item, godown, and valuation extensions."
        />
        <MetricCard
          label="Inventory scope"
          value="Billing"
          hint="Designed to bridge current accounting books with later inventory masters."
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Stock-linked ledgers</CardTitle>
          <CardDescription>
            Current accounting ledgers that can anchor the next inventory layer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {stockLedgers.map((ledger) => (
            <div
              key={ledger.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/70 px-4 py-3"
            >
              <div>
                <p className="font-medium text-foreground">{ledger.name}</p>
                <p className="text-sm text-muted-foreground">{ledger.group}</p>
              </div>
              <Badge variant="outline" className="capitalize">
                {ledger.nature}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </SectionShell>
  )
}

function StatementsSection({
  reports,
  vouchers,
}: {
  reports: BillingAccountingReports
  vouchers: BillingVoucher[]
}) {
  const recentVouchers = [...vouchers].slice(0, 5)

  return (
    <SectionShell
      title="Statements"
      description="Running business statements across receivables, payables, and recent book movement."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Receivable statement"
          value={formatAmount(reports.outstanding.receivableTotal)}
          hint="Current receivable-side statement value from posted bills."
        />
        <MetricCard
          label="Payable statement"
          value={formatAmount(reports.outstanding.payableTotal)}
          hint="Current payable-side statement value from posted bills."
        />
        <MetricCard
          label="Open bills"
          value={reports.outstanding.items.length}
          hint="Outstanding bill references contributing to statement balances."
        />
        <MetricCard
          label="Recent entries"
          value={recentVouchers.length}
          hint="Recent vouchers included in the statement snapshot below."
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent statement movement</CardTitle>
          <CardDescription>
            Recent voucher activity that would feed customer, supplier, and account statements.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentVouchers.map((voucher) => (
            <div
              key={voucher.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/70 px-4 py-3"
            >
              <div>
                <p className="font-medium text-foreground">{voucher.voucherNumber}</p>
                <p className="text-sm text-muted-foreground">
                  {voucher.counterparty} • {titleFromVoucherType(voucher.type)}
                </p>
              </div>
              <Badge variant="outline">{voucher.date}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </SectionShell>
  )
}

void StatementsSection

type PartyStatementEntryView = {
  voucherId: string
  voucherNumber: string
  voucherType: BillingVoucherType
  date: string
  narration: string
  referenceVoucherNumber: string | null
  debitAmount: number
  creditAmount: number
  runningSide: "debit" | "credit"
  runningAmount: number
}

type PartyStatementItemView = {
  partyId: string
  partyName: string
  debitTotal: number
  creditTotal: number
  closingSide: "debit" | "credit"
  closingAmount: number
  entries: PartyStatementEntryView[]
}

function PartyStatementCards({
  emptyMessage,
  items,
  movementHint,
}: {
  emptyMessage: string
  items: PartyStatementItemView[]
  movementHint: string
}) {
  if (items.length === 0) {
    return <StateCard message={emptyMessage} />
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.partyId}>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>{item.partyName}</CardTitle>
                <CardDescription>{movementHint}</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Debit {formatAmount(item.debitTotal)}</Badge>
                <Badge variant="outline">Credit {formatAmount(item.creditTotal)}</Badge>
                <Badge variant="outline">
                  Closing {formatAmount(item.closingAmount)} {item.closingSide}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Voucher</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Narration</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Running</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {item.entries.map((entry) => (
                  <TableRow
                    key={`${item.partyId}:${entry.voucherId}:${entry.referenceVoucherNumber ?? "direct"}`}
                  >
                    <TableCell>{entry.date}</TableCell>
                    <TableCell>
                      {getVoucherPostingRoute(entry.voucherType, entry.voucherId) ? (
                        <Link
                          className="font-medium text-foreground underline-offset-4 hover:underline"
                          to={getVoucherPostingRoute(entry.voucherType, entry.voucherId)!}
                        >
                          {entry.voucherNumber}
                        </Link>
                      ) : (
                        <span className="font-medium text-foreground">
                          {entry.voucherNumber}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{entry.referenceVoucherNumber ?? "Direct"}</TableCell>
                    <TableCell>{titleFromVoucherType(entry.voucherType)}</TableCell>
                    <TableCell>{entry.narration || "No narration"}</TableCell>
                    <TableCell className="text-right">
                      {entry.debitAmount > 0 ? formatAmount(entry.debitAmount) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.creditAmount > 0 ? formatAmount(entry.creditAmount) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatAmount(entry.runningAmount)} {entry.runningSide}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function StatementsOverviewSection({ reports }: { reports: BillingAccountingReports }) {
  const customerClosingTotal = reports.customerStatement.items.reduce((sum, item) => {
    if (item.closingSide !== "debit") {
      return sum
    }

    return sum + item.closingAmount
  }, 0)
  const supplierClosingTotal = reports.supplierStatement.items.reduce((sum, item) => {
    if (item.closingSide !== "credit") {
      return sum
    }

    return sum + item.closingAmount
  }, 0)

  return (
    <SectionShell
      title="Statements"
      description="Receivable and payable party statements built from posted sales, purchases, notes, receipts, and payments."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Customers"
          value={reports.customerStatement.items.length}
          hint="Customer ledgers with posted receivable movement."
        />
        <MetricCard
          label="Suppliers"
          value={reports.supplierStatement.items.length}
          hint="Supplier ledgers with posted payable movement."
        />
        <MetricCard
          label="Receivable closing"
          value={formatAmount(customerClosingTotal)}
          hint="Net debit balances across customer statements."
        />
        <MetricCard
          label="Payable closing"
          value={formatAmount(supplierClosingTotal)}
          hint="Net credit balances across supplier statements."
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Statement Book</CardTitle>
              <CardDescription>
                Receivable movement from posted sales, credit notes, and receipts.
              </CardDescription>
            </CardHeader>
          </Card>
          <PartyStatementCards
            emptyMessage="No posted customer statement movement is available yet."
            items={reports.customerStatement.items.map((item) => ({
              partyId: item.customerId,
              partyName: item.customerName,
              debitTotal: item.debitTotal,
              creditTotal: item.creditTotal,
              closingSide: item.closingSide,
              closingAmount: item.closingAmount,
              entries: item.entries,
            }))}
            movementHint="Running receivable statement from posted invoices, notes, and receipts."
          />
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Statement Book</CardTitle>
              <CardDescription>
                Payable movement from posted purchases, debit notes, and payments.
              </CardDescription>
            </CardHeader>
          </Card>
          <PartyStatementCards
            emptyMessage="No posted supplier statement movement is available yet."
            items={reports.supplierStatement.items.map((item) => ({
              partyId: item.supplierId,
              partyName: item.supplierName,
              debitTotal: item.debitTotal,
              creditTotal: item.creditTotal,
              closingSide: item.closingSide,
              closingAmount: item.closingAmount,
              entries: item.entries,
            }))}
            movementHint="Running payable statement from posted bills, notes, and payments."
          />
        </div>
      </div>
    </SectionShell>
  )
}

function DayBookSection({ vouchers }: { vouchers: BillingVoucher[] }) {
  const postedVouchers = vouchers
    .filter((voucher) => voucher.status === "posted")
    .sort((left, right) =>
      left.date.localeCompare(right.date) ||
      left.voucherNumber.localeCompare(right.voucherNumber)
    )
  const draftCount = vouchers.filter((voucher) => voucher.status === "draft").length
  const cancelledCount = vouchers.filter((voucher) => voucher.status === "cancelled").length
  const reversedCount = vouchers.filter((voucher) => voucher.status === "reversed").length
  const excludedCount = vouchers.length - postedVouchers.length

  return (
    <SectionShell
      title="Day Book"
      description="Chronological day book built from posted vouchers only, so the book reflects accounting movement rather than draft or invalidated records."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Posted entries"
          value={postedVouchers.length}
          hint="Vouchers currently contributing to the accounting day book."
        />
        <MetricCard
          label="Excluded records"
          value={excludedCount}
          hint="Draft, cancelled, and reversed records left out of the posted book."
        />
        <MetricCard
          label="Drafts"
          value={draftCount}
          hint="Unposted records still under preparation."
        />
        <MetricCard
          label="Invalidated"
          value={cancelledCount + reversedCount}
          hint="Cancelled and reversed records removed from the live day book."
        />
      </div>
      {excludedCount > 0 ? (
        <Card>
          <CardContent className="flex flex-wrap gap-3 p-5 text-sm text-muted-foreground">
            <span>Draft {draftCount}</span>
            <span>Cancelled {cancelledCount}</span>
            <span>Reversed {reversedCount}</span>
          </CardContent>
        </Card>
      ) : null}
      {postedVouchers.length === 0 ? (
        <StateCard message="No posted vouchers are available for the day book yet." />
      ) : (
        <VoucherRegisterTable vouchers={postedVouchers} />
      )}
    </SectionShell>
  )
}

function DoubleEntrySection({ vouchers }: { vouchers: BillingVoucher[] }) {
  return (
    <SectionShell
      title="Double Entry"
      description="Per-voucher debit and credit inspection modeled the way a Tally-trained operator expects to verify postings."
    >
      <Accordion type="single" collapsible className="space-y-4">
        {vouchers.map((voucher) => {
          const totals = getVoucherTotals(voucher)

          return (
            <AccordionItem
              key={voucher.id}
              value={voucher.id}
              className="overflow-hidden rounded-[1rem] border border-border/70 bg-card/70"
            >
              <AccordionTrigger className="px-5 py-4 hover:no-underline">
                <div className="flex flex-1 flex-col items-start gap-2 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{voucher.voucherNumber}</p>
                    <Badge variant="outline">{titleFromVoucherType(voucher.type)}</Badge>
                    <Badge variant={isVoucherBalanced(voucher) ? "outline" : "destructive"}>
                      {isVoucherBalanced(voucher) ? "Balanced" : "Mismatch"}
                    </Badge>
                  </div>
                  <div className="mt-1">
                    <ComplianceBadges voucher={voucher} />
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {voucher.date} | {voucher.counterparty} | {voucher.narration}
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5">
                <div className="rounded-[1rem] border border-border/70 bg-background/80">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ledger</TableHead>
                        <TableHead>Note</TableHead>
                        <TableHead>Dr</TableHead>
                        <TableHead>Cr</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {voucher.lines.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell className="font-medium">{line.ledgerName}</TableCell>
                          <TableCell className="text-muted-foreground">{line.note}</TableCell>
                          <TableCell>
                            {line.side === "debit" ? formatAmount(line.amount) : "--"}
                          </TableCell>
                          <TableCell>
                            {line.side === "credit" ? formatAmount(line.amount) : "--"}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell className="font-semibold">Total</TableCell>
                        <TableCell />
                        <TableCell className="font-semibold">
                          {formatAmount(totals.debit)}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatAmount(totals.credit)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </SectionShell>
  )
}

function TrialBalanceSection({ reports }: { reports: BillingAccountingReports }) {
  return (
    <SectionShell
      title="Trial Balance"
      description="Ledger-wise opening, movement, and closing balances derived from posted vouchers."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Debit closing"
          value={formatAmount(reports.trialBalance.debitTotal)}
          hint="Total closing debit balances across the current books."
        />
        <MetricCard
          label="Credit closing"
          value={formatAmount(reports.trialBalance.creditTotal)}
          hint="Total closing credit balances across the current books."
        />
        <MetricCard
          label="Ledgers"
          value={reports.trialBalance.items.length}
          hint="Every billing ledger contributes to this derived balance view."
        />
        <MetricCard
          label="Gap"
          value={formatAmount(
            Math.abs(reports.trialBalance.debitTotal - reports.trialBalance.creditTotal)
          )}
          hint="Any difference here indicates incomplete opening equity or unsupported books."
        />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ledger</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Opening</TableHead>
                <TableHead>Dr</TableHead>
                <TableHead>Cr</TableHead>
                <TableHead>Closing</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.trialBalance.items.map((item) => (
                <TableRow key={item.ledgerId}>
                  <TableCell className="font-medium">{item.ledgerName}</TableCell>
                  <TableCell>{item.group}</TableCell>
                  <TableCell>
                    {formatAmount(item.openingAmount)} {item.openingSide === "debit" ? "Dr" : "Cr"}
                  </TableCell>
                  <TableCell>{formatAmount(item.debitAmount)}</TableCell>
                  <TableCell>{formatAmount(item.creditAmount)}</TableCell>
                  <TableCell>
                    {formatAmount(item.closingAmount)} {item.closingSide === "debit" ? "Dr" : "Cr"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </SectionShell>
  )
}

function GeneralLedgerSection({ reports }: { reports: BillingAccountingReports }) {
  return (
    <SectionShell
      title="General Ledger"
      description="Ledger-wise running movement register built from normalized posted accounting entries."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Ledger books"
          value={reports.generalLedger.items.length}
          hint="Each ledger gets its own running movement register."
        />
        <MetricCard
          label="Entry rows"
          value={reports.generalLedger.items.reduce((sum, item) => sum + item.entries.length, 0)}
          hint="Posted debit and credit movements included across all ledger books."
        />
        <MetricCard
          label="Largest debit"
          value={formatAmount(
            Math.max(0, ...reports.generalLedger.items.map((item) => item.debitTotal))
          )}
          hint="Highest debit movement among the current ledger registers."
        />
        <MetricCard
          label="Largest credit"
          value={formatAmount(
            Math.max(0, ...reports.generalLedger.items.map((item) => item.creditTotal))
          )}
          hint="Highest credit movement among the current ledger registers."
        />
      </div>
      <div className="space-y-4">
        {reports.generalLedger.items.map((ledger) => (
          <Card key={ledger.ledgerId}>
            <CardHeader>
              <CardTitle>{ledger.ledgerName}</CardTitle>
              <CardDescription>
                {ledger.group} • Opening {formatAmount(ledger.openingAmount)} {ledger.openingSide === "debit" ? "Dr" : "Cr"} • Closing {formatAmount(ledger.closingAmount)} {ledger.closingSide === "debit" ? "Dr" : "Cr"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <MetricCard
                  label="Debit total"
                  value={formatAmount(ledger.debitTotal)}
                  hint="Debit movement posted into this ledger."
                />
                <MetricCard
                  label="Credit total"
                  value={formatAmount(ledger.creditTotal)}
                  hint="Credit movement posted into this ledger."
                />
                <MetricCard
                  label="Entries"
                  value={ledger.entries.length}
                  hint="Running ledger rows available for drillback."
                />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Voucher</TableHead>
                    <TableHead>Counterparty</TableHead>
                    <TableHead>Dr/Cr</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Running</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground">
                        No posted movements for this ledger yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ledger.entries.map((entry) => (
                      <TableRow key={entry.entryId}>
                        <TableCell>{entry.voucherDate}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{entry.voucherNumber}</p>
                            <p className="text-xs text-muted-foreground">{titleFromVoucherType(entry.voucherType)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{entry.counterparty}</p>
                            <p className="text-xs text-muted-foreground">{entry.narration}</p>
                          </div>
                        </TableCell>
                        <TableCell>{entry.side === "debit" ? "Dr" : "Cr"}</TableCell>
                        <TableCell>{formatAmount(entry.amount)}</TableCell>
                        <TableCell>
                          {formatAmount(entry.runningAmount)} {entry.runningSide === "debit" ? "Dr" : "Cr"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </SectionShell>
  )
}

function ProfitAndLossSection({ reports }: { reports: BillingAccountingReports }) {
  return (
    <SectionShell
      title="Profit & Loss"
      description="Income and expense statement built from posted ledgers and voucher movements."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total income"
          value={formatAmount(reports.profitAndLoss.totalIncome)}
          hint="Income-ledger closings contributing to the current period statement."
        />
        <MetricCard
          label="Total expense"
          value={formatAmount(reports.profitAndLoss.totalExpense)}
          hint="Expense-ledger closings contributing to the current period statement."
        />
        <MetricCard
          label="Net profit"
          value={formatAmount(reports.profitAndLoss.netProfit)}
          hint="Shown when income exceeds expense."
        />
        <MetricCard
          label="Net loss"
          value={formatAmount(reports.profitAndLoss.netLoss)}
          hint="Shown when expense exceeds income."
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Income</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reports.profitAndLoss.incomeItems.map((item) => (
              <div
                key={item.ledgerId}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/70 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-foreground">{item.ledgerName}</p>
                  <p className="text-sm text-muted-foreground">{item.group}</p>
                </div>
                <p className="font-medium text-foreground">{formatAmount(item.amount)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Expenses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reports.profitAndLoss.expenseItems.map((item) => (
              <div
                key={item.ledgerId}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/70 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-foreground">{item.ledgerName}</p>
                  <p className="text-sm text-muted-foreground">{item.group}</p>
                </div>
                <p className="font-medium text-foreground">{formatAmount(item.amount)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </SectionShell>
  )
}

function BalanceSheetSection({ reports }: { reports: BillingAccountingReports }) {
  return (
    <SectionShell
      title="Balance Sheet"
      description="Asset and liability view with current period earnings carried into the statement."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Assets"
          value={formatAmount(reports.balanceSheet.totalAssets)}
          hint="Asset-side closing balances including any current period loss carry."
        />
        <MetricCard
          label="Liabilities"
          value={formatAmount(reports.balanceSheet.totalLiabilities)}
          hint="Liability-side closing balances including current period profit carry."
        />
        <MetricCard
          label="Balance gap"
          value={formatAmount(reports.balanceSheet.balanceGap)}
          hint="A non-zero gap usually means capital/opening equity is not modeled yet."
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reports.balanceSheet.assetItems.map((item) => (
              <div
                key={item.ledgerId}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/70 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-foreground">{item.ledgerName}</p>
                  <p className="text-sm text-muted-foreground">{item.group}</p>
                </div>
                <p className="font-medium text-foreground">{formatAmount(item.amount)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Liabilities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reports.balanceSheet.liabilityItems.map((item) => (
              <div
                key={item.ledgerId}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/70 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-foreground">{item.ledgerName}</p>
                  <p className="text-sm text-muted-foreground">{item.group}</p>
                </div>
                <p className="font-medium text-foreground">{formatAmount(item.amount)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </SectionShell>
  )
}

function LedgerGuideSupportSection() {
  return (
    <SectionShell
      title="Ledger Usage Guide"
      description="How to structure billing accounts using category, ledger, voucher group, and voucher type in the finalized accounting model."
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Setup Order</CardTitle>
            <CardDescription>
              Create masters in this order so the accounting chain stays valid.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <div className="rounded-xl border border-border/70 bg-card/70 px-4 py-3">
              <p className="font-medium text-foreground">1. Category</p>
              <p>Create the accounting bucket such as Assets, Liabilities, Income, or Expenses.</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card/70 px-4 py-3">
              <p className="font-medium text-foreground">2. Ledger</p>
              <p>Create the account master under the selected category, for example Sales Account or Purchase Account.</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card/70 px-4 py-3">
              <p className="font-medium text-foreground">3. Voucher Group</p>
              <p>Create the business-side voucher grouping such as Sales, Purchase, Receipt, Payment, Contra, or Journal.</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card/70 px-4 py-3">
              <p className="font-medium text-foreground">4. Voucher Type</p>
              <p>Bind the voucher type to one voucher group, one category, and one ledger so posting intent stays explicit.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Master Chain</CardTitle>
            <CardDescription>
              The finalized billing model now keeps both accounting and operational grouping aligned.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <div className="rounded-xl border border-border/70 bg-card/70 px-4 py-3">
              <p className="font-medium text-foreground">Accounting chain</p>
              <p><code>Category -&gt; Ledger -&gt; Voucher Type</code></p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card/70 px-4 py-3">
              <p className="font-medium text-foreground">Operational chain</p>
              <p><code>Voucher Group -&gt; Voucher Type</code></p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card/70 px-4 py-3">
              <p className="font-medium text-foreground">Validation rule</p>
              <p>The selected voucher type ledger must belong to the selected category, so the account structure stays strict.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Example</CardTitle>
          <CardDescription>
            One practical setup for sales-side billing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
          <div className="rounded-xl border border-border/70 bg-card/70 px-4 py-3">
            <p><span className="font-medium text-foreground">Category:</span> Income</p>
            <p><span className="font-medium text-foreground">Ledger:</span> Sales Account</p>
            <p><span className="font-medium text-foreground">Voucher Group:</span> Sales</p>
            <p><span className="font-medium text-foreground">Voucher Type:</span> Fabric Sales</p>
          </div>
          <p>
            In that model, the voucher type belongs to the Sales group operationally, and it also points to the Sales Account ledger under the Income category for accounting alignment.
          </p>
        </CardContent>
      </Card>
    </SectionShell>
  )
}

function BillOutstandingSection({ reports }: { reports: BillingAccountingReports }) {
  return (
    <SectionShell
      title="Bill Outstanding"
      description="Receivable and payable control view covering open bills, aging, follow-up, overpayment or on-account exceptions, and party-wise settlement summaries."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Receivables"
          value={formatAmount(reports.outstanding.receivableTotal)}
          hint="Open sales bills after receipt adjustments."
        />
        <MetricCard
          label="Payables"
          value={formatAmount(reports.outstanding.payableTotal)}
          hint="Open purchase bills after payment adjustments."
        />
        <MetricCard
          label="Open bills"
          value={reports.outstanding.items.length}
          hint="Each item tracks original, settled, and outstanding values."
        />
        <MetricCard
          label="Exceptions"
          value={reports.settlementExceptions.items.length}
          hint="Advance, on-account, and overpayment cases needing operator attention."
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Receivable Aging</CardTitle>
            <CardDescription>
              Sales-side dues as of {reports.receivableAging.asOfDate}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reports.receivableAging.buckets.map((bucket) => (
              <div
                key={bucket.bucketKey}
                className="flex items-center justify-between rounded-xl border border-border/70 bg-card/70 px-4 py-3"
              >
                <span className="text-sm text-muted-foreground">{bucket.label}</span>
                <span className="font-medium text-foreground">{formatAmount(bucket.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payable Aging</CardTitle>
            <CardDescription>
              Purchase-side dues as of {reports.payableAging.asOfDate}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reports.payableAging.buckets.map((bucket) => (
              <div
                key={bucket.bucketKey}
                className="flex items-center justify-between rounded-xl border border-border/70 bg-card/70 px-4 py-3"
              >
                <span className="text-sm text-muted-foreground">{bucket.label}</span>
                <span className="font-medium text-foreground">{formatAmount(bucket.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Settlement Follow-up</CardTitle>
          <CardDescription>
            Open bills ranked by overdue position and collection or payment action.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Voucher</TableHead>
                <TableHead>Counterparty</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Overdue</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.settlementFollowUp.items.map((item) => (
                <TableRow key={`${item.voucherId}:follow-up`}>
                  <TableCell className="font-medium">
                    {getVoucherPostingRoute(item.voucherType, item.voucherId) ? (
                      <Link
                        className="underline-offset-4 hover:underline"
                        to={getVoucherPostingRoute(item.voucherType, item.voucherId)!}
                      >
                        {item.voucherNumber}
                      </Link>
                    ) : (
                      item.voucherNumber
                    )}
                  </TableCell>
                  <TableCell>{item.counterparty}</TableCell>
                  <TableCell>{item.dueDate ?? "No due date"}</TableCell>
                  <TableCell>{item.overdueDays} days</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.priority === "high"
                          ? "destructive"
                          : item.priority === "medium"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {item.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatAmount(item.outstandingAmount)}</TableCell>
                  <TableCell>
                    <Link className="underline-offset-4 hover:underline" to={item.actionRoute}>
                      {item.recommendedAction}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Settlement Exceptions</CardTitle>
            <CardDescription>
              Advance, on-account, and overpayment positions needing explicit treatment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard
                label="Advance"
                value={formatAmount(reports.settlementExceptions.advanceTotal)}
                hint="New-reference settlements recorded before bill matching."
              />
              <MetricCard
                label="On account"
                value={formatAmount(reports.settlementExceptions.onAccountTotal)}
                hint="Unmatched on-account settlements still pending allocation."
              />
              <MetricCard
                label="Overpayment"
                value={formatAmount(reports.settlementExceptions.overpaymentTotal)}
                hint="Collections or payments exceeding original bill value."
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Voucher</TableHead>
                  <TableHead>Counterparty</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.settlementExceptions.items.map((item) => (
                  <TableRow key={`${item.voucherId}:${item.category}:${item.referenceVoucherNumber ?? "direct"}`}>
                    <TableCell className="font-medium">{item.voucherNumber}</TableCell>
                    <TableCell>{item.counterparty}</TableCell>
                    <TableCell className="capitalize">{item.category.replace("_", " ")}</TableCell>
                    <TableCell>{item.referenceVoucherNumber ?? "Direct"}</TableCell>
                    <TableCell>{formatAmount(item.amount)}</TableCell>
                    <TableCell>{item.note}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Party-wise Collection and Payment Summary</CardTitle>
            <CardDescription>
              Receipt and payment behavior summarized by counterparty.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Counterparty</TableHead>
                  <TableHead>Receipts</TableHead>
                  <TableHead>Payments</TableHead>
                  <TableHead>Allocated</TableHead>
                  <TableHead>Unallocated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.partySettlementSummary.items.map((item) => (
                  <TableRow key={item.counterparty}>
                    <TableCell className="font-medium">{item.counterparty}</TableCell>
                    <TableCell>
                      {formatAmount(item.receiptAmount)}
                      <p className="text-sm text-muted-foreground">{item.receiptCount} vouchers</p>
                    </TableCell>
                    <TableCell>
                      {formatAmount(item.paymentAmount)}
                      <p className="text-sm text-muted-foreground">{item.paymentCount} vouchers</p>
                    </TableCell>
                    <TableCell>
                      {formatAmount(item.allocatedReceiptAmount + item.allocatedPaymentAmount)}
                    </TableCell>
                    <TableCell>
                      {formatAmount(item.unallocatedReceiptAmount + item.unallocatedPaymentAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Open Bills</CardTitle>
          <CardDescription>
            Detailed bill-wise exposure as of {reports.outstanding.asOfDate}.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Voucher</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Counterparty</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Overdue</TableHead>
                <TableHead>Original</TableHead>
                <TableHead>Settled</TableHead>
                <TableHead>Outstanding</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.outstanding.items.map((item) => (
                <TableRow key={item.voucherId}>
                  <TableCell className="font-medium">
                    {item.voucherNumber}
                    <p className="text-sm text-muted-foreground">{item.date}</p>
                  </TableCell>
                  <TableCell className="capitalize">{item.voucherType}</TableCell>
                  <TableCell>{item.counterparty}</TableCell>
                  <TableCell>{item.dueDate ?? item.date}</TableCell>
                  <TableCell>{item.overdueDays} days</TableCell>
                  <TableCell>{formatAmount(item.originalAmount)}</TableCell>
                  <TableCell>{formatAmount(item.settledAmount)}</TableCell>
                  <TableCell>{formatAmount(item.outstandingAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </SectionShell>
  )
}

export function BillingWorkspaceSection({
  categoryId,
  ledgerId,
  voucherId,
  sectionId,
}: {
  categoryId?: string
  ledgerId?: string
  voucherId?: string
  sectionId?: string
}) {
  const navigate = useNavigate()
  const [state, setState] = useState<ResourceState>({
    error: null,
    isLoading: true,
    categories: [],
    hsnCodes: [],
    ledgers: [],
    products: [],
    voucherGroups: [],
    voucherTypes: [],
    reports: createEmptyReports(),
    units: [],
    vouchers: [],
  })
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(null)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingLedgerId, setEditingLedgerId] = useState<string | null>(null)
  const [editingVoucherGroupId, setEditingVoucherGroupId] = useState<string | null>(null)
  const [editingVoucherTypeId, setEditingVoucherTypeId] = useState<string | null>(null)
  const [form, setForm] = useState<VoucherFormState>(() => createDefaultVoucherForm())
  const [ledgerForm, setLedgerForm] = useState<LedgerFormState>(defaultLedgerForm)
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(defaultCategoryForm)
  const [voucherGroupForm, setVoucherGroupForm] = useState<VoucherGroupFormState>(defaultVoucherGroupForm)
  const [voucherTypeForm, setVoucherTypeForm] = useState<VoucherTypeFormState>(defaultVoucherTypeForm)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [isLedgerDialogOpen, setIsLedgerDialogOpen] = useState(false)
  const [isVoucherGroupDialogOpen, setIsVoucherGroupDialogOpen] = useState(false)
  const [isVoucherTypeDialogOpen, setIsVoucherTypeDialogOpen] = useState(false)
  const [isVoucherDialogOpen, setIsVoucherDialogOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  useGlobalLoading(state.isLoading)

  async function loadResources() {
    setState((current) => ({ ...current, error: null, isLoading: true }))

    try {
        const [categoryResponse, ledgerResponse, voucherGroupResponse, voucherTypeResponse, voucherResponse, reportsResponse, productResponse, unitResponse, hsnCodeResponse] = await Promise.all([
          request<BillingCategoryListResponse>("/internal/v1/billing/categories"),
          request<BillingLedgerListResponse>("/internal/v1/billing/ledgers"),
          request<BillingVoucherGroupListResponse>("/internal/v1/billing/voucher-groups"),
          request<BillingVoucherMasterTypeListResponse>("/internal/v1/billing/voucher-types"),
          request<BillingVoucherListResponse>("/internal/v1/billing/vouchers"),
          request<BillingAccountingReportsResponse>("/internal/v1/billing/reports"),
          request<ProductListResponse>("/internal/v1/core/products"),
          request<CommonModuleListResponse>("/internal/v1/core/common-modules/items?module=units"),
          request<CommonModuleListResponse>("/internal/v1/core/common-modules/items?module=hsnCodes"),
        ])

        setState({
          error: null,
          isLoading: false,
          categories: categoryResponse.items,
          hsnCodes: hsnCodeResponse.items.filter((item) => item.isActive),
          ledgers: ledgerResponse.items,
          products: productResponse.items,
          voucherGroups: voucherGroupResponse.items,
          voucherTypes: voucherTypeResponse.items,
          reports: reportsResponse.item,
          units: unitResponse.items.filter((item) => item.isActive),
          vouchers: voucherResponse.items,
        })
      } catch (error) {
        setState({
          error: error instanceof Error ? error.message : "Failed to load billing workspace.",
          isLoading: false,
          categories: [],
          hsnCodes: [],
          ledgers: [],
          products: [],
          voucherGroups: [],
          voucherTypes: [],
          reports: createEmptyReports(),
          units: [],
          vouchers: [],
        })
      }
  }

  useEffect(() => {
    void loadResources()
  }, [])

  const selectedVoucher =
    state.vouchers.find((voucher) => voucher.id === selectedVoucherId) ?? null
  const selectedCategory =
    state.categories.find((category) => category.id === categoryId) ?? null
  const activeCategory =
    state.categories.find((category) => category.id === editingCategoryId) ??
    selectedCategory ??
    null
  const selectedLedger =
    state.ledgers.find((ledger) => ledger.id === ledgerId) ?? null
  const routeVoucher =
    state.vouchers.find((voucher) => voucher.id === voucherId) ?? null
  const activeLedger =
    state.ledgers.find((ledger) => ledger.id === editingLedgerId) ??
    selectedLedger ??
    null
  const activeVoucherGroup =
    state.voucherGroups.find((group) => group.id === editingVoucherGroupId) ?? null
  const activeVoucherType =
    state.voucherTypes.find((type) => type.id === editingVoucherTypeId) ?? null

  useEffect(() => {
    if ((sectionId ?? "overview") !== "chart-of-accounts-upsert") {
      return
    }

    setLedgerForm(toLedgerForm(activeLedger))
    setEditingLedgerId(activeLedger?.id ?? null)
    setIsLedgerDialogOpen(true)
    setFormError(null)
  }, [activeLedger, sectionId])

  useEffect(() => {
    if ((sectionId ?? "overview") !== "categories-upsert") {
      return
    }

    setCategoryForm(
      activeCategory
        ? {
            description: activeCategory.description,
            name: activeCategory.name,
          }
        : defaultCategoryForm
    )
    setIsCategoryDialogOpen(true)
    setFormError(null)
    setEditingCategoryId(activeCategory?.id ?? null)
  }, [activeCategory, sectionId])

  useEffect(() => {
    if ((sectionId ?? "overview") !== "sales-vouchers-upsert") {
      return
    }

    if (routeVoucher && routeVoucher.type === "sales") {
      setSelectedVoucherId(routeVoucher.id)
      setForm(toVoucherForm(routeVoucher))
    } else {
      setSelectedVoucherId(null)
      setForm({
        ...createDefaultVoucherForm(),
        type: "sales",
      })
    }

    setFormError(null)
  }, [routeVoucher, sectionId])

  useEffect(() => {
    const currentSection = sectionId ?? "overview"
    const moduleBySection = {
      "credit-note-upsert": "credit_note",
      "debit-note-upsert": "debit_note",
      "payment-vouchers-upsert": "payment",
      "purchase-vouchers-upsert": "purchase",
      "receipt-vouchers-upsert": "receipt",
    } as const
    const moduleId = moduleBySection[currentSection as keyof typeof moduleBySection]

    if (!moduleId) {
      return
    }

    if (routeVoucher && routeVoucher.type === moduleId) {
      setSelectedVoucherId(routeVoucher.id)
      setForm(toVoucherForm(routeVoucher))
    } else {
      setSelectedVoucherId(null)
      setForm({
        ...createDefaultVoucherForm(),
        type: moduleId,
      })
    }

    setFormError(null)
  }, [routeVoucher, sectionId])

  function resetForm() {
    setSelectedVoucherId(null)
    setForm(createDefaultVoucherForm())
    setFormError(null)
  }

  function handleSelectVoucher(voucher: BillingVoucher) {
    setSelectedVoucherId(voucher.id)
    setForm(toVoucherForm(voucher))
    setFormError(null)
    setIsVoucherDialogOpen(true)
  }

  function handleChange(field: string, value: string) {
    setForm((current) => {
      switch (field) {
        case "counterparty":
        case "date":
        case "narration":
        case "status":
        case "voucherNumber":
          return {
            ...current,
            [field]: value,
          }
        case "type":
          return {
            ...current,
            type: value as BillingVoucherType,
            sales:
              value === "sales"
                ? current.sales.items.length > 0
                  ? current.sales
                  : createDefaultSalesForm()
                : current.sales,
          }
        case "gst":
          return {
            ...current,
            gst: {
              ...current.gst,
              enabled: value === "enabled",
            },
          }
        case "generateEInvoice":
          return {
            ...current,
            generateEInvoice: value === "true",
          }
        case "generateEWayBill":
          return {
            ...current,
            generateEWayBill: value === "true",
            transport: {
              ...current.transport,
              enabled: value === "true",
            },
          }
        case "gstHsnOrSac":
          return { ...current, gst: { ...current.gst, hsnOrSac: value } }
        case "gstPartyGstin":
          return { ...current, gst: { ...current.gst, partyGstin: value } }
        case "gstPartyLedgerId":
          return { ...current, gst: { ...current.gst, partyLedgerId: value } }
        case "gstPlaceOfSupply":
          return { ...current, gst: { ...current.gst, placeOfSupply: value } }
        case "gstSupplyType":
          return {
            ...current,
            gst: {
              ...current.gst,
              supplyType: value === "inter" ? "inter" : "intra",
            },
          }
        case "gstTaxRate":
          return { ...current, gst: { ...current.gst, taxRate: value } }
        case "gstTaxableAmount":
          return { ...current, gst: { ...current.gst, taxableAmount: value } }
        case "gstTaxableLedgerId":
          return { ...current, gst: { ...current.gst, taxableLedgerId: value } }
        case "transportDistanceKm":
          return { ...current, transport: { ...current.transport, distanceKm: value } }
        case "transportVehicleNumber":
          return { ...current, transport: { ...current.transport, vehicleNumber: value } }
        case "transportTransporterId":
          return { ...current, transport: { ...current.transport, transporterId: value } }
        case "salesVoucherTypeId":
          return { ...current, sales: { ...current.sales, voucherTypeId: value } }
        case "salesCustomerLedgerId":
          return { ...current, sales: { ...current.sales, customerLedgerId: value } }
        case "salesBillToName":
          return {
            ...current,
            counterparty: value,
            sales: { ...current.sales, billToName: value },
          }
        case "salesBillToAddress":
          return { ...current, sales: { ...current.sales, billToAddress: value } }
        case "salesShipToName":
          return { ...current, sales: { ...current.sales, shipToName: value } }
        case "salesShipToAddress":
          return { ...current, sales: { ...current.sales, shipToAddress: value } }
        case "salesReferenceNumber":
          return { ...current, sales: { ...current.sales, referenceNumber: value } }
        case "salesDueDate":
          return { ...current, sales: { ...current.sales, dueDate: value } }
        case "salesPartyGstin":
          return { ...current, sales: { ...current.sales, partyGstin: value } }
        case "salesPlaceOfSupply":
          return { ...current, sales: { ...current.sales, placeOfSupply: value } }
        case "salesSupplyType":
          return {
            ...current,
            sales: {
              ...current.sales,
              supplyType: value === "inter" ? "inter" : "intra",
            },
          }
        case "salesTaxRate":
          return { ...current, sales: { ...current.sales, taxRate: value } }
        default:
          return current
      }
    })
  }

  function handleBillAllocationChange(
    index: number,
    field: keyof VoucherBillAllocationForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      billAllocations: current.billAllocations.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }))
  }

  function handleBillAllocationCreate() {
    setForm((current) => ({
      ...current,
      billAllocations: [
        ...current.billAllocations,
        {
          amount: "",
          dueDate: "",
          note: "",
          referenceDate: current.date,
          referenceNumber: "",
          referenceType: "against_ref",
        },
      ],
    }))
  }

  function handleBillAllocationRemove(index: number) {
    setForm((current) => ({
      ...current,
      billAllocations: current.billAllocations.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  function handleLineChange(
    index: number,
    field: keyof VoucherFormLine,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      lines: current.lines.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [field]: value } : line
      ),
    }))
  }

  function handleLineCreate() {
    setForm((current) => ({
      ...current,
      lines: [
        ...current.lines,
        { amount: "", ledgerId: "", note: "", side: "debit" },
      ],
    }))
  }

  function handleLineRemove(index: number) {
    setForm((current) => ({
      ...current,
      lines: current.lines.filter((_, lineIndex) => lineIndex !== index),
    }))
  }

  function handleSalesItemChange(
    index: number,
    field: keyof SalesItemForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      sales: {
        ...current.sales,
        items: current.sales.items.map((item, itemIndex) =>
          itemIndex === index ? { ...item, [field]: value } : item
        ),
      },
    }))
  }

  function handleSalesItemProductChange(index: number, productId: string) {
    const selectedProduct = state.products.find((product) => product.id === productId) ?? null
    const unitLabel = selectedProduct?.unitId
      ? getCommonModuleText(
          state.units.find((item) => item.id === selectedProduct.unitId),
          ["code", "symbol", "name"]
        )
      : ""
    const hsnLabel = selectedProduct?.hsnCodeId
      ? getCommonModuleText(
          state.hsnCodes.find((item) => item.id === selectedProduct.hsnCodeId),
          ["code", "name"]
        )
      : ""

    setForm((current) => ({
      ...current,
      sales: {
        ...current.sales,
        items: current.sales.items.map((item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                productId,
                itemName: selectedProduct?.name ?? item.itemName,
                description:
                  selectedProduct?.shortDescription?.trim() ||
                  selectedProduct?.description?.trim() ||
                  item.description,
                hsnOrSac: hsnLabel || item.hsnOrSac,
                rate: selectedProduct ? String(selectedProduct.basePrice) : item.rate,
                unit: unitLabel || item.unit,
              }
            : item
        ),
      },
    }))
  }

  function handleSalesItemCreate() {
    setForm((current) => ({
      ...current,
      sales: {
        ...current.sales,
        items: [...current.sales.items, { ...defaultSalesItem }],
      },
    }))
  }

  function handleSalesItemRemove(index: number) {
    setForm((current) => ({
      ...current,
      sales: {
        ...current.sales,
        items:
          current.sales.items.length <= 1
            ? [{ ...defaultSalesItem }]
            : current.sales.items.filter((_, itemIndex) => itemIndex !== index),
      },
    }))
  }

  function handleLedgerChange(field: keyof LedgerFormState, value: string) {
    setLedgerForm((current) => ({
      ...current,
      [field]:
        field === "nature"
          ? (value as LedgerFormState["nature"])
          : field === "closingSide"
            ? (value as LedgerFormState["closingSide"])
            : value,
    }))
  }

  function handleCategoryChange(field: keyof CategoryFormState, value: string) {
    setCategoryForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function handleVoucherGroupChange(
    field: keyof VoucherGroupFormState,
    value: string
  ) {
    setVoucherGroupForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function handleVoucherTypeChange(
    field: keyof VoucherTypeFormState,
    value: string
  ) {
    setVoucherTypeForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function buildPayload(): BillingVoucherUpsertPayload {
    const salesModeEnabled = form.type === "sales"
    const gstModeEnabled =
      salesModeEnabled || (form.gst.enabled && ["sales", "purchase"].includes(form.type))

    return {
      status: form.status,
      voucherNumber: form.voucherNumber,
      type: form.type,
      sourceVoucherId: form.sourceVoucherId.trim() || null,
      date: form.date,
      counterparty: salesModeEnabled ? form.sales.billToName : form.counterparty,
      narration: form.narration,
      lines: gstModeEnabled
        ? []
        : form.lines.map((line) => ({
            ledgerId: line.ledgerId,
            side: line.side,
            amount: Number(line.amount),
            note: line.note,
          })),
      billAllocations: form.billAllocations.map((allocation) => ({
        referenceType: allocation.referenceType,
        referenceNumber: allocation.referenceNumber,
        referenceDate: allocation.referenceDate || null,
        dueDate: allocation.dueDate || null,
        amount: Number(allocation.amount),
        note: allocation.note,
      })),
      gst: salesModeEnabled
        ? null
        : gstModeEnabled
        ? {
            supplyType: form.gst.supplyType,
            placeOfSupply: form.gst.placeOfSupply,
            partyGstin: form.gst.partyGstin.trim() || null,
            hsnOrSac: form.gst.hsnOrSac,
            taxableAmount: Number(form.gst.taxableAmount),
            taxRate: Number(form.gst.taxRate),
            taxableLedgerId: form.gst.taxableLedgerId,
            partyLedgerId: form.gst.partyLedgerId,
          }
        : null,
      sales: salesModeEnabled
        ? {
            voucherTypeId: form.sales.voucherTypeId,
            customerLedgerId: form.sales.customerLedgerId,
            billToName: form.sales.billToName,
            billToAddress: form.sales.billToAddress,
            shipToName: form.sales.shipToName.trim() || null,
            shipToAddress: form.sales.shipToAddress.trim() || null,
            dueDate: form.sales.dueDate || null,
            referenceNumber: form.sales.referenceNumber.trim() || null,
            supplyType: form.sales.supplyType,
            placeOfSupply: form.sales.placeOfSupply,
            partyGstin: form.sales.partyGstin.trim() || null,
            taxRate: Number(form.sales.taxRate),
            items: form.sales.items.map((item) => ({
              itemName: item.itemName,
              description: item.description,
              hsnOrSac: item.hsnOrSac,
              quantity: Number(item.quantity),
              unit: item.unit,
              rate: Number(item.rate),
            })),
          }
        : null,
      transport:
        form.generateEWayBill && form.transport.enabled
          ? {
              distanceKm: Number(form.transport.distanceKm),
              vehicleNumber: form.transport.vehicleNumber,
              transporterId: form.transport.transporterId.trim() || null,
            }
          : null,
      generateEInvoice: form.generateEInvoice,
      generateEWayBill: form.generateEWayBill,
    }
  }

  async function handleSave() {
    setFormError(null)
    setIsSaving(true)

    try {
      const payload = buildPayload()

      if (selectedVoucherId) {
        await request<BillingVoucherResponse>(
          `/internal/v1/billing/voucher?id=${encodeURIComponent(selectedVoucherId)}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          }
        )
      } else {
        await request<BillingVoucherResponse>("/internal/v1/billing/vouchers", {
          method: "POST",
          body: JSON.stringify(payload),
        })
      }

      await loadResources()
      resetForm()
      const currentSection = sectionId ?? "overview"
      const upsertRedirectMap = {
        "credit-note-upsert": "/dashboard/billing/credit-note",
        "debit-note-upsert": "/dashboard/billing/debit-note",
        "payment-vouchers-upsert": "/dashboard/billing/payment-vouchers",
        "purchase-vouchers-upsert": "/dashboard/billing/purchase-vouchers",
        "receipt-vouchers-upsert": "/dashboard/billing/receipt-vouchers",
        "sales-vouchers-upsert": "/dashboard/billing/sales-vouchers",
      } as const

      if (currentSection in upsertRedirectMap) {
        void navigate(upsertRedirectMap[currentSection as keyof typeof upsertRedirectMap])
      } else {
        setIsVoucherDialogOpen(false)
      }
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to save billing voucher."
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!selectedVoucherId) {
      return
    }

    setFormError(null)
    setIsSaving(true)

    try {
      await request<{ deleted: true; id: string }>(
        `/internal/v1/billing/voucher?id=${encodeURIComponent(selectedVoucherId)}`,
        {
          method: "DELETE",
        }
      )
      await loadResources()
      resetForm()
      const currentSection = sectionId ?? "overview"
      const upsertRedirectMap = {
        "payment-vouchers-upsert": "/dashboard/billing/payment-vouchers",
        "purchase-vouchers-upsert": "/dashboard/billing/purchase-vouchers",
        "receipt-vouchers-upsert": "/dashboard/billing/receipt-vouchers",
        "sales-vouchers-upsert": "/dashboard/billing/sales-vouchers",
      } as const

      if (currentSection in upsertRedirectMap) {
        void navigate(upsertRedirectMap[currentSection as keyof typeof upsertRedirectMap])
      } else {
        setIsVoucherDialogOpen(false)
      }
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to delete billing voucher."
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleReverse(voucher: BillingVoucher) {
    const reason = window.prompt(
      `Enter reversal reason for ${voucher.voucherNumber}:`,
      `Reversal of ${voucher.voucherNumber}`
    )

    if (!reason || !reason.trim()) {
      return
    }

    setFormError(null)

    try {
      await request<BillingVoucherReverseResponse>(
        `/internal/v1/billing/voucher/reverse?id=${encodeURIComponent(voucher.id)}`,
        {
          method: "POST",
          body: JSON.stringify({
            reason: reason.trim(),
          } satisfies VoucherReverseRequest),
        }
      )
      await loadResources()
      if (selectedVoucherId === voucher.id) {
        setSelectedVoucherId(null)
      }
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to reverse billing voucher."
      )
    }
  }

  async function handleLedgerSave() {
    setFormError(null)
    setIsSaving(true)

    try {
      const payload = buildLedgerPayload(ledgerForm, state.categories, activeLedger)

      if (activeLedger) {
        await request<BillingLedgerResponse>(
          `/internal/v1/billing/ledger?id=${encodeURIComponent(activeLedger.id)}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          }
        )
      } else {
        await request<BillingLedgerResponse>("/internal/v1/billing/ledgers", {
          method: "POST",
          body: JSON.stringify(payload),
        })
      }

      await loadResources()
      setEditingLedgerId(null)
      setLedgerForm(defaultLedgerForm)
      setIsLedgerDialogOpen(false)
      void navigate("/dashboard/billing/chart-of-accounts")
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to save billing ledger."
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleLedgerDelete() {
    if (!activeLedger) {
      return
    }

    setFormError(null)
    setIsSaving(true)

    try {
      await request<{ deleted: true; id: string }>(
        `/internal/v1/billing/ledger?id=${encodeURIComponent(activeLedger.id)}`,
        {
          method: "DELETE",
        }
      )
      await loadResources()
      setEditingLedgerId(null)
      setLedgerForm(defaultLedgerForm)
      setIsLedgerDialogOpen(false)
      void navigate("/dashboard/billing/chart-of-accounts")
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to delete billing ledger."
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleCategorySave() {
    setFormError(null)
    setIsSaving(true)

    try {
      const payload = {
        name: categoryForm.name,
        description: categoryForm.description,
      }

      if (activeCategory) {
        await request<BillingCategoryResponse>(
          `/internal/v1/billing/category?id=${encodeURIComponent(activeCategory.id)}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          }
        )
      } else {
        await request<BillingCategoryResponse>("/internal/v1/billing/categories", {
          method: "POST",
          body: JSON.stringify(payload),
        })
      }

      await loadResources()
      setCategoryForm(defaultCategoryForm)
      setIsCategoryDialogOpen(false)
      setEditingCategoryId(null)
      void navigate("/dashboard/billing/categories")
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to save billing category."
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleCategoryDelete(categoryEntryId: string) {
    setFormError(null)

    try {
      await request<{ deleted: true; id: string }>(
        `/internal/v1/billing/category?id=${encodeURIComponent(categoryEntryId)}`,
        {
          method: "DELETE",
        }
      )
      await loadResources()
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to delete billing category."
      )
    }
  }

  async function handleCategoryRestore(categoryEntryId: string) {
    setFormError(null)

    try {
      await request<BillingCategoryResponse>(
        `/internal/v1/billing/category/restore?id=${encodeURIComponent(categoryEntryId)}`,
        {
          method: "POST",
        }
      )
      await loadResources()
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to restore billing category."
      )
    }
  }

  async function handleQuickCategoryCreate(name: string) {
    const response = await request<BillingCategoryResponse>("/internal/v1/billing/categories", {
      method: "POST",
      body: JSON.stringify({
        name,
        description: "",
      }),
    })

    await loadResources()
    return response.item
  }

  async function handleVoucherGroupSave() {
    setFormError(null)
    setIsSaving(true)

    try {
      const payload = {
        name: voucherGroupForm.name,
        description: voucherGroupForm.description,
      }

      if (activeVoucherGroup) {
        await request<BillingVoucherGroupResponse>(
          `/internal/v1/billing/voucher-group?id=${encodeURIComponent(activeVoucherGroup.id)}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          }
        )
      } else {
        await request<BillingVoucherGroupResponse>("/internal/v1/billing/voucher-groups", {
          method: "POST",
          body: JSON.stringify(payload),
        })
      }

      await loadResources()
      setVoucherGroupForm(defaultVoucherGroupForm)
      setIsVoucherGroupDialogOpen(false)
      setEditingVoucherGroupId(null)
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to save billing voucher group."
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleVoucherGroupDelete(voucherGroupId: string) {
    setFormError(null)

    try {
      await request<{ deleted: true; id: string }>(
        `/internal/v1/billing/voucher-group?id=${encodeURIComponent(voucherGroupId)}`,
        { method: "DELETE" }
      )
      await loadResources()
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to delete billing voucher group."
      )
    }
  }

  async function handleVoucherGroupRestore(voucherGroupId: string) {
    setFormError(null)

    try {
      await request<BillingVoucherGroupResponse>(
        `/internal/v1/billing/voucher-group/restore?id=${encodeURIComponent(voucherGroupId)}`,
        { method: "POST" }
      )
      await loadResources()
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to restore billing voucher group."
      )
    }
  }

  async function handleVoucherTypeSave() {
    setFormError(null)
    setIsSaving(true)

    try {
      const payload = {
        categoryId: voucherTypeForm.categoryId,
        name: voucherTypeForm.name,
        ledgerId: voucherTypeForm.ledgerId,
        voucherGroupId: voucherTypeForm.voucherGroupId,
        description: voucherTypeForm.description,
      }

      if (activeVoucherType) {
        await request<BillingVoucherMasterTypeResponse>(
          `/internal/v1/billing/voucher-type?id=${encodeURIComponent(activeVoucherType.id)}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          }
        )
      } else {
        await request<BillingVoucherMasterTypeResponse>("/internal/v1/billing/voucher-types", {
          method: "POST",
          body: JSON.stringify(payload),
        })
      }

      await loadResources()
      setVoucherTypeForm(defaultVoucherTypeForm)
      setIsVoucherTypeDialogOpen(false)
      setEditingVoucherTypeId(null)
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to save billing voucher type."
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleVoucherTypeDelete(voucherTypeId: string) {
    setFormError(null)

    try {
      await request<{ deleted: true; id: string }>(
        `/internal/v1/billing/voucher-type?id=${encodeURIComponent(voucherTypeId)}`,
        { method: "DELETE" }
      )
      await loadResources()
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to delete billing voucher type."
      )
    }
  }

  async function handleVoucherTypeRestore(voucherTypeId: string) {
    setFormError(null)

    try {
      await request<BillingVoucherMasterTypeResponse>(
        `/internal/v1/billing/voucher-type/restore?id=${encodeURIComponent(voucherTypeId)}`,
        { method: "POST" }
      )
      await loadResources()
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to restore billing voucher type."
      )
    }
  }

  if (state.isLoading) {
    return null
  }

  if (state.error) {
    return <StateCard message={state.error} />
  }

  switch (sectionId ?? "overview") {
    case "categories":
      return (
        <ChartOfAccountsSection
          categories={state.categories}
          form={categoryForm}
          formError={formError}
          hideHeader
          isDialogOpen={isCategoryDialogOpen}
          isEditing={activeCategory !== null}
          isSaving={isSaving}
          onChange={handleCategoryChange}
          onCreate={() => {
            setFormError(null)
            setCategoryForm(defaultCategoryForm)
            setEditingCategoryId(null)
            setIsCategoryDialogOpen(true)
          }}
          onDelete={handleCategoryDelete}
          onEdit={(categoryEntryId) => {
            const category = state.categories.find((entry) => entry.id === categoryEntryId)

            setCategoryForm(
              category
                ? {
                    name: category.name,
                    description: category.description,
                  }
                : defaultCategoryForm
            )
            setEditingCategoryId(category?.id ?? null)
            setFormError(null)
            setIsCategoryDialogOpen(true)
          }}
          onOpenChange={(open) => {
            setIsCategoryDialogOpen(open)
            if (!open) {
              setEditingCategoryId(null)
              setCategoryForm(defaultCategoryForm)
              setFormError(null)
            }
          }}
          onRestore={handleCategoryRestore}
          onSave={handleCategorySave}
        />
      )
    case "categories-upsert":
      return (
        <ChartOfAccountsSection
          categories={state.categories}
          form={categoryForm}
          formError={formError}
          hideHeader
          isDialogOpen={true}
          isEditing={activeCategory !== null}
          isSaving={isSaving}
          onChange={handleCategoryChange}
          onCreate={() => {
            setEditingCategoryId(null)
            setCategoryForm(defaultCategoryForm)
            setFormError(null)
            setIsCategoryDialogOpen(true)
          }}
          onDelete={handleCategoryDelete}
          onEdit={() => {}}
          onOpenChange={(open) => {
            setIsCategoryDialogOpen(open)
            if (!open) {
              setEditingCategoryId(null)
              setCategoryForm(defaultCategoryForm)
              setFormError(null)
              void navigate("/dashboard/billing/categories")
            }
          }}
          onRestore={handleCategoryRestore}
          onSave={handleCategorySave}
        />
      )
    case "chart-of-accounts":
      return (
        <LedgerMasterSection
          ledgers={state.ledgers}
          categories={state.categories}
          form={ledgerForm}
          formError={formError}
          isDialogOpen={isLedgerDialogOpen}
          isEditing={activeLedger !== null}
          isSaving={isSaving}
          onCategoryCreate={handleQuickCategoryCreate}
          onChange={handleLedgerChange}
          onCreate={() => {
            setFormError(null)
            setLedgerForm(defaultLedgerForm)
            setEditingLedgerId(null)
            setIsLedgerDialogOpen(true)
          }}
          onDelete={handleLedgerDelete}
          onEdit={(ledgerEntryId) => {
            const ledger = state.ledgers.find((entry) => entry.id === ledgerEntryId)

            setLedgerForm(toLedgerForm(ledger))
            setEditingLedgerId(ledger?.id ?? null)
            setFormError(null)
            setIsLedgerDialogOpen(true)
          }}
          onOpenChange={(open) => {
            setIsLedgerDialogOpen(open)
            if (!open) {
              setEditingLedgerId(null)
              setLedgerForm(defaultLedgerForm)
              setFormError(null)
            }
          }}
          onSave={handleLedgerSave}
        />
      )
    case "chart-of-accounts-upsert":
      return (
        <LedgerMasterSection
          ledgers={state.ledgers}
          categories={state.categories}
          form={ledgerForm}
          formError={formError}
          isDialogOpen={true}
          isEditing={activeLedger !== null}
          isSaving={isSaving}
          onCreate={() => {
            setEditingLedgerId(null)
            setLedgerForm(defaultLedgerForm)
            setFormError(null)
            setIsLedgerDialogOpen(true)
          }}
          onCategoryCreate={handleQuickCategoryCreate}
          onChange={handleLedgerChange}
          onDelete={handleLedgerDelete}
          onEdit={() => {}}
          onOpenChange={(open) => {
            setIsLedgerDialogOpen(open)
            if (!open) {
              setEditingLedgerId(null)
              setLedgerForm(defaultLedgerForm)
              setFormError(null)
              void navigate("/dashboard/billing/chart-of-accounts")
            }
          }}
          onSave={handleLedgerSave}
        />
      )
    case "voucher-groups":
      return (
        <VoucherGroupMasterSection
          form={voucherGroupForm}
          formError={formError}
          groups={state.voucherGroups}
          isDialogOpen={isVoucherGroupDialogOpen}
          isEditing={activeVoucherGroup !== null}
          isSaving={isSaving}
          onChange={handleVoucherGroupChange}
          onCreate={() => {
            setFormError(null)
            setVoucherGroupForm(defaultVoucherGroupForm)
            setEditingVoucherGroupId(null)
            setIsVoucherGroupDialogOpen(true)
          }}
          onDelete={handleVoucherGroupDelete}
          onEdit={(voucherGroupId) => {
            const group = state.voucherGroups.find((entry) => entry.id === voucherGroupId)

            setVoucherGroupForm(
              group
                ? {
                    description: group.description,
                    name: group.name,
                  }
                : defaultVoucherGroupForm
            )
            setEditingVoucherGroupId(group?.id ?? null)
            setFormError(null)
            setIsVoucherGroupDialogOpen(true)
          }}
          onOpenChange={(open) => {
            setIsVoucherGroupDialogOpen(open)
            if (!open) {
              setEditingVoucherGroupId(null)
              setVoucherGroupForm(defaultVoucherGroupForm)
              setFormError(null)
            }
          }}
          onRestore={handleVoucherGroupRestore}
          onSave={handleVoucherGroupSave}
        />
      )
    case "voucher-types":
      return (
        <VoucherTypeMasterSection
          categories={state.categories}
          form={voucherTypeForm}
          formError={formError}
          groups={state.voucherGroups}
          isDialogOpen={isVoucherTypeDialogOpen}
          isEditing={activeVoucherType !== null}
          isSaving={isSaving}
          ledgers={state.ledgers}
          onChange={handleVoucherTypeChange}
          onCreate={() => {
            setFormError(null)
            setVoucherTypeForm(defaultVoucherTypeForm)
            setEditingVoucherTypeId(null)
            setIsVoucherTypeDialogOpen(true)
          }}
          onDelete={handleVoucherTypeDelete}
          onEdit={(voucherTypeId) => {
            const type = state.voucherTypes.find((entry) => entry.id === voucherTypeId)

            setVoucherTypeForm(
              type
                ? {
                    categoryId: type.categoryId,
                    description: type.description,
                    ledgerId: type.ledgerId,
                    name: type.name,
                    voucherGroupId: type.voucherGroupId,
                  }
                : defaultVoucherTypeForm
            )
            setEditingVoucherTypeId(type?.id ?? null)
            setFormError(null)
            setIsVoucherTypeDialogOpen(true)
          }}
          onOpenChange={(open) => {
            setIsVoucherTypeDialogOpen(open)
            if (!open) {
              setEditingVoucherTypeId(null)
              setVoucherTypeForm(defaultVoucherTypeForm)
              setFormError(null)
            }
          }}
          onRestore={handleVoucherTypeRestore}
          onSave={handleVoucherTypeSave}
          types={state.voucherTypes}
        />
      )
    case "voucher-register":
      return (
        <VoucherRegisterSection
          form={form}
          formError={formError}
          isDialogOpen={isVoucherDialogOpen}
          isSaving={isSaving}
          ledgers={state.ledgers}
          products={state.products}
          voucherTypes={state.voucherTypes}
          onChange={handleChange}
          onCreate={() => {
            resetForm()
            setIsVoucherDialogOpen(true)
          }}
          onDelete={handleDelete}
          onReverse={handleReverse}
          onBillAllocationChange={handleBillAllocationChange}
          onBillAllocationCreate={handleBillAllocationCreate}
          onBillAllocationRemove={handleBillAllocationRemove}
          onLineChange={handleLineChange}
          onLineCreate={handleLineCreate}
          onLineRemove={handleLineRemove}
          onOpenChange={(open) => {
            setIsVoucherDialogOpen(open)
            if (!open) {
              resetForm()
            }
          }}
          onReset={resetForm}
          onSalesItemProductChange={handleSalesItemProductChange}
          onSalesItemChange={handleSalesItemChange}
          onSalesItemCreate={handleSalesItemCreate}
          onSalesItemRemove={handleSalesItemRemove}
          onSave={handleSave}
          onSelectVoucher={handleSelectVoucher}
          selectedVoucher={selectedVoucher}
          vouchers={state.vouchers}
        />
      )
    case "payment-vouchers":
      return (
        <VoucherModuleListSection
          moduleId="payment"
          onCreate={() => {
            void navigate("/dashboard/billing/payment-vouchers/new")
          }}
          onEdit={(nextVoucherId) => {
            void navigate(`/dashboard/billing/payment-vouchers/${encodeURIComponent(nextVoucherId)}/edit`)
          }}
          onSelectVoucher={handleSelectVoucher}
          vouchers={state.vouchers}
        />
      )
    case "payment-vouchers-upsert":
      return (
        <VoucherModuleUpsertSection
          form={form}
          formError={formError}
          isSaving={isSaving}
          ledgers={state.ledgers}
          onBillAllocationChange={handleBillAllocationChange}
          onBillAllocationCreate={handleBillAllocationCreate}
          onBillAllocationRemove={handleBillAllocationRemove}
          onChange={handleChange}
          onDelete={handleDelete}
          onLineChange={handleLineChange}
          onLineCreate={handleLineCreate}
          onLineRemove={handleLineRemove}
          onReset={() => {
            resetForm()
            void navigate("/dashboard/billing/payment-vouchers/new")
          }}
          onSave={handleSave}
          selectedVoucher={selectedVoucher}
        />
      )
    case "receipt-vouchers":
      return (
        <VoucherModuleListSection
          moduleId="receipt"
          onCreate={() => {
            void navigate("/dashboard/billing/receipt-vouchers/new")
          }}
          onEdit={(nextVoucherId) => {
            void navigate(`/dashboard/billing/receipt-vouchers/${encodeURIComponent(nextVoucherId)}/edit`)
          }}
          onSelectVoucher={handleSelectVoucher}
          vouchers={state.vouchers}
        />
      )
    case "receipt-vouchers-upsert":
      return (
        <VoucherModuleUpsertSection
          form={form}
          formError={formError}
          isSaving={isSaving}
          ledgers={state.ledgers}
          onBillAllocationChange={handleBillAllocationChange}
          onBillAllocationCreate={handleBillAllocationCreate}
          onBillAllocationRemove={handleBillAllocationRemove}
          onChange={handleChange}
          onDelete={handleDelete}
          onLineChange={handleLineChange}
          onLineCreate={handleLineCreate}
          onLineRemove={handleLineRemove}
          onReset={() => {
            resetForm()
            void navigate("/dashboard/billing/receipt-vouchers/new")
          }}
          onSave={handleSave}
          selectedVoucher={selectedVoucher}
        />
      )
    case "sales-vouchers":
      return (
        <SalesVoucherSection
          onCreate={() => {
            void navigate("/dashboard/billing/sales-vouchers/new")
          }}
          onEdit={(nextVoucherId) => {
            void navigate(`/dashboard/billing/sales-vouchers/${encodeURIComponent(nextVoucherId)}/edit`)
          }}
          onSelectVoucher={handleSelectVoucher}
          vouchers={state.vouchers}
        />
      )
    case "sales-vouchers-upsert":
      return (
        <SalesVoucherUpsertSection
          form={form}
          formError={formError}
          isSaving={isSaving}
          ledgers={state.ledgers}
          onChange={handleChange}
          onDelete={handleDelete}
          onReset={() => {
            resetForm()
            void navigate("/dashboard/billing/sales-vouchers/new")
          }}
          onSalesItemProductChange={handleSalesItemProductChange}
          onSalesItemChange={handleSalesItemChange}
          onSalesItemCreate={handleSalesItemCreate}
          onSalesItemRemove={handleSalesItemRemove}
          onSave={handleSave}
          products={state.products}
          selectedVoucher={selectedVoucher}
          voucherTypes={state.voucherTypes}
        />
      )
    case "purchase-vouchers":
      return (
        <VoucherModuleListSection
          moduleId="purchase"
          onCreate={() => {
            void navigate("/dashboard/billing/purchase-vouchers/new")
          }}
          onEdit={(nextVoucherId) => {
            void navigate(`/dashboard/billing/purchase-vouchers/${encodeURIComponent(nextVoucherId)}/edit`)
          }}
          onSelectVoucher={handleSelectVoucher}
          vouchers={state.vouchers}
        />
      )
    case "purchase-vouchers-upsert":
      return (
        <VoucherModuleUpsertSection
          form={form}
          formError={formError}
          isSaving={isSaving}
          ledgers={state.ledgers}
          onBillAllocationChange={handleBillAllocationChange}
          onBillAllocationCreate={handleBillAllocationCreate}
          onBillAllocationRemove={handleBillAllocationRemove}
          onChange={handleChange}
          onDelete={handleDelete}
          onLineChange={handleLineChange}
          onLineCreate={handleLineCreate}
          onLineRemove={handleLineRemove}
          onReset={() => {
            resetForm()
            void navigate("/dashboard/billing/purchase-vouchers/new")
          }}
          onSave={handleSave}
          selectedVoucher={selectedVoucher}
        />
      )
    case "credit-note":
      return (
        <VoucherModuleListSection
          moduleId="credit_note"
          onCreate={() => {
            void navigate("/dashboard/billing/credit-note/new")
          }}
          onEdit={(nextVoucherId) => {
            void navigate(`/dashboard/billing/credit-note/${encodeURIComponent(nextVoucherId)}/edit`)
          }}
          onSelectVoucher={handleSelectVoucher}
          vouchers={state.vouchers}
        />
      )
    case "credit-note-upsert":
      return (
        <VoucherModuleUpsertSection
          form={form}
          formError={formError}
          isSaving={isSaving}
          ledgers={state.ledgers}
          onBillAllocationChange={handleBillAllocationChange}
          onBillAllocationCreate={handleBillAllocationCreate}
          onBillAllocationRemove={handleBillAllocationRemove}
          onChange={handleChange}
          onDelete={handleDelete}
          onLineChange={handleLineChange}
          onLineCreate={handleLineCreate}
          onLineRemove={handleLineRemove}
          onReset={() => {
            resetForm()
            void navigate("/dashboard/billing/credit-note/new")
          }}
          onSave={handleSave}
          selectedVoucher={selectedVoucher}
        />
      )
    case "debit-note":
      return (
        <VoucherModuleListSection
          moduleId="debit_note"
          onCreate={() => {
            void navigate("/dashboard/billing/debit-note/new")
          }}
          onEdit={(nextVoucherId) => {
            void navigate(`/dashboard/billing/debit-note/${encodeURIComponent(nextVoucherId)}/edit`)
          }}
          onSelectVoucher={handleSelectVoucher}
          vouchers={state.vouchers}
        />
      )
    case "debit-note-upsert":
      return (
        <VoucherModuleUpsertSection
          form={form}
          formError={formError}
          isSaving={isSaving}
          ledgers={state.ledgers}
          onBillAllocationChange={handleBillAllocationChange}
          onBillAllocationCreate={handleBillAllocationCreate}
          onBillAllocationRemove={handleBillAllocationRemove}
          onChange={handleChange}
          onDelete={handleDelete}
          onLineChange={handleLineChange}
          onLineCreate={handleLineCreate}
          onLineRemove={handleLineRemove}
          onReset={() => {
            resetForm()
            void navigate("/dashboard/billing/debit-note/new")
          }}
          onSave={handleSave}
          selectedVoucher={selectedVoucher}
        />
      )
    case "contra-vouchers":
      return (
        <VoucherModuleSection
          ledgers={state.ledgers}
          moduleId="contra"
          onSelectVoucher={handleSelectVoucher}
          vouchers={state.vouchers}
        />
      )
    case "journal-vouchers":
      return (
        <VoucherModuleSection
          ledgers={state.ledgers}
          moduleId="journal"
          onSelectVoucher={handleSelectVoucher}
          vouchers={state.vouchers}
        />
      )
    case "stock":
      return <StockSection ledgers={state.ledgers} />
    case "statements":
      return <StatementsOverviewSection reports={state.reports} />
    case "day-book":
      return <DayBookSection vouchers={state.vouchers} />
    case "double-entry":
      return <DoubleEntrySection vouchers={state.vouchers} />
    case "general-ledger":
      return <GeneralLedgerSection reports={state.reports} />
    case "trial-balance":
      return <TrialBalanceSection reports={state.reports} />
    case "profit-and-loss":
      return <ProfitAndLossSection reports={state.reports} />
    case "balance-sheet":
      return <BalanceSheetSection reports={state.reports} />
    case "bill-outstanding":
      return <BillOutstandingSection reports={state.reports} />
    case "support-ledger-guide":
      return <LedgerGuideSupportSection />
    case "overview":
      return <OverviewSection ledgers={state.ledgers} vouchers={state.vouchers} />
    default:
      return null
  }
}
