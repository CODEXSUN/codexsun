import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeftIcon,
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
  BillingAuditTrailReview,
  BillingAuditTrailReviewResponse,
  BillingVoucherGroup,
  BillingVoucherGroupListResponse,
  BillingVoucherGroupResponse,
  BillingVoucherMasterType,
  BillingVoucherMasterTypeListResponse,
  BillingVoucherMasterTypeResponse,
  BillingVoucher,
  BillingVoucherDocumentResponse,
  BillingFinancialYearCloseWorkflowResponse,
  BillingOpeningBalanceRolloverResponse,
  BillingYearEndAdjustmentControlResponse,
  BillingVoucherBankReconciliationResponse,
  BillingVoucherLifecycleStatus,
  BillingVoucherListResponse,
  BillingVoucherReviewStatus,
  BillingVoucherReviewResponse,
  BillingVoucherReverseResponse,
  BillingVoucherResponse,
  BillingVoucherType,
  BillingVoucherUpsertPayload,
} from "@billing/shared"
import { billingVoucherModules } from "@billing/shared"
import type { CommonModuleItem, CommonModuleListResponse, ProductListResponse } from "@core/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
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
import { Textarea } from "@/components/ui/textarea"
import { CommonList, MasterList } from "@/components/blocks/master-list"
import { TechnicalNameBadge } from "@/components/system/technical-name-badge"
import { VoucherInlineEditableTable } from "@/components/blocks/voucher-inline-editable-table"
import { AnimatedTabs, type AnimatedContentTab } from "@/registry/concerns/navigation/animated-tabs"

import { BillingAuditTrailSection } from "./audit-section"
import { OverviewSection, StockSection } from "./overview-stock-sections"
import {
  BalanceSheetSection,
  BankBookSection,
  BankReconciliationSection,
  BillOutstandingSection,
  CashBookSection,
  DayBookSection,
  DoubleEntrySection,
  FinancialYearCloseSection,
  GeneralLedgerSection,
  GstPurchaseRegisterSection,
  GstSalesRegisterSection,
  InputOutputTaxSummarySection,
  LedgerGuideSupportSection,
  MonthEndChecklistSection,
  ProfitAndLossSection,
  StatementsOverviewSection,
  TrialBalanceSection,
} from "./reporting-sections"


type ResourceState = {
  auditTrail: BillingAuditTrailReview
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
    bankBook: {
      items: [],
    },
    cashBook: {
      items: [],
    },
    bankReconciliation: {
      asOfDate: "1970-01-01",
      matchedEntryCount: 0,
      matchedDebitTotal: 0,
      matchedCreditTotal: 0,
      pendingEntryCount: 0,
      pendingDebitTotal: 0,
      pendingCreditTotal: 0,
      oldestPendingDays: 0,
      mismatchEntryCount: 0,
      mismatchAmountTotal: 0,
      ledgers: [],
    },
    customerStatement: {
      items: [],
    },
    supplierStatement: {
      items: [],
    },
    gstSalesRegister: {
      asOfDate: "1970-01-01",
      invoiceCount: 0,
      creditNoteCount: 0,
      taxableAmountTotal: 0,
      cgstAmountTotal: 0,
      sgstAmountTotal: 0,
      igstAmountTotal: 0,
      totalTaxAmountTotal: 0,
      invoiceAmountTotal: 0,
      items: [],
    },
    gstPurchaseRegister: {
      asOfDate: "1970-01-01",
      invoiceCount: 0,
      debitNoteCount: 0,
      taxableAmountTotal: 0,
      cgstAmountTotal: 0,
      sgstAmountTotal: 0,
      igstAmountTotal: 0,
      totalTaxAmountTotal: 0,
      invoiceAmountTotal: 0,
      items: [],
    },
    inputOutputTaxSummary: {
      asOfDate: "1970-01-01",
      outputCgst: 0,
      outputSgst: 0,
      outputIgst: 0,
      outputTaxTotal: 0,
      inputCgst: 0,
      inputSgst: 0,
      inputIgst: 0,
      inputTaxTotal: 0,
      netCgstPayable: 0,
      netSgstPayable: 0,
      netIgstPayable: 0,
      netTaxPayable: 0,
    },
    gstFilingSummary: {
      latestPeriodKey: null,
      periods: [],
    },
    inventoryAuthority: {
      masterOwner: "core",
      warehouseOwner: "core",
      transactionOwner: "billing",
      valuationOwner: "billing",
      summary: "",
    },
    stockValuationPolicy: {
      method: "weighted_average",
      costSource: "core_cost_price",
      summary: "",
    },
    stockLedger: {
      asOfDate: "1970-01-01",
      items: [],
    },
    stockAccountingRules: {
      items: [],
    },
    warehouseStockPosition: {
      asOfDate: "1970-01-01",
      totalInventoryValue: 0,
      items: [],
    },
    stockValuationReport: {
      asOfDate: "1970-01-01",
      valuationMethod: "weighted_average",
      totalInventoryValue: 0,
      items: [],
    },
    exceptions: {
      alteredCount: 0,
      reversedCount: 0,
      backDatedCount: 0,
      items: [],
    },
    financeDashboard: {
      asOfDate: "1970-01-01",
      postedVoucherCount: 0,
      pendingReviewCount: 0,
      pendingReviewAmount: 0,
      reversedVoucherCount: 0,
      reversedVoucherAmount: 0,
      backDatedVoucherCount: 0,
      receivableTotal: 0,
      payableTotal: 0,
      bankPendingEntryCount: 0,
      bankMismatchAmount: 0,
      inventoryValue: 0,
      cashBalance: 0,
      bankBalance: 0,
    },
    monthEndChecklist: {
      asOfDate: "1970-01-01",
      readyCount: 0,
      attentionCount: 0,
      blockedCount: 0,
      items: [],
    },
    financialYearCloseWorkflow: null,
    openingBalanceRolloverPolicy: null,
    yearEndAdjustmentControlPolicy: null,
  }
}

function createEmptyAuditTrail(): BillingAuditTrailReview {
  return {
    totalEntries: 0,
    infoCount: 0,
    warnCount: 0,
    errorCount: 0,
    createCount: 0,
    postCount: 0,
    cancelCount: 0,
    deleteCount: 0,
    reverseCount: 0,
    reviewCount: 0,
    reconcileCount: 0,
    items: [],
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
  warehouseId: string
  quantity: string
  rate: string
  unit: string
}

type StockItemForm = {
  landedCostAmount: string
  note: string
  productId: string
  quantity: string
  unit: string
  unitCost: string
  warehouseId: string
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
  dimensions: {
    branch: string
    project: string
    costCenter: string
  }
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
  stock: {
    items: StockItemForm[]
  }
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
  warehouseId: "",
  quantity: "1",
  rate: "",
  unit: "Nos",
}

const defaultStockItem: StockItemForm = {
  landedCostAmount: "0",
  note: "",
  productId: "",
  quantity: "1",
  unit: "Nos",
  unitCost: "0",
  warehouseId: "",
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
    dimensions: {
      branch: "",
      project: "",
      costCenter: "",
    },
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
    stock: {
      items: [{ ...defaultStockItem }],
    },
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

function toVoucherReviewLabel(status: BillingVoucherReviewStatus) {
  switch (status) {
    case "not_required":
      return "No review"
    case "pending_review":
      return "Pending review"
    case "approved":
      return "Approved"
    case "rejected":
      return "Rejected"
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

function getVoucherReviewBadgeVariant(status: BillingVoucherReviewStatus) {
  switch (status) {
    case "approved":
      return "outline" as const
    case "pending_review":
      return "secondary" as const
    case "rejected":
      return "destructive" as const
    case "not_required":
      return "secondary" as const
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
    case "sales_return":
      return "Sales Return"
    case "credit_note":
      return "Credit Note"
    case "purchase":
      return "Purchase"
    case "purchase_return":
      return "Purchase Return"
    case "debit_note":
      return "Debit Note"
    case "stock_adjustment":
      return "Stock Adjustment"
    case "landed_cost":
      return "Landed Cost"
    case "contra":
      return "Contra"
    case "journal":
      return "Journal"
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

function downloadTextFile(fileName: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

function openPrintDocument(content: string) {
  const printWindow = window.open("", "_blank", "noopener,noreferrer")

  if (!printWindow) {
    throw new Error("Print preview was blocked by the browser.")
  }

  printWindow.document.open()
  printWindow.document.write(content)
  printWindow.document.close()
  printWindow.focus()
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
    dimensions: {
      branch: voucher.dimensions.branch ?? "",
      project: voucher.dimensions.project ?? "",
      costCenter: voucher.dimensions.costCenter ?? "",
    },
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
            productId: item.productId ?? "",
            warehouseId: item.warehouseId ?? "",
            quantity: String(item.quantity),
            rate: String(item.rate),
            unit: item.unit,
          })),
          voucherTypeId: voucher.sales.voucherTypeId,
        }
      : createDefaultSalesForm(),
    stock: {
      items:
        voucher.stock?.items.length
          ? voucher.stock.items.map((item) => ({
              landedCostAmount: String(item.landedCostAmount),
              note: item.note,
              productId: item.productId,
              quantity: String(item.quantity),
              unit: item.unit,
              unitCost: String(item.unitCost),
              warehouseId: item.warehouseId,
            }))
          : [{ ...defaultStockItem }],
    },
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

function VoucherEditor({
  form,
  formError,
  isSaving,
  ledgers,
  onChange,
  onDelete,
  onDocumentAction,
  onBillAllocationChange,
  onBillAllocationCreate,
  onBillAllocationRemove,
  onLineChange,
  onLineCreate,
  onLineRemove,
  onReset,
  onReview,
  onSave,
  selectedVoucher,
}: {
  form: VoucherFormState
  formError: string | null
  isSaving: boolean
  ledgers: BillingLedger[]
  onChange: (field: string, value: string) => void
  onDelete: () => void
  onDocumentAction: (voucherId: string, format: "print" | "csv" | "json") => void
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
  onReview: (voucherId: string, status: "approved" | "rejected") => void
  onSave: () => void
  selectedVoucher: BillingVoucher | null
}) {
  const isMutableVoucher = selectedVoucher === null || selectedVoucher.status === "draft"
  const provisionalVoucher = {
    lines:
      form.gst.enabled &&
      ["sales", "purchase", "sales_return", "purchase_return"].includes(form.type)
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
  const gstModeEnabled =
    form.gst.enabled &&
    ["sales", "purchase", "sales_return", "purchase_return"].includes(form.type)

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
              {([
                "payment",
                "receipt",
                "sales",
                "sales_return",
                "purchase",
                "purchase_return",
                "credit_note",
                "debit_note",
                "stock_adjustment",
                "landed_cost",
                "contra",
                "journal",
              ] as BillingVoucherType[]).map((type) => (
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

        {selectedVoucher ? (
          <div className="flex flex-wrap items-center gap-3 rounded-[1rem] border border-border/70 bg-card/70 p-4">
            <Badge variant={getVoucherReviewBadgeVariant(selectedVoucher.review.status)}>
              {toVoucherReviewLabel(selectedVoucher.review.status)}
            </Badge>
            {selectedVoucher.review.requiredReason ? (
              <p className="text-sm text-muted-foreground">
                {selectedVoucher.review.requiredReason}
              </p>
            ) : null}
          </div>
        ) : null}

        {selectedVoucher && !isMutableVoucher ? (
          <div className="rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            {toVoucherLifecycleLabel(selectedVoucher.status)} vouchers are read-only. Keep a voucher in draft for direct editing.
          </div>
        ) : null}

        {["sales", "purchase", "sales_return", "purchase_return"].includes(form.type) ? (
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

        {["credit_note", "debit_note", "sales_return", "purchase_return"].includes(form.type) ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="voucher-source-id">
              Source voucher id
            </label>
            <Input
              id="voucher-source-id"
              value={form.sourceVoucherId}
              onChange={(event) => onChange("sourceVoucherId", event.target.value)}
              placeholder="Required for notes and returns"
            />
          </div>
        ) : null}

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground">Accounting dimensions</p>
            <p className="text-xs text-muted-foreground">
              Optional branch, project, and cost-center tracking for reporting and controls.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              value={form.dimensions.branch}
              onChange={(event) => onChange("dimensionBranch", event.target.value)}
              placeholder="Branch"
            />
            <Input
              value={form.dimensions.project}
              onChange={(event) => onChange("dimensionProject", event.target.value)}
              placeholder="Project"
            />
            <Input
              value={form.dimensions.costCenter}
              onChange={(event) => onChange("dimensionCostCenter", event.target.value)}
              placeholder="Cost center"
            />
          </div>
        </div>

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
            <>
              <Button type="button" variant="outline" onClick={() => onDocumentAction(selectedVoucher.id, "print")}>
                Print
              </Button>
              <Button type="button" variant="outline" onClick={() => onDocumentAction(selectedVoucher.id, "csv")}>
                Export CSV
              </Button>
              <Button type="button" variant="outline" onClick={() => onDocumentAction(selectedVoucher.id, "json")}>
                Export JSON
              </Button>
              {selectedVoucher.review.status === "pending_review" ? (
                <>
                  <Button type="button" variant="outline" onClick={() => onReview(selectedVoucher.id, "approved")}>
                    Approve
                  </Button>
                  <Button type="button" variant="destructive" onClick={() => onReview(selectedVoucher.id, "rejected")}>
                    Reject
                  </Button>
                </>
              ) : null}
            </>
          ) : null}
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
  onDocumentAction,
  onReset,
  onReview,
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
  onDocumentAction: (voucherId: string, format: "print" | "csv" | "json") => void
  onReset: () => void
  onReview: (voucherId: string, status: "approved" | "rejected") => void
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

        {selectedVoucher ? (
          <div className="flex flex-wrap items-center gap-3 rounded-[1rem] border border-border/70 bg-card/70 p-4">
            <Badge variant={getVoucherReviewBadgeVariant(selectedVoucher.review.status)}>
              {toVoucherReviewLabel(selectedVoucher.review.status)}
            </Badge>
            {selectedVoucher.review.requiredReason ? (
              <p className="text-sm text-muted-foreground">
                {selectedVoucher.review.requiredReason}
              </p>
            ) : null}
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
            <>
              <Button type="button" variant="outline" onClick={() => onDocumentAction(selectedVoucher.id, "print")}>
                Print
              </Button>
              <Button type="button" variant="outline" onClick={() => onDocumentAction(selectedVoucher.id, "csv")}>
                Export CSV
              </Button>
              <Button type="button" variant="outline" onClick={() => onDocumentAction(selectedVoucher.id, "json")}>
                Export JSON
              </Button>
              {selectedVoucher.review.status === "pending_review" ? (
                <>
                  <Button type="button" variant="outline" onClick={() => onReview(selectedVoucher.id, "approved")}>
                    Approve
                  </Button>
                  <Button type="button" variant="destructive" onClick={() => onReview(selectedVoucher.id, "rejected")}>
                    Reject
                  </Button>
                </>
              ) : null}
            </>
          ) : null}
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
    case "purchase_return":
      return {
        addLabel: "New Purchase Return",
        amountLabel: "Return Total",
        emptyMessage: "No purchase returns found.",
        pageDescription: "Create and maintain purchase return vouchers tied back to source bills for supplier-side return control.",
        pageTitle: "Purchase Return",
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
    case "sales_return":
      return {
        addLabel: "New Sales Return",
        amountLabel: "Return Total",
        emptyMessage: "No sales returns found.",
        pageDescription: "Create and maintain sales return vouchers tied back to source invoices for customer return control.",
        pageTitle: "Sales Return",
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
  onShow,
  onSelectVoucher,
  vouchers,
}: {
  onCreate: () => void
  onEdit: (voucherId: string) => void
  onShow: (voucherId: string) => void
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
                  <button type="button" onClick={() => onShow(voucher.id)} className="font-medium text-foreground hover:underline text-left cursor-pointer">
                    {voucher.voucherNumber}
                  </button>
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
  onDocumentAction,
  onReset,
  onReview,
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
  onDocumentAction: (voucherId: string, format: "print" | "csv" | "json") => void
  onReset: () => void
  onReview: (voucherId: string, status: "approved" | "rejected") => void
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
    <SalesInvoiceTabbedEditor
      form={form}
      formError={formError}
      isSaving={isSaving}
      ledgers={ledgers}
      onChange={onChange}
      onDelete={onDelete}
      onDocumentAction={onDocumentAction}
      onReset={onReset}
      onReview={onReview}
      onSave={onSave}
      onSalesItemProductChange={onSalesItemProductChange}
      onSalesItemChange={onSalesItemChange}
      onSalesItemCreate={onSalesItemCreate}
      onSalesItemRemove={onSalesItemRemove}
      products={products}
      selectedVoucher={selectedVoucher}
      voucherTypes={voucherTypes}
    />
  )
}

function SalesInvoiceTabbedEditor({
  form,
  formError,
  isSaving,
  ledgers,
  onChange,
  onDelete,
  onDocumentAction,
  onReset,
  onReview,
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
  onDocumentAction: (voucherId: string, format: "print" | "csv" | "json") => void
  onReset: () => void
  onReview: (voucherId: string, status: "approved" | "rejected") => void
  onSave: () => void
  onSalesItemProductChange: (index: number, productId: string) => void
  onSalesItemChange: (index: number, field: keyof SalesItemForm, value: string) => void
  onSalesItemCreate: () => void
  onSalesItemRemove: (index: number) => void
  products: ProductListResponse["items"]
  selectedVoucher: BillingVoucher | null
  voucherTypes: BillingVoucherMasterType[]
}) {
  const navigate = useNavigate()
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
  const title = selectedVoucher
    ? isMutableVoucher
      ? "Edit sales invoice"
      : "View sales invoice"
    : "Create sales invoice"
  const invoiceLabel = form.voucherNumber.trim() || title

  const tabs = useMemo<AnimatedContentTab[]>(
    () => [
      {
        label: "Details",
        value: "details",
        content: (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="sales-bill-to-name-tabbed">
                    Bill to name
                  </label>
                  <Input
                    id="sales-bill-to-name-tabbed"
                    value={form.sales.billToName}
                    onChange={(event) => onChange("salesBillToName", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="sales-party-gstin-tabbed">
                    Customer GSTIN
                  </label>
                  <Input
                    id="sales-party-gstin-tabbed"
                    value={form.sales.partyGstin}
                    onChange={(event) => onChange("salesPartyGstin", event.target.value)}
                    placeholder="29ABCDE1234F1Z5"
                  />
                </div>
              </div>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="sales-voucher-number-tabbed">
                    Invoice number
                  </label>
                  <Input
                    id="sales-voucher-number-tabbed"
                    value={form.voucherNumber}
                    onChange={(event) => onChange("voucherNumber", event.target.value)}
                    placeholder="Leave blank for FY auto numbering"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="sales-date-tabbed">
                    Invoice date
                  </label>
                  <Input
                    id="sales-date-tabbed"
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
                        : [{ value: `manual:${index}`, label: item.itemName }, ...productOptions]

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
                      onChange={(event) => onSalesItemChange(index, "quantity", event.target.value)}
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
                      onChange={(event) => onSalesItemChange(index, "rate", event.target.value)}
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
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Quantity</p>
                <p className="mt-2 text-xl font-semibold text-foreground">{salesSummary.totalQuantity.toFixed(2)}</p>
              </div>
              <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Subtotal</p>
                <p className="mt-2 text-xl font-semibold text-foreground">{formatAmount(salesSummary.subtotal)}</p>
              </div>
              <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">GST total</p>
                <p className="mt-2 text-xl font-semibold text-foreground">{formatAmount(salesSummary.taxAmount)}</p>
              </div>
              <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Invoice total</p>
                <p className="mt-2 text-xl font-semibold text-foreground">{formatAmount(salesSummary.grandTotal)}</p>
              </div>
            </div>
          </div>
        ),
      },
      {
        label: "Address & Tax",
        value: "address-tax",
        content: (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="sales-place-of-supply-tabbed">
                Place of supply
              </label>
              <Input
                id="sales-place-of-supply-tabbed"
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
              <label className="text-sm font-medium text-foreground" htmlFor="sales-tax-rate-tabbed">
                GST rate %
              </label>
              <Input
                id="sales-tax-rate-tabbed"
                type="number"
                min="0"
                step="0.01"
                value={form.sales.taxRate}
                onChange={(event) => onChange("salesTaxRate", event.target.value)}
              />
            </div>
            <div className="rounded-[1rem] border border-border/70 bg-background/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Tax posture
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {form.sales.supplyType === "inter" ? "Inter-state GST" : "Intra-state GST"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                GST postings continue to derive from the configured tax rate and item totals.
              </p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground" htmlFor="sales-bill-to-address-tabbed">
                Bill to address
              </label>
              <Textarea
                id="sales-bill-to-address-tabbed"
                value={form.sales.billToAddress}
                onChange={(event) => onChange("salesBillToAddress", event.target.value)}
                placeholder="Customer billing address"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground" htmlFor="sales-ship-to-address-tabbed">
                Ship to address
              </label>
              <Textarea
                id="sales-ship-to-address-tabbed"
                value={form.sales.shipToAddress}
                onChange={(event) => onChange("salesShipToAddress", event.target.value)}
                placeholder="Dispatch or delivery address"
              />
            </div>
            <div className="space-y-2 md:col-span-2 xl:col-span-4">
              <label className="text-sm font-medium text-foreground" htmlFor="sales-narration-tabbed">
                Narration
              </label>
              <Textarea
                id="sales-narration-tabbed"
                value={form.narration}
                onChange={(event) => onChange("narration", event.target.value)}
                placeholder="Optional invoice note"
              />
            </div>
          </div>
        ),
      },
      {
        label: "Compliance",
        value: "compliance",
        content: (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex items-center gap-2 rounded-[1rem] border border-border/70 bg-background/70 p-4 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={form.generateEInvoice}
                  onChange={(event) =>
                    onChange("generateEInvoice", event.target.checked ? "true" : "false")
                  }
                />
                Generate e-invoice record
              </label>
              <label className="flex items-center gap-2 rounded-[1rem] border border-border/70 bg-background/70 p-4 text-sm text-foreground">
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
            {selectedVoucher ? (
              <div className="flex flex-wrap items-center gap-3 rounded-[1rem] border border-border/70 bg-background/70 p-4">
                <Badge variant={getVoucherReviewBadgeVariant(selectedVoucher.review.status)}>
                  {toVoucherReviewLabel(selectedVoucher.review.status)}
                </Badge>
                {selectedVoucher.review.requiredReason ? (
                  <p className="text-sm text-muted-foreground">{selectedVoucher.review.requiredReason}</p>
                ) : null}
              </div>
            ) : null}
            {selectedVoucher ? <VoucherComplianceCard voucher={selectedVoucher} /> : null}
          </div>
        ),
      },
    ],
    [
      form,
      formError,
      isMutableVoucher,
      ledgers,
      onChange,
      onSalesItemChange,
      onSalesItemCreate,
      onSalesItemProductChange,
      onSalesItemRemove,
      productOptions,
      salesSummary.grandTotal,
      salesSummary.subtotal,
      salesSummary.taxAmount,
      salesSummary.totalQuantity,
      salesVoucherTypes,
      selectedCustomerLedger,
      selectedVoucher,
    ]
  )

  return (
    <div className="space-y-6" data-technical-name="page.billing.sales-upsert">
      <div className="relative overflow-visible rounded-[1.5rem] border border-border/70 bg-background/90 p-5 shadow-sm">
        <TechnicalNameBadge name="page.billing.sales-upsert" className="absolute -top-3 right-4 z-20" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-ml-3 w-fit"
              onClick={() => void navigate("/dashboard/billing/sales-vouchers")}
            >
              <ArrowLeftIcon className="size-4" />
              Back to sales
            </Button>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{invoiceLabel}</h1>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                Capture customer invoice details, select the sales voucher type, and post item-table totals into double-entry and GST automatically.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={onReset} disabled={isSaving}>
              {selectedVoucher ? "New invoice" : "Reset"}
            </Button>
            {selectedVoucher ? (
              <>
                <Button type="button" variant="outline" onClick={() => onDocumentAction(selectedVoucher.id, "print")}>Print</Button>
                <Button type="button" variant="outline" onClick={() => onDocumentAction(selectedVoucher.id, "csv")}>Export CSV</Button>
                <Button type="button" variant="outline" onClick={() => onDocumentAction(selectedVoucher.id, "json")}>Export JSON</Button>
              </>
            ) : null}
            <Button type="button" onClick={onSave} disabled={isSaving || !isMutableVoucher}>
              {isSaving ? "Saving..." : selectedVoucher ? "Update Invoice" : "Create Invoice"}
            </Button>
          </div>
        </div>
      </div>
      <AnimatedTabs defaultTabValue="details" tabs={tabs} />
      <div className="flex flex-wrap gap-3">
        {selectedVoucher?.review.status === "pending_review" ? (
          <>
            <Button type="button" variant="outline" onClick={() => onReview(selectedVoucher.id, "approved")}>Approve</Button>
            <Button type="button" variant="destructive" onClick={() => onReview(selectedVoucher.id, "rejected")}>Reject</Button>
          </>
        ) : null}
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
  moduleId:
    | "payment"
    | "receipt"
    | "purchase"
    | "credit_note"
    | "sales_return"
    | "debit_note"
    | "purchase_return"
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
  onDocumentAction,
  onLineChange,
  onLineCreate,
  onLineRemove,
  onReset,
  onReview,
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
  onDocumentAction: (voucherId: string, format: "print" | "csv" | "json") => void
  onLineChange: (
    index: number,
    field: keyof VoucherFormLine,
    value: string
  ) => void
  onLineCreate: () => void
  onLineRemove: (index: number) => void
  onReset: () => void
  onReview: (voucherId: string, status: "approved" | "rejected") => void
  onSave: () => void
  selectedVoucher: BillingVoucher | null
}) {
  if (form.type === "purchase") {
    return (
      <PurchaseVoucherTabbedEditor
        form={form}
        formError={formError}
        isSaving={isSaving}
        ledgers={ledgers}
        onChange={onChange}
        onDelete={onDelete}
        onDocumentAction={onDocumentAction}
        onLineChange={onLineChange}
        onLineCreate={onLineCreate}
        onLineRemove={onLineRemove}
        onReset={onReset}
        onReview={onReview}
        onSave={onSave}
        selectedVoucher={selectedVoucher}
      />
    )
  }

  if (form.type === "payment") {
    return (
      <PaymentVoucherTabbedEditor
        form={form}
        formError={formError}
        isSaving={isSaving}
        ledgers={ledgers}
        onBillAllocationChange={onBillAllocationChange}
        onBillAllocationCreate={onBillAllocationCreate}
        onBillAllocationRemove={onBillAllocationRemove}
        onChange={onChange}
        onDelete={onDelete}
        onDocumentAction={onDocumentAction}
        onLineChange={onLineChange}
        onLineCreate={onLineCreate}
        onLineRemove={onLineRemove}
        onReset={onReset}
        onReview={onReview}
        onSave={onSave}
        selectedVoucher={selectedVoucher}
      />
    )
  }

  if (form.type === "receipt") {
    return (
      <ReceiptVoucherTabbedEditor
        form={form}
        formError={formError}
        isSaving={isSaving}
        ledgers={ledgers}
        onBillAllocationChange={onBillAllocationChange}
        onBillAllocationCreate={onBillAllocationCreate}
        onBillAllocationRemove={onBillAllocationRemove}
        onChange={onChange}
        onDelete={onDelete}
        onDocumentAction={onDocumentAction}
        onLineChange={onLineChange}
        onLineCreate={onLineCreate}
        onLineRemove={onLineRemove}
        onReset={onReset}
        onReview={onReview}
        onSave={onSave}
        selectedVoucher={selectedVoucher}
      />
    )
  }

  return (
    <div className="space-y-4">
      <VoucherEditor
        form={form}
        formError={formError}
        isSaving={isSaving}
        ledgers={ledgers}
        onChange={onChange}
        onDelete={onDelete}
        onDocumentAction={onDocumentAction}
        onBillAllocationChange={onBillAllocationChange}
        onBillAllocationCreate={onBillAllocationCreate}
        onBillAllocationRemove={onBillAllocationRemove}
        onLineChange={onLineChange}
        onLineCreate={onLineCreate}
        onLineRemove={onLineRemove}
        onReset={onReset}
        onReview={onReview}
        onSave={onSave}
        selectedVoucher={selectedVoucher}
      />
      {selectedVoucher ? <VoucherComplianceCard voucher={selectedVoucher} /> : null}
    </div>
  )
}

function ReceiptVoucherTabbedEditor({
  form,
  formError,
  isSaving,
  ledgers,
  onBillAllocationChange,
  onBillAllocationCreate,
  onBillAllocationRemove,
  onChange,
  onDelete,
  onDocumentAction,
  onLineChange,
  onLineCreate,
  onLineRemove,
  onReset,
  onReview,
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
  onDocumentAction: (voucherId: string, format: "print" | "csv" | "json") => void
  onLineChange: (
    index: number,
    field: keyof VoucherFormLine,
    value: string
  ) => void
  onLineCreate: () => void
  onLineRemove: (index: number) => void
  onReset: () => void
  onReview: (voucherId: string, status: "approved" | "rejected") => void
  onSave: () => void
  selectedVoucher: BillingVoucher | null
}) {
  const navigate = useNavigate()
  const isMutableVoucher = selectedVoucher === null || selectedVoucher.status === "draft"
  const provisionalVoucher = {
    lines: form.lines.map((line) => ({
      amount: Number(line.amount || 0),
      side: line.side,
    })),
  } as Pick<BillingVoucher, "lines">
  const totals = getVoucherTotals(provisionalVoucher)
  const title = selectedVoucher
    ? isMutableVoucher
      ? "Edit receipt voucher"
      : "View receipt voucher"
    : "Create receipt voucher"
  const voucherLabel = form.voucherNumber.trim() || title

  const tabs = useMemo<AnimatedContentTab[]>(
    () => [
      {
        label: "Details",
        value: "details",
        content: (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="receipt-voucher-number">
                Voucher number
              </label>
              <Input
                id="receipt-voucher-number"
                value={form.voucherNumber}
                onChange={(event) => onChange("voucherNumber", event.target.value)}
                placeholder="Leave blank for FY auto numbering"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="receipt-voucher-date">
                Date
              </label>
              <Input
                id="receipt-voucher-date"
                type="date"
                value={form.date}
                onChange={(event) => onChange("date", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="receipt-voucher-lifecycle">
                Lifecycle
              </label>
              <select
                id="receipt-voucher-lifecycle"
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
              <label className="text-sm font-medium text-foreground" htmlFor="receipt-counterparty">
                Counterparty
              </label>
              <Input
                id="receipt-counterparty"
                value={form.counterparty}
                onChange={(event) => onChange("counterparty", event.target.value)}
                placeholder="Customer / bank / party"
              />
            </div>
            <div className="space-y-2 md:col-span-2 xl:col-span-4">
              <label className="text-sm font-medium text-foreground" htmlFor="receipt-narration">
                Narration
              </label>
              <Textarea
                id="receipt-narration"
                value={form.narration}
                onChange={(event) => onChange("narration", event.target.value)}
                placeholder="Optional receipt note"
              />
            </div>
            <div className="rounded-[1rem] border border-border/70 bg-background/70 p-4 md:col-span-2 xl:col-span-4">
              {selectedVoucher ? (
                <p className="text-sm text-muted-foreground">
                  Lifecycle <span className="font-medium text-foreground">{toVoucherLifecycleLabel(selectedVoucher.status)}</span> in financial year <span className="font-medium text-foreground">{selectedVoucher.financialYear.label}</span> with sequence{" "}
                  <span className="font-medium text-foreground">
                    {selectedVoucher.financialYear.prefix}-{String(selectedVoucher.financialYear.sequenceNumber).padStart(3, "0")}
                  </span>.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Receipt voucher number and financial-year sequence will be generated automatically from the posting date if left blank.
                </p>
              )}
            </div>
          </div>
        ),
      },
      {
        label: "Adjustments",
        value: "adjustments",
        content: (
          <div className="space-y-4">
            <VoucherInlineEditableTable
              title="Bill-wise adjustments"
              description="Match receipt vouchers against bill references the way Tally operators expect."
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
          </div>
        ),
      },
      {
        label: "Accounting",
        value: "accounting",
        content: (
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-foreground">Accounting dimensions</p>
                <p className="text-xs text-muted-foreground">
                  Optional branch, project, and cost-center tracking for reporting and controls.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <Input
                  value={form.dimensions.branch}
                  onChange={(event) => onChange("dimensionBranch", event.target.value)}
                  placeholder="Branch"
                />
                <Input
                  value={form.dimensions.project}
                  onChange={(event) => onChange("dimensionProject", event.target.value)}
                  placeholder="Project"
                />
                <Input
                  value={form.dimensions.costCenter}
                  onChange={(event) => onChange("dimensionCostCenter", event.target.value)}
                  placeholder="Cost center"
                />
              </div>
            </div>
            <VoucherInlineEditableTable
              title="Ledger lines"
              description="Every receipt voucher must contain balanced debit and credit lines."
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
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Debit total
                </p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {formatAmount(totals.debit)}
                </p>
              </div>
              <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Credit total
                </p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {formatAmount(totals.credit)}
                </p>
              </div>
            </div>
          </div>
        ),
      },
      {
        label: "Review",
        value: "review",
        content: (
          <div className="space-y-4">
            {selectedVoucher ? (
              <div className="flex flex-wrap items-center gap-3 rounded-[1rem] border border-border/70 bg-background/70 p-4">
                <Badge variant={getVoucherReviewBadgeVariant(selectedVoucher.review.status)}>
                  {toVoucherReviewLabel(selectedVoucher.review.status)}
                </Badge>
                {selectedVoucher.review.requiredReason ? (
                  <p className="text-sm text-muted-foreground">
                    {selectedVoucher.review.requiredReason}
                  </p>
                ) : null}
              </div>
            ) : null}
            {selectedVoucher && !isMutableVoucher ? (
              <div className="rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                {toVoucherLifecycleLabel(selectedVoucher.status)} vouchers are read-only. Keep a voucher in draft for direct editing.
              </div>
            ) : null}
            {formError ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {formError}
              </div>
            ) : null}
            {selectedVoucher ? <VoucherComplianceCard voucher={selectedVoucher} /> : null}
          </div>
        ),
      },
    ],
    [
      form,
      formError,
      isMutableVoucher,
      ledgers,
      onBillAllocationChange,
      onBillAllocationCreate,
      onBillAllocationRemove,
      onChange,
      onLineChange,
      onLineCreate,
      onLineRemove,
      selectedVoucher,
      totals.credit,
      totals.debit,
    ]
  )

  return (
    <div className="space-y-6" data-technical-name="page.billing.receipt-upsert">
      <div className="relative overflow-visible rounded-[1.5rem] border border-border/70 bg-background/90 p-5 shadow-sm">
        <TechnicalNameBadge
          name="page.billing.receipt-upsert"
          className="absolute -top-3 right-4 z-20"
        />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-ml-3 w-fit"
              onClick={() => void navigate("/dashboard/billing/receipt-vouchers")}
            >
              <ArrowLeftIcon className="size-4" />
              Back to receipt
            </Button>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {voucherLabel}
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                Capture incoming receipt details, allocate bill references, and keep receipt postings balanced through the billing books.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={onReset} disabled={isSaving}>
              {selectedVoucher ? "New voucher" : "Reset"}
            </Button>
            {selectedVoucher ? (
              <>
                <Button type="button" variant="outline" onClick={() => onDocumentAction(selectedVoucher.id, "print")}>
                  Print
                </Button>
                <Button type="button" variant="outline" onClick={() => onDocumentAction(selectedVoucher.id, "csv")}>
                  Export CSV
                </Button>
                <Button type="button" variant="outline" onClick={() => onDocumentAction(selectedVoucher.id, "json")}>
                  Export JSON
                </Button>
              </>
            ) : null}
            <Button type="button" onClick={onSave} disabled={isSaving || !isMutableVoucher}>
              {isSaving ? "Saving..." : selectedVoucher ? "Update Voucher" : "Create Voucher"}
            </Button>
          </div>
        </div>
      </div>
      <AnimatedTabs defaultTabValue="details" tabs={tabs} />
      <div className="flex flex-wrap gap-3">
        {selectedVoucher?.review.status === "pending_review" ? (
          <>
            <Button type="button" variant="outline" onClick={() => onReview(selectedVoucher.id, "approved")}>
              Approve
            </Button>
            <Button type="button" variant="destructive" onClick={() => onReview(selectedVoucher.id, "rejected")}>
              Reject
            </Button>
          </>
        ) : null}
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
    </div>
  )
}

function PaymentVoucherTabbedEditor({
  form,
  formError,
  isSaving,
  ledgers,
  onBillAllocationChange,
  onBillAllocationCreate,
  onBillAllocationRemove,
  onChange,
  onDelete,
  onDocumentAction,
  onLineChange,
  onLineCreate,
  onLineRemove,
  onReset,
  onReview,
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
  onDocumentAction: (voucherId: string, format: "print" | "csv" | "json") => void
  onLineChange: (
    index: number,
    field: keyof VoucherFormLine,
    value: string
  ) => void
  onLineCreate: () => void
  onLineRemove: (index: number) => void
  onReset: () => void
  onReview: (voucherId: string, status: "approved" | "rejected") => void
  onSave: () => void
  selectedVoucher: BillingVoucher | null
}) {
  const navigate = useNavigate()
  const isMutableVoucher = selectedVoucher === null || selectedVoucher.status === "draft"
  const provisionalVoucher = {
    lines: form.lines.map((line) => ({
      amount: Number(line.amount || 0),
      side: line.side,
    })),
  } as Pick<BillingVoucher, "lines">
  const totals = getVoucherTotals(provisionalVoucher)
  const title = selectedVoucher
    ? isMutableVoucher
      ? "Edit payment voucher"
      : "View payment voucher"
    : "Create payment voucher"
  const voucherLabel = form.voucherNumber.trim() || title

  const tabs = useMemo<AnimatedContentTab[]>(
    () => [
      {
        label: "Details",
        value: "details",
        content: (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="payment-voucher-number">
                Voucher number
              </label>
              <Input
                id="payment-voucher-number"
                value={form.voucherNumber}
                onChange={(event) => onChange("voucherNumber", event.target.value)}
                placeholder="Leave blank for FY auto numbering"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="payment-voucher-date">
                Date
              </label>
              <Input
                id="payment-voucher-date"
                type="date"
                value={form.date}
                onChange={(event) => onChange("date", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="payment-voucher-lifecycle">
                Lifecycle
              </label>
              <select
                id="payment-voucher-lifecycle"
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
              <label className="text-sm font-medium text-foreground" htmlFor="payment-counterparty">
                Counterparty
              </label>
              <Input
                id="payment-counterparty"
                value={form.counterparty}
                onChange={(event) => onChange("counterparty", event.target.value)}
                placeholder="Supplier / bank / party"
              />
            </div>
            <div className="space-y-2 md:col-span-2 xl:col-span-4">
              <label className="text-sm font-medium text-foreground" htmlFor="payment-narration">
                Narration
              </label>
              <Textarea
                id="payment-narration"
                value={form.narration}
                onChange={(event) => onChange("narration", event.target.value)}
                placeholder="Optional payment note"
              />
            </div>
            <div className="rounded-[1rem] border border-border/70 bg-background/70 p-4 md:col-span-2 xl:col-span-4">
              {selectedVoucher ? (
                <p className="text-sm text-muted-foreground">
                  Lifecycle <span className="font-medium text-foreground">{toVoucherLifecycleLabel(selectedVoucher.status)}</span> in financial year <span className="font-medium text-foreground">{selectedVoucher.financialYear.label}</span> with sequence{" "}
                  <span className="font-medium text-foreground">
                    {selectedVoucher.financialYear.prefix}-{String(selectedVoucher.financialYear.sequenceNumber).padStart(3, "0")}
                  </span>.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Payment voucher number and financial-year sequence will be generated automatically from the posting date if left blank.
                </p>
              )}
            </div>
          </div>
        ),
      },
      {
        label: "Adjustments",
        value: "adjustments",
        content: (
          <div className="space-y-4">
            <VoucherInlineEditableTable
              title="Bill-wise adjustments"
              description="Match payment vouchers against bill references the way Tally operators expect."
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
          </div>
        ),
      },
      {
        label: "Accounting",
        value: "accounting",
        content: (
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-foreground">Accounting dimensions</p>
                <p className="text-xs text-muted-foreground">
                  Optional branch, project, and cost-center tracking for reporting and controls.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <Input
                  value={form.dimensions.branch}
                  onChange={(event) => onChange("dimensionBranch", event.target.value)}
                  placeholder="Branch"
                />
                <Input
                  value={form.dimensions.project}
                  onChange={(event) => onChange("dimensionProject", event.target.value)}
                  placeholder="Project"
                />
                <Input
                  value={form.dimensions.costCenter}
                  onChange={(event) => onChange("dimensionCostCenter", event.target.value)}
                  placeholder="Cost center"
                />
              </div>
            </div>
            <VoucherInlineEditableTable
              title="Ledger lines"
              description="Every payment voucher must contain balanced debit and credit lines."
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
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Debit total
                </p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {formatAmount(totals.debit)}
                </p>
              </div>
              <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Credit total
                </p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {formatAmount(totals.credit)}
                </p>
              </div>
            </div>
          </div>
        ),
      },
      {
        label: "Review",
        value: "review",
        content: (
          <div className="space-y-4">
            {selectedVoucher ? (
              <div className="flex flex-wrap items-center gap-3 rounded-[1rem] border border-border/70 bg-background/70 p-4">
                <Badge variant={getVoucherReviewBadgeVariant(selectedVoucher.review.status)}>
                  {toVoucherReviewLabel(selectedVoucher.review.status)}
                </Badge>
                {selectedVoucher.review.requiredReason ? (
                  <p className="text-sm text-muted-foreground">
                    {selectedVoucher.review.requiredReason}
                  </p>
                ) : null}
              </div>
            ) : null}
            {selectedVoucher && !isMutableVoucher ? (
              <div className="rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                {toVoucherLifecycleLabel(selectedVoucher.status)} vouchers are read-only. Keep a voucher in draft for direct editing.
              </div>
            ) : null}
            {formError ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {formError}
              </div>
            ) : null}
            {selectedVoucher ? <VoucherComplianceCard voucher={selectedVoucher} /> : null}
          </div>
        ),
      },
    ],
    [
      form,
      formError,
      isMutableVoucher,
      ledgers,
      onBillAllocationChange,
      onBillAllocationCreate,
      onBillAllocationRemove,
      onChange,
      onLineChange,
      onLineCreate,
      onLineRemove,
      selectedVoucher,
      totals.credit,
      totals.debit,
    ]
  )

  return (
    <div className="space-y-6" data-technical-name="page.billing.payment-upsert">
      <div className="relative overflow-visible rounded-[1.5rem] border border-border/70 bg-background/90 p-5 shadow-sm">
        <TechnicalNameBadge
          name="page.billing.payment-upsert"
          className="absolute -top-3 right-4 z-20"
        />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-ml-3 w-fit"
              onClick={() => void navigate("/dashboard/billing/payment-vouchers")}
            >
              <ArrowLeftIcon className="size-4" />
              Back to payment
            </Button>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {voucherLabel}
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                Capture outgoing payment details, allocate bill references, and keep payment postings balanced through the billing books.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={onReset} disabled={isSaving}>
              {selectedVoucher ? "New voucher" : "Reset"}
            </Button>
            {selectedVoucher ? (
              <>
                <Button type="button" variant="outline" onClick={() => onDocumentAction(selectedVoucher.id, "print")}>
                  Print
                </Button>
                <Button type="button" variant="outline" onClick={() => onDocumentAction(selectedVoucher.id, "csv")}>
                  Export CSV
                </Button>
                <Button type="button" variant="outline" onClick={() => onDocumentAction(selectedVoucher.id, "json")}>
                  Export JSON
                </Button>
              </>
            ) : null}
            <Button type="button" onClick={onSave} disabled={isSaving || !isMutableVoucher}>
              {isSaving ? "Saving..." : selectedVoucher ? "Update Voucher" : "Create Voucher"}
            </Button>
          </div>
        </div>
      </div>
      <AnimatedTabs defaultTabValue="details" tabs={tabs} />
      <div className="flex flex-wrap gap-3">
        {selectedVoucher?.review.status === "pending_review" ? (
          <>
            <Button type="button" variant="outline" onClick={() => onReview(selectedVoucher.id, "approved")}>
              Approve
            </Button>
            <Button type="button" variant="destructive" onClick={() => onReview(selectedVoucher.id, "rejected")}>
              Reject
            </Button>
          </>
        ) : null}
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
    </div>
  )
}

function PurchaseVoucherTabbedEditor({
  form,
  formError,
  isSaving,
  ledgers,
  onChange,
  onDelete,
  onDocumentAction,
  onLineChange,
  onLineCreate,
  onLineRemove,
  onReset,
  onReview,
  onSave,
  selectedVoucher,
}: {
  form: VoucherFormState
  formError: string | null
  isSaving: boolean
  ledgers: BillingLedger[]
  onChange: (field: string, value: string) => void
  onDelete: () => void
  onDocumentAction: (voucherId: string, format: "print" | "csv" | "json") => void
  onLineChange: (
    index: number,
    field: keyof VoucherFormLine,
    value: string
  ) => void
  onLineCreate: () => void
  onLineRemove: (index: number) => void
  onReset: () => void
  onReview: (voucherId: string, status: "approved" | "rejected") => void
  onSave: () => void
  selectedVoucher: BillingVoucher | null
}) {
  const navigate = useNavigate()
  const isMutableVoucher = selectedVoucher === null || selectedVoucher.status === "draft"
  const provisionalVoucher = {
    lines: form.gst.enabled ? [] : form.lines.map((line) => ({
      amount: Number(line.amount || 0),
      side: line.side,
    })),
  } as Pick<BillingVoucher, "lines">
  const totals = getVoucherTotals(provisionalVoucher)
  const gstTaxableAmount = Number(form.gst.taxableAmount || 0)
  const gstRate = Number(form.gst.taxRate || 0)
  const gstTotalTax = Number(((gstTaxableAmount * gstRate) / 100).toFixed(2))
  const gstCgst = form.gst.supplyType === "intra" ? Number((gstTotalTax / 2).toFixed(2)) : 0
  const gstSgst = form.gst.supplyType === "intra" ? Number((gstTotalTax / 2).toFixed(2)) : 0
  const gstIgst = form.gst.supplyType === "inter" ? gstTotalTax : 0
  const gstInvoiceAmount = Number((gstTaxableAmount + gstTotalTax).toFixed(2))
  const gstModeEnabled = form.gst.enabled
  const title = selectedVoucher
    ? isMutableVoucher
      ? "Edit purchase voucher"
      : "View purchase voucher"
    : "Create purchase voucher"
  const voucherLabel = form.voucherNumber.trim() || title

  const tabs = useMemo<AnimatedContentTab[]>(
    () => [
      {
        label: "Details",
        value: "details",
        content: (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="purchase-voucher-number">
                Voucher number
              </label>
              <Input
                id="purchase-voucher-number"
                value={form.voucherNumber}
                onChange={(event) => onChange("voucherNumber", event.target.value)}
                placeholder="Leave blank for FY auto numbering"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="purchase-voucher-date">
                Date
              </label>
              <Input
                id="purchase-voucher-date"
                type="date"
                value={form.date}
                onChange={(event) => onChange("date", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="purchase-voucher-lifecycle">
                Lifecycle
              </label>
              <select
                id="purchase-voucher-lifecycle"
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
              <label className="text-sm font-medium text-foreground" htmlFor="purchase-counterparty">
                Counterparty
              </label>
              <Input
                id="purchase-counterparty"
                value={form.counterparty}
                onChange={(event) => onChange("counterparty", event.target.value)}
                placeholder="Supplier name"
              />
            </div>
            <div className="space-y-2 md:col-span-2 xl:col-span-4">
              <label className="text-sm font-medium text-foreground" htmlFor="purchase-narration">
                Narration
              </label>
              <Textarea
                id="purchase-narration"
                value={form.narration}
                onChange={(event) => onChange("narration", event.target.value)}
                placeholder="Optional purchase note"
              />
            </div>
            <div className="rounded-[1rem] border border-border/70 bg-background/70 p-4 md:col-span-2 xl:col-span-4">
              {selectedVoucher ? (
                <p className="text-sm text-muted-foreground">
                  Lifecycle <span className="font-medium text-foreground">{toVoucherLifecycleLabel(selectedVoucher.status)}</span> in financial year <span className="font-medium text-foreground">{selectedVoucher.financialYear.label}</span> with sequence{" "}
                  <span className="font-medium text-foreground">
                    {selectedVoucher.financialYear.prefix}-{String(selectedVoucher.financialYear.sequenceNumber).padStart(3, "0")}
                  </span>.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Purchase voucher number and financial-year sequence will be generated automatically from the posting date if left blank.
                </p>
              )}
            </div>
          </div>
        ),
      },
      {
        label: "GST & Transport",
        value: "gst-transport",
        content: (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-[1rem] border border-border/70 bg-background/70 p-4">
              <div>
                <p className="font-semibold text-foreground">GST posting</p>
                <p className="text-sm text-muted-foreground">
                  Enable GST mode to auto-post tax ledgers for purchase vouchers.
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
                    options={ledgers.map((ledger) => ({ value: ledger.id, label: ledger.name }))}
                    searchPlaceholder="Search party ledger"
                    value={form.gst.partyLedgerId}
                  />
                  <AutocompleteLookupField
                    emptyLabel="Select taxable ledger"
                    onChange={(nextValue) => onChange("gstTaxableLedgerId", nextValue)}
                    options={ledgers.map((ledger) => ({ value: ledger.id, label: ledger.name }))}
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
                  <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Taxable</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">{formatAmount(gstTaxableAmount)}</p>
                  </div>
                  <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">CGST</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">{formatAmount(gstCgst)}</p>
                  </div>
                  <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">SGST / IGST</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">{formatAmount(form.gst.supplyType === "intra" ? gstSgst : gstIgst)}</p>
                  </div>
                  <div className="rounded-[1rem] border border-border/70 bg-card/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Invoice total</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">{formatAmount(gstInvoiceAmount)}</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex items-center gap-2 rounded-[1rem] border border-border/70 bg-background/70 p-4 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={form.generateEInvoice}
                      onChange={(event) =>
                        onChange("generateEInvoice", event.target.checked ? "true" : "false")
                      }
                    />
                    Generate e-invoice record
                  </label>
                  <label className="flex items-center gap-2 rounded-[1rem] border border-border/70 bg-background/70 p-4 text-sm text-foreground">
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
            ) : (
              <div className="rounded-[1rem] border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
                GST auto-post is disabled. Use the accounting tab to maintain direct ledger lines.
              </div>
            )}
          </div>
        ),
      },
      {
        label: "Accounting",
        value: "accounting",
        content: (
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-foreground">Accounting dimensions</p>
                <p className="text-xs text-muted-foreground">
                  Optional branch, project, and cost-center tracking for reporting and controls.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <Input
                  value={form.dimensions.branch}
                  onChange={(event) => onChange("dimensionBranch", event.target.value)}
                  placeholder="Branch"
                />
                <Input
                  value={form.dimensions.project}
                  onChange={(event) => onChange("dimensionProject", event.target.value)}
                  placeholder="Project"
                />
                <Input
                  value={form.dimensions.costCenter}
                  onChange={(event) => onChange("dimensionCostCenter", event.target.value)}
                  placeholder="Cost center"
                />
              </div>
            </div>
            {!gstModeEnabled ? (
              <VoucherInlineEditableTable
                title="Ledger lines"
                description="Every purchase voucher must contain balanced debit and credit lines."
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
          </div>
        ),
      },
      {
        label: "Review",
        value: "review",
        content: (
          <div className="space-y-4">
            {selectedVoucher ? (
              <div className="flex flex-wrap items-center gap-3 rounded-[1rem] border border-border/70 bg-background/70 p-4">
                <Badge variant={getVoucherReviewBadgeVariant(selectedVoucher.review.status)}>
                  {toVoucherReviewLabel(selectedVoucher.review.status)}
                </Badge>
                {selectedVoucher.review.requiredReason ? (
                  <p className="text-sm text-muted-foreground">
                    {selectedVoucher.review.requiredReason}
                  </p>
                ) : null}
              </div>
            ) : null}
            {selectedVoucher && !isMutableVoucher ? (
              <div className="rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                {toVoucherLifecycleLabel(selectedVoucher.status)} vouchers are read-only. Keep a voucher in draft for direct editing.
              </div>
            ) : null}
            {formError ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {formError}
              </div>
            ) : null}
            {selectedVoucher ? <VoucherComplianceCard voucher={selectedVoucher} /> : null}
          </div>
        ),
      },
    ],
    [
      form,
      formError,
      gstCgst,
      gstIgst,
      gstInvoiceAmount,
      gstModeEnabled,
      gstSgst,
      gstTaxableAmount,
      gstTotalTax,
      isMutableVoucher,
      ledgers,
      onChange,
      onLineChange,
      onLineCreate,
      onLineRemove,
      selectedVoucher,
      totals.credit,
      totals.debit,
    ]
  )

  return (
    <div className="space-y-6" data-technical-name="page.billing.purchase-upsert">
      <div className="relative overflow-visible rounded-[1.5rem] border border-border/70 bg-background/90 p-5 shadow-sm">
        <TechnicalNameBadge
          name="page.billing.purchase-upsert"
          className="absolute -top-3 right-4 z-20"
        />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-ml-3 w-fit"
              onClick={() => void navigate("/dashboard/billing/purchase-vouchers")}
            >
              <ArrowLeftIcon className="size-4" />
              Back to purchase
            </Button>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {voucherLabel}
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                Capture supplier voucher details, configure GST posture, and post balanced purchase entries through the billing books.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={onReset} disabled={isSaving}>
              {selectedVoucher ? "New voucher" : "Reset"}
            </Button>
            {selectedVoucher ? (
              <>
                <Button type="button" variant="outline" onClick={() => onDocumentAction(selectedVoucher.id, "print")}>
                  Print
                </Button>
                <Button type="button" variant="outline" onClick={() => onDocumentAction(selectedVoucher.id, "csv")}>
                  Export CSV
                </Button>
                <Button type="button" variant="outline" onClick={() => onDocumentAction(selectedVoucher.id, "json")}>
                  Export JSON
                </Button>
              </>
            ) : null}
            <Button type="button" onClick={onSave} disabled={isSaving || !isMutableVoucher}>
              {isSaving ? "Saving..." : selectedVoucher ? "Update Voucher" : "Create Voucher"}
            </Button>
          </div>
        </div>
      </div>
      <AnimatedTabs defaultTabValue="details" tabs={tabs} />
      <div className="flex flex-wrap gap-3">
        {selectedVoucher?.review.status === "pending_review" ? (
          <>
            <Button type="button" variant="outline" onClick={() => onReview(selectedVoucher.id, "approved")}>
              Approve
            </Button>
            <Button type="button" variant="destructive" onClick={() => onReview(selectedVoucher.id, "rejected")}>
              Reject
            </Button>
          </>
        ) : null}
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
    </div>
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
  onDocumentAction,
  onReverse,
  onBillAllocationChange,
  onBillAllocationCreate,
  onBillAllocationRemove,
  onLineChange,
  onLineCreate,
  onLineRemove,
  onOpenChange,
  onReset,
  onReview,
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
  onDocumentAction: (voucherId: string, format: "print" | "csv" | "json") => void
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
  onReview: (voucherId: string, status: "approved" | "rejected") => void
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
              onDocumentAction={onDocumentAction}
              onReset={onReset}
              onReview={onReview}
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
              onDocumentAction={onDocumentAction}
              onBillAllocationChange={onBillAllocationChange}
              onBillAllocationCreate={onBillAllocationCreate}
              onBillAllocationRemove={onBillAllocationRemove}
              onLineChange={onLineChange}
              onLineCreate={onLineCreate}
              onLineRemove={onLineRemove}
              onReset={onReset}
              onReview={onReview}
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
    auditTrail: createEmptyAuditTrail(),
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
        const currentSection = sectionId ?? "overview"
        const [categoryResponse, ledgerResponse, voucherGroupResponse, voucherTypeResponse, voucherResponse, reportsResponse, productResponse, unitResponse, hsnCodeResponse, auditTrailResponse] = await Promise.all([
          request<BillingCategoryListResponse>("/internal/v1/billing/categories"),
          request<BillingLedgerListResponse>("/internal/v1/billing/ledgers"),
          request<BillingVoucherGroupListResponse>("/internal/v1/billing/voucher-groups"),
          request<BillingVoucherMasterTypeListResponse>("/internal/v1/billing/voucher-types"),
          request<BillingVoucherListResponse>("/internal/v1/billing/vouchers"),
          request<BillingAccountingReportsResponse>("/internal/v1/billing/reports"),
          request<ProductListResponse>("/internal/v1/core/products"),
          request<CommonModuleListResponse>("/internal/v1/core/common-modules/items?module=units"),
          request<CommonModuleListResponse>("/internal/v1/core/common-modules/items?module=hsnCodes"),
          currentSection === "audit-trail"
            ? request<BillingAuditTrailReviewResponse>("/internal/v1/billing/audit-trail")
            : Promise.resolve({ item: createEmptyAuditTrail() }),
        ])

        setState({
          auditTrail: auditTrailResponse.item,
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
          auditTrail: createEmptyAuditTrail(),
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
    const activeSection = sectionId ?? "overview"
    if (activeSection !== "sales-vouchers-upsert" && activeSection !== "sales-vouchers-show") {
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
      "purchase-return-upsert": "purchase_return",
      "receipt-vouchers-upsert": "receipt",
      "sales-return-upsert": "sales_return",
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
        case "dimensionBranch":
        case "date":
        case "dimensionCostCenter":
        case "dimensionProject":
        case "narration":
        case "sourceVoucherId":
        case "status":
        case "voucherNumber":
          if (field === "dimensionBranch") {
            return {
              ...current,
              dimensions: { ...current.dimensions, branch: value },
            }
          }
          if (field === "dimensionProject") {
            return {
              ...current,
              dimensions: { ...current.dimensions, project: value },
            }
          }
          if (field === "dimensionCostCenter") {
            return {
              ...current,
              dimensions: { ...current.dimensions, costCenter: value },
            }
          }
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
      salesModeEnabled ||
      (
        form.gst.enabled &&
        ["sales", "purchase", "sales_return", "purchase_return"].includes(form.type)
      )

    return {
      status: form.status,
      voucherNumber: form.voucherNumber,
      type: form.type,
      sourceVoucherId: form.sourceVoucherId.trim() || null,
      dimensions: {
        branch: form.dimensions.branch.trim() || null,
        project: form.dimensions.project.trim() || null,
        costCenter: form.dimensions.costCenter.trim() || null,
      },
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
              productId: item.productId.trim() || null,
              warehouseId: item.warehouseId.trim() || null,
              itemName: item.itemName,
              description: item.description,
              hsnOrSac: item.hsnOrSac,
              quantity: Number(item.quantity),
              unit: item.unit,
              rate: Number(item.rate),
            })),
          }
        : null,
      stock:
        ["purchase", "purchase_return", "sales_return", "stock_adjustment", "landed_cost"].includes(
          form.type
        )
          ? {
              items: form.stock.items
                .filter((item) => item.productId && item.warehouseId)
                .map((item) => ({
                  productId: item.productId,
                  warehouseId: item.warehouseId,
                  quantity: Number(item.quantity),
                  unit: item.unit,
                  unitCost: Number(item.unitCost),
                  landedCostAmount: Number(item.landedCostAmount),
                  note: item.note,
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
        "purchase-return-upsert": "/dashboard/billing/purchase-return",
        "receipt-vouchers-upsert": "/dashboard/billing/receipt-vouchers",
        "sales-return-upsert": "/dashboard/billing/sales-return",
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

  async function handleDocumentAction(
    voucherId: string,
    format: "print" | "csv" | "json"
  ) {
    try {
      const response = await request<BillingVoucherDocumentResponse>(
        `/internal/v1/billing/voucher/document?id=${encodeURIComponent(voucherId)}&format=${encodeURIComponent(format)}`
      )

      if (format === "print") {
        openPrintDocument(response.item.content)
        return
      }

      downloadTextFile(
        response.item.fileName,
        response.item.content,
        response.item.mimeType
      )
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to prepare billing document."
      )
    }
  }

  async function handleReviewVoucher(
    voucherId: string,
    status: "approved" | "rejected"
  ) {
    const note = window.prompt(
      `${status === "approved" ? "Approve" : "Reject"} ${voucherId} with review note:`,
      ""
    )

    if (note === null) {
      return
    }

    try {
      await request<BillingVoucherReviewResponse>(
        `/internal/v1/billing/voucher/review?id=${encodeURIComponent(voucherId)}`,
        {
          method: "POST",
          body: JSON.stringify({
            status,
            note,
          }),
        }
      )
      await loadResources()
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to update finance review."
      )
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

  async function handleBankReconciliation(
    voucherId: string,
    status: "pending" | "matched" | "mismatch"
  ) {
    setFormError(null)

    const note =
      window.prompt(
        status === "pending"
          ? "Optional note for resetting this voucher to pending:"
          : `Optional note for marking this voucher as ${status}:`,
        ""
      ) ?? ""

    const clearedDate =
      status === "pending"
        ? null
        : window.prompt("Enter cleared date (YYYY-MM-DD):", state.reports.bankReconciliation.asOfDate)

    if (status !== "pending" && (!clearedDate || !clearedDate.trim())) {
      return
    }

    const statementReference =
      status === "pending"
        ? null
        : window.prompt("Enter bank statement reference:", "")

    if (status !== "pending" && (!statementReference || !statementReference.trim())) {
      return
    }

    const statementAmountInput =
      status === "pending"
        ? null
        : window.prompt("Enter statement amount:", "")

    if (status !== "pending" && (!statementAmountInput || !statementAmountInput.trim())) {
      return
    }

    const statementAmount =
      status === "pending" ? null : Number(statementAmountInput)

    if (
      status !== "pending" &&
      (!Number.isFinite(statementAmount) || Number(statementAmount) <= 0)
    ) {
      setFormError("Statement amount must be a valid positive number.")
      return
    }

    try {
      await request<BillingVoucherBankReconciliationResponse>(
        `/internal/v1/billing/voucher/reconciliation?id=${encodeURIComponent(voucherId)}`,
        {
          method: "POST",
          body: JSON.stringify({
            status,
            clearedDate: clearedDate?.trim() || null,
            statementReference: statementReference?.trim() || null,
            statementAmount,
            note: note.trim(),
          }),
        }
      )
      await loadResources()
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to update bank reconciliation."
      )
    }
  }

  async function handleFinancialYearClose(action: "preview" | "close") {
    setFormError(null)

    try {
      await request<BillingFinancialYearCloseWorkflowResponse>(
        "/internal/v1/billing/year-close",
        {
          method: "POST",
          body: JSON.stringify({
            action,
            financialYearCode: state.reports.financialYearCloseWorkflow?.financialYearCode ?? null,
            note:
              action === "close"
                ? "Financial year closed from billing workspace."
                : "Financial year close preview refreshed from billing workspace.",
          }),
        }
      )
      await loadResources()
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to update financial-year close workflow."
      )
    }
  }

  async function handleOpeningBalanceRollover(action: "preview" | "apply") {
    setFormError(null)

    try {
      await request<BillingOpeningBalanceRolloverResponse>(
        "/internal/v1/billing/opening-balance-rollover",
        {
          method: "POST",
          body: JSON.stringify({
            action,
            sourceFinancialYearCode:
              state.reports.financialYearCloseWorkflow?.financialYearCode ?? null,
            note:
              action === "apply"
                ? "Opening balances rolled forward from billing workspace."
                : "Opening-balance rollover preview refreshed from billing workspace.",
          }),
        }
      )
      await loadResources()
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to update opening-balance rollover policy."
      )
    }
  }

  async function handleYearEndControl(action: "preview" | "apply") {
    setFormError(null)

    try {
      await request<BillingYearEndAdjustmentControlResponse>(
        "/internal/v1/billing/year-end-controls",
        {
          method: "POST",
          body: JSON.stringify({
            action,
            sourceFinancialYearCode:
              state.reports.financialYearCloseWorkflow?.financialYearCode ?? null,
            note:
              action === "apply"
                ? "Year-end controls applied from billing workspace."
                : "Year-end control preview refreshed from billing workspace.",
          }),
        }
      )
      await loadResources()
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to update year-end controls."
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
          onDocumentAction={handleDocumentAction}
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
          onReview={handleReviewVoucher}
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
          onDocumentAction={handleDocumentAction}
          onLineChange={handleLineChange}
          onLineCreate={handleLineCreate}
          onLineRemove={handleLineRemove}
          onReset={() => {
            resetForm()
            void navigate("/dashboard/billing/payment-vouchers/new")
          }}
          onReview={handleReviewVoucher}
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
          onDocumentAction={handleDocumentAction}
          onLineChange={handleLineChange}
          onLineCreate={handleLineCreate}
          onLineRemove={handleLineRemove}
          onReset={() => {
            resetForm()
            void navigate("/dashboard/billing/receipt-vouchers/new")
          }}
          onReview={handleReviewVoucher}
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
          onShow={(nextVoucherId) => {
            void navigate(`/dashboard/billing/sales-vouchers/${encodeURIComponent(nextVoucherId)}/show`)
          }}
          onSelectVoucher={handleSelectVoucher}
          vouchers={state.vouchers}
        />
      )
    case "sales-vouchers-show":
      return (
        <SalesVoucherShowSection
          onEdit={(nextVoucherId) => {
            void navigate(`/dashboard/billing/sales-vouchers/${encodeURIComponent(nextVoucherId)}/edit`)
          }}
          onDelete={handleDelete}
          onDocumentAction={handleDocumentAction}
          onBack={() => {
            void navigate("/dashboard/billing/sales-vouchers")
          }}
          onNavigate={(targetId) => {
            void navigate(`/dashboard/billing/sales-vouchers/${encodeURIComponent(targetId)}/show`)
          }}
          selectedVoucher={selectedVoucher}
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
          onDocumentAction={handleDocumentAction}
          onReset={() => {
            resetForm()
            void navigate("/dashboard/billing/sales-vouchers/new")
          }}
          onReview={handleReviewVoucher}
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
    case "sales-return":
      return (
        <VoucherModuleListSection
          moduleId="sales_return"
          onCreate={() => {
            void navigate("/dashboard/billing/sales-return/new")
          }}
          onEdit={(nextVoucherId) => {
            void navigate(`/dashboard/billing/sales-return/${encodeURIComponent(nextVoucherId)}/edit`)
          }}
          onSelectVoucher={handleSelectVoucher}
          vouchers={state.vouchers}
        />
      )
    case "sales-return-upsert":
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
          onDocumentAction={handleDocumentAction}
          onLineChange={handleLineChange}
          onLineCreate={handleLineCreate}
          onLineRemove={handleLineRemove}
          onReset={() => {
            resetForm()
            void navigate("/dashboard/billing/sales-return/new")
          }}
          onReview={handleReviewVoucher}
          onSave={handleSave}
          selectedVoucher={selectedVoucher}
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
          onDocumentAction={handleDocumentAction}
          onLineChange={handleLineChange}
          onLineCreate={handleLineCreate}
          onLineRemove={handleLineRemove}
          onReset={() => {
            resetForm()
            void navigate("/dashboard/billing/purchase-vouchers/new")
          }}
          onReview={handleReviewVoucher}
          onSave={handleSave}
          selectedVoucher={selectedVoucher}
        />
      )
    case "purchase-return":
      return (
        <VoucherModuleListSection
          moduleId="purchase_return"
          onCreate={() => {
            void navigate("/dashboard/billing/purchase-return/new")
          }}
          onEdit={(nextVoucherId) => {
            void navigate(`/dashboard/billing/purchase-return/${encodeURIComponent(nextVoucherId)}/edit`)
          }}
          onSelectVoucher={handleSelectVoucher}
          vouchers={state.vouchers}
        />
      )
    case "purchase-return-upsert":
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
          onDocumentAction={handleDocumentAction}
          onLineChange={handleLineChange}
          onLineCreate={handleLineCreate}
          onLineRemove={handleLineRemove}
          onReset={() => {
            resetForm()
            void navigate("/dashboard/billing/purchase-return/new")
          }}
          onReview={handleReviewVoucher}
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
          onDocumentAction={handleDocumentAction}
          onLineChange={handleLineChange}
          onLineCreate={handleLineCreate}
          onLineRemove={handleLineRemove}
          onReset={() => {
            resetForm()
            void navigate("/dashboard/billing/credit-note/new")
          }}
          onReview={handleReviewVoucher}
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
          onDocumentAction={handleDocumentAction}
          onLineChange={handleLineChange}
          onLineCreate={handleLineCreate}
          onLineRemove={handleLineRemove}
          onReset={() => {
            resetForm()
            void navigate("/dashboard/billing/debit-note/new")
          }}
          onReview={handleReviewVoucher}
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
      return <StockSection ledgers={state.ledgers} reports={state.reports} />
    case "statements":
      return <StatementsOverviewSection reports={state.reports} />
    case "gst-sales-register":
      return <GstSalesRegisterSection reports={state.reports} />
    case "gst-purchase-register":
      return <GstPurchaseRegisterSection reports={state.reports} />
    case "input-output-tax-summary":
      return <InputOutputTaxSummarySection reports={state.reports} />
    case "day-book":
      return <DayBookSection vouchers={state.vouchers} />
    case "double-entry":
      return <DoubleEntrySection vouchers={state.vouchers} />
    case "general-ledger":
      return <GeneralLedgerSection reports={state.reports} />
    case "bank-book":
      return <BankBookSection reports={state.reports} />
    case "cash-book":
      return <CashBookSection reports={state.reports} />
    case "bank-reconciliation":
      return (
        <BankReconciliationSection
          reports={state.reports}
          onReconcileVoucher={handleBankReconciliation}
        />
      )
    case "trial-balance":
      return <TrialBalanceSection reports={state.reports} />
    case "profit-and-loss":
      return <ProfitAndLossSection reports={state.reports} />
    case "balance-sheet":
      return <BalanceSheetSection reports={state.reports} />
    case "month-end-checklist":
      return <MonthEndChecklistSection reports={state.reports} />
    case "financial-year-close":
      return (
        <FinancialYearCloseSection
          onRunYearEndControl={handleYearEndControl}
          reports={state.reports}
          onRunRollover={handleOpeningBalanceRollover}
          onRunWorkflow={handleFinancialYearClose}
        />
      )
    case "audit-trail":
      return <BillingAuditTrailSection auditTrail={state.auditTrail} />
    case "bill-outstanding":
      return <BillOutstandingSection reports={state.reports} />
    case "support-ledger-guide":
      return <LedgerGuideSupportSection />
    case "overview":
      return (
        <OverviewSection
          ledgers={state.ledgers}
          reports={state.reports}
          vouchers={state.vouchers}
        />
      )
    default:
      return null
  }
}





function SalesVoucherShowSection({
  onEdit,
  onDelete,
  onDocumentAction,
  onBack,
  onNavigate,
  selectedVoucher,
  vouchers,
}: {
  onEdit: (voucherId: string) => void
  onDelete: () => void
  onDocumentAction: (voucherId: string, format: "print" | "csv" | "json") => void
  onBack: () => void
  onNavigate: (targetId: string) => void
  selectedVoucher: BillingVoucher | null
  vouchers: BillingVoucher[]
}) {
  const salesVouchers = useMemo(() => {
    return vouchers.filter(v => v.type === "sales").sort((a, b) => {
       if (a.date !== b.date) return a.date > b.date ? -1 : 1
       return a.voucherNumber > b.voucherNumber ? -1 : 1
    })
  }, [vouchers])

  const currentIndex = selectedVoucher ? salesVouchers.findIndex(v => v.id === selectedVoucher.id) : -1
  const prevVoucher = currentIndex > 0 ? salesVouchers[currentIndex - 1] : null
  const nextVoucher = currentIndex !== -1 && currentIndex < salesVouchers.length - 1 ? salesVouchers[currentIndex + 1] : null

  if (!selectedVoucher) return null 

  const sales = selectedVoucher.sales
  if (!sales) return null

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between print:hidden">
         <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeftIcon className="size-4" />
            </Button>
            <h1 className="text-xl font-semibold tracking-tight">Invoice {selectedVoucher.voucherNumber}</h1>
         </div>
         <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={!prevVoucher} onClick={() => prevVoucher ? onNavigate(prevVoucher.id) : undefined}>
              &larr; Prev
            </Button>
            <Button variant="outline" size="sm" disabled={!nextVoucher} onClick={() => nextVoucher ? onNavigate(nextVoucher.id) : undefined}>
              Next &rarr;
            </Button>
            <div className="w-px h-6 bg-border mx-2" />
            <Button variant="outline" size="sm" onClick={() => onEdit(selectedVoucher.id)}>
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDocumentAction(selectedVoucher.id, "print")}>
              Print
            </Button>
            <Button variant="destructive" size="sm" onClick={onDelete}>
              Delete
            </Button>
         </div>
      </div>

      <Card className="print:shadow-none print:border-none print:m-0">
         <CardContent className="p-8">
            <div className="flex justify-between items-start border-b border-border/50 pb-8">
              <div>
                <h2 className="text-2xl font-bold uppercase tracking-widest text-foreground">Tax Invoice</h2>
                <p className="text-muted-foreground mt-1 text-sm">{sales.voucherTypeName}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">{selectedVoucher.companyId}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 py-8 border-b border-border/50">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">Bill To</p>
                <p className="font-bold text-foreground text-lg">{sales.billToName || selectedVoucher.counterparty}</p>
                {sales.partyGstin ? <p className="text-sm text-foreground mt-1">GSTIN: {sales.partyGstin}</p> : null}
                {sales.shipToAddress && (
                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">Ship To</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{sales.shipToAddress}</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-right">
                <div>
                   <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">Invoice Date</p>
                   <p className="text-foreground font-medium">{selectedVoucher.date}</p>
                </div>
                <div>
                   <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">Invoice No</p>
                   <p className="text-foreground font-medium">{selectedVoucher.voucherNumber}</p>
                </div>
                {sales.referenceNumber && (
                   <div>
                     <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">Reference</p>
                     <p className="text-foreground font-medium">{sales.referenceNumber}</p>
                   </div>
                )}
                {sales.referenceDate && (
                   <div>
                     <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">Ref Date</p>
                     <p className="text-foreground font-medium">{sales.referenceDate}</p>
                   </div>
                )}
              </div>
            </div>

            <div className="py-8">
               <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="pb-3 font-semibold text-muted-foreground">Item</th>
                      <th className="pb-3 text-right font-semibold text-muted-foreground">Qty</th>
                      <th className="pb-3 text-right font-semibold text-muted-foreground">Rate</th>
                      <th className="pb-3 text-right font-semibold text-muted-foreground">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-border/20 last:border-0">
                         <td className="py-4">
                           <p className="font-medium text-foreground">{item.itemName}</p>
                           {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                         </td>
                         <td className="py-4 text-right tabular-nums">{item.quantity}</td>
                         <td className="py-4 text-right tabular-nums">{formatAmount(item.rate)}</td>
                         <td className="py-4 text-right font-medium tabular-nums">{formatAmount(item.quantity * item.rate)}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>

            <div className="flex justify-end pt-4 border-t border-border/50">
               <div className="w-64 space-y-3">
                  <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Subtotal</span>
                     <span className="font-medium tabular-nums">{formatAmount(sales.subtotal)}</span>
                  </div>
                  {sales.taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                       <span className="text-muted-foreground">Tax</span>
                       <span className="font-medium tabular-nums">{formatAmount(sales.taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold pt-3 border-t border-border/50">
                     <span>Grand Total</span>
                     <span className="tabular-nums">{formatAmount(sales.grandTotal)}</span>
                  </div>
               </div>
            </div>

            {selectedVoucher.narration && (
              <div className="mt-12 pt-8 border-t border-border/20">
                 <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">Remarks / Narration</p>
                 <p className="text-sm text-foreground">{selectedVoucher.narration}</p>
              </div>
            )}
         </CardContent>
      </Card>
    </div>
  )
}
