import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import type {
  BillingLedger,
  BillingLedgerListResponse,
  BillingVoucher,
  BillingVoucherListResponse,
  BillingVoucherResponse,
  BillingVoucherType,
  BillingVoucherUpsertPayload,
} from "@billing/shared"
import { billingVoucherModules, billingWorkspaceItems } from "@billing/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

type ResourceState = {
  error: string | null
  isLoading: boolean
  ledgers: BillingLedger[]
  vouchers: BillingVoucher[]
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

type VoucherFormState = {
  counterparty: string
  date: string
  billAllocations: VoucherBillAllocationForm[]
  generateEInvoice: boolean
  generateEWayBill: boolean
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
  type: BillingVoucherType
  voucherNumber: string
}

const defaultVoucherForm: VoucherFormState = {
  billAllocations: [],
  counterparty: "",
  date: "2026-04-01",
  generateEInvoice: false,
  generateEWayBill: false,
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
  type: "journal",
  voucherNumber: "",
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

function titleFromVoucherType(type: BillingVoucherType) {
  switch (type) {
    case "payment":
      return "Payment"
    case "receipt":
      return "Receipt"
    case "sales":
      return "Sales"
    case "purchase":
      return "Purchase"
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
    type: voucher.type,
    voucherNumber: voucher.voucherNumber,
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
        <CardTitle>{selectedVoucher ? "Edit Voucher" : "Post Voucher"}</CardTitle>
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
              Posted in financial year <span className="font-medium text-foreground">{selectedVoucher.financialYear.label}</span> with sequence{" "}
              <span className="font-medium text-foreground">
                {selectedVoucher.financialYear.prefix}-{String(selectedVoucher.financialYear.sequenceNumber).padStart(3, "0")}
              </span>.
            </>
          ) : (
            <>Voucher number and financial year sequence will be generated automatically from the posting date if left blank.</>
          )}
        </div>

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
                  <select
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.gst.partyLedgerId}
                    onChange={(event) => onChange("gstPartyLedgerId", event.target.value)}
                  >
                    <option value="">Select party ledger</option>
                    {ledgers.map((ledger) => (
                      <option key={ledger.id} value={ledger.id}>
                        {ledger.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.gst.taxableLedgerId}
                    onChange={(event) => onChange("gstTaxableLedgerId", event.target.value)}
                  >
                    <option value="">Select taxable ledger</option>
                    {ledgers.map((ledger) => (
                      <option key={ledger.id} value={ledger.id}>
                        {ledger.name}
                      </option>
                    ))}
                  </select>
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
          <div className="space-y-3 rounded-[1rem] border border-border/70 bg-card/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">Bill-wise adjustments</p>
                <p className="text-sm text-muted-foreground">
                  Match receipt and payment vouchers against bill references the way Tally operators expect.
                </p>
              </div>
              <Button type="button" variant="outline" onClick={onBillAllocationCreate}>
                Add bill ref
              </Button>
            </div>
            {form.billAllocations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bill-wise adjustments added yet.</p>
            ) : (
              form.billAllocations.map((allocation, index) => (
                <div
                  key={`${allocation.referenceNumber}:${index}`}
                  className="grid gap-3 rounded-[1rem] border border-border/70 bg-background/80 p-4 md:grid-cols-[0.9fr_1fr_0.9fr_0.9fr_1fr_auto]"
                >
                  <select
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={allocation.referenceType}
                    onChange={(event) =>
                      onBillAllocationChange(index, "referenceType", event.target.value)
                    }
                  >
                    <option value="against_ref">Against ref</option>
                    <option value="new_ref">New ref</option>
                    <option value="on_account">On account</option>
                  </select>
                  <Input
                    value={allocation.referenceNumber}
                    onChange={(event) =>
                      onBillAllocationChange(index, "referenceNumber", event.target.value)
                    }
                    placeholder="Reference number"
                  />
                  <Input
                    type="date"
                    value={allocation.referenceDate}
                    onChange={(event) =>
                      onBillAllocationChange(index, "referenceDate", event.target.value)
                    }
                  />
                  <Input
                    type="date"
                    value={allocation.dueDate}
                    onChange={(event) =>
                      onBillAllocationChange(index, "dueDate", event.target.value)
                    }
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={allocation.amount}
                    onChange={(event) =>
                      onBillAllocationChange(index, "amount", event.target.value)
                    }
                    placeholder="Amount"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onBillAllocationRemove(index)}
                  >
                    Remove
                  </Button>
                  <Input
                    className="md:col-span-6"
                    value={allocation.note}
                    onChange={(event) =>
                      onBillAllocationChange(index, "note", event.target.value)
                    }
                    placeholder="Adjustment note"
                  />
                </div>
              ))
            )}
          </div>
        ) : null}

        {!gstModeEnabled ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-foreground">Ledger lines</p>
              <p className="text-sm text-muted-foreground">
                Every voucher must contain balanced debit and credit lines.
              </p>
            </div>
            <Button type="button" variant="outline" onClick={onLineCreate}>
              Add line
            </Button>
          </div>
          {form.lines.map((line, index) => (
            <div
              key={`${index}:${line.ledgerId}:${line.side}`}
              className="grid gap-3 rounded-[1rem] border border-border/70 bg-card/70 p-4 md:grid-cols-[1.2fr_0.7fr_0.8fr_1.4fr_auto]"
            >
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={line.ledgerId}
                onChange={(event) => onLineChange(index, "ledgerId", event.target.value)}
              >
                <option value="">Select ledger</option>
                {ledgers.map((ledger) => (
                  <option key={ledger.id} value={ledger.id}>
                    {ledger.name}
                  </option>
                ))}
              </select>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={line.side}
                onChange={(event) => onLineChange(index, "side", event.target.value)}
              >
                <option value="debit">Debit</option>
                <option value="credit">Credit</option>
              </select>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={line.amount}
                onChange={(event) => onLineChange(index, "amount", event.target.value)}
              />
              <Input
                value={line.note}
                onChange={(event) => onLineChange(index, "note", event.target.value)}
                placeholder="Posting note"
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => onLineRemove(index)}
                disabled={form.lines.length <= 2}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
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
          <Button type="button" onClick={onSave} disabled={isSaving}>
            {isSaving ? "Saving..." : selectedVoucher ? "Update voucher" : "Post voucher"}
          </Button>
          <Button type="button" variant="outline" onClick={onReset} disabled={isSaving}>
            New voucher
          </Button>
          {selectedVoucher ? (
            <Button type="button" variant="destructive" onClick={onDelete} disabled={isSaving}>
              Delete voucher
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
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
      purchase: 0,
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

function ChartOfAccountsSection({ ledgers }: { ledgers: BillingLedger[] }) {
  return (
    <SectionShell
      title="Chart Of Accounts"
      description="Ledger groups and closing balances aligned to a Tally-style operational accounting setup."
    >
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ledger</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Nature</TableHead>
                <TableHead>Closing</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledgers.map((ledger) => (
                <TableRow key={ledger.id}>
                  <TableCell className="font-medium">{ledger.name}</TableCell>
                  <TableCell>{ledger.group}</TableCell>
                  <TableCell className="capitalize">{ledger.nature}</TableCell>
                  <TableCell>
                    {formatAmount(ledger.closingAmount)} {ledger.closingSide === "debit" ? "Dr" : "Cr"}
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

function VoucherRegisterSection({
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
  onSelectVoucher,
  selectedVoucher,
  vouchers,
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
  onSelectVoucher: (voucher: BillingVoucher) => void
  selectedVoucher: BillingVoucher | null
  vouchers: BillingVoucher[]
}) {
  return (
    <SectionShell
      title="Voucher Register"
      description="Create, update, and review posted vouchers using the billing posting engine."
    >
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Posted vouchers</CardTitle>
            <CardDescription>
              Select a voucher to edit it. New posting always stays double-entry balanced.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {vouchers.map((voucher) => {
              const totals = getVoucherTotals(voucher)
              const selected = selectedVoucher?.id === voucher.id

              return (
                <button
                  key={voucher.id}
                  type="button"
                  onClick={() => onSelectVoucher(voucher)}
                  className={`w-full rounded-[1rem] border p-4 text-left transition ${
                    selected
                      ? "border-accent bg-accent/5"
                      : "border-border/70 bg-card/70 hover:border-accent/40"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{voucher.voucherNumber}</p>
                    <Badge variant="outline">{titleFromVoucherType(voucher.type)}</Badge>
                    <Badge variant={isVoucherBalanced(voucher) ? "outline" : "destructive"}>
                      {isVoucherBalanced(voucher) ? "Balanced" : "Mismatch"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {voucher.date} | {voucher.counterparty}
                  </p>
                  <div className="mt-2">
                    <ComplianceBadges voucher={voucher} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {voucher.narration}
                  </p>
                  <p className="mt-3 text-sm font-medium text-foreground">
                    {formatAmount(totals.debit)}
                  </p>
                </button>
              )
            })}
          </CardContent>
        </Card>

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
      </div>
      <VoucherComplianceCard voucher={selectedVoucher} />
    </SectionShell>
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

function DayBookSection({ vouchers }: { vouchers: BillingVoucher[] }) {
  const orderedVouchers = [...vouchers].sort((left, right) =>
    left.date.localeCompare(right.date)
  )

  return (
    <SectionShell
      title="Day Book"
      description="Chronological day book view so operators can audit posting flow in the exact order vouchers were entered."
    >
      <VoucherRegisterTable vouchers={orderedVouchers} />
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

export function BillingWorkspaceSection({ sectionId }: { sectionId?: string }) {
  const [state, setState] = useState<ResourceState>({
    error: null,
    isLoading: true,
    ledgers: [],
    vouchers: [],
  })
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(null)
  const [form, setForm] = useState<VoucherFormState>(defaultVoucherForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  async function loadResources() {
    setState((current) => ({ ...current, error: null, isLoading: true }))

    try {
      const [ledgerResponse, voucherResponse] = await Promise.all([
        request<BillingLedgerListResponse>("/internal/v1/billing/ledgers"),
        request<BillingVoucherListResponse>("/internal/v1/billing/vouchers"),
      ])

      setState({
        error: null,
        isLoading: false,
        ledgers: ledgerResponse.items,
        vouchers: voucherResponse.items,
      })
    } catch (error) {
      setState({
        error: error instanceof Error ? error.message : "Failed to load billing workspace.",
        isLoading: false,
        ledgers: [],
        vouchers: [],
      })
    }
  }

  useEffect(() => {
    void loadResources()
  }, [])

  const selectedVoucher =
    state.vouchers.find((voucher) => voucher.id === selectedVoucherId) ?? null

  function resetForm() {
    setSelectedVoucherId(null)
    setForm(defaultVoucherForm)
    setFormError(null)
  }

  function handleSelectVoucher(voucher: BillingVoucher) {
    setSelectedVoucherId(voucher.id)
    setForm(toVoucherForm(voucher))
    setFormError(null)
  }

  function handleChange(field: string, value: string) {
    setForm((current) => {
      switch (field) {
        case "counterparty":
        case "date":
        case "narration":
        case "type":
        case "voucherNumber":
          return {
            ...current,
            [field]: value,
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

  function buildPayload(): BillingVoucherUpsertPayload {
    const gstModeEnabled = form.gst.enabled && ["sales", "purchase"].includes(form.type)

    return {
      voucherNumber: form.voucherNumber,
      type: form.type,
      date: form.date,
      counterparty: form.counterparty,
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
      gst: gstModeEnabled
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
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to delete billing voucher."
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (state.isLoading) {
    return <StateCard message="Loading billing workspace." />
  }

  if (state.error) {
    return <StateCard message={state.error} />
  }

  switch (sectionId ?? "overview") {
    case "chart-of-accounts":
      return <ChartOfAccountsSection ledgers={state.ledgers} />
    case "voucher-register":
      return (
        <VoucherRegisterSection
          form={form}
          formError={formError}
          isSaving={isSaving}
          ledgers={state.ledgers}
          onChange={handleChange}
          onDelete={handleDelete}
          onBillAllocationChange={handleBillAllocationChange}
          onBillAllocationCreate={handleBillAllocationCreate}
          onBillAllocationRemove={handleBillAllocationRemove}
          onLineChange={handleLineChange}
          onLineCreate={handleLineCreate}
          onLineRemove={handleLineRemove}
          onReset={resetForm}
          onSave={handleSave}
          onSelectVoucher={handleSelectVoucher}
          selectedVoucher={selectedVoucher}
          vouchers={state.vouchers}
        />
      )
    case "payment-vouchers":
      return (
        <VoucherModuleSection
          ledgers={state.ledgers}
          moduleId="payment"
          onSelectVoucher={handleSelectVoucher}
          vouchers={state.vouchers}
        />
      )
    case "receipt-vouchers":
      return (
        <VoucherModuleSection
          ledgers={state.ledgers}
          moduleId="receipt"
          onSelectVoucher={handleSelectVoucher}
          vouchers={state.vouchers}
        />
      )
    case "sales-vouchers":
      return (
        <VoucherModuleSection
          ledgers={state.ledgers}
          moduleId="sales"
          onSelectVoucher={handleSelectVoucher}
          vouchers={state.vouchers}
        />
      )
    case "purchase-vouchers":
      return (
        <VoucherModuleSection
          ledgers={state.ledgers}
          moduleId="purchase"
          onSelectVoucher={handleSelectVoucher}
          vouchers={state.vouchers}
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
    case "day-book":
      return <DayBookSection vouchers={state.vouchers} />
    case "double-entry":
      return <DoubleEntrySection vouchers={state.vouchers} />
    case "overview":
      return <OverviewSection ledgers={state.ledgers} vouchers={state.vouchers} />
    default:
      return null
  }
}
